// This script runs in the page context and sets up Splunk RUM configuration
(function() {
  // Get configuration from the script tag's data attributes
  const script = document.currentScript;
  if (!script) return;
  
  const config = {
    realm: script.dataset.realm,
    rumAccessToken: script.dataset.rumAccessToken,
    applicationName: script.dataset.applicationName || 'monitored-app',
    deploymentEnvironment: script.dataset.environment || 'production',
    version: '1.0.0',
    debug: false,
    globalAttributes: {
      'app.injected_by': 'splunk-rum-extension'
    }
  };
  
  // Set the Splunk RUM configuration
  window.SplunkRumOptions = config;
  
  console.log('[Splunk RUM Extension] Configuration set:', {
    realm: config.realm,
    applicationName: config.applicationName,
    environment: config.deploymentEnvironment
  });
  
  // Wait for SplunkRum to be available and initialize it
  let rumInitialized = false;
  let sessionReplayInitialized = false;
  
  function initializeSplunkRum() {
    if (!rumInitialized && window.SplunkRum && window.SplunkRum.init) {
      try {
        window.SplunkRum.init(config);
        console.log('[Splunk RUM Extension] SplunkRum.init() called successfully');
        rumInitialized = true;
        
        // After RUM is initialized, try to initialize session replay
        initializeSessionReplay();
      } catch (error) {
        console.error('[Splunk RUM Extension] Error initializing SplunkRum:', error);
      }
    } else if (!rumInitialized) {
      // Retry after a short delay if SplunkRum is not yet available
      setTimeout(initializeSplunkRum, 100);
    }
  }
  
  // Initialize Session Replay
  function initializeSessionReplay() {
    if (!sessionReplayInitialized && window.SplunkSessionRecorder && window.SplunkSessionRecorder.init) {
      try {
        // Initialize Session Recorder with configuration
        const sessionRecorderConfig = {
          // Basic configuration
          realm: config.realm,
          rumAccessToken: config.rumAccessToken,
          app: config.applicationName,
          recorder: "splunk"
        };

        window.SplunkSessionRecorder.init(sessionRecorderConfig);
        console.log('[Splunk RUM Extension] SplunkSessionRecorder.init() called successfully');
        sessionReplayInitialized = true;
        
        // Set global attributes to indicate session replay is enabled
        if (window.SplunkRum && window.SplunkRum.setGlobalAttributes) {
          window.SplunkRum.setGlobalAttributes({
            'session.replay_enabled': true,
            'session.replay_sample_rate': sessionRecorderConfig.sessionSampleRate
          });
        }
      } catch (error) {
        console.error('[Splunk RUM Extension] Error initializing Session Recorder:', error);
      }
    } else if (!sessionReplayInitialized) {
      // Retry after a short delay if Session Recorder is not yet available
      setTimeout(initializeSessionReplay, 100);
    }
  }
  
  // Start initialization attempt
  initializeSplunkRum();
})();