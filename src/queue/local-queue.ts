// Local storage implementation (no AWS needed)
import { promises as fs } from 'fs';
import * as path from 'path';

// Use ./storage for local files, /tmp for Render/cloud
const STORAGE_PATH = process.env.STORAGE_PATH || (process.env.NODE_ENV === 'production' ? '/tmp/adsterra-jobs' : './storage');

export class LocalQueue {
  private jobsFile: string;
  private runsFile: string;

  constructor() {
    this.jobsFile = path.join(STORAGE_PATH, 'jobs.json');
    this.runsFile = path.join(STORAGE_PATH, 'runs.json');
  }

  async init() {
    try {
      await fs.mkdir(STORAGE_PATH, { recursive: true });
      
      // Initialize jobs file
      try {
        await fs.stat(this.jobsFile);
      } catch {
        await fs.writeFile(this.jobsFile, JSON.stringify([]));
      }

      // Initialize runs file
      try {
        await fs.stat(this.runsFile);
      } catch {
        await fs.writeFile(this.runsFile, JSON.stringify([]));
      }
    } catch (error) {
      console.error('Error initializing local queue:', error);
      throw error;
    }
  }

  async addJob(job: any) {
    try {
      const data = await fs.readFile(this.jobsFile, 'utf-8');
      const jobs = JSON.parse(data);
      jobs.push({ ...job, timestamp: Date.now() });
      await fs.writeFile(this.jobsFile, JSON.stringify(jobs, null, 2));
    } catch (error) {
      console.error('Error adding job:', error);
      throw error;
    }
  }

  async getNextJob() {
    try {
      const data = await fs.readFile(this.jobsFile, 'utf-8');
      const jobs = JSON.parse(data);
      if (jobs.length > 0) {
        const job = jobs.shift();
        await fs.writeFile(this.jobsFile, JSON.stringify(jobs, null, 2));
        return job;
      }
      return null;
    } catch (error) {
      console.error('Error getting next job:', error);
      return null;
    }
  }

  async getJobCount() {
    try {
      const data = await fs.readFile(this.jobsFile, 'utf-8');
      const jobs = JSON.parse(data);
      return jobs.length;
    } catch {
      return 0;
    }
  }
}

export default new LocalQueue();
