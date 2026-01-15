// Load environment variables first
import 'dotenv/config';

// CRITICAL: Disable output buffering on Windows (ensures logs appear immediately)
// This prevents logs from appearing "stuck" when they're actually just buffered
if (process.platform === 'win32') {
  // Force unbuffered output on Windows
  if (process.stdout.isTTY) {
    process.stdout.setDefaultEncoding('utf8');
  }
  // Ensure console.log flushes immediately
  const originalLog = console.log;
  console.log = (...args: any[]) => {
    originalLog(...args);
    if (process.stdout.isTTY) {
      process.stdout.write(''); // Force flush
    }
  };
  const originalError = console.error;
  console.error = (...args: any[]) => {
    originalError(...args);
    if (process.stderr.isTTY) {
      process.stderr.write(''); // Force flush
    }
  };
}

// Ensure Playwright browsers are installed before starting
import './ensure-browsers';

import { getNextJob, getNextJobForRun, markJobActive, markJobCompleted, markJobFailed } from './queue/dynamodb-queue';
import { AdsterraSession } from './bot/session';
import { queueConfig } from './config';
import { sleep } from './utils/helpers';
import type { AdsterraConfig, AdsterraRun } from './types';
import { getMaxConcurrencyFromActiveRuns } from './utils/dynamic-concurrency';
import { Semaphore } from './utils/semaphore';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

// Global to track last poll log time (prevents spam)
declare global {
  var lastPollLog: number | undefined;
}

// Helper function to check and log run completion immediately (not just every 5 minutes)
async function checkRunCompletionImmediately(runId: string): Promise<void> {
  try {
    const { getAllAdsterraRuns } = await import('./lib/aws/adsterra-helpers');
    const { getQueueStatsByRunId } = await import('./queue/dynamodb-queue');
    const allRuns = await getAllAdsterraRuns();
    const run = allRuns.find(r => r.id === runId);
    
    if (!run || run.status !== 'running') return; // Only check running runs
    
    const stats = await getQueueStatsByRunId(runId);
    
    // Check if run is complete
    if (stats.waiting === 0 && stats.active === 0 && stats.completed > 0) {
      const cpm = 2.365;
      const revenue = (stats.completed / 1000) * cpm;
      const dataGB = (stats.completed * 0.05) / 1024;
      const cost = dataGB * 8;
      const profit = revenue - cost;
      
      console.log('\n' + '='.repeat(60));
      console.log('🎉 RUN COMPLETED!');
      console.log('='.repeat(60));
      console.log(`Run: ${runId.substring(0, 8)}...`);
      console.log(`  ✅ Completed: ${stats.completed} / ${stats.completed + stats.failed} (${((stats.completed / (stats.completed + stats.failed)) * 100).toFixed(1)}%)`);
      console.log(`  ❌ Failed: ${stats.failed}`);
      console.log(`  💵 Revenue: $${revenue.toFixed(2)}`);
      console.log(`  💸 Cost: $${cost.toFixed(2)} (${dataGB.toFixed(3)} GB)`);
      console.log(`  💰 Profit: $${profit.toFixed(2)}`);
      console.log(`  📊 Profit Margin: ${revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0}%`);
      
      // Update run status to completed
      try {
        const { updateAdsterraRun } = await import('./lib/aws/adsterra-helpers');
        // stats here is JobStatus; only pass status to update
        await updateAdsterraRun(runId, {
          status: 'completed',
        });
        console.log(`  ✅ Run status updated to 'completed'`);
      } catch (error: any) {
        console.error(`  ⚠️  Failed to update run status: ${error.message}`);
      }
      
      console.log('='.repeat(60) + '\n');
      
      // Force flush output (especially important on Windows)
      if (process.stdout.isTTY) {
        process.stdout.write('');
      }
    }
  } catch (error: any) {
    // Silently ignore errors in completion check (don't spam logs)
  }
}

// We'll create a new session for each job with the run's config
async function processJob(semaphore: Semaphore) {
  // Acquire permit from semaphore (waits if at max concurrency)
  await semaphore.acquire();
  
  let job: any = null;
  try {
    // Default: Try to get any available job (we'll check pacing mode after)
    // Use a balanced approach: try immediate first, but we'll validate scheduled time
    const DEFAULT_PROCESS_IMMEDIATELY = (process.env.PROCESS_IMMEDIATELY ?? 'true') === 'true';
    
    // If this worker was launched for a specific run, ONLY process that run.
    const RUN_ID = process.env.RUN_ID;
    job = RUN_ID
      ? await getNextJobForRun(RUN_ID, DEFAULT_PROCESS_IMMEDIATELY)
      : await getNextJob(DEFAULT_PROCESS_IMMEDIATELY);
    
    if (!job) {
      // No jobs available or all jobs are scheduled for the future
      semaphore.release();
      return false;
    }

    // Mark job as active (atomically claim it)
    const claimed = await markJobActive(job.id);
    if (!claimed) {
      // Another worker already claimed this job - release semaphore and try again
      semaphore.release();
      return false;
    }

    // Load run config from DynamoDB if runId is provided
    // Also check pacing mode to respect scheduled times
    let config: AdsterraConfig | null = null;
    if (job.runId) {
      try {
        const ADSTERRA_RUNS_TABLE = process.env.DYNAMODB_ADSTERRA_RUNS_TABLE || 'AdsterraRuns';
        const ddbClient = new DynamoDBClient({
          region: process.env.AWS_REGION || 'us-east-1',
        });
        const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
        
        const result = await ddbDocClient.send(
          new QueryCommand({
            TableName: ADSTERRA_RUNS_TABLE,
            KeyConditionExpression: 'PK = :pk AND SK = :sk',
            ExpressionAttributeValues: {
              ':pk': `RUN#${job.runId}`,
              ':sk': 'META',
            },
          })
        );

        if (result.Items && result.Items.length > 0) {
          const run = result.Items[0] as any;
          const runStatus = run.status;
          
          // PRODUCTION: Skip jobs from stopped/cancelled runs
          if (runStatus === 'stopped' || runStatus === 'cancelled') {
            console.log(`⏸️  Skipping job from ${runStatus} run: ${job.runId}`);
            // Mark job as failed so it doesn't stay in queue forever
            await markJobFailed(job.id, `Run is ${runStatus}`);
            semaphore.release();
            return true; // Job handled (skipped), continue to next
          }
          
          // Only process jobs from running or pending runs
          if (runStatus !== 'running' && runStatus !== 'pending') {
            console.log(`⏸️  Skipping job from run with status '${runStatus}': ${job.runId}`);
            await markJobFailed(job.id, `Run status is ${runStatus}`);
            semaphore.release();
            return true; // Job handled (skipped), continue to next
          }
          
          config = run.config as AdsterraConfig;
          const pacingMode = config?.pacingMode || 'human';
          
          console.log(`📋 Loaded config for run: ${job.runId} (Status: ${runStatus}, Pacing: ${pacingMode}, URL: ${config?.adsterraUrl ? 'configured' : 'default'})`);
          
          // If human pacing mode, check if job is scheduled for the future
          if (pacingMode === 'human') {
            const now = Date.now();
            const scheduledTime = new Date(job.scheduledTime).getTime();
            
            if (scheduledTime > now) {
              // Job is scheduled for the future - skip it for now
              // Release semaphore and return (job stays in queue, will be picked up later)
              semaphore.release();
              return false;
            }
            // Job is ready (scheduled time has passed) - proceed
          }
          // Fast mode: process immediately regardless of scheduled time
        }
      } catch (error: any) {
        console.error(`⚠️  Failed to load run config for ${job.runId}:`, error.message);
        // Continue with null config (will use defaults)
      }
    }

    // Create session with config (or use defaults)
    const session = new AdsterraSession(config);

    console.log(`\n🚀 [${job.botId}] Session ${job.sessionNumber}: Starting...`);
    const jobStartTime = Date.now();

    // Execute the bot session (pass distribution if available)
    const result = await session.execute(job.botId, job.sessionNumber, job.distribution);

    if (result.success) {
      // Mark job as completed
      await markJobCompleted(job.id);
      const jobDuration = Date.now() - jobStartTime;
      console.log(`✅ [${job.botId}] Session ${job.sessionNumber}: Completed in ${(jobDuration / 1000).toFixed(1)}s`);
      
      // Check if run is complete immediately (not wait for 5-minute interval)
      if (job.runId) {
        await checkRunCompletionImmediately(job.runId);
      }
      
      semaphore.release();
      return true;
    } else {
      // Mark job as failed
      await markJobFailed(job.id, result.error || 'Session failed');
      const jobDuration = Date.now() - jobStartTime;
      console.error(`❌ [${job.botId}] Session ${job.sessionNumber}: Failed after ${(jobDuration / 1000).toFixed(1)}s - ${result.error}`);
      
      // Check if run is complete immediately (even if last job failed)
      if (job.runId) {
        await checkRunCompletionImmediately(job.runId);
      }
      
      semaphore.release();
      return true;
    }
  } catch (error: any) {
    // Mark job as failed
    if (job) {
      await markJobFailed(job.id, error.message || 'Unknown error');
      console.error(`❌ [${job.botId}] Session ${job.sessionNumber}: Error - ${error.message}`);
      if (error.stack) {
        console.error(`   Stack: ${error.stack.split('\n')[1]?.trim()}`);
      }
    }
    semaphore.release();
    return true;
  }
}

async function workerLoop() {
  const PROCESS_IMMEDIATELY = (process.env.PROCESS_IMMEDIATELY ?? 'true') === 'true';
  
  // Fetch concurrency dynamically from active runs, but cap it to prevent system freeze
  const MIN_CONCURRENT_JOBS = parseInt(process.env.MIN_CONCURRENT_JOBS || '2', 10);
  const MAX_SAFE_CONCURRENCY = parseInt(process.env.MAX_CONCURRENT_BROWSERS || '10', 10); // Safe default: 10 browsers max
  const fallbackConcurrency = parseInt(process.env.CONCURRENT_JOBS || '50', 10);
  
  let currentConcurrency = await getMaxConcurrencyFromActiveRuns();
  if (currentConcurrency < MIN_CONCURRENT_JOBS) {
    currentConcurrency = fallbackConcurrency;
  }
  // Cap concurrency to prevent system freeze (especially with headed browsers)
  currentConcurrency = Math.min(currentConcurrency, MAX_SAFE_CONCURRENCY);
  
  // Create semaphore with dynamic concurrency
  const semaphore = new Semaphore(currentConcurrency);
  
  // Spawn worker threads that compete for semaphore permits
  // Keep worker threads slightly higher than max concurrency to ensure we always have jobs ready
  // But NOT too many - each worker thread consumes memory even when waiting
  const MAX_WORKER_THREADS = Math.min(
    currentConcurrency + 5, // Just a few more than concurrency to keep pipeline full
    parseInt(process.env.MAX_WORKER_THREADS || '15', 10) // Hard cap at 15 by default
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Adsterra Bot Worker started');
  console.log('='.repeat(60));
  console.log(`⏱️  Polling interval: ${queueConfig.pollInterval}ms`);
  console.log(`⚡ Process immediately: ${PROCESS_IMMEDIATELY ? 'Yes (ignoring scheduled times)' : 'No (respecting scheduled times)'}`);
  console.log(`🔄 Concurrent browsers: ${currentConcurrency} (max: ${MAX_SAFE_CONCURRENCY})`);
  console.log(`🧵 Worker threads: ${MAX_WORKER_THREADS}`);
  console.log('💡 Waiting for jobs...\n');

  // Start periodic concurrency update and summary (every 5 minutes)
  const concurrencyUpdateInterval = setInterval(async () => {
    try {
      let newConcurrency = await getMaxConcurrencyFromActiveRuns();
      // Apply same safety cap
      newConcurrency = Math.min(newConcurrency, MAX_SAFE_CONCURRENCY);
      
      if (newConcurrency !== currentConcurrency && newConcurrency >= MIN_CONCURRENT_JOBS) {
        const oldConcurrency = currentConcurrency;
        currentConcurrency = newConcurrency;
        semaphore.setMaxPermits(newConcurrency);
        console.log(`\n🔄 Concurrency updated: ${oldConcurrency} → ${newConcurrency} (capped at ${MAX_SAFE_CONCURRENCY})`);
      }
      
      // Log summary of active runs
      const { getAllAdsterraRuns } = await import('./lib/aws/adsterra-helpers');
      const allRuns = await getAllAdsterraRuns();
      const activeRuns = allRuns.filter(run => run.status === 'running' || run.status === 'pending');
      
      if (activeRuns.length > 0) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 Run Summary (Every 5 minutes)');
        console.log('='.repeat(60));
        
        for (const run of activeRuns) {
          const { getQueueStatsByRunId } = await import('./queue/dynamodb-queue');
          const stats = await getQueueStatsByRunId(run.id);
          
          const total = stats.waiting + stats.active + stats.completed + stats.failed;
          const progress = total > 0 ? ((stats.completed / total) * 100).toFixed(1) : '0.0';
          const successRate = (stats.completed + stats.failed) > 0 
            ? ((stats.completed / (stats.completed + stats.failed)) * 100).toFixed(1) 
            : '0.0';
          
          console.log(`\nRun: ${run.id.substring(0, 8)}...`);
          console.log(`  ✅ Completed: ${stats.completed} / ${total} (${progress}%)`);
          console.log(`  ❌ Failed: ${stats.failed}`);
          console.log(`  ⏳ Waiting: ${stats.waiting}`);
          console.log(`  🔄 Active: ${stats.active}`);
          console.log(`  📈 Success Rate: ${successRate}%`);
          
          // PRODUCTION: Auto-mark run as completed when all jobs are done (but only if still running)
          // Note: Completion is also checked immediately after each job, so this is just a periodic summary
          if (stats.waiting === 0 && stats.active === 0 && stats.completed > 0 && run.status === 'running') {
            const cpm = 2.365;
            const revenue = (stats.completed / 1000) * cpm;
            const dataGB = (stats.completed * 0.05) / 1024;
            const cost = dataGB * 8;
            const profit = revenue - cost;
            
            // Only log if not already completed (to avoid duplicate messages)
            // The immediate check should have already logged this, but this serves as a periodic reminder
            console.log(`\n  🎉 RUN COMPLETED! (Periodic check)`);
            console.log(`  💵 Revenue: $${revenue.toFixed(2)}`);
            console.log(`  💸 Cost: $${cost.toFixed(2)} (${dataGB.toFixed(3)} GB)`);
            console.log(`  💰 Profit: $${profit.toFixed(2)}`);
            console.log(`  📊 Profit Margin: ${revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0}%`);
            
            // Update run status to completed (only if still running - don't override stopped)
            try {
              const { updateAdsterraRun } = await import('./lib/aws/adsterra-helpers');
              // stats here is JobStatus; only pass status to update
              await updateAdsterraRun(run.id, {
                status: 'completed',
              });
              console.log(`  ✅ Run status updated to 'completed'`);
            } catch (error: any) {
              console.error(`  ⚠️  Failed to update run status: ${error.message}`);
            }
          }
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
      }
    } catch (error: any) {
      console.error('Error updating concurrency/summary:', error.message);
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  let processedCount = 0;
  let consecutiveEmptyPolls = 0;
  const maxEmptyPolls = 10; // Stop if no jobs found after 10 polls
  let pollCount = 0;

  // Stagger browser launches to prevent system overload and proxy overload
  // Longer stagger (5-10s) gives proxy time to handle each connection properly
  // This prevents 502 errors from too many simultaneous proxy connections
  const LAUNCH_STAGGER_MS = parseInt(process.env.LAUNCH_STAGGER_MS || '5000', 10); // 5 seconds between launches (increased from 3s)
  let lastLaunchTime = 0;
  const launchMutex = new Semaphore(1); // Only one browser can be in "launching" state at a time
  
  console.log(`⏱️  Launch stagger: ${LAUNCH_STAGGER_MS}ms between browsers`);

  const workers: Promise<void>[] = [];
  
  for (let i = 0; i < MAX_WORKER_THREADS; i++) {
    workers.push((async () => {
      while (true) {
        let hasMutex = false;
        
        try {
          // Stagger launches: ensure minimum delay since last browser started
          await launchMutex.acquire();
          hasMutex = true;
          
          const now = Date.now();
          const timeSinceLastLaunch = now - lastLaunchTime;
          if (timeSinceLastLaunch < LAUNCH_STAGGER_MS && lastLaunchTime > 0) {
            const waitTime = LAUNCH_STAGGER_MS - timeSinceLastLaunch;
            await sleep(waitTime);
          }
          lastLaunchTime = Date.now();
          
          // Release mutex BEFORE processing job (allow next worker to start staggering)
          launchMutex.release();
          hasMutex = false;
          
          const hadJob = await processJob(semaphore);
          if (hadJob) {
            processedCount++;
            // PRODUCTION: Minimal delay to keep jobs moving efficiently
            await sleep(50); // Reduced from 100ms to 50ms for faster processing
          } else {
            // No job available - wait before polling again
            // Log periodically so user knows worker is alive (every 30 seconds)
            const now = Date.now();
            if (!global.lastPollLog || now - global.lastPollLog > 30000) {
              console.log(`💤 No jobs available, polling again in ${queueConfig.pollInterval}ms...`);
              global.lastPollLog = now;
            }
            await sleep(queueConfig.pollInterval);
          }
        } catch (error: any) {
          console.error(`Worker ${i} error:`, error.message);
          
          // Clean up mutex if we still hold it
          if (hasMutex) {
            launchMutex.release();
          }
          
          await sleep(5000);
        }
      }
    })());
  }

  // Cleanup on shutdown
  process.on('SIGTERM', () => {
    clearInterval(concurrencyUpdateInterval);
  });
  process.on('SIGINT', () => {
    clearInterval(concurrencyUpdateInterval);
  });

  await Promise.all(workers);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\nSIGTERM received, shutting down worker...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received, shutting down worker...');
  process.exit(0);
});

// Start the worker
workerLoop().catch((error) => {
  console.error('Fatal worker error:', error);
  process.exit(1);
});
