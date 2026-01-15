import type { BrowserContextOptions } from 'playwright';

export type BrowserType = 'chromium' | 'webkit';
export type DeviceType = 'iphone' | 'android' | 'desktop' | 'tablet';

export interface DeviceConfig {
  viewport: { width: number; height: number };
  userAgent: string;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
  browserType: BrowserType;
}

// Mobile Devices (Primary - matches mobile proxy)
const mobileDevices: Record<string, DeviceConfig> = {
  // === iPhone devices (Safari on iOS) - Latest models ===
  'iPhone 15 Pro Max': {
    viewport: { width: 430, height: 932 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/605.1.15',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    browserType: 'webkit',
  },
  'iPhone 15': {
    viewport: { width: 393, height: 852 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/605.1.15',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    browserType: 'webkit',
  },
  'iPhone 14 Pro Max': {
    viewport: { width: 430, height: 932 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/605.1.15',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    browserType: 'webkit',
  },
  'iPhone 14': {
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/605.1.15',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    browserType: 'webkit',
  },
  'iPhone 13 Pro Max': {
    viewport: { width: 428, height: 926 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.7 Mobile/15E148 Safari/605.1.15',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    browserType: 'webkit',
  },
  'iPhone 13': {
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/605.1.15',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    browserType: 'webkit',
  },
  'iPhone 12': {
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/605.1.15',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    browserType: 'webkit',
  },
  'iPhone 11': {
    viewport: { width: 414, height: 896 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_7_9 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.7 Mobile/15E148 Safari/605.1.15',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    browserType: 'webkit',
  },
  'iPhone SE 2022': {
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/605.1.15',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    browserType: 'webkit',
  },
  
  // === Samsung Galaxy S Series (Chrome on Android) ===
  'Samsung Galaxy S24 Ultra': {
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  'Samsung Galaxy S24': {
    viewport: { width: 360, height: 800 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  'Samsung Galaxy S23 Ultra': {
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  'Samsung Galaxy S22 Ultra': {
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  'Samsung Galaxy S21': {
    viewport: { width: 360, height: 800 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  
  // === Samsung Galaxy A Series (Mid-range, very popular) ===
  'Samsung Galaxy A54': {
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  'Samsung Galaxy A34': {
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-A346B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  'Samsung Galaxy A14': {
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-A145F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  
  // === Google Pixel Series ===
  'Google Pixel 8 Pro': {
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  'Google Pixel 8': {
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  'Google Pixel 7 Pro': {
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  'Google Pixel 7': {
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  'Google Pixel 6': {
    viewport: { width: 393, height: 851 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  
  // === Xiaomi Phones (Very popular globally) ===
  'Xiaomi 13 Pro': {
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; 2210132C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  'Xiaomi Redmi Note 13 Pro': {
    viewport: { width: 393, height: 873 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; 23113RKC6G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  'Xiaomi Redmi Note 12 Pro': {
    viewport: { width: 393, height: 873 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; 22101316G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  'Xiaomi Poco X5 Pro': {
    viewport: { width: 393, height: 873 },
    userAgent: 'Mozilla/5.0 (Linux; Android 12; 22101320G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  
  // === OnePlus Phones ===
  'OnePlus 11': {
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; CPH2449) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  'OnePlus 9 Pro': {
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; LE2123) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  'OnePlus Nord 3': {
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; CPH2491) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  
  // === Oppo Phones (Popular in Asia) ===
  'Oppo Find X6 Pro': {
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; PHM110) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  'Oppo Reno 10 Pro': {
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; CPH2525) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  
  // === Motorola Phones ===
  'Motorola Edge 40 Pro': {
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; motorola edge 40 pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
  'Motorola Moto G84': {
    viewport: { width: 393, height: 873 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; moto g84 5G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
};

// Tablet devices
const tabletDevices: Record<string, DeviceConfig> = {
  'iPad Pro 12.9': {
    viewport: { width: 1024, height: 1366 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/605.1.15',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    browserType: 'webkit',
  },
  'iPad Air': {
    viewport: { width: 820, height: 1180 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/605.1.15',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    browserType: 'webkit',
  },
  'Samsung Galaxy Tab S9': {
    viewport: { width: 1024, height: 768 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-X910) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    browserType: 'chromium',
  },
};

// Desktop devices
const desktopDevices: Record<string, DeviceConfig> = {
  'Windows Chrome': {
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    browserType: 'chromium',
  },
  'Windows Edge': {
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    browserType: 'chromium',
  },
  'macOS Safari': {
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    browserType: 'webkit',
  },
  'macOS Chrome': {
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    browserType: 'chromium',
  },
};

// Combine all devices
export const ALL_DEVICES: Record<string, DeviceConfig> = {
  ...mobileDevices,
  ...tabletDevices,
  ...desktopDevices,
};

// Device distribution weights (favor mobile for mobile proxy)
export const DEVICE_WEIGHTS: Record<string, number> = {
  // === iPhone devices: ~38% === (Most popular iOS devices)
  'iPhone 15 Pro Max': 5,
  'iPhone 15': 5,
  'iPhone 14 Pro Max': 4.5,
  'iPhone 14': 4,
  'iPhone 13 Pro Max': 3.5,
  'iPhone 13': 4,
  'iPhone 12': 3.5,
  'iPhone 11': 2.5,
  'iPhone SE 2022': 2,
  
  // === Samsung Galaxy S Series: ~22% === (Premium Android)
  'Samsung Galaxy S24 Ultra': 3.5,
  'Samsung Galaxy S24': 3.5,
  'Samsung Galaxy S23 Ultra': 3,
  'Samsung Galaxy S22 Ultra': 2.5,
  'Samsung Galaxy S21': 2.5,
  
  // === Samsung Galaxy A Series: ~12% === (Mid-range, very popular)
  'Samsung Galaxy A54': 4,
  'Samsung Galaxy A34': 3.5,
  'Samsung Galaxy A14': 3,
  
  // === Google Pixel: ~9% === (Stock Android enthusiasts)
  'Google Pixel 8 Pro': 2.5,
  'Google Pixel 8': 2.5,
  'Google Pixel 7 Pro': 2,
  'Google Pixel 7': 2,
  'Google Pixel 6': 1.5,
  
  // === Xiaomi: ~6% === (Very popular globally)
  'Xiaomi 13 Pro': 1.5,
  'Xiaomi Redmi Note 13 Pro': 2,
  'Xiaomi Redmi Note 12 Pro': 1.5,
  'Xiaomi Poco X5 Pro': 1.5,
  
  // === OnePlus: ~4% ===
  'OnePlus 11': 2,
  'OnePlus 9 Pro': 1.5,
  'OnePlus Nord 3': 1.5,
  
  // === Oppo: ~2% === (Popular in Asia)
  'Oppo Find X6 Pro': 1,
  'Oppo Reno 10 Pro': 1.5,
  
  // === Motorola: ~2% ===
  'Motorola Edge 40 Pro': 1,
  'Motorola Moto G84': 1.5,
  
  // === Tablet: ~5% ===
  'iPad Pro 12.9': 1.5,
  'iPad Air': 2,
  'Samsung Galaxy Tab S9': 1.5,
  
  // === Desktop: ~10% ===
  'Windows Chrome': 3,
  'Windows Edge': 2.5,
  'macOS Safari': 2.5,
  'macOS Chrome': 2.5,
};

/**
 * Get a random device based on weights (favors mobile devices)
 */
export function getRandomDevice(): { deviceName: string; config: DeviceConfig } {
  const devices = Object.keys(DEVICE_WEIGHTS);
  const weights = devices.map(d => DEVICE_WEIGHTS[d]);
  
  // Calculate cumulative weights
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < devices.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      const deviceName = devices[i];
      return {
        deviceName,
        config: ALL_DEVICES[deviceName],
      };
    }
  }
  
  // Fallback to first device
  const deviceName = devices[0];
  return {
    deviceName,
    config: ALL_DEVICES[deviceName],
  };
}

/**
 * Geographic device preferences - which devices are more common in which regions
 */
const GEO_DEVICE_PREFERENCES: Record<string, string[]> = {
  'US': [
    // US heavily favors iPhone, Google Pixel, Samsung flagships
    'iPhone 15 Pro Max', 'iPhone 15', 'iPhone 14 Pro Max', 'iPhone 14', 
    'iPhone 13 Pro Max', 'iPhone 13', 'iPhone 12', 'iPhone 11',
    'Samsung Galaxy S24 Ultra', 'Samsung Galaxy S24', 'Samsung Galaxy S23 Ultra', 'Samsung Galaxy S22 Ultra',
    'Google Pixel 8 Pro', 'Google Pixel 8', 'Google Pixel 7 Pro', 'Google Pixel 7',
    'iPad Pro 12.9', 'iPad Air', 'Windows Chrome', 'macOS Safari', 'macOS Chrome'
  ],
  'UK': [
    // UK: iPhone dominant, Samsung, some Pixel
    'iPhone 15 Pro Max', 'iPhone 15', 'iPhone 14 Pro Max', 'iPhone 14',
    'iPhone 13 Pro Max', 'iPhone 13', 'iPhone 12', 'iPhone 11', 'iPhone SE 2022',
    'Samsung Galaxy S24 Ultra', 'Samsung Galaxy S24', 'Samsung Galaxy S23 Ultra',
    'Samsung Galaxy A54', 'Samsung Galaxy A34',
    'Google Pixel 8', 'Google Pixel 7', 'Google Pixel 6',
    'OnePlus 11', 'OnePlus Nord 3',
    'iPad Pro 12.9', 'iPad Air', 'Windows Chrome', 'macOS Safari'
  ],
  'FR': [
    // France: iPhone, Samsung, Xiaomi growing
    'iPhone 15', 'iPhone 14', 'iPhone 13', 'iPhone 12',
    'Samsung Galaxy S24', 'Samsung Galaxy S23 Ultra', 'Samsung Galaxy S22 Ultra',
    'Samsung Galaxy A54', 'Samsung Galaxy A34', 'Samsung Galaxy A14',
    'Xiaomi 13 Pro', 'Xiaomi Redmi Note 13 Pro', 'Xiaomi Redmi Note 12 Pro',
    'Google Pixel 8', 'Google Pixel 7',
    'OnePlus 11', 'Oppo Reno 10 Pro',
    'iPad Air', 'Windows Chrome'
  ],
  'DE': [
    // Germany: diverse - iPhone, Samsung, Xiaomi, OnePlus
    'iPhone 15', 'iPhone 14', 'iPhone 13', 'iPhone 12',
    'Samsung Galaxy S24 Ultra', 'Samsung Galaxy S24', 'Samsung Galaxy S23 Ultra',
    'Samsung Galaxy A54', 'Samsung Galaxy A34',
    'Google Pixel 8 Pro', 'Google Pixel 8', 'Google Pixel 7',
    'Xiaomi 13 Pro', 'Xiaomi Redmi Note 13 Pro',
    'OnePlus 11', 'OnePlus 9 Pro',
    'iPad Pro 12.9', 'Windows Chrome'
  ],
  'CN': [
    // China: Xiaomi, Oppo dominant; some iPhone
    'iPhone 15 Pro Max', 'iPhone 14 Pro Max',
    'Xiaomi 13 Pro', 'Xiaomi Redmi Note 13 Pro', 'Xiaomi Redmi Note 12 Pro', 'Xiaomi Poco X5 Pro',
    'Oppo Find X6 Pro', 'Oppo Reno 10 Pro',
    'OnePlus 11', 'OnePlus 9 Pro', 'OnePlus Nord 3',
    'Samsung Galaxy S24 Ultra', 'Samsung Galaxy S23 Ultra',
    'iPad Pro 12.9', 'Windows Chrome'
  ],
  'IN': [
    // India: Budget Samsung, Xiaomi, Motorola
    'Samsung Galaxy A54', 'Samsung Galaxy A34', 'Samsung Galaxy A14',
    'Xiaomi Redmi Note 13 Pro', 'Xiaomi Redmi Note 12 Pro', 'Xiaomi Poco X5 Pro',
    'OnePlus Nord 3', 'OnePlus 11',
    'Motorola Edge 40 Pro', 'Motorola Moto G84',
    'Oppo Reno 10 Pro',
    'Samsung Galaxy S24', 'Samsung Galaxy S23 Ultra',
    'iPhone 15', 'iPhone 14', 'iPhone 13',
    'Samsung Galaxy Tab S9', 'Windows Chrome'
  ],
  'BR': [
    // Brazil: Samsung A-series, Motorola
    'Samsung Galaxy A54', 'Samsung Galaxy A34', 'Samsung Galaxy A14',
    'Motorola Edge 40 Pro', 'Motorola Moto G84',
    'Samsung Galaxy S24', 'Samsung Galaxy S23 Ultra', 'Samsung Galaxy S22 Ultra',
    'Xiaomi Redmi Note 13 Pro', 'Xiaomi Poco X5 Pro',
    'iPhone 15', 'iPhone 14', 'iPhone 13', 'iPhone 12',
    'Windows Chrome'
  ],
};

/**
 * Get a random device based on geographic location for more realistic distribution
 */
export function getRandomDeviceByGeo(country: 'US' | 'UK' | 'FR' | 'DE' | 'CN' | 'IN' | 'BR' = 'US'): { deviceName: string; config: DeviceConfig } {
  const preferredDevices = GEO_DEVICE_PREFERENCES[country] || GEO_DEVICE_PREFERENCES['US'];
  
  // Filter DEVICE_WEIGHTS to only include geo-preferred devices
  const geoWeights: Record<string, number> = {};
  let totalWeight = 0;
  
  preferredDevices.forEach(deviceName => {
    if (DEVICE_WEIGHTS[deviceName]) {
      geoWeights[deviceName] = DEVICE_WEIGHTS[deviceName];
      totalWeight += DEVICE_WEIGHTS[deviceName];
    }
  });
  
  // Weighted random selection
  let random = Math.random() * totalWeight;
  
  for (const deviceName of Object.keys(geoWeights)) {
    random -= geoWeights[deviceName];
    if (random <= 0) {
      return {
        deviceName,
        config: ALL_DEVICES[deviceName],
      };
    }
  }
  
  // Fallback to first preferred device
  const deviceName = preferredDevices[0];
  return {
    deviceName,
    config: ALL_DEVICES[deviceName],
  };
}

/**
 * Get Playwright browser type from device config
 */
export function getBrowserType(deviceConfig: DeviceConfig): BrowserType {
  return deviceConfig.browserType;
}

/**
 * Get browser context options for a device
 */
export function getContextOptionsForDevice(
  deviceConfig: DeviceConfig,
  country: 'US' | 'UK' | 'FR' | 'DE' | 'CN' | 'IN' | 'BR' = 'US',
  timezone?: string
): BrowserContextOptions {
  // Map country to timezone, locale, language, and geolocation
  const countryMap: Record<string, { 
    timezone: string; 
    locale: string;
    language: string;
    geolocation: { latitude: number; longitude: number };
  }> = {
    'US': { 
      timezone: 'America/New_York', 
      locale: 'en-US',
      language: 'en-US,en;q=0.9',
      geolocation: { latitude: 40.7128, longitude: -74.0060 } // New York
    },
    'UK': { 
      timezone: 'Europe/London', 
      locale: 'en-GB',
      language: 'en-GB,en;q=0.9',
      geolocation: { latitude: 51.5074, longitude: -0.1278 } // London
    },
    'FR': { 
      timezone: 'Europe/Paris', 
      locale: 'fr-FR',
      language: 'fr-FR,fr;q=0.9',
      geolocation: { latitude: 48.8566, longitude: 2.3522 } // Paris
    },
    'DE': { 
      timezone: 'Europe/Berlin', 
      locale: 'de-DE',
      language: 'de-DE,de;q=0.9',
      geolocation: { latitude: 52.5200, longitude: 13.4050 } // Berlin
    },
    'CN': { 
      timezone: 'Asia/Shanghai', 
      locale: 'zh-CN',
      language: 'zh-CN,zh;q=0.9',
      geolocation: { latitude: 31.2304, longitude: 121.4737 } // Shanghai
    },
    'IN': { 
      timezone: 'Asia/Kolkata', 
      locale: 'en-IN',
      language: 'en-IN,en;q=0.9',
      geolocation: { latitude: 28.6139, longitude: 77.2090 } // New Delhi
    },
    'BR': { 
      timezone: 'America/Sao_Paulo', 
      locale: 'pt-BR',
      language: 'pt-BR,pt;q=0.9',
      geolocation: { latitude: -23.5505, longitude: -46.6333 } // São Paulo
    },
  };
  
  const countryConfig = countryMap[country] || countryMap['US'];
  const defaultTimezone = timezone || countryConfig.timezone;
  const locale = countryConfig.locale;
  const language = countryConfig.language;
  
  return {
    viewport: deviceConfig.viewport,
    userAgent: deviceConfig.userAgent,
    deviceScaleFactor: deviceConfig.deviceScaleFactor,
    isMobile: deviceConfig.isMobile,
    hasTouch: deviceConfig.hasTouch,
    locale,
    timezoneId: defaultTimezone,
    permissions: ['geolocation'],
    geolocation: countryConfig.geolocation,
    colorScheme: 'light',
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      'Accept-Language': language,
    },
  };
}