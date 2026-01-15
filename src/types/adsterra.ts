export interface AdsterraRun {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'running' | 'paused' | 'completed' | 'stopped' | 'cancelled';
  config: AdsterraConfig;
  createdAt: string;
  updatedAt: string;
  stats?: AdsterraStats;
  instanceIds?: string[]; // EC2 instance IDs managed by GitHub Actions
  instancesLaunchedAt?: string; // When instances were launched
  instancesTerminatedAt?: string; // When instances were terminated
}

export interface AdsterraConfig {
  adsterraUrl: string; // Direct Adsterra Smart Link URL
  totalBots: number;
  sessionsPerBot: number;
  targetImpressions: number;
  browserHeadless: boolean;
  minScrollWait: number;
  maxScrollWait: number;
  minAdWait: number;
  maxAdWait: number;
  concurrentJobs?: number; // Optional: dynamically calculated based on target impressions
  pacingMode?: 'fast' | 'human'; // fast = ignore schedule, human = spread sessions with schedule + jitter
  pacingHours?: number; // Optional: hours to spread impressions across (default: auto-calculated based on volume)
  distribution?: {
    countries: Record<string, number>;
    devices: Record<string, number>;
    browsers: Record<string, number>;
  };
}

export interface AdsterraStats {
  totalSessions: number;
  completed: number;
  failed: number;
  active: number;
  waiting: number;
  successRate: number;
  impressions: number;
  estimatedRevenue: number;
  averageSessionDuration: number;
  dataUsedMB: number; // Total data used in MB
  dataUsedGB: number; // Total data used in GB
  estimatedCost: number; // Estimated proxy cost
  estimatedProfit: number; // Estimated profit (revenue - cost)
}

