# DigitalOcean Quick Setup Guide

## 🎯 How It Works

**You configure build/run commands ONCE in the DigitalOcean dashboard.**
After that, every `git push` to GitHub automatically triggers a new deployment.

## ✅ Step-by-Step Setup (One-Time)

### 1. Create App in DigitalOcean

1. Go to https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. Connect GitHub account
4. Select repository: `footyamigo/adsterra`
5. Select branch: `main`
6. ✅ Enable **"Autodeploy on push"**

### 2. Configure Component (Worker)

When DigitalOcean asks you to configure the component:

**Component Type:** Worker (not Web Service)

**Build Command:**
```bash
npm install && npx playwright install chromium
```

**Run Command:**
```bash
npm start
```

**Instance Size:**
- Choose: $98/mo | 8 GB RAM | 2 Dedicated vCPUs

**Autoscaling:**
- Minimum Containers: 1
- Maximum Containers: 2
- CPU Threshold: 80%

### 3. Add Environment Variables

Go to **Settings → App-Level Environment Variables** and add:

```bash
# AWS (Required)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
DYNAMODB_ADSTERRA_RUNS_TABLE=AdsterraRuns
DYNAMODB_ADSTERRA_JOBS_TABLE=AdsterraJobs

# Proxy (BrightData)
PROXY_PROVIDER=brightdata
BRIGHTDATA_HOST=brd.superproxy.io
BRIGHTDATA_PORT=33335
BRIGHTDATA_USERNAME=brd-customer-hl_d4382b99-zone-residential_proxy1
BRIGHTDATA_PASSWORD=o1qvlhpaqg22
BRIGHTDATA_ZONE=residential_proxy1

# Worker
PROCESS_IMMEDIATELY=true
MAX_CONCURRENT_JOBS=500
CONCURRENT_JOBS=50

# Timing
MIN_SCROLL_WAIT=0
MAX_SCROLL_WAIT=0
MIN_AD_WAIT=10000
MAX_AD_WAIT=30000

# Browser
BROWSER_HEADLESS=true
BROWSER_TIMEOUT=30000

# Queue
QUEUE_POLL_INTERVAL=1000
MAX_RETRIES=3
```

### 4. Deploy

Click **"Create Resources"** or **"Deploy"**

---

## 🔄 After Initial Setup

**That's it!** Now every time you:

```bash
git push origin main
```

DigitalOcean will:
1. ✅ Detect the push
2. ✅ Run build command automatically
3. ✅ Install dependencies
4. ✅ Install Playwright browsers
5. ✅ Start the worker
6. ✅ Deploy new code

**No manual steps needed!**

---

## 🐛 Troubleshooting

### Build Fails: "Playwright requires sudo"

**Fixed!** We removed `--with-deps` flag. DigitalOcean has system dependencies pre-installed.

### Browser Not Found

If you still see browser errors, the build command should be:
```bash
npm install && npx playwright install chromium
```

Make sure it's set in DigitalOcean dashboard → Settings → Build Command

### App Won't Start

Check:
- ✅ Environment variables are set
- ✅ AWS credentials are correct
- ✅ DynamoDB table names are correct

---

## 📝 Summary

1. **Configure once** in DigitalOcean dashboard (build/run commands)
2. **Push to GitHub** → Auto-deploys
3. **That's it!** No manual deployment needed

The `.do/app.yaml` and `app.yaml` files are optional - DigitalOcean will use them if detected, but you can also configure everything in the dashboard UI.

