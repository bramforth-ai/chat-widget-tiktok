/**
 * Configuration System for Chat Widget
 * Creates a merged configuration with user overrides
 */

// Default configuration
const defaultConfig = {
  widgetTitle: 'AI Assistant',
  initialMessage: 'Welcome! How can I help you today?',
  position: 'bottom-right',
  icons: {
    button: {
      type: 'icon',
      value: 'fa-comment-dots',
      color: '#3b82f6'
    },
    assistant: {
      type: 'icon',
      value: 'fa-robot',
      color: '#3b82f6'
    },
    send: {
      type: 'icon',
      value: 'fa-paper-plane',
      color: '#ffffff'
    },
    microphone: {
      type: 'icon',
      value: 'fa-microphone',
      color: '#ffffff'
    },
    close: {
      type: 'icon',
      value: 'fa-times',
      color: '#ffffff'
    }
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
  websocketUrl: 'wss://your_live-server_url.onrender.com'
};          // Replace double quotes with single quotes

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
export default { createConfig, defaultConfig };