/**
 * Test a single bot session
 * Runs one complete session to test the flow
 */

import { AdsterraSession } from '../src/bot/session';
import type { AdsterraConfig } from '../src/types';

// Test configuration
const testConfig: AdsterraConfig = {
  adsterraUrl: 'https://www.effectivegatecpm.com/q64ufhkh98?key=9414d82da3928873f0911726c75dab83',
  // blogHomepageUrl: 'https://thesportamigo.com/',
  // smartLinkText: 'Click here to make money with sport betting',
  totalBots: 1,
  sessionsPerBot: 1,
  targetImpressions: 1,
  browserHeadless: false, // headed is closer to real user and reduces Adsterra filtering
  minScrollWait: 2000,
  maxScrollWait: 5000,
  minAdWait: 15000,
  maxAdWait: 30000,
  // ipRoyalConfig: {
  //   server: '',
  //   httpsPort: 0,
  //   socks5Port: 0,
  //   username: '',
  //   password: '',
  //   apiKey: '',
  //   orderId: '',
  // },
};

// Force a stable, Chrome-on-Android path to avoid Safari/WebKit stalls
const forcedDistribution = {
  country: 'us',
  deviceType: 'mobile',
  deviceName: 'Google Pixel 6',
  browserType: 'chromium' as const,
};

async function testSession() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Testing Single Bot Session');
  console.log('='.repeat(60));
  console.log(`\n📋 Configuration:`);
  console.log(`   URL: ${testConfig.adsterraUrl}`);
  // console.log(`   Blog: ${testConfig.blogHomepageUrl}`);
  // console.log(`   Smart Link Text: "${testConfig.smartLinkText}"`);
  console.log(`   Headless: ${testConfig.browserHeadless ? 'Yes' : 'No (Browser will open)'}`);
  console.log(`   Forced device/browser: ${forcedDistribution.deviceName} / ${forcedDistribution.browserType} / ${forcedDistribution.country.toUpperCase()}\n`);

  const session = new AdsterraSession(testConfig);
  
  try {
    const result = await session.execute('test-bot-001', 1, forcedDistribution);
    
    console.log('\n' + '='.repeat(60));
    if (result.success) {
      console.log('✅ Session completed successfully!');
      console.log(`   Article: ${result.articleUrl}`);
      console.log(`   Duration: ${result.duration ? (result.duration / 1000).toFixed(1) + 's' : 'N/A'}`);
    } else {
      console.log('❌ Session failed!');
      console.log(`   Error: ${result.error}`);
    }
    console.log('='.repeat(60) + '\n');
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testSession();
