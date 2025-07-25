console.log('configurator.js loaded');

// Global variables for widget management
let currentWidgetInstance = null;
let currentWidgetType = 'voice';
let currentWidget = null;

// Global voice cleanup function
function forceCleanupAllVoiceConnections() {
  console.log('🧹 Force cleaning up all voice connections...');
  
  // Method 1: Try to end all conversations via global references
  if (window.currentVoiceModule) {
    try {
      window.currentVoiceModule.endVoiceConversation();
      window.currentVoiceModule = null;
    } catch (e) {
      console.warn('Error ending voice module:', e);
    }
  }
  
  // Method 2: Close all WebRTC connections
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(track => {
          console.log('🔇 Stopping audio track:', track.label);
          track.stop();
        });
      })
      .catch(() => {/* Ignore permission errors */});
  }
  
  // Method 3: Dispatch custom cleanup event
  document.dispatchEvent(new CustomEvent('force-voice-cleanup'));
  
  // Method 4: Clear any ElevenLabs global references
  if (window.ElevenLabs) {
    try {
      // Try to cleanup any global ElevenLabs state
      console.log('🔇 Clearing ElevenLabs global state');
    } catch (e) {
      console.warn('Error clearing ElevenLabs state:', e);
    }
  }
}

// Main configuration handler
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded fired');

  // Initial configuration object
  const defaultConfig = {
    widgetTitle: 'AI Assistant',
    initialMessage: 'Welcome! How can I help you today?',
    position: 'bottom-right',
    icons: {
      button: { type: 'icon', value: 'fa-comment-dots', color: '#3b82f6' },
      assistant: { type: 'icon', value: 'fa-robot', color: '#3b82f6' },
      send: { type: 'icon', value: 'fa-paper-plane', color: '#ffffff' },
      microphone: { type: 'icon', value: 'fa-microphone', color: '#ffffff' },
      close: { type: 'icon', value: 'fa-times', color: '#ffffff' }
    },
    colors: {
      primaryColor: '#1e293b',
      primaryHover: '#0f172a',
      accentColor: '#3b82f6',
      accentHover: '#2563eb',
      textLight: '#ffffff',
      textDark: '#1e293b',
      bgLight: '#f8fafc',
      bgWhite: '#ffffff',
      borderColor: '#e2e8f0',
      assistantMessageBg: '#ffffff',
      assistantMessageText: '#1e293b',
      userMessageBg: '#3b82f6',
      userMessageText: '#ffffff',
      systemMessageBg: '#e2e8f0',
      systemMessageText: '#475569'
    },
    size: {
      width: '24rem',
      maxWidth: '90vw',
      height: '70vh',
      maxHeight: '31.25rem',
      buttonSize: '3.5rem'
    },
    typingSpeed: 'normal',
    enableMarkdown: true,
    enableVoice: true,
    elevenLabsAgentId: 'YOUR_AGENT_ID_HERE',
    websocketUrl: 'wss://your_live-server_url.onrender.com',
    // Voice transcript settings
    showTranscriptsInChat: true,
    showUserTranscripts: true,
    showAssistantTranscripts: true
  };

  // Current configuration (deep clone default)
  let currentConfig = JSON.parse(JSON.stringify(defaultConfig));

  // Set up event listeners
  initEventListeners();
  updateFormFields();
  updateOutputCode();

  // Widget type selection
  function initEventListeners() {
    // Widget type selection
    document.querySelectorAll('input[name="widget-type"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        console.log('Widget type changed to:', e.target.value);
        currentWidgetType = e.target.value;
        updateVoiceSettings();

        // Force reloading the widget with the correct type
        loadWidget();

        updateOutputCode();
      });
    });

    // Icon type selection
    document.querySelectorAll('input[name="button-icon-type"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        toggleIconOptions('button', e.target.value);
      });
    });

    document.querySelectorAll('input[name="assistant-icon-type"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        toggleIconOptions('assistant', e.target.value);
      });
    });

    // Range input displays
    document.getElementById('button-size').addEventListener('input', (e) => {
      document.getElementById('button-size-display').textContent = e.target.value + 'rem';
    });

    document.getElementById('widget-width').addEventListener('input', (e) => {
      document.getElementById('widget-width-display').textContent = e.target.value + 'rem';
    });

    // Voice settings toggle
    document.getElementById('enable-voice').addEventListener('change', updateVoiceSettings);

    // Image URL inputs
    document.getElementById('button-image-url').addEventListener('change', (e) => {
      previewImage('button', e.target.value);
    });

    document.getElementById('assistant-image-url').addEventListener('change', (e) => {
      previewImage('assistant', e.target.value);
    });

    // File uploads
    document.getElementById('button-image-upload').addEventListener('change', (e) => {
      handleImageUpload('button', e);
    });

    document.getElementById('assistant-image-upload').addEventListener('change', (e) => {
      handleImageUpload('assistant', e);
    });

    // Apply configuration
    document.getElementById('apply-config').addEventListener('click', () => {
      buildConfigFromForm();
      loadWidget();
    });

    // Reset configuration
    document.getElementById('reset-config').addEventListener('click', () => {
      currentConfig = JSON.parse(JSON.stringify(defaultConfig));
      updateFormFields();
      loadWidget();
    });

    // Copy button
    document.getElementById('copy-config').addEventListener('click', function () {
      const textToCopy = document.getElementById('config-output').textContent;
      copyToClipboard(textToCopy, this);
    });
  }

  // Toggle icon/image options based on selected type
  function toggleIconOptions(iconName, type) {
    const iconOption = document.querySelector(`.icon-option[data-for="${iconName}-icon"]`);
    const imageOption = document.querySelector(`.image-option[data-for="${iconName}-image"]`);

    if (type === 'icon') {
      iconOption.style.display = 'block';
      imageOption.style.display = 'none';
    } else {
      iconOption.style.display = 'none';
      imageOption.style.display = 'block';
    }
  }

  // Update voice settings based on widget type and checkbox
  function updateVoiceSettings() {
    const voiceSettings = document.querySelector('.voice-settings');
    const voiceCheckbox = document.getElementById('enable-voice');

    if (currentWidgetType === 'text') {
      voiceSettings.style.display = 'none';
      currentConfig.enableVoice = false;
    } else {
      voiceSettings.style.display = 'block';
      currentConfig.enableVoice = voiceCheckbox.checked;
    }

    updateOutputCode();
  }

  // Preview image from URL
  function previewImage(iconName, url) {
    if (!url) return;

    const previewElement = document.getElementById(`${iconName}-image-preview`);
    previewElement.innerHTML = '';

    const img = document.createElement('img');
    img.src = url;
    img.alt = `${iconName} icon`;

    img.onerror = () => {
      previewElement.innerHTML = '<div class="preview-placeholder">Invalid image URL</div>';
    };

    img.onload = () => {
      previewElement.appendChild(img);
    };
  }

  // Build configuration object from form values
  function buildConfigFromForm() {
    // Basic settings
    currentConfig.widgetTitle = document.getElementById('widget-title').value;
    currentConfig.initialMessage = document.getElementById('welcome-message').value;
    currentConfig.position = document.getElementById('widget-position').value;

    // Colors
    currentConfig.colors.primaryColor = document.getElementById('primary-color').value;
    currentConfig.colors.primaryHover = document.getElementById('primary-hover').value;
    currentConfig.colors.accentColor = document.getElementById('accent-color').value;
    currentConfig.colors.accentHover = document.getElementById('accent-hover').value;

    // Message colors
    currentConfig.colors.assistantMessageBg = document.getElementById('assistant-bg').value;
    currentConfig.colors.assistantMessageText = document.getElementById('assistant-text').value;
    currentConfig.colors.userMessageBg = document.getElementById('user-bg').value;
    currentConfig.colors.userMessageText = document.getElementById('user-text').value;

    // Icons
    const buttonIconType = document.querySelector('input[name="button-icon-type"]:checked').value;
    currentConfig.icons.button.type = buttonIconType;

    if (buttonIconType === 'icon') {
      currentConfig.icons.button.value = document.getElementById('button-icon').value;
      currentConfig.icons.button.color = document.getElementById('button-icon-color').value;
    } else {
      currentConfig.icons.button.value = document.getElementById('button-image-url').value;
    }

    const assistantIconType = document.querySelector('input[name="assistant-icon-type"]:checked').value;
    currentConfig.icons.assistant.type = assistantIconType;

    if (assistantIconType === 'icon') {
      currentConfig.icons.assistant.value = document.getElementById('assistant-icon').value;
      currentConfig.icons.assistant.color = document.getElementById('assistant-icon-color').value;
    } else {
      currentConfig.icons.assistant.value = document.getElementById('assistant-image-url').value;
    }

    // Size
    currentConfig.size.buttonSize = document.getElementById('button-size').value + 'rem';
    currentConfig.size.width = document.getElementById('widget-width').value + 'rem';

    // Features
    currentConfig.typingSpeed = document.getElementById('typing-speed').value;
    currentConfig.enableMarkdown = document.getElementById('enable-markdown').checked;

    // Voice settings
    currentConfig.enableVoice = currentWidgetType === 'voice' && document.getElementById('enable-voice').checked;
    currentConfig.elevenLabsAgentId = document.getElementById('agent-id').value;

    // Voice transcript settings
    currentConfig.showUserTranscripts = document.getElementById('show-user-transcripts').checked;
    currentConfig.showAssistantTranscripts = document.getElementById('show-assistant-transcripts').checked;
    currentConfig.showTranscriptsInChat = currentConfig.showUserTranscripts || currentConfig.showAssistantTranscripts;

    // Connection
    currentConfig.websocketUrl = document.getElementById('websocket-url').value;

    // Update output code
    updateOutputCode();
  }

  // Update form fields from current configuration
  function updateFormFields() {
    // Basic settings
    document.getElementById('widget-title').value = currentConfig.widgetTitle;
    document.getElementById('welcome-message').value = currentConfig.initialMessage;
    document.getElementById('widget-position').value = currentConfig.position;

    // Colors
    document.getElementById('primary-color').value = currentConfig.colors.primaryColor;
    document.getElementById('primary-hover').value = currentConfig.colors.primaryHover;
    document.getElementById('accent-color').value = currentConfig.colors.accentColor;
    document.getElementById('accent-hover').value = currentConfig.colors.accentHover;

    // Message colors
    document.getElementById('assistant-bg').value = currentConfig.colors.assistantMessageBg;
    document.getElementById('assistant-text').value = currentConfig.colors.assistantMessageText;
    document.getElementById('user-bg').value = currentConfig.colors.userMessageBg;
    document.getElementById('user-text').value = currentConfig.colors.userMessageText;

    // Icons
    document.querySelector(`input[name="button-icon-type"][value="${currentConfig.icons.button.type}"]`).checked = true;
    toggleIconOptions('button', currentConfig.icons.button.type);

    if (currentConfig.icons.button.type === 'icon') {
      document.getElementById('button-icon').value = currentConfig.icons.button.value;
      document.getElementById('button-icon-color').value = currentConfig.icons.button.color;
    } else {
      document.getElementById('button-image-url').value = currentConfig.icons.button.value;
      previewImage('button', currentConfig.icons.button.value);
    }

    document.querySelector(`input[name="assistant-icon-type"][value="${currentConfig.icons.assistant.type}"]`).checked = true;
    toggleIconOptions('assistant', currentConfig.icons.assistant.type);

    if (currentConfig.icons.assistant.type === 'icon') {
      document.getElementById('assistant-icon').value = currentConfig.icons.assistant.value;
      document.getElementById('assistant-icon-color').value = currentConfig.icons.assistant.color;
    } else {
      document.getElementById('assistant-image-url').value = currentConfig.icons.assistant.value;
      previewImage('assistant', currentConfig.icons.assistant.value);
    }

    // Size
    const buttonSize = parseFloat(currentConfig.size.buttonSize);
    document.getElementById('button-size').value = buttonSize;
    document.getElementById('button-size-display').textContent = buttonSize + 'rem';

    const widgetWidth = parseFloat(currentConfig.size.width);
    document.getElementById('widget-width').value = widgetWidth;
    document.getElementById('widget-width-display').textContent = widgetWidth + 'rem';

    // Features
    document.getElementById('typing-speed').value = currentConfig.typingSpeed;
    document.getElementById('enable-markdown').checked = currentConfig.enableMarkdown;

    // Voice settings
    document.getElementById('enable-voice').checked = currentConfig.enableVoice;
    document.getElementById('agent-id').value = currentConfig.elevenLabsAgentId;

    // Voice transcript settings
    document.getElementById('show-user-transcripts').checked = currentConfig.showUserTranscripts ?? true;
    document.getElementById('show-assistant-transcripts').checked = currentConfig.showAssistantTranscripts ?? true;

    // Connection
    document.getElementById('websocket-url').value = currentConfig.websocketUrl;

    // Update widget type radio
    document.querySelector(`input[name="widget-type"][value="${currentWidgetType}"]`).checked = true;

    // Update voice settings display
    updateVoiceSettings();
  }

  // Update output code to match the desired format
  function updateOutputCode() {
    // Config code
    const configOutput = document.getElementById('config-output');
    const configCopy = JSON.parse(JSON.stringify(currentConfig));

    // If text-only, force disable voice
    if (currentWidgetType === 'text') {
      configCopy.enableVoice = false;
    }

    // Create the full config file format
    const configText = `/**
 * Configuration System for Chat Widget
 * Creates a merged configuration with user overrides
 */

// Default configuration
const defaultConfig = ${JSON.stringify(configCopy, null, 2)
        .replace(/"([^"]+)":/g, '$1:') // Convert "key": to key:
        .replace(/"/g, "'")};          // Replace double quotes with single quotes

/**
 * Create a configuration by merging defaults with custom config
 * @param {Object} customConfig - Custom configuration options
 * @returns {Object} - Merged configuration
 */
export function createConfig(customConfig = {}) {
  // Perform a deep merge for nested objects
  const merged = JSON.parse(JSON.stringify(defaultConfig)); // Deep clone to avoid modification
  
  // Enhanced deep merge that properly handles nested objects
  const deepMerge = (target, source) => {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        // If property doesn't exist on target, create it
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        // Recursively merge objects
        deepMerge(target[key], source[key]);
      } else {
        // Simple assignment for primitives or arrays
        target[key] = source[key];
      }
    }
    return target;
  };
  
  // Perform the deep merge
  return deepMerge(merged, customConfig);
}

// Export the createConfig function both as a named export (above)
// and as part of the default export (below)
export default { createConfig, defaultConfig };`;

    configOutput.textContent = configText;
  }

  // FIXED loadWidget function with aggressive cleanup
  function loadWidget() {
    console.log('🔄 Loading widget, type:', currentWidgetType);

    // STEP 1: Nuclear cleanup of everything
    forceCleanupAllVoiceConnections();

    // STEP 2: Destroy existing widget instance
    if (currentWidgetInstance) {
      console.log('🗑️ Destroying existing widget instance...');
      try {
        // End any active voice conversations
        if (currentWidgetInstance.voice) {
          console.log('🔇 Ending voice conversation...');
          if (typeof currentWidgetInstance.voice.endVoiceConversation === 'function') {
            currentWidgetInstance.voice.endVoiceConversation();
          }
          currentWidgetInstance.voice = null;
        }

        // Destroy the widget properly
        if (currentWidgetInstance.widget && typeof currentWidgetInstance.widget.destroy === 'function') {
          currentWidgetInstance.widget.destroy();
        }
      } catch (error) {
        console.warn('⚠️ Error destroying widget:', error);
      }
      
      currentWidgetInstance = null;
    }

    // STEP 3: Remove DOM elements
    const existingWidget = document.getElementById('chat-widget');
    if (existingWidget) {
      console.log('🗑️ Removing existing widget DOM');
      existingWidget.remove();
    }

    // STEP 4: Remove scripts
    const existingScript = document.getElementById('widget-script');
    if (existingScript) {
      console.log('🗑️ Removing existing widget script');
      existingScript.remove();
    }

    // STEP 5: Clear global references
    if (window.ChatWidget) {
      delete window.ChatWidget;
    }
    if (window.currentVoiceModule) {
      window.currentVoiceModule = null;
    }

    // STEP 6: Wait for cleanup to complete, then load new widget
    setTimeout(() => {
      console.log('✨ Starting fresh widget load...');
      
      // Determine script path based on widget type
      const scriptPath = currentWidgetType === 'text'
        ? './dist/widget-elevenlabs-text.min.js'
        : './dist/widget-elevenlabs.min.js';

      console.log('📦 Loading script from:', scriptPath);

      // Create and add the script element
      const script = document.createElement('script');
      script.id = 'widget-script';
      script.src = scriptPath;

      script.onload = function () {
        console.log('✅ Script loaded successfully!');

        if (window.ChatWidget && window.ChatWidget.init) {
          console.log('🎯 ChatWidget found, initializing...');

          // Create a copy of the config to avoid mutation issues
          const configCopy = JSON.parse(JSON.stringify(currentConfig));

          // Force voice setting based on widget type
          if (currentWidgetType === 'text') {
            configCopy.enableVoice = false;
          }

          // Initialize the widget and STORE the reference
          try {
            currentWidgetInstance = window.ChatWidget.init(configCopy);
            console.log('🎉 Widget initialized successfully:', currentWidgetInstance);
          } catch (initError) {
            console.error('❌ Error initializing widget:', initError);
          }
        } else {
          console.error('❌ ChatWidget not available after script load!');
        }
      };

      script.onerror = function (error) {
        console.error('❌ Failed to load widget script:', error);
      };

      // Add script to page
      document.head.appendChild(script);
    }, 500); // Longer delay for complete cleanup
  }

  // Helper: Copy to clipboard with visual feedback
  function copyToClipboard(text, buttonElement) {
    // Modern clipboard API
    navigator.clipboard.writeText(text)
      .then(() => {
        // Store original button state
        const originalText = buttonElement.textContent;
        const originalBgColor = buttonElement.style.backgroundColor;
        const originalColor = buttonElement.style.color;

        // Visual feedback
        buttonElement.textContent = '✓ Copied!';
        buttonElement.style.backgroundColor = '#10b981';
        buttonElement.style.color = 'white';

        // Reset after 2 seconds
        setTimeout(() => {
          buttonElement.textContent = originalText;
          buttonElement.style.backgroundColor = originalBgColor;
          buttonElement.style.color = originalColor;
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        alert('Could not copy text. Please try again or copy manually.');
      });
  }

  // Initialize on load
  loadWidget();
});