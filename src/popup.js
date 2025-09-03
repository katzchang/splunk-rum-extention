// Popup script for Splunk RUM Extension

// DOM elements
const elements = {
  enableToggle: document.getElementById('enableToggle'),
  statusBadge: document.getElementById('statusBadge'),
  currentDomain: document.getElementById('currentDomain'),
  injectionStatus: document.getElementById('injectionStatus'),
  eventCount: document.getElementById('eventCount'),
  lastEvent: document.getElementById('lastEvent'),
  realmValue: document.getElementById('realmValue'),
  appNameValue: document.getElementById('appNameValue'),
  optionsBtn: document.getElementById('optionsBtn'),
  refreshBtn: document.getElementById('refreshBtn')
};

// Load and display current settings and status
async function loadStatus() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url) {
      const url = new URL(tab.url);
      elements.currentDomain.textContent = url.hostname;
      
      // Only check injection status for HTTPS sites
      if (url.protocol === 'https:') {
        checkInjectionStatus(tab);
      } else {
        elements.injectionStatus.textContent = 'HTTP not supported';
        elements.injectionStatus.classList.remove('active');
      }
    }
    
    // Load settings
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    if (response) {
      updateUI(response);
    }
    
    // Load stats
    const statsResponse = await chrome.runtime.sendMessage({ action: 'getStats' });
    if (statsResponse) {
      updateStats(statsResponse);
    }
  } catch (error) {
    console.error('Error loading status:', error);
  }
}

// Check if RUM is injected on current page
async function checkInjectionStatus(tab) {
  try {
    // Try to execute script to check if RUM is loaded
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        return typeof window.SplunkRum !== 'undefined';
      }
    });
    
    const isInjected = results && results[0] && results[0].result;
    
    if (isInjected) {
      elements.injectionStatus.textContent = 'RUM Active';
      elements.injectionStatus.classList.add('active');
    } else {
      elements.injectionStatus.textContent = 'Not injected';
      elements.injectionStatus.classList.remove('active');
    }
  } catch (error) {
    elements.injectionStatus.textContent = 'Cannot check';
    elements.injectionStatus.classList.remove('active');
  }
}

// Update UI with settings
function updateUI(settings) {
  // Update toggle
  elements.enableToggle.checked = settings.enabled;
  
  // Update status badge
  if (settings.enabled) {
    elements.statusBadge.classList.remove('inactive');
    elements.statusBadge.querySelector('.status-text').textContent = 'Active';
  } else {
    elements.statusBadge.classList.add('inactive');
    elements.statusBadge.querySelector('.status-text').textContent = 'Inactive';
  }
  
  // Update config display
  if (settings.splunkConfig.realm) {
    elements.realmValue.textContent = settings.splunkConfig.realm;
    elements.realmValue.classList.remove('not-configured');
  } else {
    elements.realmValue.textContent = 'Not configured';
    elements.realmValue.classList.add('not-configured');
  }
  
  if (settings.splunkConfig.applicationName) {
    elements.appNameValue.textContent = settings.splunkConfig.applicationName;
    elements.appNameValue.classList.remove('not-configured');
  } else {
    elements.appNameValue.textContent = 'Not configured';
    elements.appNameValue.classList.add('not-configured');
  }
}

// Update statistics display
function updateStats(stats) {
  elements.eventCount.textContent = stats.eventsCount || 0;
  
  if (stats.lastEvent) {
    const date = new Date(stats.lastEvent);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
      elements.lastEvent.textContent = 'Just now';
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      elements.lastEvent.textContent = `${minutes}m ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      elements.lastEvent.textContent = `${hours}h ago`;
    } else {
      elements.lastEvent.textContent = date.toLocaleDateString();
    }
  } else {
    elements.lastEvent.textContent = 'Never';
  }
}

// Handle enable toggle
elements.enableToggle.addEventListener('change', async (e) => {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    if (response) {
      response.enabled = e.target.checked;
      await chrome.runtime.sendMessage({ 
        action: 'saveSettings', 
        settings: response 
      });
      updateUI(response);
      
      // Reload current tab if toggling on
      if (e.target.checked) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url?.startsWith('https://')) {
          chrome.tabs.reload(tab.id);
        }
      }
    }
  } catch (error) {
    console.error('Error toggling extension:', error);
  }
});

// Handle options button
elements.optionsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Handle refresh button
elements.refreshBtn.addEventListener('click', async () => {
  // Reload current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    await chrome.tabs.reload(tab.id);
    // Reload popup status after a short delay
    setTimeout(() => {
      loadStatus();
    }, 1000);
  }
});

// Initialize popup
loadStatus();

// Auto-refresh stats every 5 seconds
setInterval(async () => {
  const statsResponse = await chrome.runtime.sendMessage({ action: 'getStats' });
  if (statsResponse) {
    updateStats(statsResponse);
  }
}, 5000);