/**
 * Frontend distribution calculator
 * UI approximation of backend distribution logic
 * Note: This is a simplified model for display purposes only
 */

export interface DistributionConfig {
  countries: Record<string, number>;
  devices: Record<string, number>;
  browsers: Record<string, number>;
}

export interface DistributionMatrixEntry {
  country: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  deviceName: string;
  browserType: 'webkit' | 'chromium';
  count: number;
}

export interface DistributionMatrix {
  total: number;
  entries: DistributionMatrixEntry[];
}

// Device-browser mapping - mobile and tablet only support webkit/chromium
const DEVICE_BROWSER_MAP: Record<string, ('webkit' | 'chromium')[]> = {
  mobile: ['webkit', 'chromium'],
  tablet: ['webkit', 'chromium'],
  desktop: ['chromium', 'webkit'],
};

// Device selection matching actual device-config.ts
// Each device type maps to real devices from the config
export const DEVICE_SELECTION: Record<string, Record<string, string[]>> = {
  mobile: {
    webkit: [
      // iPhone devices (Safari on iOS)
      'iPhone 15 Pro Max',
      'iPhone 15',
      'iPhone 14 Pro Max',
      'iPhone 14',
      'iPhone 13 Pro Max',
      'iPhone 13',
      'iPhone 12',
      'iPhone 11',
      'iPhone SE 2022',
    ],
    chromium: [
      // Android devices (Chrome)
      'Samsung Galaxy S24 Ultra',
      'Samsung Galaxy S24',
      'Samsung Galaxy S23 Ultra',
      'Samsung Galaxy S22 Ultra',
      'Samsung Galaxy S21',
      'Samsung Galaxy A54',
      'Samsung Galaxy A34',
      'Samsung Galaxy A14',
      'Google Pixel 8 Pro',
      'Google Pixel 8',
      'Google Pixel 7 Pro',
      'Google Pixel 7',
      'Google Pixel 6',
      'Xiaomi 13 Pro',
      'Xiaomi Redmi Note 13 Pro',
      'Xiaomi Redmi Note 12 Pro',
      'Xiaomi Poco X5 Pro',
      'OnePlus 11',
      'OnePlus 9 Pro',
      'OnePlus Nord 3',
      'Oppo Find X6 Pro',
      'Oppo Reno 10 Pro',
      'Motorola Edge 40 Pro',
      'Motorola Moto G84',
    ],
  },
  tablet: {
    webkit: [
      // iPad devices
      'iPad Pro 12.9',
      'iPad Air',
    ],
    chromium: [
      // Android tablets
      'Samsung Galaxy Tab S9',
    ],
  },
  desktop: {
    chromium: [
      'Windows Chrome',
      'Windows Edge',
      'macOS Chrome',
    ],
    webkit: [
      'macOS Safari',
    ],
  },
};

// Device weights for non-uniform distribution
// Higher weight = more likely to be selected
const DEVICE_WEIGHTS: Record<string, Record<string, Record<string, number>>> = {
  mobile: {
    webkit: {
      'iPhone 15 Pro Max': 5,
      'iPhone 15': 5,
      'iPhone 14 Pro Max': 4.5,
      'iPhone 14': 4,
      'iPhone 13 Pro Max': 3.5,
      'iPhone 13': 4,
      'iPhone 12': 3.5,
      'iPhone 11': 2.5,
      'iPhone SE 2022': 2,
    },
    chromium: {
      'Samsung Galaxy S24 Ultra': 3.5,
      'Samsung Galaxy S24': 3.5,
      'Samsung Galaxy S23 Ultra': 3,
      'Samsung Galaxy S22 Ultra': 2.5,
      'Samsung Galaxy S21': 2.5,
      'Samsung Galaxy A54': 4,
      'Samsung Galaxy A34': 3.5,
      'Samsung Galaxy A14': 3,
      'Google Pixel 8 Pro': 2.5,
      'Google Pixel 8': 2.5,
      'Google Pixel 7 Pro': 2,
      'Google Pixel 7': 2,
      'Google Pixel 6': 1.5,
      'Xiaomi 13 Pro': 1.5,
      'Xiaomi Redmi Note 13 Pro': 2,
      'Xiaomi Redmi Note 12 Pro': 1.5,
      'Xiaomi Poco X5 Pro': 1.5,
      'OnePlus 11': 2,
      'OnePlus 9 Pro': 1.5,
      'OnePlus Nord 3': 1.5,
      'Oppo Find X6 Pro': 1,
      'Oppo Reno 10 Pro': 1.5,
      'Motorola Edge 40 Pro': 1,
      'Motorola Moto G84': 1.5,
    },
  },
  tablet: {
    webkit: {
      'iPad Pro 12.9': 1.5,
      'iPad Air': 2,
    },
    chromium: {
      'Samsung Galaxy Tab S9': 1.5,
    },
  },
  desktop: {
    chromium: {
      'Windows Chrome': 3,
      'Windows Edge': 2.5,
      'macOS Chrome': 2.5,
    },
    webkit: {
      'macOS Safari': 2.5,
    },
  },
};

/**
 * Distribute count across devices using weighted random distribution
 */
function distributeWithWeights(
  devices: string[],
  weights: Record<string, number>,
  totalCount: number
): Record<string, number> {
  const result: Record<string, number> = {};
  
  // Calculate total weight
  const totalWeight = devices.reduce((sum, device) => sum + (weights[device] || 1), 0);
  
  // Distribute with some randomness (±15%) to avoid perfect uniformity
  let remaining = totalCount;
  
  for (let i = 0; i < devices.length; i++) {
    const device = devices[i];
    const weight = weights[device] || 1;
    
    if (i === devices.length - 1) {
      // Last device gets remaining count
      result[device] = remaining;
    } else {
      // Calculate base count from weight
      const baseCount = Math.round(totalCount * (weight / totalWeight));
      
      // Add randomness ±15%
      const randomFactor = 0.85 + Math.random() * 0.3; // 0.85 to 1.15
      const count = Math.round(baseCount * randomFactor);
      
      result[device] = Math.max(1, Math.min(count, remaining - (devices.length - i - 1)));
      remaining -= result[device];
    }
  }
  
  return result;
}

export function calculateDistributionMatrix(
  config: DistributionConfig,
  totalImpressions: number
): DistributionMatrix {
  const entries: DistributionMatrixEntry[] = [];

  // Validate percentages sum to 100
  const countrySum = Object.values(config.countries).reduce((a, b) => a + b, 0);
  const deviceSum = Object.values(config.devices).reduce((a, b) => a + b, 0);
  const browserSum = Object.values(config.browsers).reduce((a, b) => a + b, 0);

  if (Math.abs(countrySum - 100) > 0.01) {
    throw new Error(`Country percentages must sum to 100, got ${countrySum}`);
  }
  if (Math.abs(deviceSum - 100) > 0.01) {
    throw new Error(`Device percentages must sum to 100, got ${deviceSum}`);
  }
  if (Math.abs(browserSum - 100) > 0.01) {
    throw new Error(`Browser percentages must sum to 100, got ${browserSum}`);
  }

  // Calculate distribution for each country
  for (const [country, countryPercent] of Object.entries(config.countries)) {
    const countryImpressions = Math.round(totalImpressions * (countryPercent / 100));

    // For each device type
    for (const [deviceType, devicePercent] of Object.entries(config.devices)) {
      const deviceImpressions = Math.round(countryImpressions * (devicePercent / 100));

      if (deviceImpressions === 0) continue;

      // Get valid browsers for this device type (from DEVICE_BROWSER_MAP)
      const validBrowsers = DEVICE_BROWSER_MAP[deviceType] || [];

      if (validBrowsers.length === 0) continue;

      // Calculate browser distribution for this device type
      let remainingDeviceImpressions = deviceImpressions;
      const browserCounts: Record<string, number> = {};

      // Filter browsers that are in the config
      const enabledBrowsers = validBrowsers.filter(b => {
        const key = b === 'webkit' ? 'safari' : 'chrome';
        return config.browsers[key] > 0;
      });

      if (enabledBrowsers.length === 0) {
        // If no browsers enabled, skip this device type
        continue;
      }

      // Calculate total browser percentage for enabled browsers
      const totalBrowserPercent = enabledBrowsers.reduce((sum, b) => {
        const key = b === 'webkit' ? 'safari' : 'chrome';
        return sum + (config.browsers[key] || 0);
      }, 0);

      // Distribute impressions across browsers
      for (let i = 0; i < enabledBrowsers.length; i++) {
        const browser = enabledBrowsers[i];
        const browserKey = browser === 'webkit' ? 'safari' : 'chrome';
        const browserPercent = config.browsers[browserKey] || 0;

        if (i === enabledBrowsers.length - 1) {
          // Last browser gets remaining impressions
          browserCounts[browser] = remainingDeviceImpressions;
        } else {
          // Normalize percentage to enabled browsers only
          const normalizedPercent = totalBrowserPercent > 0 
            ? browserPercent / totalBrowserPercent 
            : 1 / enabledBrowsers.length;
          const count = Math.round(deviceImpressions * normalizedPercent);
          browserCounts[browser] = count;
          remainingDeviceImpressions -= count;
        }
      }

      // For each browser, distribute across devices with weights
      for (const [browser, browserCount] of Object.entries(browserCounts)) {
        if (browserCount <= 0) continue;

        const browserType = browser as 'webkit' | 'chromium';
        const availableDevices = DEVICE_SELECTION[deviceType]?.[browserType] || [];

        if (availableDevices.length === 0) continue;

        // Get weights for these devices
        const weights = DEVICE_WEIGHTS[deviceType]?.[browserType] || {};

        // Distribute impressions with weights
        const deviceCounts = distributeWithWeights(availableDevices, weights, browserCount);

        // Create entries
        for (const [deviceName, count] of Object.entries(deviceCounts)) {
          if (count > 0) {
            entries.push({
              country,
              deviceType: deviceType as 'mobile' | 'tablet' | 'desktop',
              deviceName,
              browserType,
              count,
            });
          }
        }
      }
    }
  }

  // Verify total and adjust for rounding
  const calculatedTotal = entries.reduce((sum, e) => sum + e.count, 0);
  const difference = totalImpressions - calculatedTotal;

  // Distribute any rounding difference to largest entries
  if (difference !== 0) {
    const sortedEntries = [...entries].sort((a, b) => b.count - a.count);
    for (let i = 0; i < Math.abs(difference); i++) {
      const entry = sortedEntries[i % sortedEntries.length];
      if (difference > 0) {
        entry.count++;
      } else if (entry.count > 0) {
        entry.count--;
      }
    }
  }

  return {
    entries,
    total: entries.reduce((sum, e) => sum + e.count, 0),
  };
}