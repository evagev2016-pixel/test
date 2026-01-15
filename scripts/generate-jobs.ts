import { promises as fs } from 'fs';
import * as path from 'path';

const STORAGE_PATH = './storage';

interface SessionJob {
  id: string;
  botId: string;
  sessionNumber: number;
  scheduledTime: string;
  status: string;
}

async function createSessionJobs(): Promise<SessionJob[]> {
  const jobs: SessionJob[] = [];
  const now = Date.now();
  const totalBots = 500;
  const sessionsPerBot = 1;
  
  console.log(`🤖 Creating ${totalBots} bots with ${sessionsPerBot} sessions each...`);
  console.log(`📊 Total sessions: ${totalBots * sessionsPerBot}`);

  for (let botIndex = 0; botIndex < totalBots; botIndex++) {
    const botId = `bot-${String(botIndex).padStart(5, '0')}`;

    for (let sessionNum = 1; sessionNum <= sessionsPerBot; sessionNum++) {
      const job: SessionJob = {
        id: `${botId}-session-${sessionNum}`,
        botId,
        sessionNumber: sessionNum,
        scheduledTime: new Date(now).toISOString(),
        status: 'pending',
      };

      jobs.push(job);
    }
  }

  return jobs;
}

async function main() {
  try {
    console.log('✅ Adsterra Bot Orchestrator (Local)');
    console.log('====================================\n');

    // Create storage directory
    await fs.mkdir(STORAGE_PATH, { recursive: true });

    // Create jobs
    const jobs = await createSessionJobs();
    console.log(`\n✨ Generated ${jobs.length} jobs`);

    // Save to file
    const jobsFile = path.join(STORAGE_PATH, 'jobs.json');
    await fs.writeFile(jobsFile, JSON.stringify(jobs, null, 2));
    console.log(`📝 Saved to: ${jobsFile}`);

    // Create empty runs file
    const runsFile = path.join(STORAGE_PATH, 'runs.json');
    await fs.writeFile(runsFile, JSON.stringify([], null, 2));
    console.log(`📝 Created runs file: ${runsFile}`);

    console.log('\n✅ Ready to deploy to Render!');
    console.log('   1. Commit files: git add .');
    console.log('   2. Push: git push');
    console.log('   3. Render will auto-redeploy');
    console.log('   4. Worker will process jobs immediately!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
