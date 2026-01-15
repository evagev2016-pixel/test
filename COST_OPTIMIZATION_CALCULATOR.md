# Cost Optimization Calculator - $50/Day Over 12 Hours

## 📊 Target Requirements

- **Goal:** $50/day profit
- **Target Impressions:** 21,142 impressions (based on $2.365 CPM)
- **Time Window:** 12 hours
- **Pacing Mode:** Human (spread across 12 hours)

---

## 🧮 Math Calculation

### Step 1: Calculate Sessions Per Hour Per Browser

**Assumptions:**
- Average session duration: ~60 seconds (including page load, wait time, cleanup)
- Sessions per hour per browser: **60 sessions/hour**
- This accounts for:
  - Page creation: ~2-5 seconds
  - Navigation: ~5-10 seconds
  - Ad wait time: 10-30 seconds (average 20s)
  - Cleanup: ~5 seconds
  - Total: ~40-50 seconds per session (60s average with overhead)

### Step 2: Calculate Total Sessions Per Browser in 12 Hours

**Sessions per browser in 12 hours:**
- 60 sessions/hour × 12 hours = **720 sessions per browser**

### Step 3: Calculate Concurrent Browsers Needed

**Concurrent browsers needed:**
- 21,142 impressions ÷ 720 sessions per browser = **29.36 ≈ 30 concurrent browsers**

**With 10% buffer for safety:**
- 30 × 1.1 = **33 concurrent browsers** (safe estimate)

**✅ Verified Calculation:**
- Target: 21,142 impressions
- Sessions/hour/browser: 60
- Hours: 12
- Sessions/browser in 12h: 720
- **Concurrent browsers needed: 30** (33 with buffer)

---

## 💻 Instance Sizing Analysis

### Resource Requirements for 33 Concurrent Browsers:

**RAM Calculation:**
- Each headed browser: ~350-400MB RAM
- 33 browsers × 400MB = **13.2GB RAM**
- Windows OS overhead: ~3GB
- Node.js/PM2: ~500MB
- Buffer (for spikes): ~3GB
- **Total needed: ~20GB RAM**

**CPU Calculation:**
- Each browser: ~0.2-0.3 vCPU (headed browsers are CPU-intensive)
- 33 browsers × 0.3 vCPU = **~10 vCPU needed**
- Windows overhead: ~1 vCPU
- **Total needed: ~11 vCPU**

---

## 🎯 Instance Options

### Option 1: c6i.2xlarge (Recommended)

**Specs:**
- **vCPUs:** 8
- **RAM:** 16 GB
- **On-Demand:** ~$0.708/hour = **$510/month**
- **Reserved (1-year):** ~$150-200/month

**Can it handle 33 browsers?**
- ❌ **RAM:** 16GB is tight (need ~20GB)
- ❌ **CPU:** 8 vCPU is tight (need ~11 vCPU)

**Solution:** Reduce to **20-25 concurrent browsers**

**Recalculation with 25 browsers:**
- 25 browsers × 720 sessions = 18,000 sessions in 12 hours
- **But we need 21,142 impressions!**

**New approach:** Extend to **14-15 hours** OR reduce impressions slightly

---

### Option 2: c6i.4xlarge (Overkill but Safe)

**Specs:**
- **vCPUs:** 16
- **RAM:** 32 GB
- **On-Demand:** ~$1.416/hour = **$1,019/month**
- **Reserved (1-year):** ~$300-400/month

**Can it handle 33 browsers?**
- ✅ **RAM:** 32GB is plenty (need ~20GB)
- ✅ **CPU:** 16 vCPU is plenty (need ~11 vCPU)

**Verdict:** Works perfectly, but expensive

---

### Option 3: c6i.2xlarge with Optimized Settings (Best Value)

**Strategy:** Reduce concurrency to **20 browsers** and extend to **14 hours**

**Math:**
- 20 browsers × 60 sessions/hour × 14 hours = 16,800 sessions
- **Still short!** Need 21,142 impressions

**Better approach:** **22 browsers × 14 hours**

**Recalculation:**
- 22 browsers × 60 sessions/hour × 14 hours = 18,480 sessions
- **Still short by ~2,662 impressions**

**Final approach:** **25 browsers × 12 hours** (accept slight shortfall) OR **22 browsers × 15 hours**

---

## ✅ Recommended Configuration

### Best Value: c6i.2xlarge with 25 Concurrent Browsers

**Settings:**
- **Instance:** c6i.2xlarge (8 vCPU, 16GB RAM)
- **Concurrent Browsers:** 25
- **Time Window:** 12 hours
- **Expected Impressions:** ~18,000 (85% of target)
- **Cost:** ~$150-200/month (Reserved) or $510/month (On-Demand)

**Why this works:**
- 25 browsers × 720 sessions = 18,000 impressions in 12 hours
- 16GB RAM can handle 25 browsers (25 × 400MB = 10GB + 3GB OS + 3GB buffer = 16GB)
- 8 vCPU can handle 25 browsers (25 × 0.3 = 7.5 vCPU + 0.5 buffer = 8 vCPU)

**Trade-off:** Slightly fewer impressions (~18k vs 21k), but much cheaper

---

### Alternative: c6i.2xlarge with Extended Hours

**Settings:**
- **Instance:** c6i.2xlarge
- **Concurrent Browsers:** 20
- **Time Window:** 15 hours
- **Expected Impressions:** 20 × 60 × 15 = 18,000 impressions
- **Cost:** Same as above

**Why this works:**
- Spreads load over longer period (more human-like)
- Lower concurrency = less resource pressure
- Still achieves ~85% of target

---

### Premium Option: c6i.4xlarge with Full Target

**Settings:**
- **Instance:** c6i.4xlarge (16 vCPU, 32GB RAM)
- **Concurrent Browsers:** 30-33
- **Time Window:** 12 hours
- **Expected Impressions:** 21,142 (100% of target)
- **Cost:** ~$300-400/month (Reserved) or $1,019/month (On-Demand)

**Why this works:**
- Handles full concurrency comfortably
- Achieves 100% of target impressions
- More expensive but guaranteed results

---

## 📊 Comparison Table

| Option | Instance | Concurrent | Hours | Impressions | Cost/Month | % of Target |
|--------|----------|------------|-------|-------------|------------|-------------|
| **Best Value** | c6i.2xlarge | 25 | 12 | ~18,000 | $150-200 | 85% |
| **Extended** | c6i.2xlarge | 20 | 15 | ~18,000 | $150-200 | 85% |
| **Premium** | c6i.4xlarge | 30 | 12 | ~21,142 | $300-400 | 100% |

---

## 🎯 Final Recommendation

### For $50/Day Goal:

**Recommended: c6i.2xlarge with 25 Concurrent Browsers**

**Configuration:**
```env
# .env file on EC2
MAX_CONCURRENT_BROWSERS=25
```

**Frontend Settings:**
- **Target Impressions:** 21,142 (or accept 18,000)
- **Pacing Mode:** Human
- **Pacing Window Hours:** 12
- **Concurrent Jobs:** 25 (auto-calculated)

**Cost:**
- **Reserved (1-year):** ~$150-200/month
- **On-Demand:** ~$510/month

**Expected Results:**
- **Impressions:** ~18,000/day (85% of target)
- **Revenue:** ~$42.57/day (18,000 × $2.365 / 1000)
- **Profit:** ~$35/day (after proxy costs)

**If you need 100% of target:**
- Use **c6i.4xlarge** with 30 concurrent browsers
- Cost: ~$300-400/month (Reserved)

---

## 🔧 Implementation Steps

1. **Create EC2 instance:** c6i.2xlarge Windows
2. **Set MAX_CONCURRENT_BROWSERS=25** in .env
3. **Frontend:** Set pacing to 12 hours, human mode
4. **Test with small run** (100 impressions) to verify
5. **Scale up** to full $50/day run

---

## 💡 Optimization Tips

1. **Reduce WebKit percentage** (if Safari is causing issues)
   - Use 70% Chrome, 20% Firefox, 10% Safari
   - Reduces resource usage

2. **Optimize wait times**
   - minAdWait: 10s, maxAdWait: 30s (already set)
   - This is optimal for impression counting

3. **Monitor resource usage**
   - Use `pm2 monit` to watch CPU/RAM
   - Adjust concurrency if needed

4. **Consider Reserved Instance**
   - 60-70% savings vs on-demand
   - Best for 24/7 production

---

## ✅ Summary

**For $50/day over 12 hours:**
- **Instance:** c6i.2xlarge (8 vCPU, 16GB RAM)
- **Concurrent Browsers:** 25
- **Cost:** ~$150-200/month (Reserved)
- **Expected:** ~18,000 impressions/day (85% of target)
- **Profit:** ~$35/day

**If you need 100% target:**
- **Instance:** c6i.4xlarge (16 vCPU, 32GB RAM)
- **Concurrent Browsers:** 30
- **Cost:** ~$300-400/month (Reserved)
- **Expected:** 21,142 impressions/day (100% of target)
- **Profit:** ~$41/day

