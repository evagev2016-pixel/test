# DigitalOcean App Platform Setup Guide

## 📋 Prerequisites

1. **DigitalOcean Account** - Sign up at https://www.digitalocean.com
2. **GitHub Repository** - Your code should be in `footyamigo/adsterra`
3. **AWS Credentials** - For DynamoDB access

## 🚀 Quick Setup Steps

### 1. Create App in DigitalOcean

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click **"Create App"**
3. Connect your GitHub account
4. Select repository: `footyamigo/adsterra`
5. Select branch: `main`
6. Enable **"Autodeploy on push"**

### 2. Configure Build Settings

**Build Command:**
```bash
npm install && npx playwright install chromium --with-deps
```

**Run Command:**
```bash
npm start
```

### 3. Configure Instance Size

- **Instance Size:** $98/mo | 8 GB RAM | 2 Dedicated vCPUs
- **Autoscaling:**
  - Minimum Containers: 1
  - Maximum Containers: 2
  - CPU Threshold: 80%

### 4. Set Environment Variables

Go to **Settings → App-Level Environment Variables** and add:

#### AWS Configuration (Required)
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
DYNAMODB_ADSTERRA_RUNS_TABLE=AdsterraRuns
DYNAMODB_ADSTERRA_JOBS_TABLE=AdsterraJobs
```

#### Proxy Configuration (BrightData)
```bash
PROXY_PROVIDER=brightdata
BRIGHTDATA_HOST=brd.superproxy.io
BRIGHTDATA_PORT=33335
BRIGHTDATA_USERNAME=brd-customer-hl_d4382b99-zone-residential_proxy1
BRIGHTDATA_PASSWORD=o1qvlhpaqg22
BRIGHTDATA_ZONE=residential_proxy1
```

#### Worker Configuration
```bash
PROCESS_IMMEDIATELY=true
MAX_CONCURRENT_JOBS=500
CONCURRENT_JOBS=50
```

#### Timing Configuration
```bash
MIN_SCROLL_WAIT=0
MAX_SCROLL_WAIT=0
MIN_AD_WAIT=10000
MAX_AD_WAIT=30000
```

#### Browser Configuration
```bash
BROWSER_HEADLESS=true
BROWSER_TIMEOUT=30000
```

#### Queue Configuration
```bash
QUEUE_POLL_INTERVAL=1000
MAX_RETRIES=3
```

### 5. Deploy

1. Click **"Create Resources"** or **"Deploy"**
2. Wait for build to complete (~5-10 minutes)
3. Check logs to ensure worker started successfully

## ✅ Verification

After deployment, check the logs:

1. Go to **Runtime Logs** in DigitalOcean dashboard
2. You should see:
   ```
   🚀 Adsterra Bot Worker started
   ⏱️  Polling interval: 1000ms
   ⚡ Process immediately: Yes
   🔄 Concurrent jobs: 50 (dynamically calculated from active runs)
   💡 Waiting for jobs...
   ```

## 🔧 Troubleshooting

### Build Fails

**Error:** `TypeScript compilation errors`
- **Solution:** Make sure all TypeScript errors are fixed (we've fixed them)

**Error:** `Playwright browsers not found`
- **Solution:** Build command includes `npx playwright install chromium --with-deps`

### Worker Won't Start

**Error:** `AWS credentials not found`
- **Solution:** Add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to environment variables

**Error:** `Cannot connect to DynamoDB`
- **Solution:** Check `AWS_REGION` and table names are correct

### High Memory Usage

**Issue:** Container running out of memory
- **Solution:** 
  - Reduce `MAX_CONCURRENT_JOBS` (try 200-300)
  - Or upgrade to larger instance size

## 📊 Monitoring

- **Logs:** View in DigitalOcean dashboard → Runtime Logs
- **Metrics:** Check CPU/Memory usage in dashboard
- **Queue Status:** Use `npm run check:queue` (if you SSH in) or check DynamoDB directly

## 🔄 Auto-Deployment

Once set up, every `git push origin main` will:
1. Trigger DigitalOcean build
2. Install dependencies
3. Install Playwright browsers
4. Restart worker with new code

No manual deployment needed! 🎉

## 💰 Cost Estimate

- **$50/day runs:** 1 container = $98/month
- **$500/day runs:** 2 containers = $196/month
- **Idle:** 1 container = $98/month

Much cheaper than EC2 ($500/month)!

