import { chromium, webkit, Browser, Page, BrowserType as PlaywrightBrowserType } from 'playwright';
import { botConfig, ipRoyalConfig, timingConfig } from '../config';
import { 
  getRandomDevice, 
  getRandomDeviceByGeo,
  getBrowserType, 
  getContextOptionsForDevice, 
  ALL_DEVICES, 
  type BrowserType,
  type DeviceConfig 
} from '../config/devices';
import { ArticleLink, SessionResult } from '../types';
import { random, sleep } from '../utils/helpers';
import type { AdsterraConfig } from '../types';
import { Semaphore } from '../utils/semaphore';

// Device selection for browser fallback
const DEVICE_SELECTION: Record<string, Record<string, string[]>> = {
  mobile: {
    webkit: [
      'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15',
      'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14',
      'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 Mini',
      'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 Mini',
      'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11', 'iPhone SE 2022',
    ],
    chromium: [
      'Samsung Galaxy S24 Ultra', 'Samsung Galaxy S24+', 'Samsung Galaxy S24',
      'Samsung Galaxy S23 Ultra', 'Samsung Galaxy S23+', 'Samsung Galaxy S23',
      'Samsung Galaxy S22 Ultra', 'Samsung Galaxy S22+', 'Samsung Galaxy S22',
      'Samsung Galaxy S21 Ultra', 'Samsung Galaxy S21+', 'Samsung Galaxy S21',
      'Samsung Galaxy S20 Ultra', 'Samsung Galaxy S20+', 'Samsung Galaxy S20',
      'Samsung Galaxy A54', 'Samsung Galaxy A53', 'Samsung Galaxy A34', 'Samsung Galaxy A33', 'Samsung Galaxy A14',
      'Google Pixel 8 Pro', 'Google Pixel 8', 'Google Pixel 7 Pro', 'Google Pixel 7',
      'Google Pixel 6 Pro', 'Google Pixel 6', 'Google Pixel 5', 'Google Pixel 4a',
      'Xiaomi 13 Pro', 'Xiaomi 13', 'Xiaomi 12 Pro',
      'Xiaomi Redmi Note 13 Pro', 'Xiaomi Redmi Note 12 Pro', 'Xiaomi Redmi Note 11', 'Xiaomi Poco X5 Pro',
      'OnePlus 11', 'OnePlus 10 Pro', 'OnePlus 9 Pro', 'OnePlus 9', 'OnePlus Nord 3',
      'Oppo Find X6 Pro', 'Oppo Reno 10 Pro', 'Oppo A78',
      'Vivo X90 Pro', 'Vivo V29 Pro', 'Vivo Y36',
      'Realme GT 3', 'Realme 11 Pro+', 'Realme C55',
      'Motorola Edge 40 Pro', 'Motorola Moto G84', 'Motorola Moto G73',
      'Huawei P60 Pro', 'Huawei Nova 11 Pro',
      'Honor Magic 5 Pro', 'Honor 90',
      'Sony Xperia 1 V', 'Sony Xperia 5 V',
      'Asus ROG Phone 7', 'Nothing Phone (2)',
    ],
  },
  tablet: {
    webkit: ['iPad Pro 12.9', 'iPad Air'],
    chromium: [],
  },
  desktop: {
    chromium: ['Windows Chrome', 'Windows Edge', 'macOS Chrome'],
    webkit: ['macOS Safari'],
  },
};

// Device manager helper functions
class DeviceManager {
  static isIOS(deviceName: string): boolean {
    return deviceName.includes('iPhone') || deviceName.includes('iPad');
  }

  static isAndroid(deviceName: string): boolean {
    const androidBrands = [
      'Samsung', 'Pixel', 'Xiaomi', 'OnePlus', 
      'Oppo', 'Vivo', 'Realme', 'Motorola', 'Huawei', 'Honor', 
      'Sony', 'Asus', 'Nothing', 'Galaxy Tab'
    ];
    return androidBrands.some(brand => deviceName.includes(brand));
  }

  static isDesktop(deviceName: string): boolean {
    return deviceName.includes('Windows') || 
           deviceName.includes('macOS') || 
           deviceName.includes('Chrome') ||
           deviceName.includes('Safari') ||
           deviceName.includes('Edge');
  }

  static canSwitchBrowser(deviceName: string): boolean {
    return this.isDesktop(deviceName);
  }

  static getLockedBrowser(deviceName: string): BrowserType | null {
    if (this.isIOS(deviceName)) return 'webkit';
    if (this.isAndroid(deviceName)) return 'chromium';
    return null;
  }

  static getAlternativeBrowser(currentBrowser: BrowserType): BrowserType {
    return currentBrowser === 'webkit' ? 'chromium' : 'webkit';
  }
}

// Production-level WebKit handling: Limit concurrent WebKit browsers and add longer stagger
// WebKit on Linux with Xvfb + proxy can be resource-intensive and slow
// On Windows with real GUI, these limitations are not needed
const IS_LINUX = process.platform === 'linux';
const MAX_CONCURRENT_WEBKIT = parseInt(process.env.MAX_CONCURRENT_WEBKIT || '2', 10); // Max 2 WebKit browsers at once (Linux only)
const WEBKIT_LAUNCH_STAGGER_MS = parseInt(process.env.WEBKIT_LAUNCH_STAGGER_MS || '15000', 10); // 15 seconds between WebKit launches (Linux only)
const webkitSemaphore = IS_LINUX ? new Semaphore(MAX_CONCURRENT_WEBKIT) : null; // Only create semaphore on Linux
let lastWebKitLaunchTime = 0;
const webkitLaunchMutex = IS_LINUX ? new Semaphore(1) : null; // Only create mutex on Linux

export class AdsterraSession {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: AdsterraConfig | null;
  private webkitSemaphoreAcquired: boolean = false; // Track if we acquired WebKit semaphore

  constructor(config?: AdsterraConfig | null) {
    this.config = config || null;
  }

  private getConfig() {
    if (this.config) {
      // If browserHeadless is explicitly set (true or false), use it
      // If undefined, fall back to env config (which defaults to true if env var is 'true')
      // Important: We explicitly check !== undefined to handle false correctly
      const browserHeadless = this.config.browserHeadless !== undefined 
        ? this.config.browserHeadless 
        : botConfig.browserHeadless;
      
      return {
        adsterraUrl: this.config.adsterraUrl,
        browserHeadless, // Will be false if explicitly set to false, true if set to true, or env default if undefined
        browserTimeout: 30000, // Default timeout
        minScrollWait: this.config.minScrollWait,
        maxScrollWait: this.config.maxScrollWait,
        minAdWait: this.config.minAdWait,
        maxAdWait: this.config.maxAdWait,
      };
    }
    // Fallback to env-based config
    const defaultAdsterraUrl = 'https://www.effectivegatecpm.com/q64ufhkh98?key=9414d82da3928873f0911726c75dab83';
    return {
      adsterraUrl: defaultAdsterraUrl,
      browserHeadless: botConfig.browserHeadless,
      browserTimeout: botConfig.browserTimeout,
      minScrollWait: timingConfig.minScrollWait,
      maxScrollWait: timingConfig.maxScrollWait,
      minAdWait: timingConfig.minAdWait,
      maxAdWait: timingConfig.maxAdWait,
    };
  }

  async execute(
    botId: string,
    sessionNumber: number,
    distribution?: { country: string; deviceType: string; deviceName: string; browserType: string }
  ): Promise<SessionResult> {
    const startTime = Date.now();
    const config = this.getConfig();
    let adsterraUrl = config.adsterraUrl || 'https://www.effectivegatecpm.com/q64ufhkh98?key=9414d82da3928873f0911726c75dab83';
    
    // Ensure URL has https:// protocol (fixes Firefox/Chrome protocol issues)
    if (!adsterraUrl.startsWith('http://') && !adsterraUrl.startsWith('https://')) {
      adsterraUrl = 'https://' + adsterraUrl;
      console.log(`   ⚠️  URL missing protocol, added https://: ${adsterraUrl}`);
    } else if (adsterraUrl.startsWith('http://')) {
      // Force HTTPS for security and compatibility
      adsterraUrl = adsterraUrl.replace('http://', 'https://');
      console.log(`   ⚠️  URL was HTTP, forced to HTTPS: ${adsterraUrl}`);
    }
    
    this.webkitSemaphoreAcquired = false; // Reset for each session

    try {
      // Retry navigation on transient proxy/network failures.
      // This prevents ERR_HTTP_RESPONSE_CODE_FAILURE / timeouts from killing the whole run.
      const NAV_RETRIES = parseInt(process.env.NAV_RETRIES || '2', 10); // 2 retries = 3 total attempts (1 initial + 2 retries)
      const NAV_BACKOFF_MS = parseInt(process.env.NAV_BACKOFF_MS || '1500', 10);
      const MAX_ATTEMPTS = NAV_RETRIES + 1; // Total attempts: 1 initial + NAV_RETRIES retries (with browser fallback)

      const { getProxyServer, getProxyUsername, getProxyPassword, PROXY_PROVIDER } = await import('../config');

      // Rate limiting for BrightData (rate limit removed after adding funds)
      // Limiter is kept for safety but effectively disabled (100k req/min limit)
      if (PROXY_PROVIDER === 'brightdata') {
        const { brightDataRateLimiter } = await import('../utils/rate-limiter');
        await brightDataRateLimiter.waitIfNeeded();
      }

      let lastNavError: any = null;
      
      // Store original distribution for browser fallback
      let originalDeviceName: string | undefined;
      let originalDeviceConfig: DeviceConfig | undefined;
      let originalBrowserType: BrowserType | undefined;
      let originalCountry: string | undefined;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        // Use assigned distribution or randomly select device + browser
        let deviceName: string;
        let deviceConfig: DeviceConfig;
        let browserType: BrowserType;
        let country: string;
        
        if (distribution) {
          // Store original on first attempt
          if (attempt === 1) {
            originalDeviceName = distribution.deviceName;
            originalDeviceConfig = ALL_DEVICES[distribution.deviceName];
            originalBrowserType = distribution.browserType as BrowserType;
            originalCountry = distribution.country;
          }
          
          // Browser fallback strategy: Original → Chrome → Safari (same device)
          if (attempt === 1) {
            // First attempt: Use assigned browser
            deviceName = distribution.deviceName;
            deviceConfig = ALL_DEVICES[deviceName];
            if (!deviceConfig) {
              throw new Error(`Device "${deviceName}" not found in ALL_DEVICES`);
            }
            browserType = distribution.browserType as BrowserType;
            country = distribution.country;
          } else if (attempt === 2) {
            // Second attempt: Switch to Chrome (same device type)
            const deviceType = distribution.deviceType;
            const chromeDevices = DEVICE_SELECTION[deviceType]?.['chromium'] || [];
            if (chromeDevices.length > 0) {
              deviceName = chromeDevices[0]; // Use first Chrome device for this type
              deviceConfig = ALL_DEVICES[deviceName];
              browserType = 'chromium';
              country = originalCountry || distribution.country;
              console.log(`   🔄 Browser fallback: ${originalBrowserType} → Chrome (${deviceName})`);
            } else {
              // No Chrome device available, skip to Safari
              const safariDevices = DEVICE_SELECTION[deviceType]?.['webkit'] || [];
              if (safariDevices.length > 0) {
                deviceName = safariDevices[0];
                deviceConfig = ALL_DEVICES[deviceName];
                browserType = 'webkit';
                country = originalCountry || distribution.country;
                console.log(`   🔄 Browser fallback: ${originalBrowserType} → Safari (${deviceName})`);
              } else {
                // No alternative browser, use original
                deviceName = originalDeviceName!;
                deviceConfig = originalDeviceConfig!;
                browserType = originalBrowserType!;
                country = originalCountry!;
              }
            }
          } else {
            // Third attempt: Switch to Safari (same device type)
            const deviceType = distribution.deviceType;
            const safariDevices = DEVICE_SELECTION[deviceType]?.['webkit'] || [];
            if (safariDevices.length > 0 && originalBrowserType !== 'webkit') {
              deviceName = safariDevices[0];
              deviceConfig = ALL_DEVICES[deviceName];
              browserType = 'webkit';
              country = originalCountry || distribution.country;
              console.log(`   🔄 Browser fallback: ${originalBrowserType} → Safari (${deviceName})`);
            } else {
              // No Safari available or already Safari, use original
              deviceName = originalDeviceName!;
              deviceConfig = originalDeviceConfig!;
              browserType = originalBrowserType!;
              country = originalCountry!;
            }
          }
        } else {
          // Fallback to random selection (for backwards compatibility)
          const randomDevice = getRandomDevice();
          deviceName = randomDevice.deviceName;
          deviceConfig = randomDevice.config;
          browserType = getBrowserType(deviceConfig);
          country = (process.env.PROXY_COUNTRY || 'us').toLowerCase(); // Read from env or default to US
        }
        
        // Generate session ID for mobile proxy (fits: 12 chars available)
        // Mobile proxy format: username-session-<12char-id>-country-XX
        const sessionId = `${Date.now().toString(36).slice(-6)}${Math.random().toString(36).slice(2, 8)}`; // 12 chars max
        const proxyUsername = getProxyUsername(sessionId, country);

        try {
          const countryNames: Record<string, string> = {
            us: 'USA', uk: 'UK', ca: 'Canada', fr: 'France',
            es: 'Spain', ie: 'Ireland', au: 'Australia', cn: 'China',
          };
          const browserNames: Record<string, string> = {
            chromium: 'Chrome', firefox: 'Firefox', webkit: 'Safari',
          };
          
          // Verify Xvfb display for headed browsers on Linux
          if (!config.browserHeadless && process.platform === 'linux') {
            const display = process.env.DISPLAY;
            if (display) {
              console.log(`   🖥️  DISPLAY=${display} (Xvfb virtual display detected)`);
            } else {
              console.log(`   ⚠️  WARNING: Headed mode on Linux but no DISPLAY env var! Browsers may fail.`);
            }
          }
          
          console.log(`   🌐 Launching browser (headless: ${config.browserHeadless})...`);
          if (this.config?.browserHeadless !== undefined) {
            console.log(`   📝 Headless setting from run config: ${this.config.browserHeadless}`);
          } else {
            console.log(`   📝 Headless setting from env/default: ${config.browserHeadless}`);
          }
          
          if (!config.browserHeadless) {
            console.log(`   ✅ HEADED MODE: Browser will render visibly (required for Adsterra impressions)`);
          } else {
            console.log(`   ⚠️  HEADLESS MODE: Browser runs without display (impressions may not count on Adsterra)`);
          }
          console.log(`   🌍 Country: ${countryNames[country] || country.toUpperCase()}`);
          console.log(`   📱 Device: ${deviceName} (${deviceConfig.isMobile ? 'Mobile' : deviceConfig.hasTouch ? 'Tablet' : 'Desktop'})`);
          console.log(`   🌐 Browser: ${browserNames[browserType] || browserType.toUpperCase()}`);
          console.log(`   🔌 Using ${PROXY_PROVIDER.toUpperCase()} proxy: ${getProxyServer()}`);
          if (PROXY_PROVIDER === 'brightdata') {
            console.log(`   🆔 Session ID: ${sessionId} (ensures unique IP per bot)`);
            console.log(`   🌍 Proxy Username: ${proxyUsername} (mobile proxy: session + country)`);
            console.log(`   ✅ Each bot gets unique ${countryNames[country] || country.toUpperCase()} mobile IP with sticky session`);
          }

          // Production-level WebKit handling: Limit concurrent WebKit and add longer stagger (Linux only)
          // On Windows with real GUI, WebKit performs well without these limitations
          if (browserType === 'webkit' && IS_LINUX) {
            // Acquire WebKit semaphore to limit concurrent WebKit browsers (Linux only)
            if (webkitSemaphore) {
              await webkitSemaphore.acquire();
              this.webkitSemaphoreAcquired = true;
              console.log(`   🍎 WebKit: Acquired semaphore (max ${MAX_CONCURRENT_WEBKIT} concurrent)`);
            }
            
            // Stagger WebKit launches more aggressively (Linux only)
            if (webkitLaunchMutex) {
              await webkitLaunchMutex.acquire();
              const now = Date.now();
              const timeSinceLastWebKit = now - lastWebKitLaunchTime;
              if (timeSinceLastWebKit < WEBKIT_LAUNCH_STAGGER_MS && lastWebKitLaunchTime > 0) {
                const waitTime = WEBKIT_LAUNCH_STAGGER_MS - timeSinceLastWebKit;
                console.log(`   ⏳ WebKit: Waiting ${(waitTime/1000).toFixed(1)}s since last WebKit launch (stagger: ${WEBKIT_LAUNCH_STAGGER_MS}ms)...`);
                await sleep(waitTime);
              }
              lastWebKitLaunchTime = Date.now();
              webkitLaunchMutex.release();
            }
          } else if (browserType === 'webkit' && !IS_LINUX) {
            // Windows: No semaphore or stagger needed - WebKit works well with real GUI
            console.log(`   🍎 WebKit: Running on Windows - no concurrency limits (real GUI)`);
          }

          // Launch browser based on device type (chromium or webkit only - Firefox removed due to proxy issues)
          const browserLauncher = browserType === 'webkit' ? webkit : chromium;
          
          // Browser launch args (different per browser type)
          // NOTE: WebKit does NOT support command-line args like Chromium/Firefox
          const chromiumArgs = [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-webrtc', // Prevent IP leaks
              '--disable-dev-shm-usage',
              '--ignore-certificate-errors',
              '--ignore-certificate-errors-spki-list',
              '--ignore-ssl-errors',
              '--disable-blink-features=AutomationControlled',
              '--disable-features=IsolateOrigins,site-per-process',
              '--disable-site-isolation-trials',
              '--disable-infobars',
              '--disable-notifications',
              '--disable-popup-blocking',
              '--disable-translate',
              '--disable-default-apps',
              '--mute-audio',
              '--disable-web-security',
              '--allow-running-insecure-content',
          ];

          // NOTE: Firefox support removed due to proxy compatibility issues with BrightData
          // Only Chromium and WebKit are supported now
          // WebKit doesn't support command-line args
          
          const launchOptions: any = {
            headless: config.browserHeadless,
            proxy: {
              server: getProxyServer(),
              username: proxyUsername,
              password: getProxyPassword(),
            },
            // Only pass args for Chromium (WebKit doesn't support args)
            ...(browserType === 'chromium' ? { args: chromiumArgs } : {}),
          };
          
          const browserLaunchStart = Date.now();
          this.browser = await browserLauncher.launch(launchOptions);
          const browserLaunchTime = Date.now() - browserLaunchStart;
          console.log(`   ✅ Browser launched (${browserType}) in ${browserLaunchTime}ms`);
          
          // Release WebKit semaphore after successful launch (will be released in cleanup if error)
          if (browserType === 'webkit') {
            // Don't release here - release in cleanup to ensure it's always released
          }

          // Map country code to country name for context options
          const countryMap: Record<string, 'US' | 'UK' | 'FR' | 'CN'> = {
            us: 'US',
            uk: 'UK',
            fr: 'FR',
            ca: 'US', // Canada uses US locale/timezone for now
            es: 'FR', // Spain uses France locale/timezone for now
            ie: 'UK', // Ireland uses UK locale/timezone
            au: 'US', // Australia uses US locale/timezone for now
            cn: 'CN', // China uses CN locale/timezone
          };
          const countryCode = countryMap[country.toLowerCase()] || 'US';
          
          // Create context with device-specific fingerprint
          // NOTE: Do NOT set extraHTTPHeaders - let Playwright use defaults (like test script)
          // Custom headers can trigger detection, so we match the working test script approach
          const contextOptions = getContextOptionsForDevice(deviceConfig, countryCode);
          
          // Add ignoreHTTPSErrors for BrightData proxy (it uses SSL interception)
          const contextStart = Date.now();
          const context = await this.browser.newContext({
            ...contextOptions,
            ignoreHTTPSErrors: true,
          });
          const contextTime = Date.now() - contextStart;
          console.log(`   🔌 Proxy: ${getProxyServer()} | Context created in ${contextTime}ms`);

          // WebKit (Safari) on Linux with Xvfb can be slow with proxy connections
          // Use longer timeout for WebKit, shorter for others
          const pageCreationTimeout = browserType === 'webkit' ? 60000 : 30000; // 60s for WebKit, 30s for others
          
          let pageCreationAttempts = 0;
          const maxPageCreationAttempts = 3;
          let pageCreated = false;
          const pageCreationStart = Date.now();
          
          while (!pageCreated && pageCreationAttempts < maxPageCreationAttempts) {
            pageCreationAttempts++;
            if (pageCreationAttempts > 1) {
              console.log(`   🔁 Retrying page creation (attempt ${pageCreationAttempts}/${maxPageCreationAttempts})...`);
              await sleep(2000); // Wait 2s between retries
            }
            
            try {
              this.page = await Promise.race([
                context.newPage(),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error(`Page creation timeout after ${pageCreationTimeout/1000}s`)), pageCreationTimeout)
                )
              ]) as Page;
              pageCreated = true;
            } catch (pageError: any) {
              if (pageCreationAttempts >= maxPageCreationAttempts) {
                console.error(`   ❌ Page creation failed after ${maxPageCreationAttempts} attempts: ${pageError.message}`);
                throw pageError;
              }
              console.log(`   ⚠️  Page creation attempt ${pageCreationAttempts} failed: ${pageError.message}, retrying...`);
            }
          }
          
          const pageCreationTime = Date.now() - pageCreationStart;
          if (!this.page) throw new Error('Page not initialized');
          this.page.setDefaultTimeout(config.browserTimeout);
          console.log(`   📄 Page created (attempt ${pageCreationAttempts}/${maxPageCreationAttempts}) in ${pageCreationTime}ms`);
          
          // Handle new tabs/pages that might open (close them to avoid confusion)
          context.on('page', async (newPage) => {
            // If a new page opens and it's not our main page, close it after a short delay
            if (newPage !== this.page) {
              // Give it a moment to see if it's a redirect
              setTimeout(async () => {
                try {
                  const newPageUrl = newPage.url();
                  // If it's an empty tab or automationcontrolled, close it
                  if (newPageUrl === 'about:blank' || newPageUrl.includes('automationcontrolled') || newPageUrl === '') {
                    await newPage.close();
                  } else {
                    // If it's a valid URL, switch to it (might be the actual redirect)
                    this.page = newPage;
                  }
                } catch (e) {
                  // Ignore errors when checking/closing
                }
              }, 2000);
            }
          });

      // STEP 1: Set up resource blocking to minimize data usage (target: <0.5 MB per session)
      let totalBytesDownloaded = 0;
      let blockedCount = 0;
      
      if (!this.page) throw new Error('Page not initialized');
      await this.page.route('**/*', (route) => {
        const request = route.request();
        const url = request.url();
        const resourceType = request.resourceType();
        
        // Block images (40-60% bandwidth savings)
        if (resourceType === 'image') {
          blockedCount++;
          route.abort();
          return;
        }
        
        // Block fonts (5-10% savings)
        if (resourceType === 'font') {
          blockedCount++;
          route.abort();
          return;
        }
        
        // Block videos/media (5-10% savings)
        if (resourceType === 'media' || 
            url.includes('.mp4') || 
            url.includes('.webm') || 
            url.includes('.avi') ||
            url.includes('.mov')) {
          blockedCount++;
          route.abort();
          return;
        }
        
        // Block analytics & tracking (15-20% savings)
        const analyticsDomains = [
          'google-analytics.com',
          'googletagmanager.com',
          'analytics.google.com',
          'facebook.net',
          'facebook.com/tr',
          'twitter.com/i/adsct',
          'hotjar.com',
          'mixpanel.com',
          'segment.com',
          'amplitude.com',
          'heap.io',
          'fullstory.com',
          'mouseflow.com',
        ];
        
        if (analyticsDomains.some(domain => url.includes(domain))) {
          blockedCount++;
          route.abort();
          return;
        }
        
        // Block social media widgets
        if (url.includes('facebook.com/plugins') ||
            url.includes('twitter.com/widgets') ||
            url.includes('instagram.com/embed')) {
          blockedCount++;
          route.abort();
          return;
        }
        
        // Allow everything else (HTML, CSS, JS needed for functionality)
        route.continue();
      });
      
      // Track data usage accurately
      // Use content-length header which represents actual bytes transferred (compressed)
      // This matches what proxy providers like BrightData measure
      if (!this.page) throw new Error('Page not initialized');
      this.page.on('response', (response) => {
        try {
          const headers = response.headers();
          
          // Use content-length header (this is the actual compressed bytes transferred)
          const contentLength = headers['content-length'];
          if (contentLength) {
            const size = parseInt(contentLength, 10);
            if (!isNaN(size) && size > 0) {
              totalBytesDownloaded += size;
            }
          }
          
          // For responses without content-length, estimate from content-encoding
          // But only if we can't get content-length (most responses have it)
          // Note: We don't count response bodies directly as they're uncompressed
          // and would inflate our numbers
        } catch (e) {
          // Ignore tracking errors
        }
      });
      
      // Track request body size (POST data)
      if (!this.page) throw new Error('Page not initialized');
      this.page.on('request', (request) => {
        try {
          const postData = request.postData();
          if (postData) {
            // Count actual bytes of POST data
            totalBytesDownloaded += Buffer.byteLength(postData, 'utf8');
          }
        } catch (e) {
          // Ignore errors in request tracking
        }
      });

      // STEP 2: Inject stealth scripts to avoid detection
      // Inject enhanced stealth scripts to hide automation (device-aware)
      // Capture device info in closure
      const isMobileDevice = deviceConfig.isMobile;
      const deviceBrowserType = browserType;
      const deviceUserAgent = deviceConfig.userAgent;
      
      if (!this.page) throw new Error('Page not initialized');
      await this.page.addInitScript(() => {
        // Variables captured from closure
        const isMobile = isMobileDevice;
        const browserType = deviceBrowserType;
        const userAgent = deviceUserAgent;
        
        // Hide webdriver property (all devices)
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });

        // Override chrome object (only for Chromium-based browsers, not mobile Safari/Firefox)
        if (browserType === 'chromium' || userAgent.includes('Chrome')) {
        (window as any).chrome = {
          runtime: {},
          loadTimes: () => {},
          csi: () => {},
          app: {},
        };
        }

        // Override permissions
        const originalQuery = (window.navigator.permissions as any).query;
        (window.navigator.permissions as any).query = (parameters: any) =>
          parameters.name === 'notifications'
            ? Promise.resolve({ state: Notification.permission })
            : originalQuery(parameters);

        // Override plugins (desktop only - mobile devices don't have plugins)
        if (!isMobile) {
        Object.defineProperty(navigator, 'plugins', {
          get: () => {
            const plugins = [];
            for (let i = 0; i < 3; i++) {
              plugins.push({
                0: { type: 'application/x-google-chrome-pdf', suffixes: 'pdf', description: 'Portable Document Format' },
                description: 'Portable Document Format',
                filename: 'internal-pdf-viewer',
                length: 1,
                name: 'Chrome PDF Plugin',
              });
            }
            return plugins;
          },
        });
        } else {
          // Mobile devices: plugins should be empty or minimal
          Object.defineProperty(navigator, 'plugins', {
            get: () => [],
          });
        }

        // Override languages (match device locale)
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });

        // Override platform to match user agent
        let platform = 'Win32'; // Default
        if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
          platform = 'iPhone';
        } else if (userAgent.includes('Android')) {
          platform = 'Linux armv8l';
        } else if (userAgent.includes('Macintosh')) {
          platform = 'MacIntel';
        }
        Object.defineProperty(navigator, 'platform', {
          get: () => platform,
        });

        // Override hardwareConcurrency (device-appropriate)
        const cores = isMobile ? 6 : 8; // Mobile devices typically have fewer cores
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => cores,
        });

        // Override deviceMemory (device-appropriate)
        const memory = isMobile ? 4 : 8; // Mobile devices typically have less RAM
        Object.defineProperty(navigator, 'deviceMemory', {
          get: () => memory,
        });

        // Override connection (prevent WebRTC leaks, mobile-appropriate)
        Object.defineProperty(navigator, 'connection', {
          get: () => ({
            effectiveType: isMobile ? '4g' : 'wifi',
            rtt: isMobile ? 100 : 50,
            downlink: isMobile ? 10 : 50,
            saveData: false,
          }),
        });

        // Hide proxy detection indicators
        // Override getClientRects to prevent fingerprinting
        const originalGetClientRects = Element.prototype.getClientRects;
        Element.prototype.getClientRects = function() {
          const rects = originalGetClientRects.apply(this, arguments as any);
          // Return normal rects to avoid detection
          return rects;
        };

        // Override getBoundingClientRect similarly
        const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
        Element.prototype.getBoundingClientRect = function() {
          return originalGetBoundingClientRect.apply(this, arguments as any);
        };

        // Override screen properties to match device
        Object.defineProperty(screen, 'availWidth', {
          get: () => isMobile ? 375 : 1920,
        });
        Object.defineProperty(screen, 'availHeight', {
          get: () => isMobile ? 667 : 1080,
        });
        Object.defineProperty(screen, 'width', {
          get: () => isMobile ? 375 : 1920,
        });
        Object.defineProperty(screen, 'height', {
          get: () => isMobile ? 667 : 1080,
        });

        // Remove automation indicators
        delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Array;
        delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Promise;
        delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
        delete (window as any).__playwright;
        delete (window as any).__pw_manual;
        delete (window as any).__PW_inspect;
        delete (window as any).__PW;
        delete (window as any).__PUPPETEER;
        delete (window as any).__nightmare;
        delete (window as any).callPhantom;
        delete (window as any).Buffer;
        delete (window as any).emit;
        delete (window as any).spawn;
        
        // Override toString to hide automation
        const originalToString = Function.prototype.toString;
        Function.prototype.toString = function() {
          if (typeof navigator.webdriver === 'boolean' && navigator.webdriver) {
            return 'function webdriver() { [native code] }';
          }
          return originalToString.apply(this, arguments as any);
        };
      });

      // CRITICAL: Wait for browser/proxy connection to establish
      // These are minimum wait times - proven to work from test-page-readiness.ts
      // Chromium needs 10s, WebKit needs 5s for proxy connection
      const browserInitDelay = browserType === 'chromium' ? 10000 : 5000;
      console.log(`   ⏳ Waiting ${browserInitDelay/1000}s for ${browserType} proxy connection to establish...`);
      await sleep(browserInitDelay);
      
      // Page readiness check - verify browser context is ready before navigation
      // Max 120 seconds - better to wait longer than fail prematurely
      const MAX_PAGE_READY_WAIT = 120000;
      console.log(`   🔍 Checking page readiness (max ${MAX_PAGE_READY_WAIT/1000}s)...`);
      let readyChecks = 0;
      const maxReadyChecks = 3;
      const readyCheckStart = Date.now();
      while (readyChecks < maxReadyChecks && Date.now() - readyCheckStart < MAX_PAGE_READY_WAIT) {
        try {
          if (!this.page) throw new Error('Page not initialized');
          const currentUrl = this.page.url();
          // Check for error states
          if (currentUrl.includes('chrome-error') || currentUrl.includes('error')) {
            await sleep(1000);
            continue;
          }
          // Verify page context is responsive
          if (!this.page) throw new Error('Page not initialized');
          await this.page.evaluate(() => true);
          readyChecks++;
          if (readyChecks >= 3) {
            const elapsed = Math.floor((Date.now() - readyCheckStart) / 1000);
            console.log(`   ✅ Browser/proxy connection ready after ${elapsed}s!`);
            break;
          }
        } catch (e) {
          // Page not ready yet
        }
        // Log progress every 10 seconds
        const elapsed = Math.floor((Date.now() - readyCheckStart) / 1000);
        if (elapsed > 0 && elapsed % 10 === 0) {
          console.log(`   ⏳ Waiting for page readiness... (${elapsed}s elapsed, ${readyChecks}/${maxReadyChecks} checks)`);
        }
        await sleep(1000);
      }
      if (readyChecks < 3) {
        const elapsed = Math.floor((Date.now() - readyCheckStart) / 1000);
        console.log(`   ⚠️  Page readiness check incomplete after ${elapsed}s (${readyChecks}/3), proceeding anyway...`);
      }

      // STEP 3: Navigate to Adsterra Smart Link URL
      console.log(`   🚀 Navigating to: ${adsterraUrl}`);
      
      // Track redirects and responses to see the full chain
      const redirectChain: string[] = [];
      let redirectCount = 0;
      let firstResponseCode: number | null = null;
      let finalResponseCode: number | null = null;
      
      if (!this.page) throw new Error('Page not initialized');
      this.page.on('response', (response) => {
        const url = response.url();
        const status = response.status();
        
        // Track first response code
        if (firstResponseCode === null && url.includes('effectivegatecpm.com')) {
          firstResponseCode = status;
        }
        
        // Track final response code
        if (url.includes('effectivegatecpm.com') || url.includes('api/users')) {
          finalResponseCode = status;
        }
        
        // Track all redirects (3xx) and important URLs
        if (status >= 300 && status < 400) {
          redirectCount++;
          const redirectUrl = url.length > 100 ? url.substring(0, 100) + '...' : url;
          redirectChain.push(`${status} -> ${redirectUrl}`);
          console.log(`   🔄 Redirect #${redirectCount}: ${status} → ${redirectUrl}`);
        } else if ((status >= 200 && status < 300) && (url.includes('effectivegatecpm.com') || url.includes('api/users'))) {
          redirectChain.push(`${status} ${url.substring(0, 80)}`);
        }
      });
      
      // Handle navigation with better error handling for redirects
      try {
        const navStart = Date.now();
        
        // Ensure URL is HTTPS before navigation (critical for proxy compatibility)
        const navigationUrl = adsterraUrl.startsWith('https://') ? adsterraUrl : `https://${adsterraUrl.replace(/^https?:\/\//, '')}`;
        if (navigationUrl !== adsterraUrl) {
          console.log(`   ⚠️  URL protocol corrected: ${adsterraUrl} → ${navigationUrl}`);
        }
        
        // Browser-specific navigation settings (proven to work from test-page-readiness.ts)
        // Chromium: 'load' with longer timeout (handles redirects better)
        // WebKit: 'domcontentloaded' with shorter timeout (faster)
        // Max 120s timeout - better to wait than fail
        const navWaitUntil = browserType === 'chromium' ? 'load' : 'domcontentloaded';
        const navTimeout = 120000; // 120s max for both browsers
        
        console.log(`   ⏳ Navigating with waitUntil: ${navWaitUntil}, timeout: ${navTimeout/1000}s...`);
        let response;
        try {
          if (!this.page) throw new Error('Page not initialized');
          response = await this.page.goto(navigationUrl, {
            waitUntil: navWaitUntil as 'load' | 'domcontentloaded',
            timeout: navTimeout,
          });
        } catch (navError: any) {
          // Handle ERR_HTTP_RESPONSE_CODE_FAILURE - page might still have navigated despite error
          // This happens with 502/503 errors where proxy returns error but page still loads
          if (navError.message.includes('ERR_HTTP_RESPONSE_CODE_FAILURE') || 
              navError.message.includes('net::ERR') ||
              navError.message.includes('Navigation failed')) {
            console.log(`   ⚠️  Navigation error (${navError.message.substring(0, 80)}), checking if page still loaded...`);
            if (!this.page) throw navError;
            const currentUrl = this.page.url();
            if (currentUrl !== 'about:blank' && 
                !currentUrl.includes('chrome-error') && 
                !currentUrl.includes('automationcontrolled')) {
              console.log(`   ✅ Page still navigated to: ${currentUrl.substring(0, 80)}...`);
              // Continue - page loaded despite error
              response = null; // Will check URL instead of response status
            } else {
              // Still on error page, re-throw
              throw navError;
            }
          } else {
            throw navError; // Re-throw other errors
          }
        }
        
        const navTime = Date.now() - navStart;
        const responseStatus = response?.status() || 'N/A';
        console.log(`   📡 Navigation completed in ${navTime}ms | Response: ${responseStatus}${firstResponseCode && firstResponseCode !== responseStatus ? ` (first: ${firstResponseCode})` : ''}`);
        
        // CRITICAL: 5xx errors (502, 503, 504, 500, 501) mean the page didn't load - throw to trigger retry
        // But only if we have a response - if response is null, we already handled the error above
        if (response && response.status() >= 500) {
          // Check if we're actually on a valid URL despite the error
          if (!this.page) throw new Error('Page not initialized');
          const currentUrl = this.page.url();
          const isValidUrl = currentUrl !== 'about:blank' && 
                            !currentUrl.includes('chrome-error') &&
                            !currentUrl.includes('automationcontrolled');
          
          if (isValidUrl) {
            console.log(`   ⚠️  HTTP ${response.status()} response, but page is on valid URL - continuing...`);
          } else {
            const errorMsg = `HTTP ${response.status()} error - page did not load (will retry with browser fallback)`;
            console.error(`   ❌ ${errorMsg}`);
            throw new Error(errorMsg);
          }
        }
        
        // 4xx errors (except 404) might be retryable, but let's be conservative
        if (response && response.status() >= 400 && response.status() < 500) {
          // 404 is usually not retryable, but others might be
          if (response.status() !== 404) {
            console.log(`   ⚠️  HTTP ${response.status()} response detected, but continuing...`);
          } else {
            throw new Error(`HTTP 404 - page not found (will retry)`);
          }
        }
        
        // Wait for network to settle (all redirects complete)
        // Max 60s for network idle (120s would be too long for this specific check)
        const networkIdleTimeout = 60000;
        console.log(`   ⏳ Waiting for network to settle (max ${networkIdleTimeout/1000}s)...`);
        try {
          if (!this.page) throw new Error('Page not initialized');
          await this.page.waitForLoadState('networkidle', { timeout: networkIdleTimeout });
          console.log(`   ✅ Network idle - redirects should be complete`);
        } catch (e) {
          console.log(`   ⚠️  Network not idle after ${networkIdleTimeout/1000}s, continuing...`);
        }
        
        // Additional wait for JavaScript redirects and page scripts
        // Chromium needs more time for JS redirects
        const jsWaitTime = browserType === 'chromium' ? 5000 : 3000;
        console.log(`   ⏳ Waiting ${jsWaitTime/1000}s for JavaScript redirects...`);
        await sleep(jsWaitTime);
        
        // Check if URL changed after wait (JavaScript redirects)
        if (!this.page) throw new Error('Page not initialized');
        const urlAfterWait = this.page.url();
        if (urlAfterWait !== navigationUrl && !urlAfterWait.includes('effectivegatecpm.com')) {
          console.log(`   🔄 JavaScript redirect detected: ${urlAfterWait.substring(0, 100)}`);
        }
        
        if (!this.page) throw new Error('Page not initialized');
        const finalUrl = this.page.url();
        
        // Handle "automationcontrolled/" issue (happens with Firefox/Chrome)
        // This is a browser quirk where it tries to handle the automation flag incorrectly
        if (finalUrl.includes('automationcontrolled')) {
          console.log(`   ❌ Browser stuck on automationcontrolled protocol`);
          console.log(`   🦊 This is a known ${deviceBrowserType} issue - failing gracefully`);
          
          // Don't try to recover - just fail and move on to prevent blocking
          throw new Error(`Navigation failed - stuck on automationcontrolled protocol (${deviceBrowserType} issue)`);
        }
        
        if (!this.page) throw new Error('Page not initialized');
        const actualFinalUrl = this.page.url();
        
        // Helper to check if we're on final destination (will be used in wait loop)
        const isFinalDestinationUrl = (url: string): boolean => {
          // Final destination is NOT on Adsterra domain and NOT on API endpoint
          const isNotAdsterra = !url.includes('effectivegatecpm.com') && !url.includes('api/users');
          const isAdDestination = url.includes('chaturbate') || 
                                  url.includes('adult') || 
                                  url.includes('porn') || 
                                  url.includes('dating') ||
                                  url.includes('click.php') ||
                                  url.includes('redirect') ||
                                  url.includes('offer') ||
                                  url.includes('preland') ||
                                  url.includes('lp/') ||
                                  url.includes('/landing') ||
                                  (isNotAdsterra && url.length > 20); // If not on Adsterra and has reasonable length, likely ad
          
          return isAdDestination && 
                 url !== 'about:blank' && 
                 !url.includes('chrome-error') &&
                 !url.includes('automationcontrolled');
        };
        
        // Log current status (but don't count as impression yet - wait for final destination)
        if (isFinalDestinationUrl(actualFinalUrl)) {
          console.log(`   ✅ Final destination reached: ${actualFinalUrl.substring(0, 100)}`);
        } else if (actualFinalUrl.includes('api/users')) {
          console.log(`   ⚠️  On Adsterra API endpoint (waiting for redirect to final destination...)`);
        } else if (actualFinalUrl.includes('effectivegatecpm.com')) {
          console.log(`   ⚠️  Still on Adsterra domain (waiting for redirect to final destination...)`);
        } else {
          console.log(`   ⚠️  Current URL: ${actualFinalUrl.substring(0, 100)} (waiting for final destination...)`);
        }
        
        // Log redirect chain summary
        if (redirectCount > 0) {
          console.log(`   📊 Redirects: ${redirectCount} | Chain: ${redirectChain.slice(0, 3).join(' → ')}${redirectChain.length > 3 ? '...' : ''}`);
        } else if (finalResponseCode) {
          console.log(`   📊 No redirects | Final response: ${finalResponseCode}`);
        }
        
        // Check if proxy was detected or 502 error
        try {
          if (!this.page) throw new Error('Page not initialized');
          const pageText = await this.page.textContent('body') || '';
          
          // Check for 502 Proxy Error - Throw to trigger retry
          if (pageText.includes('502 Unexpected Status') || pageText.includes('Error code: 502') || pageText.includes('no_peer')) {
            throw new Error('Proxy Error: 502 Unexpected Status (no_peer) - will retry');
          }

          // CRITICAL: If proxy is detected, throw error to trigger browser retry
          // Proxy detection means impression won't count - must retry with different browser
          if (pageText.includes('Anonymous Proxy') || pageText.includes('proxy detected') ||
              pageText.includes('VPN detected') || pageText.includes('bot detected')) {
            const errorMsg = `Proxy/automation detected in page content - impression will not count (will retry with browser fallback)`;
            console.error(`   ❌ ${errorMsg}`);
            throw new Error(errorMsg);
          }
        } catch (textError: any) {
          // Re-throw proxy errors to trigger retry
          if (textError.message && textError.message.includes('Proxy Error')) {
            throw textError;
          }
          console.log(`   ℹ️  Could not check page text (redirected away)`);
        }
      } catch (navError: any) {
        if (!this.page) throw navError;
        const currentUrl = this.page.url();
        
        // Only continue if we're on a valid URL (not about:blank or error pages)
        // AND the URL is actually related to Adsterra or the ad destination
        const isValidUrl = currentUrl !== 'about:blank' && 
                          !currentUrl.includes('chrome-error') &&
                          (currentUrl.includes('effectivegatecpm.com') || 
                           currentUrl.includes('api/users') ||
                           currentUrl.includes('chaturbate') ||
                           currentUrl.includes('adult') ||
                           currentUrl.includes('porn') ||
                           currentUrl.includes('dating'));
        
        if (isValidUrl) {
          console.log(`   ⚠️  Navigation error, but page is at: ${currentUrl.substring(0, 100)}...`);
          console.log(`   ℹ️  Valid URL detected - impression may still count`);
          
          // Check if we actually reached the ad despite the error
          if (currentUrl.includes('chaturbate') || currentUrl.includes('adult')) {
            console.log(`   🎉 SUCCESS: Reached ad destination despite navigation error!`);
          }
        } else {
          // Still on about:blank or error page - navigation definitely failed
          console.error(`   ❌ Navigation failed - still on invalid URL: ${currentUrl}`);
          throw navError;
        }
      }

      // STEP 4: Wait for final destination (the ad page) - ONLY count impression when we reach it
      // This is critical: Adsterra only counts impressions when the user reaches the final ad destination
      // We must wait dynamically until we reach the final destination, not just wait a fixed time
      
      // Additional redirect wait time (proven to work from test-page-readiness.ts)
      // Chromium needs more time for final redirects than WebKit
      const additionalRedirectWait = browserType === 'chromium' ? 15000 : 10000;
      console.log(`   ⏳ Waiting ${additionalRedirectWait/1000}s for final redirects to complete...`);
      await sleep(additionalRedirectWait);
      
      console.log(`   ⏱️  Checking final destination (ad page)...`);
      
      const MAX_WAIT_FOR_FINAL_DESTINATION = 120000; // Max 120 seconds to reach final destination - better to wait than lose impression
      const POLL_INTERVAL = 1000; // Check every 1 second
      const startWaitTime = Date.now();
      let reachedFinalDestination = false;
      if (!this.page) throw new Error('Page not initialized');
      let currentUrl = this.page.url();
      
      // Helper function to check if we're on the final destination (the ad page)
      const isFinalDestination = (url: string): boolean => {
        // Reject error states immediately
        if (url.includes('chrome-error') || url.includes('error://') || url === 'about:blank') {
          return false;
        }
        
        // Final destination is NOT on Adsterra domain and NOT on API endpoint
        const isNotAdsterra = !url.includes('effectivegatecpm.com') && !url.includes('api/users');
        const isAdDestination = url.includes('chaturbate') || 
                                url.includes('adult') || 
                                url.includes('porn') || 
                                url.includes('dating') ||
                                url.includes('click.php') ||
                                url.includes('redirect') ||
                                url.includes('offer') ||
                                url.includes('preland') ||
                                url.includes('lp/') ||
                                url.includes('/landing') ||
                                (isNotAdsterra && url.length > 20); // If not on Adsterra and has reasonable length, likely ad
        
        return isAdDestination && !url.includes('automationcontrolled');
      };
      
      // Check initial URL (might already be on final destination)
      if (isFinalDestination(currentUrl)) {
        reachedFinalDestination = true;
        console.log(`   ✅ Already on final destination: ${currentUrl.substring(0, 100)}`);
      } else {
        // Poll until we reach final destination or timeout
        console.log(`   🔄 Polling for final destination (max ${MAX_WAIT_FOR_FINAL_DESTINATION/1000}s)...`);
        let consecutiveErrorCount = 0;
        
        while (Date.now() - startWaitTime < MAX_WAIT_FOR_FINAL_DESTINATION) {
          await sleep(POLL_INTERVAL);
          
          try {
            if (!this.page) throw new Error('Page not initialized');
            currentUrl = this.page.url();
            
            // Check for chrome-error or persistent error states
            if (currentUrl.includes('chrome-error://')) {
              consecutiveErrorCount++;
              const elapsed = Math.floor((Date.now() - startWaitTime) / 1000);
              
              if (consecutiveErrorCount >= 10) { // 10 seconds of error = timeout
                console.error(`   ❌ Browser error detected (chrome-error://), page failed to load after ${elapsed}s`);
                console.error(`   💡 This may indicate: proxy issue, blocked by target site, or network failure`);
                console.error(`   🔧 Current URL: ${currentUrl}`);
                break; // Exit and fail gracefully instead of hanging
              }
            } else {
              consecutiveErrorCount = 0; // Reset if we're not in error state
            }
            
            // Check for JavaScript redirects (page might have navigated)
            if (isFinalDestination(currentUrl)) {
              reachedFinalDestination = true;
              const elapsed = Math.floor((Date.now() - startWaitTime) / 1000);
              console.log(`   ✅ Final destination reached after ${elapsed}s: ${currentUrl.substring(0, 100)}`);
              break;
            }
            
            // Log progress every 5 seconds
            const elapsed = Math.floor((Date.now() - startWaitTime) / 1000);
            if (elapsed % 5 === 0 && elapsed > 0) {
              console.log(`   ⏳ Still waiting for final destination... (${elapsed}s elapsed, current: ${currentUrl.substring(0, 80)})`);
            }
          } catch (e) {
            // Page might have navigated away, continue checking
            const elapsed = Math.floor((Date.now() - startWaitTime) / 1000);
            if (elapsed % 5 === 0 && elapsed > 0) {
              console.log(`   ⏳ Page may have navigated, continuing to check... (${elapsed}s elapsed)`);
            }
          }
        }
      }
      
      // If we didn't reach final destination, this impression won't count - fail the session
      if (!reachedFinalDestination) {
        const elapsed = Math.floor((Date.now() - startWaitTime) / 1000);
        console.error(`   ❌ Failed to reach final destination within ${elapsed}s`);
        console.error(`   📍 Final URL: ${currentUrl.substring(0, 100)}`);
        console.error(`   ⚠️  This impression will NOT count on Adsterra - session failed`);
        throw new Error(`Did not reach final ad destination - impression will not count. Final URL: ${currentUrl.substring(0, 100)}`);
      }
      
      // Now that we're on the final destination, wait the configured time (10-30s) for impression to register
      // This ensures Adsterra has time to track the impression
      const minWait = Math.max(10000, config.minAdWait || 10000); // Minimum 10s
      const maxWait = Math.min(30000, config.maxAdWait || 30000); // Maximum 30s
      const waitTime = random(minWait, maxWait);
      console.log(`   ⏱️  On final destination, waiting ${(waitTime / 1000).toFixed(1)}s for impression to register...`);
      await sleep(waitTime);
      
      // Calculate data usage
      const dataUsedMB = (totalBytesDownloaded / (1024 * 1024)).toFixed(2);
      const dataUsedGB = (totalBytesDownloaded / (1024 * 1024 * 1024)).toFixed(4);
      const duration = Date.now() - startTime;
      
      // Close browser
      await this.cleanup();

      console.log(`   ✅ Session complete: ${(duration / 1000).toFixed(1)}s | Data: ${dataUsedMB}MB | Blocked: ${blockedCount}\n`);

      return {
        success: true,
        botId,
        sessionNumber,
        articleUrl: adsterraUrl, // Use Adsterra URL
        duration,
        timestamp: new Date(),
      };
        } catch (attemptError: any) {
          lastNavError = attemptError;

          const msg = String(attemptError?.message || attemptError);
          const retryable =
            msg.includes('ERR_HTTP_RESPONSE_CODE_FAILURE') ||
            msg.includes('501') || // Not Implemented
            msg.includes('502') || // Bad Gateway
            msg.includes('503') || // Service Unavailable
            msg.includes('504') || // Gateway Timeout
            msg.includes('500') || // Internal Server Error
            msg.includes('no_peer') ||
            msg.includes('Timeout') ||
            msg.includes('net::ERR_TIMED_OUT') ||
            msg.includes('net::ERR_CONNECTION') ||
            msg.includes('net::ERR_PROXY') ||
            msg.includes('Navigation') ||
            msg.includes('Target page, context or browser has been closed') ||
            msg.includes('Proxy/automation detected') || // Proxy detection - retry with different browser
            msg.includes('Did not reach final ad destination'); // CRITICAL: Retry if final destination not reached

          // Clean up browser/context for next attempt (new IP)
          await this.cleanup();

          if (!retryable || attempt === MAX_ATTEMPTS) {
            throw attemptError;
          }

          const backoff = NAV_BACKOFF_MS * attempt;
          console.log(`   🔁 Navigation failed (attempt ${attempt}/${MAX_ATTEMPTS}). Retrying in ${(backoff / 1000).toFixed(1)}s...`);
          await sleep(backoff);
        }
      }

      // If we somehow exit loop without returning, throw last error
      throw lastNavError || new Error('Navigation failed');
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
      if (error.stack) {
        console.error(`   Stack: ${error.stack.split('\n')[1]?.trim()}`);
      }
      await this.cleanup();

      return {
        success: false,
        botId,
        sessionNumber,
        articleUrl: adsterraUrl, // Use Adsterra URL
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  private async findArticles(): Promise<ArticleLink[]> {
    if (!this.page) throw new Error('Page not initialized');

    // Try multiple selectors to find article links
    const articleSelectors = [
      'article a',
      '.post a',
      '.blog-post a',
      '.article-link',
      '.entry-title a',
      'h2 a',
      'h3 a',
      '.post-title a',
    ];

    for (const selector of articleSelectors) {
      try {
        const links = await this.page.$$eval(selector, (elements) => {
          return elements
            .map((el) => ({
              href: (el as HTMLAnchorElement).href,
              text: el.textContent?.trim() || '',
            }))
            .filter(
              (link) =>
                link.href &&
                !link.href.includes('#') &&
                link.text.length > 0 &&
                link.href.startsWith('http')
            );
        });

        if (links.length > 0) {
          // Remove duplicates
          const uniqueLinks = Array.from(
            new Map(links.map((link) => [link.href, link])).values()
          );
          return uniqueLinks;
        }
      } catch (e) {
        // Try next selector
        continue;
      }
    }

    return [];
  }

  private async clickSmartLink(smartLinkText: string): Promise<boolean> {
    if (!this.page) throw new Error('Page not initialized');

    // Multiple strategies to find Smart Link
    const smartLinkSelectors = [
      // Href contains effectivegatecpm.com (Adsterra Smart Link domain)
      'a[href*="effectivegatecpm.com"]',
      // Exact text match
      `text="${smartLinkText}"`,
      // Partial text match (case insensitive)
      `text=/Click here to make money/i`,
      // Href contains adsterra
      'a[href*="adsterra"]',
      // Any link with "make money" in text
      'a:has-text("make money")',
      // Any link with "sport betting" in text
      'a:has-text("sport betting")',
    ];

    for (const selector of smartLinkSelectors) {
      try {
        const link = this.page.locator(selector).first();
        
        // Wait for link to be attached to DOM
        await link.waitFor({ state: 'attached', timeout: 3000 });
        
        // Check if link is visible (don't scroll yet)
        const isVisible = await link.isVisible({ timeout: 2000 }).catch(() => false);
        if (!isVisible) {
          // Scroll to link only if not visible
          console.log(`   📍 Scrolling to Smart Link...`);
          await link.scrollIntoViewIfNeeded({ timeout: 5000 });
          await sleep(1000);
        }
        
        // Get link details for logging
        const linkHref = await link.getAttribute('href');
        const linkText = await link.textContent();
        console.log(`   🔍 Found Smart Link:`);
        console.log(`      Text: "${linkText?.trim()}"`);
        console.log(`      URL: ${linkHref}`);
        
        // Wait a bit before clicking (human-like delay)
        await sleep(random(500, 1500));

        // Check if link opens in new tab (target="_blank")
        const target = await link.getAttribute('target');
        const opensInNewTab = target === '_blank' || target === '_new';
        
        if (opensInNewTab) {
          console.log(`   📌 Link opens in new tab, waiting for popup...`);
          
          // Get current context and page count
          const context = this.page.context();
          const pagesBefore = context.pages().length;
          
          // Wait for new page/tab to open BEFORE clicking
          const pagePromise = context.waitForEvent('page', { timeout: 15000 });
          
          // Click the link
          await link.click({ force: true, timeout: 5000 });
          
          try {
            const newPage = await pagePromise;
            console.log(`   ✅ New tab opened!`);
            // Switch to the new page
            this.page = newPage;
            
            // Wait for page to load with longer timeout and better error handling
            try {
              await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 });
              
              // Check if page loaded successfully (not an error page)
              const currentUrl = this.page.url();
              if (currentUrl.startsWith('chrome-error://') || currentUrl.startsWith('about:blank')) {
                console.log(`   ⚠️  Page didn't load properly, waiting longer...`);
                await sleep(3000);
                
                // Try waiting for network idle
                try {
                  await this.page.waitForLoadState('networkidle', { timeout: 20000 });
                } catch (e) {
                  // If networkidle fails, check URL again
                  const finalUrl = this.page.url();
                  if (finalUrl.startsWith('chrome-error://')) {
                    throw new Error(`Page failed to load: ${finalUrl}`);
                  }
                }
              }
              
              // Verify final URL is valid
              const finalUrl = this.page.url();
              if (!finalUrl.startsWith('chrome-error://') && !finalUrl.startsWith('about:blank')) {
                console.log(`   ✅ Page loaded successfully: ${finalUrl.substring(0, 80)}...`);
                // Store the successful URL for later reference
                (this.page as any)._adsterraUrl = finalUrl;
                return true;
              } else {
                throw new Error(`Page loaded with error URL: ${finalUrl}`);
              }
            } catch (loadError: any) {
              // Check if page eventually loaded
              await sleep(2000);
              const checkUrl = this.page.url();
              if (!checkUrl.startsWith('chrome-error://') && !checkUrl.startsWith('about:blank')) {
                console.log(`   ✅ Page loaded after retry: ${checkUrl.substring(0, 80)}...`);
                return true;
              }
              throw loadError;
            }
          } catch (e) {
            // Check if new page was created anyway
            const pagesAfter = context.pages();
            if (pagesAfter.length > pagesBefore) {
              console.log(`   ✅ New tab found (${pagesAfter.length} tabs now)`);
              this.page = pagesAfter[pagesAfter.length - 1];
              
              // Wait for load with retry
              try {
                await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 });
                const checkUrl = this.page.url();
                if (!checkUrl.startsWith('chrome-error://') && !checkUrl.startsWith('about:blank')) {
                  console.log(`   ✅ Page loaded: ${checkUrl.substring(0, 80)}...`);
                  return true;
                }
              } catch (loadError) {
                await sleep(3000);
                const finalCheck = this.page.url();
                if (!finalCheck.startsWith('chrome-error://') && !finalCheck.startsWith('about:blank')) {
                  console.log(`   ✅ Page loaded after wait: ${finalCheck.substring(0, 80)}...`);
                  return true;
                }
              }
            }
            console.log(`   ⚠️  New tab didn't open properly, trying same-tab navigation...`);
            // Fall through to same-tab click
          }
        }
        
        // Click the link (will navigate in same tab or if new tab failed)
        console.log(`   🖱️  Clicking Smart Link...`);
        await link.click({ force: true, timeout: 5000 });
        console.log(`   ✅ Smart Link clicked using selector: ${selector}`);
        return true;
        
      } catch (e: any) {
        // Log error but continue to next selector
        if (!e.message.includes('timeout') && !e.message.includes('not found')) {
          console.log(`   ⚠️  Selector ${selector} failed: ${e.message}`);
        }
        continue;
      }
    }

    return false;
  }

  private async clickPrivacyButtons(): Promise<void> {
    if (!this.page) return;

    // Common privacy policy/cookie consent button selectors
    const privacyButtonSelectors = [
      'button:has-text("Accept")',
      'button:has-text("Accept All")',
      'button:has-text("I Accept")',
      'button:has-text("Agree")',
      'button:has-text("OK")',
      'button:has-text("Got it")',
      'button:has-text("Allow")',
      'button:has-text("Allow All")',
      'button[id*="accept"]',
      'button[class*="accept"]',
      'button[id*="cookie"]',
      'button[class*="cookie"]',
      'button[id*="consent"]',
      'button[class*="consent"]',
      'a:has-text("Accept")',
      'a:has-text("I Accept")',
      '.cookie-consent button',
      '#cookie-consent button',
      '[id*="cookie-banner"] button',
      '[class*="cookie-banner"] button',
      '[id*="privacy-banner"] button',
      '[class*="privacy-banner"] button',
      // Add more specific selectors
      'button[aria-label*="Accept"]',
      'button[aria-label*="Cookie"]',
      '[role="button"]:has-text("Accept")',
    ];

    for (const selector of privacyButtonSelectors) {
      try {
        const button = this.page.locator(selector).first();
        
        // Wait for button to be attached to DOM
        await button.waitFor({ state: 'attached', timeout: 3000 }).catch(() => null);
        
        // Check if visible
        const isVisible = await button.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (isVisible) {
          // Scroll into view if needed
          await button.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => null);
          await sleep(500); // Wait for scroll
          
          // Get button info for logging
          const buttonText = await button.textContent().catch(() => '');
          const buttonId = await button.getAttribute('id').catch(() => '');
          const buttonClass = await button.getAttribute('class').catch(() => '');
          
          console.log(`   🍪 Found privacy/cookie button:`);
          console.log(`      Text: "${buttonText?.trim()}"`);
          console.log(`      ID: ${buttonId || 'none'}`);
          console.log(`      Class: ${buttonClass?.substring(0, 50) || 'none'}...`);
          console.log(`      Clicking...`);
          
          // Try multiple click methods
          try {
            // Method 1: Regular click
            await button.click({ timeout: 3000, force: true });
            console.log(`   ✅ Clicked privacy button (method: regular click)`);
          } catch (clickError: any) {
            // Method 2: JavaScript click
            try {
              await button.evaluate((el: HTMLElement) => el.click());
              console.log(`   ✅ Clicked privacy button (method: JavaScript click)`);
            } catch (jsError: any) {
              // Method 3: Dispatch click event
              await button.dispatchEvent('click');
              console.log(`   ✅ Clicked privacy button (method: dispatch event)`);
            }
          }
          
          await sleep(2000); // Wait for popunder to trigger
          console.log(`   ✅ Privacy button clicked (popunder should have triggered)`);
          return; // Only click one button
        }
      } catch (e: any) {
        // Try next selector
        if (!e.message.includes('timeout') && !e.message.includes('not found')) {
          // Only log non-timeout errors
          continue;
        }
        continue;
      }
    }
    
    console.log(`   ℹ️  No privacy button found (this is okay)`);
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      // Release WebKit semaphore if we acquired it (Linux only)
      if (this.webkitSemaphoreAcquired && webkitSemaphore) {
        webkitSemaphore.release();
        this.webkitSemaphoreAcquired = false;
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      // Ensure WebKit semaphore is released even on error (Linux only)
      if (this.webkitSemaphoreAcquired && webkitSemaphore) {
        try {
          webkitSemaphore.release();
          this.webkitSemaphoreAcquired = false;
        } catch (e) {
          // Ignore release errors
        }
      }
    }
  }
}
