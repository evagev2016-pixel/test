# DigitalOcean Deployment Fix

## 🔴 Current Issues

1. **Missing system library**: `libnspr4.so` - Chromium needs system dependencies
2. **Health check failure**: Component configured as Web Service instead of Worker

## ✅ Solutions

### 1. Fix System Dependencies

**In DigitalOcean Dashboard:**

Update your **Build Command** to:
```bash
npm install && npx playwright install chromium --with-deps
```

The `--with-deps` flag installs system libraries that Chromium needs. DigitalOcean App Platform should allow this during build (not runtime).

### 2. Configure as Worker (Not Web Service)

**Critical:** Make sure your component is a **Worker**, not a **Web Service**:

1. Go to DigitalOcean App Platform dashboard
2. Find your app → **Components**
3. Check the component type:
   - ❌ If it says "Web Service" → Delete it and create a new Worker
   - ✅ If it says "Worker" → Good!

**Why this matters:**
- Workers don't need HTTP health checks on port 8080
- Workers run background processes (like your bot)
- Web Services expect HTTP endpoints (which your bot doesn't have)

### 3. Update Build Command in Dashboard

1. Go to **Settings → Build & Deploy**
2. Update **Build Command**:
   ```bash
   npm install && npx playwright install chromium --with-deps
   ```
3. Make sure **Run Command** is:
   ```bash
   npm start
   ```

### 4. Disable Health Checks (If Still Failing)

If health checks still fail after configuring as Worker:

1. Go to **Settings → Health Checks**
2. **Disable** HTTP health checks (Workers don't need them)
3. Or set health check to a different port (but Workers shouldn't need this)

## 📝 Summary

**What to do:**
1. ✅ Update Build Command: Add `--with-deps` flag
2. ✅ Verify component is **Worker** (not Web Service)
3. ✅ Disable HTTP health checks (Workers don't need them)

**After these changes:**
- System dependencies will be installed during build
- No health check errors (Workers don't need HTTP endpoints)
- Playwright browsers will work correctly

