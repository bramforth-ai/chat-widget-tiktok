/**
 * Chat Widget - Text-Only Entry Point
 * Uses an ElevenLabs module stub for styling without mic activation
 */

import { WidgetCore } from '../core/widget-core.js';
import { createConfig } from '../config.js';
import { ElevenLabsVoiceModule } from './elevenlabs-module-stub.js';
import '../../css/widget.css';
import { marked } from 'marked';

// Make marked available globally for other modules
window.marked = marked;

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false,
  mangle: false,
  sanitize: false,
  smartLists: true,
  smartypants: true
});

// Export to window object for external access
window.ChatWidget = {
  /**
   * Initialize the chat widget (text-only version)
   * @param {Object} config - Widget configuration options
   * @returns {Object} Object containing widget instance
   */
  init: function (config = {}) {
    // CRITICAL: Always ensure voice is disabled in text-only version
    
    // Ensure voice is disabled in user config
    config.enableVoice = false;
    config.micButtonVisible = false;
    
    // Merge with default configuration
    const widgetConfig = createConfig(config);
    
    console.log('Initializing text-only widget with config:', {
      enableVoice: widgetConfig.enableVoice, 
      enableMarkdown: widgetConfig.enableMarkdown
    });
    
    // Initialize widget
    const widget = new WidgetCore(widgetConfig);
    widget.init();
    
    // CRITICAL: Initialize the stub ElevenLabs module to add styling fixes
    // but without activating microphone
    const voice = new ElevenLabsVoiceModule(widgetConfig, widget);
    voice.init();
    
    return {
      widget,
      voice
    };
  }
};

// Auto-initialize if the script is loaded directly
document.addEventListener('DOMContentLoaded', () => {
  if (!window.ChatWidgetAutoInitDisabled) {
    window.ChatWidget.init();
  }
});

export default window.ChatWidget;