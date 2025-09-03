// Options page script for Splunk RUM Extension

let currentSettings = null;

// DOM elements
const elements = {
  realm: document.getElementById('realm'),
  rumAccessToken: document.getElementById('rumAccessToken'),
  applicationName: document.getElementById('applicationName'),
  environment: document.getElementById('environment'),
  blacklistMode: document.getElementById('blacklistMode'),
  whitelistMode: document.getElementById('whitelistMode'),
  blacklistSection: document.getElementById('blacklistSection'),
  whitelistSection: document.getElementById('whitelistSection'),
  blacklistInput: document.getElementById('blacklistInput'),
  whitelistInput: document.getElementById('whitelistInput'),
  blacklistDomains: document.getElementById('blacklistDomains'),
  whitelistDomains: document.getElementById('whitelistDomains'),
  addBlacklist: document.getElementById('addBlacklist'),
  addWhitelist: document.getElementById('addWhitelist'),
  saveBtn: document.getElementById('saveBtn'),
  resetBtn: document.getElementById('resetBtn'),
  exportBtn: document.getElementById('exportBtn'),
  importBtn: document.getElementById('importBtn'),
  importFile: document.getElementById('importFile'),
  statusMessage: document.getElementById('statusMessage'),
  toggleToken: document.getElementById('toggleToken')
};

// Load current settings
async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    if (response) {
      currentSettings = response;
      applySettingsToUI(response);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('Error loading settings', 'error');
  }
}

// Apply settings to UI
function applySettingsToUI(settings) {
  // Splunk config
  elements.realm.value = settings.splunkConfig.realm || '';
  elements.rumAccessToken.value = settings.splunkConfig.rumAccessToken || '';
  elements.applicationName.value = settings.splunkConfig.applicationName || '';
  elements.environment.value = settings.splunkConfig.environment || '';
  
  // Domain mode
  if (settings.useWhitelist) {
    elements.whitelistMode.checked = true;
    elements.blacklistSection.style.display = 'none';
    elements.whitelistSection.style.display = 'block';
  } else {
    elements.blacklistMode.checked = true;
    elements.blacklistSection.style.display = 'block';
    elements.whitelistSection.style.display = 'none';
  }
  
  // Domain lists
  renderDomainList(elements.blacklistDomains, settings.blacklistDomains || []);
  renderDomainList(elements.whitelistDomains, settings.whitelistDomains || []);
}

// Render domain list
function renderDomainList(listElement, domains) {
  listElement.innerHTML = '';
  domains.forEach(domain => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${domain}</span>
      <button data-domain="${domain}">Remove</button>
    `;
    li.querySelector('button').addEventListener('click', (e) => {
      removeDomain(e.target.dataset.domain, listElement === elements.blacklistDomains ? 'blacklist' : 'whitelist');
    });
    listElement.appendChild(li);
  });
}

// Add domain to list
function addDomain(domain, listType) {
  if (!domain) return;
  
  const key = listType === 'blacklist' ? 'blacklistDomains' : 'whitelistDomains';
  if (!currentSettings[key].includes(domain)) {
    currentSettings[key].push(domain);
    renderDomainList(
      listType === 'blacklist' ? elements.blacklistDomains : elements.whitelistDomains,
      currentSettings[key]
    );
  }
}

// Remove domain from list
function removeDomain(domain, listType) {
  const key = listType === 'blacklist' ? 'blacklistDomains' : 'whitelistDomains';
  const index = currentSettings[key].indexOf(domain);
  if (index > -1) {
    currentSettings[key].splice(index, 1);
    renderDomainList(
      listType === 'blacklist' ? elements.blacklistDomains : elements.whitelistDomains,
      currentSettings[key]
    );
  }
}

// Save settings
async function saveSettings() {
  // Validate required fields
  if (!elements.realm.value.trim()) {
    showStatus('Realm is required', 'error');
    return;
  }
  
  if (!elements.rumAccessToken.value.trim()) {
    showStatus('RUM Access Token is required', 'error');
    return;
  }
  
  // Build settings object
  const settings = {
    enabled: currentSettings.enabled,
    splunkConfig: {
      realm: elements.realm.value.trim(),
      rumAccessToken: elements.rumAccessToken.value.trim(),
      applicationName: elements.applicationName.value.trim() || 'monitored-app',
      environment: elements.environment.value.trim() || 'production'
    },
    whitelistDomains: currentSettings.whitelistDomains || [],
    blacklistDomains: currentSettings.blacklistDomains || [],
    useWhitelist: elements.whitelistMode.checked
  };
  
  try {
    const response = await chrome.runtime.sendMessage({ 
      action: 'saveSettings', 
      settings 
    });
    
    if (response && response.success) {
      showStatus('Settings saved successfully!', 'success');
      currentSettings = settings;
    } else {
      showStatus('Error saving settings', 'error');
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('Error saving settings', 'error');
  }
}

// Reset to defaults
async function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    const defaultSettings = {
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
    
    try {
      const response = await chrome.runtime.sendMessage({ 
        action: 'saveSettings', 
        settings: defaultSettings 
      });
      
      if (response && response.success) {
        currentSettings = defaultSettings;
        applySettingsToUI(defaultSettings);
        showStatus('Settings reset to defaults', 'success');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      showStatus('Error resetting settings', 'error');
    }
  }
}

// Export settings
function exportSettings() {
  const dataStr = JSON.stringify(currentSettings, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportLink = document.createElement('a');
  exportLink.setAttribute('href', dataUri);
  exportLink.setAttribute('download', 'splunk-rum-settings.json');
  document.body.appendChild(exportLink);
  exportLink.click();
  document.body.removeChild(exportLink);
  
  showStatus('Settings exported successfully', 'success');
}

// Import settings
function importSettings(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const settings = JSON.parse(e.target.result);
      
      // Validate imported settings
      if (!settings.splunkConfig || typeof settings.splunkConfig !== 'object') {
        throw new Error('Invalid settings format');
      }
      
      const response = await chrome.runtime.sendMessage({ 
        action: 'saveSettings', 
        settings 
      });
      
      if (response && response.success) {
        currentSettings = settings;
        applySettingsToUI(settings);
        showStatus('Settings imported successfully', 'success');
      }
    } catch (error) {
      console.error('Error importing settings:', error);
      showStatus('Error importing settings. Please check the file format.', 'error');
    }
  };
  reader.readAsText(file);
}

// Show status message
function showStatus(message, type) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message ${type}`;
  
  setTimeout(() => {
    elements.statusMessage.className = 'status-message';
  }, 3000);
}

// Event listeners
elements.blacklistMode.addEventListener('change', () => {
  elements.blacklistSection.style.display = 'block';
  elements.whitelistSection.style.display = 'none';
  currentSettings.useWhitelist = false;
});

elements.whitelistMode.addEventListener('change', () => {
  elements.blacklistSection.style.display = 'none';
  elements.whitelistSection.style.display = 'block';
  currentSettings.useWhitelist = true;
});

elements.addBlacklist.addEventListener('click', () => {
  const domain = elements.blacklistInput.value.trim();
  if (domain) {
    addDomain(domain, 'blacklist');
    elements.blacklistInput.value = '';
  }
});

elements.addWhitelist.addEventListener('click', () => {
  const domain = elements.whitelistInput.value.trim();
  if (domain) {
    addDomain(domain, 'whitelist');
    elements.whitelistInput.value = '';
  }
});

// Allow adding domains with Enter key
elements.blacklistInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    elements.addBlacklist.click();
  }
});

elements.whitelistInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    elements.addWhitelist.click();
  }
});

// Toggle token visibility
elements.toggleToken.addEventListener('click', () => {
  if (elements.rumAccessToken.type === 'password') {
    elements.rumAccessToken.type = 'text';
    elements.toggleToken.textContent = 'Hide';
  } else {
    elements.rumAccessToken.type = 'password';
    elements.toggleToken.textContent = 'Show';
  }
});

// Main action buttons
elements.saveBtn.addEventListener('click', saveSettings);
elements.resetBtn.addEventListener('click', resetSettings);
elements.exportBtn.addEventListener('click', exportSettings);
elements.importBtn.addEventListener('click', () => {
  elements.importFile.click();
});

elements.importFile.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    importSettings(e.target.files[0]);
  }
});

// Initialize
loadSettings();