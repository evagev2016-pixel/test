# DigitalOcean Deployment Checklist

## ✅ Pre-Deployment

- [x] TypeScript errors fixed
- [x] Node version specified in package.json
- [x] `tsx` moved to dependencies (not devDependencies)
- [x] Start command configured (`npm start`)
- [x] dotenv loaded in worker.ts
- [x] Playwright browser installation in postinstall script

## 📦 Files Added/Modified

- [x] `.do/app.yaml` - DigitalOcean configuration
- [x] `DIGITALOCEAN_SETUP.md` - Setup guide
- [x] `.nvmrc` - Node version file
- [x] `.node-version` - Node version file
- [x] `package.json` - Updated with postinstall script
- [x] `src/worker.ts` - Added dotenv import
- [x] `src/orchestrator-run.ts` - Fixed TypeScript errors

## 🚀 Deployment Steps

### 1. Push to GitHub
```bash
cd adsterra
git add .
git commit -m "Configure for DigitalOcean deployment"
git push origin main
```

### 2. DigitalOcean Setup

#### A. Create App
1. Go to https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Connect GitHub
4. Select repo: `footyamigo/adsterra`
5. Select branch: `main`
6. Enable "Autodeploy on push"

#### B. Configure Component
- **Type:** Worker
- **Instance Size:** $98/mo | 8 GB RAM | 2 Dedicated vCPUs
- **Autoscaling:**
  - Min: 1
  - Max: 2
  - CPU Threshold: 80%

#### C. Build Settings
- **Build Command:** `npm install && npx playwright install chromium --with-deps`
- **Run Command:** `npm start`

#### D. Environment Variables
Add all variables from `DIGITALOCEAN_SETUP.md`:
- AWS credentials
- Proxy settings
- Worker configuration
- Timing settings
- Browser settings

### 3. Deploy
- Click "Create Resources"
- Wait for build (~5-10 minutes)
- Check logs for success

## 🔍 Post-Deployment Verification

- [ ] Build completed successfully
- [ ] Worker started (check logs)
- [ ] Can connect to DynamoDB
- [ ] Can connect to BrightData proxy
- [ ] Environment variables loaded correctly

## 📝 Environment Variables Template

Copy this to DigitalOcean dashboard:

```bash
# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
DYNAMODB_ADSTERRA_RUNS_TABLE=AdsterraRuns
DYNAMODB_ADSTERRA_JOBS_TABLE=AdsterraJobs

# Proxy
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

## 🐛 Troubleshooting

### Build Fails
- Check TypeScript compilation errors
- Verify Node version (should be 20+)
- Check Playwright installation

### Worker Won't Start
- Verify environment variables are set
- Check AWS credentials
- Verify DynamoDB table names

### Memory Issues
- Reduce `MAX_CONCURRENT_JOBS`
- Upgrade instance size
- Check autoscaling is working

