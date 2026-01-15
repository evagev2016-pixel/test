# Windows EC2 Production Setup Guide

## 🎯 EC2 Instance Spec Recommendation

### For 25 Concurrent Browsers:

**Recommended: `c6i.4xlarge`**
- **vCPUs:** 16
- **RAM:** 32 GB
- **Cost:** ~$680/month (on-demand) or ~$200/month (1-year reserved)
- **Why:** Handles 25 concurrent headed browsers comfortably

**Alternative (if budget tight): `c6i.2xlarge`**
- **vCPUs:** 8
- **RAM:** 16 GB  
- **Cost:** ~$340/month (on-demand)
- **Why:** Might work but will be tight with 25 concurrent

### Resource Calculation:
- **25 concurrent browsers** × **400MB each** = 10GB RAM
- **Windows OS overhead:** ~3GB
- **Node.js/PM2:** ~500MB
- **Buffer:** ~5GB
- **Total needed:** ~18-20GB → **32GB recommended**

---

## 🚀 Production Setup (No IDE Needed)

### Step 1: Create EC2 Windows Instance

1. **AWS Console** → EC2 → Launch Instance
2. **AMI:** Windows Server 2022 Base
3. **Instance Type:** `c6i.4xlarge` (or `c6i.2xlarge` if budget tight)
4. **Storage:** 50GB SSD (minimum)
5. **Security Group:** Allow RDP (port 3389) from your IP
6. **Key Pair:** Create/download .pem file (for password retrieval)

---

### Step 2: Connect via RDP (One-Time Setup)

1. **Get Windows Password:**
   - EC2 Console → Select instance → Connect → Get Windows Password
   - Use your .pem key to decrypt password

2. **Connect:**
   - Windows: `Win + R` → `mstsc` → Enter Public IP
   - Mac: Microsoft Remote Desktop app
   - Username: `Administrator`

---

### Step 3: Run Setup Script (Automated)

1. **Open PowerShell as Administrator** on EC2

2. **Download setup script:**
   ```powershell
   cd C:\
   Invoke-WebRequest -Uri "https://raw.githubusercontent.com/footyamigo/adsterra/main/scripts/setup-ec2-windows.ps1" -OutFile "setup.ps1"
   ```

3. **Run setup:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\setup.ps1
   ```

4. **Follow prompts** (enter GitHub repo URL when asked)

**This installs:**
- Node.js 20
- Git
- Clones your repo
- Installs dependencies
- Installs Playwright browsers
- Sets up PM2
- Creates .env file

---

### Step 4: Configure .env File

```powershell
notepad C:\AdsenseLoading\adsterra\.env
```

**Update these values:**
```env
# BrightData
BRIGHTDATA_PASSWORD=your-password-here

# AWS (or use IAM role)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Browser (headed mode)
BROWSER_HEADLESS=false

# Timing (10-30 seconds)
MIN_AD_WAIT=10000
MAX_AD_WAIT=30000

# Concurrency (adjust based on instance size)
MAX_CONCURRENT_BROWSERS=25
```

---

### Step 5: Start Worker with PM2 (Production Mode)

**PM2 runs in background - no IDE needed!**

```powershell
cd C:\AdsenseLoading\adsterra

# Start worker
pm2 start ecosystem.config.js

# Save PM2 config (survives reboots)
pm2 save

# Auto-start on Windows boot
pm2-startup install
```

**That's it!** Worker is now running in background.

---

### Step 6: Disconnect RDP (Optional)

**You can close RDP now!** PM2 keeps the worker running.

**To reconnect later:**
- RDP back in
- Check status: `pm2 status`
- View logs: `pm2 logs adsterra-worker`

---

## 📊 Monitoring (Without RDP)

### Option 1: CloudWatch Logs (Recommended)

Set up CloudWatch agent to stream PM2 logs to AWS CloudWatch.

### Option 2: SSH/Terminal Access

Use AWS Systems Manager Session Manager (no RDP needed).

### Option 3: Frontend Dashboard

Your frontend shows real-time stats from DynamoDB.

---

## 🔄 Daily Operations

### Update Code:
```powershell
# Connect via RDP (or use Session Manager)
cd C:\AdsenseLoading
git pull
cd adsterra
npm install  # if dependencies changed
pm2 restart adsterra-worker
```

### Check Status:
```powershell
pm2 status
pm2 logs adsterra-worker --lines 50
```

### Restart Worker:
```powershell
pm2 restart adsterra-worker
```

---

## ❓ FAQ

### Q: Do I need to compile to EXE?
**A: No!** PM2 runs `tsx src/worker.ts` directly. No compilation needed.

### Q: Can I close RDP?
**A: Yes!** PM2 runs as a Windows service. Worker continues running.

### Q: Will it start on reboot?
**A: Yes!** `pm2-startup install` configures auto-start.

### Q: What if Cursor/IDE causes lag?
**A: Don't run Cursor on EC2!** Use PM2 only. Connect via RDP only when needed.

### Q: How to reduce lag?
**A:**
1. Don't run Cursor/IDE on EC2
2. Use PM2 (runs in background)
3. Close RDP when not needed
4. Use `c6i.4xlarge` (32GB RAM) for 25 concurrent

---

## 💰 Cost Optimization

### Option 1: Reserved Instances (1-year)
- **c6i.4xlarge:** ~$200/month (vs $680 on-demand)
- **Savings:** 70% discount

### Option 2: Spot Instances
- **c6i.4xlarge:** ~$200/month (can be interrupted)
- **Risk:** Instance may terminate (but PM2 auto-restarts)

### Option 3: Start/Stop Schedule
- Run only during business hours
- Stop at night (saves ~50% cost)

---

## ✅ Production Checklist

- [ ] EC2 instance created (`c6i.4xlarge` recommended)
- [ ] RDP access configured
- [ ] Setup script run successfully
- [ ] .env file configured with credentials
- [ ] PM2 worker started and saved
- [ ] PM2 startup configured
- [ ] Tested with small run (10 impressions)
- [ ] Verified browsers launch correctly
- [ ] Disconnected RDP (worker still running)
- [ ] Frontend shows jobs processing

---

## 🎯 Summary

**You DON'T need:**
- ❌ Cursor/IDE on EC2
- ❌ Compile to EXE
- ❌ Keep RDP open
- ❌ Manual process management

**You DO need:**
- ✅ PM2 (runs in background)
- ✅ Proper EC2 spec (`c6i.4xlarge` for 25 concurrent)
- ✅ .env file with credentials
- ✅ One-time RDP setup, then disconnect

**The worker runs 24/7 in the background, automatically processing jobs!**

