# Google Cloud Windows Setup Guide

## 📋 Instance Details

- **Instance Name:** adsterra-bot
- **External IP:** 34.69.10.52
- **Region:** us-central1-c
- **OS:** Windows Server 2025
- **Specs:** 12 vCPU, 32GB RAM

---

## Step 1: Set Windows Password

1. **In Google Cloud Console:**
   - Go to your instance page
   - Click **"Set Windows password"** button
   - Copy the generated password (you'll need this for RDP)

---

## Step 2: Connect via RDP

### On Your Local PC:

1. **Press `Win + R`**
2. **Type:** `mstsc` (Remote Desktop Connection)
3. **Enter External IP:** `34.69.10.52`
4. **Click "Connect"**
5. **Enter credentials:**
   - Username: `Administrator` (or the username shown in Google Cloud)
   - Password: (the password you set in Step 1)

**You should now see Windows desktop on Google Cloud!**

---

## Step 3: Download Setup Script

### Option A: Download from GitHub (Recommended)

1. **Open browser** on Windows VM (Internet Explorer or Edge)
2. **Go to:** https://raw.githubusercontent.com/footyamigo/adsterra/main/scripts/setup-google-cloud-windows.ps1
3. **Right-click** → **Save As**
4. **Save to:** `C:\setup.ps1`

### Option B: Copy from Your Local PC

1. **On your local PC**, copy the setup script
2. **In RDP**, open File Explorer
3. **Paste file** to `C:\setup.ps1`

---

## Step 4: Run Setup Script

1. **Open PowerShell as Administrator:**
   - Right-click Start button
   - Select "Windows PowerShell (Admin)"

2. **Navigate to C:\:**
   ```powershell
   cd C:\
   ```

3. **Allow script execution** (first time only):
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

4. **Run setup script:**
   ```powershell
   .\setup.ps1
   ```

5. **Follow prompts:**
   - Enter your GitHub repository URL: `https://github.com/footyamigo/adsterra`
   - Script will install everything automatically

**This takes 10-15 minutes** (mostly downloading/installing)

---

## Step 5: Configure Environment Variables

1. **Open .env file:**
   ```powershell
   notepad C:\AdsenseLoading\adsterra\.env
   ```

2. **Update these values** (from your local .env):
   ```env
   # BrightData (you already have this)
   BRIGHTDATA_PASSWORD=ql1bol9csls1
   
   # AWS (copy from your local .env)
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-key-here
   AWS_SECRET_ACCESS_KEY=your-secret-here
   DYNAMODB_ADSTERRA_RUNS_TABLE=AdsterraRuns
   DYNAMODB_ADSTERRA_JOBS_TABLE=AdsterraJobs
   
   # Browser (headed mode for impressions)
   BROWSER_HEADLESS=false
   
   # Timing (10-30 seconds for impressions)
   MIN_AD_WAIT=10000
   MAX_AD_WAIT=30000
   
   # Worker (25 concurrent for $50/day)
   MAX_CONCURRENT_BROWSERS=25
   PROCESS_IMMEDIATELY=true
   ```

3. **Save and close** (Ctrl+S, then close)

---

## Step 6: Start the Worker

### Option A: Auto-Start Script (Recommended)

This keeps the worker running and auto-restarts if it crashes:

1. **Open PowerShell** (can be regular, not admin)

2. **Run the auto-start script:**
   ```powershell
   cd C:\adsterra
   .\scripts\start-worker-auto.ps1
   ```

This will:
- Start the worker automatically
- Auto-restart if it crashes
- Keep running until you stop it (Ctrl+C)

**To run in background (keeps running after closing RDP):**
- Use Windows Task Scheduler (see Option B below)

### Option B: Windows Task Scheduler (Auto-start on Boot)

1. **Open Task Scheduler** (search in Start menu)

2. **Create Basic Task:**
   - Name: "Adsterra Worker"
   - Trigger: "When the computer starts"
   - Action: "Start a program"
   - Program: `powershell.exe`
   - Arguments: `-NoExit -File "C:\adsterra\scripts\start-worker-auto.ps1"`

3. **Save** - Worker will auto-start on every boot

### Option C: Manual Start (For Testing)

```powershell
cd C:\adsterra
npx tsx src/worker.ts
```

Keep this window open while testing.

---

## Step 7: Verify It's Working

**Note:** The worker now:
- ✅ Retries 502 errors and other proxy failures (2 retries = 3 total attempts)
- ✅ Shows summary every 5 minutes with run progress
- ✅ Shows final summary when runs complete with revenue/profit breakdown

1. **Check PM2 status:**
   ```powershell
   pm2 status
   ```
   Should show `adsterra-worker` as "online"

2. **View logs:**
   ```powershell
   pm2 logs adsterra-worker
   ```
   Should show worker polling for jobs

3. **Check if it's processing:**
   - Logs should show: "Polling for jobs..." or "No jobs available"
   - This means it's connected to DynamoDB and working!

---

## Daily Workflow

### Starting a Run (From Your Local Frontend):

1. **Create run** in frontend (set $50/day, 12 hours, human pacing)
2. **Click "Start Production"**
3. **Frontend creates jobs in DynamoDB**
4. **Google Cloud worker automatically picks them up** (within seconds)
5. **Monitor progress** in frontend

### Monitoring on Google Cloud:

```powershell
# Check status
pm2 status

# View live logs
pm2 logs adsterra-worker

# View last 100 lines
pm2 logs adsterra-worker --lines 100

# Restart if needed
pm2 restart adsterra-worker
```

### Updating Code:

```powershell
# Navigate to repo
cd C:\AdsenseLoading

# Pull latest code
git pull

# Install new dependencies (if package.json changed)
cd adsterra
npm install

# Restart worker
pm2 restart adsterra-worker
```

---

## Cost Optimization: 12-Hour Schedule

To save money by running only 12 hours/day:

### Option 1: Manual Start/Stop

1. **Start instance** when you need it (Google Cloud Console)
2. **PM2 auto-starts** worker when instance boots
3. **Stop instance** when done (saves ~50% cost)

### Option 2: Automated Schedule (Recommended)

Use Google Cloud Scheduler to auto-start/stop:
- **Start:** Daily at your desired time
- **Stop:** 12 hours later
- **Cost:** ~$138/month (vs $280/month 24/7)

---

## Troubleshooting

### Worker Not Starting?

1. **Check PM2 status:**
   ```powershell
   pm2 status
   ```

2. **Check logs for errors:**
   ```powershell
   pm2 logs adsterra-worker --err
   ```

3. **Common issues:**
   - Missing .env file: Create it from template
   - Wrong credentials: Check .env file
   - DynamoDB access: Check AWS credentials

### Can't Connect to DynamoDB?

1. **Check AWS credentials in .env**
2. **Test connection:**
   ```powershell
   cd C:\AdsenseLoading\adsterra
   node -e "const {DynamoDBClient} = require('@aws-sdk/client-dynamodb'); const client = new DynamoDBClient({region: 'us-east-1'}); console.log('Connected!');"
   ```

### Browsers Not Running?

1. **Check BROWSER_HEADLESS=false** in .env
2. **Check Playwright browsers installed:**
   ```powershell
   cd C:\AdsenseLoading\adsterra
   npx playwright install chromium firefox webkit
   ```

---

## Useful Commands

```powershell
# View worker status
pm2 status

# View logs (live)
pm2 logs adsterra-worker

# View logs (last 50 lines)
pm2 logs adsterra-worker --lines 50

# Restart worker
pm2 restart adsterra-worker

# Stop worker
pm2 stop adsterra-worker

# Monitor (CPU, memory)
pm2 monit
```

---

## Next Steps

1. ✅ **Worker is running** - automatically processes jobs
2. **Create your first run** from frontend
3. **Watch it work!** 🚀

The worker will automatically pick up jobs from DynamoDB as soon as you create them from the frontend!

