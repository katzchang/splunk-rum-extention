// Content script for Splunk RUM injection

let isInjected = false;
let settings = null;

// Check if we should inject RUM on this page
async function checkAndInject() {
  if (isInjected) return;

  try {
    const response = await chrome.runtime.sendMessage({ action: 'checkDomain' });
    
    if (response.shouldInject && response.settings) {
      settings = response.settings;
      injectSplunkRUM(settings.splunkConfig);
      isInjected = true;
      console.log('[Splunk RUM Extension] RUM agent injected successfully');
    }
  } catch (error) {
    console.error('[Splunk RUM Extension] Error checking domain:', error);
  }
}

// Inject Splunk RUM script into the page
function injectSplunkRUM(config) {
  if (!config.realm || !config.rumAccessToken) {
    console.warn('[Splunk RUM Extension] Missing Splunk configuration');
    return;
  }

  // First, inject the configuration setter script with data attributes
  const configScript = document.createElement('script');
  configScript.src = chrome.runtime.getURL('src/injector.js');
  configScript.dataset.realm = config.realm;
  configScript.dataset.rumAccessToken = config.rumAccessToken;
  configScript.dataset.applicationName = config.applicationName || 'monitored-app';
  configScript.dataset.environment = config.environment || 'production';
  
  // Insert config script before other scripts
  if (document.head) {
    document.head.insertBefore(configScript, document.head.firstChild);
  } else {
    // If head doesn't exist yet, wait for it
    const observer = new MutationObserver((mutations, obs) => {
      if (document.head) {
        document.head.insertBefore(configScript, document.head.firstChild);
        obs.disconnect();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  // Inject the Splunk RUM script from extension resources
  const rumScript = document.createElement('script');
  rumScript.src = chrome.runtime.getURL('src/splunk-otel-web.js');
  rumScript.onload = () => {
    console.log('[Splunk RUM Extension] Splunk RUM loaded successfully');
    
    // Now inject the session replay script
    const sessionReplayScript = document.createElement('script');
    sessionReplayScript.src = chrome.runtime.getURL('src/splunk-otel-web-session-recorder.js');
    sessionReplayScript.onload = () => {
      console.log('[Splunk RUM Extension] Session replay loaded successfully');
    };
    sessionReplayScript.onerror = () => {
      console.error('[Splunk RUM Extension] Failed to load session replay script');
    };
    
    if (document.head) {
      document.head.appendChild(sessionReplayScript);
    } else {
      const observer = new MutationObserver((mutations, obs) => {
        if (document.head) {
          document.head.appendChild(sessionReplayScript);
          obs.disconnect();
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
    
    // Track injection event
    chrome.runtime.sendMessage({ action: 'updateStats', count: 1 });
    
    // Initialize custom tracking
    initializeCustomTracking();
  };
  rumScript.onerror = () => {
    console.error('[Splunk RUM Extension] Failed to load Splunk RUM script');
  };

  // Add script to page
  if (document.head) {
    document.head.appendChild(rumScript);
  } else {
    // Wait for head to be available
    const observer = new MutationObserver((mutations, obs) => {
      if (document.head) {
        document.head.appendChild(rumScript);
        obs.disconnect();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
}

// Initialize custom tracking features
function initializeCustomTracking() {
  // Add custom error tracking
  window.addEventListener('error', (event) => {
    chrome.runtime.sendMessage({ action: 'updateStats', count: 1 });
  });

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    chrome.runtime.sendMessage({ action: 'updateStats', count: 1 });
  });

  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (window.SplunkRum) {
      window.SplunkRum.setGlobalAttributes({
        'page.visibility': document.visibilityState
      });
    }
  });

  // Add custom user interaction tracking
  let interactionCount = 0;
  document.addEventListener('click', () => {
    interactionCount++;
    if (window.SplunkRum) {
      window.SplunkRum.setGlobalAttributes({
        'user.interaction_count': interactionCount
      });
    }
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'settingsUpdated':
      // Reload the page if settings changed
      if (isInjected) {
        location.reload();
      }
      break;
    
    case 'pageLoaded':
      // Re-check injection when page loads
      checkAndInject();
      break;
  }
});

// Initial injection check
checkAndInject();

// Also check when DOM is ready (for SPAs)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkAndInject);
} else {
  checkAndInject();
}