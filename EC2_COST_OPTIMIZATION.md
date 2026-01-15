# EC2 Windows Cost Optimization Guide

## 💰 Current Pricing (c6i.4xlarge Windows)

**On-Demand:** $1.416/hour = **$1,019/month**

---

## 🎯 Cost Optimization Strategies

### Option 1: Reserved Instances (Best for 24/7)

**1-Year Reserved Instance:**
- **Cost:** ~$300-400/month (60-70% savings)
- **Total:** ~$3,600-4,800/year
- **Best for:** Always-on production

**3-Year Reserved Instance:**
- **Cost:** ~$250-350/month (75-80% savings)
- **Total:** ~$9,000-12,600/3 years
- **Best for:** Long-term commitment

**How to buy:**
1. EC2 Console → Reserved Instances → Purchase Reserved Instances
2. Select: `c6i.4xlarge`, Windows, 1-year term
3. Payment: All upfront (best discount) or partial upfront

---

### Option 2: Savings Plans (Flexible)

**Compute Savings Plan:**
- **Cost:** ~$400-500/month (50-60% savings)
- **Flexibility:** Can switch instance types/families
- **Best for:** If you might change instance types

**EC2 Instance Savings Plan:**
- **Cost:** ~$350-450/month (60-65% savings)
- **Flexibility:** Same instance family only
- **Best for:** Fixed instance type

---

### Option 3: Spot Instances (Risky but Cheap)

**Cost:** ~$400-600/month (40-60% savings)

**Risks:**
- Can be interrupted (terminated) with 2-minute warning
- Not suitable for 24/7 production
- Need to handle interruptions gracefully

**Best for:**
- Non-critical workloads
- Can tolerate interruptions
- Have fallback (e.g., DigitalOcean worker)

---

### Option 4: Schedule-Based (Stop/Start)

**Run 12 hours/day:**
- **Cost:** $1.416/hour × 12h × 30 days = **$510/month** (50% savings)

**Run 8 hours/day:**
- **Cost:** $1.416/hour × 8h × 30 days = **$340/month** (67% savings)

**Automation:**
- Use AWS Lambda + EventBridge to start/stop on schedule
- Worker auto-starts when instance starts (PM2 configured)

**Best for:**
- Business hours only
- Can schedule around peak usage

---

### Option 5: Smaller Instance (If Concurrency < 25)

**c6i.2xlarge (8 vCPU, 16GB RAM):**
- **On-Demand:** ~$0.708/hour = **$510/month**
- **Reserved (1-year):** ~$150-200/month
- **Best for:** 10-15 concurrent browsers

**c6i.xlarge (4 vCPU, 8GB RAM):**
- **On-Demand:** ~$0.354/hour = **$255/month**
- **Reserved (1-year):** ~$75-100/month
- **Best for:** 5-8 concurrent browsers

---

## 📊 Cost Comparison Table

| Option | Monthly Cost | Savings | Best For |
|--------|-------------|---------|----------|
| **On-Demand** | $1,019 | 0% | Testing, short-term |
| **Reserved (1-year)** | $300-400 | 60-70% | Production 24/7 |
| **Reserved (3-year)** | $250-350 | 75-80% | Long-term commitment |
| **Savings Plan** | $400-500 | 50-60% | Flexible instance types |
| **Spot Instance** | $400-600 | 40-60% | Non-critical workloads |
| **12h/day Schedule** | $510 | 50% | Business hours only |
| **8h/day Schedule** | $340 | 67% | Limited hours |
| **c6i.2xlarge Reserved** | $150-200 | 80% | Lower concurrency |

---

## 🎯 Recommended Strategy

### For Production (24/7):

**Best:** 1-Year Reserved Instance
- **Cost:** ~$300-400/month
- **Savings:** $600-700/month vs on-demand
- **Setup:** One-time purchase, then runs 24/7

### For Testing/Development:

**Best:** On-Demand + Schedule
- **Cost:** $340-510/month (8-12h/day)
- **Flexibility:** Can adjust schedule
- **Setup:** Use Lambda to auto-start/stop

### For Budget-Conscious:

**Best:** c6i.2xlarge Reserved (1-year)
- **Cost:** ~$150-200/month
- **Trade-off:** Lower concurrency (10-15 browsers)
- **Setup:** Adjust `MAX_CONCURRENT_BROWSERS=15` in .env

---

## 🔧 How to Set Up Reserved Instance

1. **EC2 Console** → **Reserved Instances** → **Purchase Reserved Instances**

2. **Configure:**
   - **Platform:** Windows
   - **Instance Type:** c6i.4xlarge
   - **Term:** 1 year (or 3 years)
   - **Payment:** All upfront (best discount)

3. **Review & Purchase**

4. **After purchase:**
   - Reserved instance applies automatically
   - No code changes needed
   - Same instance, lower cost

---

## 🔧 How to Set Up Schedule-Based (Stop/Start)

### Using AWS Lambda + EventBridge:

1. **Create Lambda function** to start/stop instance:
   ```python
   import boto3
   
   ec2 = boto3.client('ec2')
   INSTANCE_ID = 'i-xxxxxxxxxxxxx'
   
   def start_instance():
       ec2.start_instances(InstanceIds=[INSTANCE_ID])
   
   def stop_instance():
       ec2.stop_instances(InstanceIds=[INSTANCE_ID])
   ```

2. **Create EventBridge rules:**
   - **Start:** Daily at 8:00 AM UTC
   - **Stop:** Daily at 8:00 PM UTC

3. **Configure PM2 auto-start:**
   - PM2 already configured to start on boot
   - When instance starts, PM2 auto-starts worker

---

## ✅ Summary

**For your $50/day run (21k impressions, 25 concurrent):**

1. **Best value:** 1-Year Reserved Instance = **~$300-400/month**
2. **Most flexible:** On-Demand + Schedule = **~$340-510/month**
3. **Budget option:** c6i.2xlarge Reserved = **~$150-200/month** (lower concurrency)

**Recommendation:** Start with **1-Year Reserved Instance** for maximum savings on 24/7 production.

