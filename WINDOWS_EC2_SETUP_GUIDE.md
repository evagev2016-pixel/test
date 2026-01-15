# Windows EC2 Setup Guide - Complete Instructions

## Prerequisites

- Windows EC2 instance running (c6i.xlarge or larger)
- RDP access configured (Security Group allows port 3389)
- Windows password obtained from EC2 Console

---

## Step 1: Connect to EC2 via RDP

### On Your Local PC:

1. **Press `Win + R`**
2. **Type:** `mstsc` (Remote Desktop Connection)
3. **Enter EC2 Public IP** (from EC2 Console)
4. **Click "Connect"**
5. **Enter credentials:**
   - Username: `Administrator`
   - Password: (from EC2 Console → Connect → Get Windows Password)

**You should now see Windows desktop on EC2!**

---

## Step 2: Download Setup Script

### Option A: Download from GitHub (Recommended)

1. **Open browser** on Windows EC2
2. **Go to your GitHub repository**
3. **Navigate to:** `adsterra/scripts/setup-ec2-windows.ps1`
4. **Click "Raw"** (view raw file)
5. **Save as:** `C:\setup-ec2-windows.ps1`

### Option B: Copy from Your Local PC

1. **On your local PC**, copy `adsterra/scripts/setup-ec2-windows.ps1`
2. **In RDP**, open File Explorer
3. **Paste file** to `C:\setup-ec2-windows.ps1`

---

## Step 3: Run Setup Script

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
   .\setup-ec2-windows.ps1
   ```

5. **Follow prompts:**
   - Enter your GitHub repository URL when asked
   - Script will install everything automatically

**This takes 10-15 minutes** (mostly downloading/installing)

---

## Step 4: Configure Environment Variables

1. **Open .env file:**
   ```powershell
   notepad C:\AdsenseLoading\adsterra\.env
   ```

2. **Update these values:**
   ```env
   BRIGHTDATA_PASSWORD=your-actual-password-here
   AWS_REGION=us-east-1
   # Add AWS credentials if not using IAM role:
   # AWS_ACCESS_KEY_ID=your-key
   # AWS_SECRET_ACCESS_KEY=your-secret
   ```

3. **Save and close** (Ctrl+S, then close)

---

## Step 5: Start the Worker

1. **Open PowerShell** (can be regular, not admin)

2. **Navigate to adsterra folder:**
   ```powershell
   cd C:\AdsenseLoading\adsterra
   ```

3. **Start worker with PM2:**
   ```powershell
   pm2 start ecosystem.config.js
   ```

4. **Save PM2 configuration** (so it starts on reboot):
   ```powershell
   pm2 save
   ```

5. **Configure PM2 to start on Windows boot:**
   ```powershell
   pm2-startup install
   ```
   (Follow the instructions it shows)

---

## Step 6: Verify It's Working

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

### Starting a Run (From Your Local PC or Cloud Frontend):

1. **Create run** in frontend (set profit, distribution, etc.)
2. **Click "Start Production"**
3. **Frontend creates jobs in DynamoDB**
4. **EC2 worker automatically picks them up** (within seconds)
5. **Watch browsers run** via RDP (optional)
6. **Monitor progress** in frontend

### Monitoring on EC2:

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
   - **Missing .env file:** Create it from template
   - **Wrong credentials:** Check .env file
   - **DynamoDB access:** Check AWS credentials
   - **Port conflicts:** Unlikely, but check

### Can't Connect to DynamoDB?

1. **Check AWS credentials in .env**
2. **Or use IAM role** (attach IAM role to EC2 instance with DynamoDB permissions)
3. **Test connection:**
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

### PM2 Not Working?

1. **Reinstall PM2:**
   ```powershell
   npm install -g pm2 pm2-windows-startup
   ```

2. **Run PowerShell as Administrator** for PM2 commands

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

# Delete worker from PM2
pm2 delete adsterra-worker

# View PM2 info
pm2 info adsterra-worker

# Monitor (CPU, memory)
pm2 monit
```

---

## Security Notes

1. **Keep RDP secure:**
   - Only allow your IP in Security Group
   - Use strong Windows password
   - Consider using AWS Systems Manager Session Manager instead

2. **Protect .env file:**
   - Contains sensitive credentials
   - Don't commit to Git
   - Keep it secure

3. **AWS Credentials:**
   - Best practice: Use IAM role attached to EC2
   - Alternative: Use .env file (less secure)

---

## Next Steps

1. ✅ **EC2 worker is running** - automatically processes jobs
2. **Deploy frontend** to Vercel/DigitalOcean (optional)
3. **Create your first run** from frontend
4. **Watch it work!** 🚀

---

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs adsterra-worker`
2. Check .env file configuration
3. Verify DynamoDB access
4. Check Security Group settings

The worker will automatically pick up jobs from DynamoDB as soon as you create them from the frontend!

