# Railway Deployment Guide (No AWS Account Needed)

## 🚀 Quick Deploy to Railway

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub

### Step 2: Deploy from GitHub

1. Click **"Create New Project"**
2. Select **"Deploy from GitHub"**
3. Connect your GitHub account
4. Select repository: `evagev2016-pixel/test`
5. Confirm: Railway will auto-detect Node.js project

### Step 3: Configure Environment Variables

Railway will show a dashboard. Add these variables:

```
# Proxy (required)
PROXY_PROVIDER=brightdata
BRIGHTDATA_HOST=brd.superproxy.io
BRIGHTDATA_PORT=33335
BRIGHTDATA_USERNAME=brd-customer-hl_db83aded-zone-mobile_proxy1
BRIGHTDATA_PASSWORD=qig6iro1op2o
BRIGHTDATA_ZONE=mobile_proxy1
PROXY_COUNTRY=us

# Storage (local, no AWS)
USE_LOCAL_STORAGE=true
STORAGE_PATH=/tmp/adsterra-jobs

# Bot Config
TOTAL_BOTS=500
SESSIONS_PER_BOT=1
TARGET_IMPRESSIONS=500
MIN_CONCURRENT_JOBS=2
CONCURRENT_JOBS=5
MAX_CONCURRENT_JOBS=5

# Browser
BROWSER_HEADLESS=true
BROWSER_TIMEOUT=30000

# Your blog
BLOG_HOMEPAGE_URL=https://your-blog.com
SMART_LINK_TEXT=Smart Link
```

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build (3-5 minutes)
3. Check logs for success

### Step 5: Verify Deployment

Click on project in Railway dashboard:
- Look for green checkmark next to "Running"
- Check logs tab for any errors
- Should see: "Worker started successfully"

## 📊 Monitoring

Railway provides real-time logs. To check status:
1. Dashboard → Your project
2. Click **"Logs"** tab
3. Should see worker processing jobs

## ⚠️ Free Tier Limits

- $5 credit/month (~3-4 days runtime)
- When credits end → auto pause
- Restart when credits refill next month

## 🔄 To Update Code

Simply push to GitHub:
```bash
git push origin main
```

Railway auto-deploys on push!

## ⚡ Cost Optimization

Current config will use ~$1.50-2/day:
- 500 bots × 1 session each
- Minimal concurrency
- Browser headless (fast)

If this works, scale to 2000 bots for ~$6/day.
