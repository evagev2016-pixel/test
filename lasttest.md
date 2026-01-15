# Последний тест сессии (`npm run test:session`)

Логи запуска:
```
npm run test:session  # полный сценарий одной сессии

> adsterra-bot@1.0.0 test:session
> tsx scripts/test-session.ts    


============================================================
🧪 Testing Single Bot Session
============================================================     

📋 Configuration:
   Blog: https://thesportamigo.com/
   Smart Link Text: "Click here to make money with sport betting"
   Headless: Yes

   🌐 Launching browser (headless: true)...
   📝 Headless setting from run config: true
   ⚠️  HEADLESS MODE: Browser runs without display (impressions may not count on Adsterra)
   🌍 Country: USA
   📱 Device: Samsung Galaxy A53 (Mobile)
   🌐 Browser: Chrome
   🔌 Using BRIGHTDATA proxy: http://brd.superproxy.io:33335
   🆔 Session ID: emw41ikyvs5r (ensures unique IP per bot)
   🌍 Proxy Username: brd-customer-hl_d4382b99-zone-mb-session-emw41ikyvs5r-country-us (mobile proxy: session + country)
   ✅ Each bot gets unique USA mobile IP with sticky session
   ✅ Browser launched (chromium) in 897ms
   🔌 Proxy: http://brd.superproxy.io:33335 | Context created in 176ms
   📄 Page created (attempt 1/3) in 225ms
   ⏳ Waiting 10s for chromium proxy connection to establish...
   🔍 Checking page readiness (max 120s)...
   ✅ Browser/proxy connection ready after 2s!
   🚀 Navigating to: https://www.effectivegatecpm.com/q64ufhkh98?key=9414d82da3928873f0911726c75dab83
   ⏳ Navigating with waitUntil: load, timeout: 120s...
   📡 Navigation completed in 2805ms | Response: 200
   ⏳ Waiting for network to settle (max 60s)...
   🔄 Redirect #1: 302 → https://www.effectivegatecpm.com/api/users?token=L3E2NHVmaGtoOTg_a2V5PTk0MTRkODJkYTM5Mjg4NzNmMDkxMTc...
   ✅ Network idle - redirects should be complete
   ⏳ Waiting 5s for JavaScript redirects...
   🔄 JavaScript redirect detected: https://quickstream-app.com/preland/storage/ut/pr-br/8/index.html?c=11840&u=28&p1=https%3A%2F%2Fsctc
   ✅ Final destination reached: https://quickstream-app.com/preland/storage/ut/pr-br/8/index.html?c=11840&u=28&p1=https%3A%2F%2Fsctc
   📊 Redirects: 1 | Chain: 200 https://www.effectivegatecpm.com/q64ufhkh98?key=9414d82da3928873f0911726c75dab83 → 302 -> https://www.effectivegatecpm.com/api/users?token=L3E2NHVmaGtoOTg_a2V5PTk0MTRkODJkYTM5Mjg4NzNmMDkxMTc...
   ⏳ Waiting 15s for final redirects to complete...
   ⏱️  Checking final destination (ad page)...
   ✅ Already on final destination: https://quickstream-app.com/preland/storage/ut/pr-br/8/index.html?c=11840&u=28&p1=https%3A%2F%2Fsctc
   ⏱️  On final destination, waiting 27.3s for impression to register...
   ✅ Session complete: 66.8s | Data: 0.00MB | Blocked: 0


============================================================
✅ Session completed successfully!
   Article: https://www.effectivegatecpm.com/q64ufhkh98?key=9414d82da3928873f0911726c75dab83
   Duration: 66.8s
====================
```
