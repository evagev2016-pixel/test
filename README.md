# Adsterra Smart Link Bot System

Automated bot system for generating Adsterra Smart Link impressions.

## 🎯 Overview

- **Target**: 160,000 impressions/day
- **Bots**: 16,000 bots × 10 sessions each
- **Proxy**: IPRoyal Mobile Proxies
- **Cost**: $10.11/day
- **Expected Profit**: $230.89/day

## 📋 Prerequisites

1. **AWS DynamoDB** - Used for job queue (already set up!)
   ```bash
   # Setup DynamoDB table (one-time)
   npm run setup:jobs
   ```

2. **Node.js** - v18 or higher

3. **IPRoyal Proxy** - Already configured

4. **AWS Credentials** - Set in `.env` file

## 🚀 Setup

1. **Install dependencies:**
   ```bash
   cd adsterra
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp env.template .env
   # Edit .env with your settings (especially BLOG_HOMEPAGE_URL)
   ```

3. **Update .env file:**
   - Set `BLOG_HOMEPAGE_URL` to your blog URL
   - Adjust `TOTAL_BOTS` and `SESSIONS_PER_BOT` if needed
   - Set `BROWSER_HEADLESS=false` for testing (to see browser)

## 🏃 Running

### 1. Setup DynamoDB Table (One-time)
```bash
npm run setup:jobs
```
This creates the DynamoDB table for storing jobs.

### 2. Create Jobs (One-time)
```bash
npm run orchestrator
```
This creates all 160,000 session jobs and adds them to DynamoDB.

### 3. Start Workers
```bash
npm run worker
```
Start multiple worker processes (in separate terminals) for better performance:
```bash
# Terminal 1
npm run worker

# Terminal 2
npm run worker

# Terminal 3
npm run worker
```

### 4. Monitor (Optional)
```bash
npm run dev
```
Shows real-time queue statistics.

## 📊 Flow

Each bot session:
1. Visits blog homepage
2. Finds all articles on homepage
3. Randomly selects one article
4. Navigates to article
5. Scrolls down to find Smart Link
6. Clicks Smart Link
7. Waits 20-60 seconds on advertiser page (for impression)
8. Closes browser

## ⚙️ Configuration

### Environment Variables

- `BLOG_HOMEPAGE_URL` - Your blog homepage URL
- `SMART_LINK_TEXT` - Text of the Smart Link to find
- `TOTAL_BOTS` - Number of bots (default: 16000)
- `SESSIONS_PER_BOT` - Sessions per bot per day (default: 10)
- `BROWSER_HEADLESS` - true for production, false for testing
- `REDIS_URL` - Redis connection URL

### Timing Configuration

- `MIN_SCROLL_WAIT` - Min wait after scrolling (ms)
- `MAX_SCROLL_WAIT` - Max wait after scrolling (ms)
- `MIN_AD_WAIT` - Min wait on ad page (ms) - 20 seconds
- `MAX_AD_WAIT` - Max wait on ad page (ms) - 60 seconds

## 🔍 Testing

1. Set `BROWSER_HEADLESS=false` in `.env`
2. Set `TOTAL_BOTS=10` and `SESSIONS_PER_BOT=1` for testing
3. Run orchestrator to create test jobs
4. Run worker to see browser in action
5. Verify Smart Link is found and clicked correctly

## 📈 Monitoring

- Queue stats: Check Redis or use monitoring script
- Success rate: Monitor completed vs failed jobs
- Adsterra dashboard: Check impressions in Adsterra account

## ⚠️ Important Notes

- Each bot gets unique IP automatically from IPRoyal
- Sessions are spread across 24 hours
- Average concurrent bots: ~75-100
- Peak concurrent bots: ~200-300
- Each session = new browser = new IP

## 🛠️ Troubleshooting

### Smart Link Not Found
- Check `SMART_LINK_TEXT` matches exactly
- Verify link is on article pages
- Check article selectors in `src/bot/session.ts`

### No Articles Found
- Update article selectors in `findArticles()` method
- Check blog homepage structure
- Verify `BLOG_HOMEPAGE_URL` is correct

### Queue Not Processing
- Check Redis is running
- Verify `REDIS_URL` is correct
- Check worker logs for errors

## 📝 File Structure

```
adsterra/
├── src/
│   ├── bot/
│   │   └── session.ts          # Bot session execution
│   ├── queue/
│   │   └── index.ts            # Queue setup
│   ├── config/
│   │   └── index.ts             # Configuration
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   ├── utils/
│   │   └── helpers.ts           # Helper functions
│   ├── orchestrator.ts          # Job creation
│   ├── worker.ts                # Worker process
│   └── index.ts                 # Monitoring dashboard
├── .env.example                 # Environment template
├── package.json
└── README.md
```

# test
