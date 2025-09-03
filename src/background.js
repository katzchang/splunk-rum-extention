// Background service worker for Splunk RUM Extension

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  splunkConfig: {
    realm: '',
    rumAccessToken: '',
    applicationName: 'monitored-app',
    environment: 'production'
  },
  whitelistDomains: [],
  blacklistDomains: [],
  useWhitelist: false
};

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async () => {
  const settings = await chrome.storage.local.get('settings');
  if (!settings.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getSettings':
      chrome.storage.local.get('settings').then(data => {
        sendResponse(data.settings || DEFAULT_SETTINGS);
      });
      return true;

    case 'saveSettings':
      chrome.storage.local.set({ settings: request.settings }).then(() => {
        sendResponse({ success: true });
        // Notify all tabs to reload settings
        chrome.tabs.query({}, tabs => {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { action: 'settingsUpdated' }).catch(() => {});
          });
        });
      });
      return true;

    case 'checkDomain':
      chrome.storage.local.get('settings').then(data => {
        const settings = data.settings || DEFAULT_SETTINGS;
        const domain = new URL(sender.tab.url).hostname;
        const shouldInject = shouldInjectForDomain(domain, settings);
        sendResponse({ shouldInject, settings });
      });
      return true;

    case 'getStats':
      chrome.storage.local.get('stats').then(data => {
        sendResponse(data.stats || { eventsCount: 0, lastEvent: null });
      });
      return true;

    case 'updateStats':
      chrome.storage.local.get('stats').then(data => {
        const stats = data.stats || { eventsCount: 0, lastEvent: null };
        stats.eventsCount += request.count || 1;
        stats.lastEvent = new Date().toISOString();
        chrome.storage.local.set({ stats });
      });
      return true;
  }
});

// Check if RUM should be injected for a domain
function shouldInjectForDomain(domain, settings) {
  if (!settings.enabled) return false;
  if (!settings.splunkConfig.realm || !settings.splunkConfig.rumAccessToken) return false;

  if (settings.useWhitelist) {
    // Whitelist mode - only inject on listed domains
    return settings.whitelistDomains.some(pattern => matchDomain(domain, pattern));
  } else {
    // Blacklist mode - inject unless domain is blacklisted
    return !settings.blacklistDomains.some(pattern => matchDomain(domain, pattern));
  }
}

// Match domain against pattern (supports wildcards)
function matchDomain(domain, pattern) {
  if (pattern === domain) return true;
  
  // Convert wildcard pattern to regex
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  
  const regex = new RegExp(`^${regexPattern}$`, 'i');
  return regex.test(domain);
}

// Handle tab updates to potentially inject RUM
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.startsWith('https://')) {
    chrome.tabs.sendMessage(tabId, { action: 'pageLoaded' }).catch(() => {});
  }
});