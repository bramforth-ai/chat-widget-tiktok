/**
 * Chat Widget - Voice-enabled Entry Point (ElevenLabs Version)
 */

import { WidgetCore } from '../core/widget-core.js';
import { createConfig } from '../config.js';
import { ElevenLabsVoiceModule } from './elevenlabs-module.js';
import '../../css/widget.css';
import { marked } from 'marked';

// Make marked available globally for other modules
window.marked = marked;

// Export to window object for external access
window.ChatWidget = {

  /**
   * Initialize the chat widget with voice capabilities using ElevenLabs
   * @param {Object} config - Widget configuration options
   * @param {boolean} [config.enableVoice=true] - Enable voice functionality
   * @param {string} [config.elevenLabsAgentId] - ElevenLabs Agent ID
   * @param {boolean} [config.showTranscriptsInChat=true] - Show voice transcripts in chat
   * @param {boolean} [config.showUserTranscripts=true] - Show user's spoken messages
   * @param {boolean} [config.showAssistantTranscripts=true] - Show assistant's spoken responses
   * @returns {Object} Object containing widget and voice module instances
   */
  init: function (config = {}) {
    // Detect text-only mode BEFORE any initialization
    const isTextOnly = window.location.href.includes('text') ||
      new URLSearchParams(window.location.search).get('textOnly') === 'true';

    if (isTextOnly) {
      console.log('Text-only mode detected - forcing voice to be disabled');
      config.enableVoice = false;
    }

    // Create configuration with text-only consideration
    const widgetConfig = createConfig({
      ...config,
      // Explicitly ensure voice is disabled for text-only mode
      enableVoice: isTextOnly ? false : (config.enableVoice !== false)
    });

    console.log('Widget initialization:', {
      isTextOnly: isTextOnly,
      enableVoice: widgetConfig.enableVoice
    });

    // Initialize widget
    const widget = new WidgetCore(widgetConfig);
    widget.init();

    // Only initialize voice module if NOT in text-only mode AND voice is enabled
    let voice = null;
    if (!isTextOnly && widgetConfig.enableVoice) {
      console.log('Voice enabled - initializing ElevenLabs module');
      voice = new ElevenLabsVoiceModule(widgetConfig, widget);
      voice.init();

      // CRITICAL: Store globally for cleanup
      window.currentVoiceModule = voice;
    } else {
      console.log('Voice disabled - skipping ElevenLabs module initialization');
      window.currentVoiceModule = null;
    }

    return {
      widget,
      voice
    };
  }
};

// Only auto-initialize if not in text-only mode
document.addEventListener('DOMContentLoaded', () => {
  if (!window.ChatWidgetAutoInitDisabled) {
    // Check for text-only before initializing
    const urlParams = new URLSearchParams(window.location.search);
    const isTextOnly = urlParams.get('textOnly') === 'true';

    window.ChatWidget.init({
      textOnly: isTextOnly,
      enableVoice: !isTextOnly
    });
  }
});

export default window.ChatWidget;