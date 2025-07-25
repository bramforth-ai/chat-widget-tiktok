/**
 * ElevenLabs Voice Integration Module - Updated for v0.2.0
 * 
 * Handles voice functionality for the chat widget using ElevenLabs Conversational AI SDK
 */

// Import the SDK - trying multiple patterns for v0.2.0 compatibility
import { Conversation } from '@11labs/client';
// Alternative imports to try if above fails:
// import * as ElevenLabs from '@11labs/client';
// import ElevenLabsSDK from '@11labs/client';

/**
 * ElevenLabsVoiceModule class
 * Integrates ElevenLabs SDK with the chat widget
 */
export class ElevenLabsVoiceModule {
  /**
   * Constructor
   * @param {Object} config - Voice configuration
   * @param {Object} widgetCore - Reference to the widget core instance
   */
  constructor(config, widgetCore) {
    this.config = config;
    this.widget = widgetCore;
    this.conversation = null;
    this.isActive = false;
    this.isConnecting = false;
    this.currentMode = 'idle'; // idle, listening, speaking

    // Validate that widgetCore is properly passed and has required methods
    if (!widgetCore) {
      console.error('WidgetCore not provided to ElevenLabsVoiceModule');
    } else if (typeof widgetCore.addMessage !== 'function') {
      console.error('WidgetCore does not have addMessage method', widgetCore);
    } else {
      console.log('WidgetCore properly initialized with addMessage method');
    }

    // Add CSS styles to ensure assistant messages are visible
    this.addCustomStyles();
  }

  /**
   * Suppress harmless blob URL errors from WebRTC audio processing
   */
  suppressBlobUrlErrors() {
    // Store original console.error
    const originalError = console.error;

    // Override console.error to filter blob URL messages
    console.error = (...args) => {
      const message = args.join(' ');

      // Skip blob URL errors (they're harmless WebRTC audio processing warnings)
      if (message.includes('Not allowed to load local resource: blob:')) {
        return; // Suppress these specific errors
      }

      // Allow all other errors through
      originalError.apply(console, args);
    };

    console.log('Blob URL error suppression enabled (harmless WebRTC warnings hidden)');
  }

  /**
   * Add custom CSS styles for proper message display
   */
  addCustomStyles() {
    try {
      // Create a style element for our custom styles
      const styleEl = document.createElement('style');
      styleEl.id = 'elevenlabs-custom-styles';

      // Define styles using CSS variables instead of hardcoded values
      styleEl.textContent = `
      /* Ensure assistant messages are visible */
      .message.assistant .message-content {
        background-color: var(--assistant-message-bg, var(--bg-white, #ffffff)) !important;
        color: var(--assistant-message-text, var(--text-dark, #1e293b)) !important;
        border-bottom-left-radius: 0 !important;
        box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)) !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
      }
      
      /* Ensure prose content inside assistant messages is visible */
      .message.assistant .message-content .prose {
        color: var(--assistant-message-text, var(--text-dark, #1e293b)) !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
      }

      /* Voice transcript styling */
      .message[data-voice-transcript="true"] .message-content {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05)) !important;
        border: 1px solid rgba(59, 130, 246, 0.2) !important;
        border-left: 4px solid var(--accent-color) !important;
        font-style: italic !important;
        opacity: 0.9 !important;
      }

      .message.user[data-voice-transcript="true"] .message-content {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.1)) !important;
        border: 1px solid rgba(59, 130, 246, 0.3) !important;
        border-right: 4px solid var(--accent-color) !important;
        border-left: none !important;
      }
    `;

      // Add to document head
      document.head.appendChild(styleEl);
      console.log('Added custom styles for message visibility using CSS variables');
    } catch (error) {
      console.error('Error adding custom styles:', error);
    }
  }

  /**
   * Initialize the voice module
   */
  async init() {
    if (!this.config.elevenLabsAgentId) {
      console.error('ElevenLabs Agent ID not provided');
      return;
    }

    // Suppress blob URL errors (harmless WebRTC audio processing warnings)
    this.suppressBlobUrlErrors();

    // CHECK: Only ask for permission if we don't already have it
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
      if (permissionStatus.state === 'granted') {
        console.log('🎤 Microphone permission already granted - no need to ask again');
      } else {
        console.log('🎤 Microphone permission not yet granted - will ask when voice is used');
      }
    } catch (e) {
      console.log('🎤 Permission check not supported - will ask when voice is used');
    }

    // Log configuration for debugging
    console.log('ElevenLabs initialization with config:', {
      agentId: this.config.elevenLabsAgentId,
      showTranscriptsInChat: this.config.showTranscriptsInChat ?? true,
      showUserTranscripts: this.config.showUserTranscripts ?? true,
      showAssistantTranscripts: this.config.showAssistantTranscripts ?? true
    });

    // Set default transcript settings if not configured
    this.config.showTranscriptsInChat = this.config.showTranscriptsInChat ?? true;
    this.config.showUserTranscripts = this.config.showUserTranscripts ?? true;
    this.config.showAssistantTranscripts = this.config.showAssistantTranscripts ?? true;

    // Override the widget's addMessage method to fix styling issues for assistant messages
    if (this.widget && typeof this.widget.addMessage === 'function') {
      // Store the original method
      const originalAddMessage = this.widget.addMessage.bind(this.widget);

      // Replace with our modified version
      this.widget.addMessage = (messageData) => {
        console.log('Custom addMessage called with data:', messageData);

        // Call the original function to add the message
        originalAddMessage(messageData);

        // After a short delay, fix any styling issues for assistant messages
        setTimeout(() => {
          try {
            if (messageData.type === 'assistant') {
              // Find all assistant message content elements
              const messageElements = document.querySelectorAll('.message.assistant .message-content');

              // Apply styles using CSS variables instead of hardcoded values
              messageElements.forEach(el => {
                // Get the computed styles to access CSS variables
                const computedStyle = getComputedStyle(document.documentElement);

                // Get the background color from CSS variables with fallbacks
                const bgColor = computedStyle.getPropertyValue('--assistant-message-bg').trim() ||
                  computedStyle.getPropertyValue('--bg-white').trim() ||
                  '#ffffff';

                // Get the text color from CSS variables with fallbacks
                const textColor = computedStyle.getPropertyValue('--assistant-message-text').trim() ||
                  computedStyle.getPropertyValue('--text-dark').trim() ||
                  '#1e293b';

                // Apply the variable-based colors
                el.style.backgroundColor = bgColor;
                el.style.color = textColor;

                // Find the prose element inside and ensure it's visible
                const proseEl = el.querySelector('.prose');
                if (proseEl) {
                  proseEl.style.color = textColor;
                }
              });

              console.log(`Fixed styling for ${messageElements.length} assistant messages using CSS variables`);
            }
          } catch (error) {
            console.error('Error fixing message styles:', error);
          }
        }, 50);
      };

      console.log('Successfully overrode widget.addMessage method to fix styling');
    }

    // Listen for voice toggle event from the widget
    document.addEventListener('widget:voice-toggle', () => {
      this.toggleVoice();
    });

    console.log('ElevenLabs voice module initialized');
  }

  /**
   * Toggle voice mode on/off
   */
  async toggleVoice() {
    console.log('Toggle voice. Current state:', { isActive: this.isActive });

    // GUARD: Prevent multiple rapid clicks
    if (this.isConnecting) {
      console.log('Already connecting, ignoring click');
      return;
    }

    if (!this.isActive) {
      // Start voice conversation
      await this.startVoiceConversation();
    } else {
      // End voice conversation
      await this.endVoiceConversation();
    }
  }

  /**
   * Start a voice conversation - Updated for v0.2.0
   */
  async startVoiceConversation() {
    try {
      // GUARD: Prevent multiple connections
      if (this.isActive || this.isConnecting) {
        console.log('Voice already active or connecting, skipping');
        return;
      }

      this.isConnecting = true; // Set connecting flag
      this.updateVoiceButtonStatus(true, 'connecting');

      // Check if we're in a secure context (required for microphone access)
      if (!window.isSecureContext) {
        this.isConnecting = false; // Reset flag
        this.updateVoiceButtonStatus(false);
        this.widget.addMessage({
          type: 'system',
          content: 'Voice calls require a secure connection (HTTPS).'
        });
        return;
      }

      // CLEANUP: End any existing conversation first
      if (this.conversation) {
        console.log('Cleaning up existing conversation...');
        try {
          await this.conversation.endSession();
        } catch (error) {
          console.warn('Error cleaning up existing conversation:', error);
        }
        this.conversation = null;
      }

      // Get agent ID from configuration with fallback options
      const agentId = this.config.elevenLabsAgentId || this.config.vapiAssistantId || '6OFeXYiQ86ij4TkiYiy6';

      console.log('Starting ElevenLabs conversation with agentId:', agentId);

      // Use WebRTC mode (we know this works now)
      console.log('Starting ElevenLabs conversation with WebRTC mode...');
      this.conversation = await Conversation.startSession({
        agentId: agentId,
        mode: 'webrtc', // WebRTC mode working perfectly
        onConnect: () => {
          console.log('✅ Connected to ElevenLabs');
          this.isConnecting = false; // Clear connecting flag on success
          this.updateVoiceButtonStatus(true, 'listening');
          this.widget.addMessage({
            type: 'system',
            content: 'Voice call started - speak clearly into your microphone'
          });
        },
        onDisconnect: () => {
          console.log('🔌 Disconnected from ElevenLabs');
          this.isActive = false;
          this.isConnecting = false; // Clear flags
          this.updateVoiceButtonStatus(false);
          this.widget.addMessage({
            type: 'system',
            content: 'Voice call ended'
          });
        },
        onMessage: (message) => {
          // Only log important transcripts, not all messages
          if (message.message) {
            console.log(`🎙️ ${message.source}: "${message.message}"`);
          }

          try {
            if (message.source === 'user' && message.message && this.config.showUserTranscripts) {
              this.widget.addMessage({
                type: 'user',
                content: `🎙️ ${message.message}`,
                isVoiceTranscript: true
              });
            }
            else if (message.source === 'ai' && message.message && this.config.showAssistantTranscripts) {
              this.widget.addMessage({
                type: 'assistant',
                content: `🔊 ${message.message}`,
                isVoiceTranscript: true
              });
            }
          } catch (error) {
            console.error('Error adding message to chat:', error);
          }
        },
        onError: (error) => {
          console.error('❌ ElevenLabs error:', error);
          this.isActive = false;
          this.isConnecting = false; // Clear flags on error
          this.updateVoiceButtonStatus(false);
          this.widget.addMessage({
            type: 'system',
            content: 'An error occurred with the voice call. Please try again.'
          });
          this.endVoiceConversation();
        },
        onModeChange: (mode) => {
          const modeEmoji = mode === 'speaking' ? '🔊' : mode === 'listening' ? '🎤' : '⏸️';
          console.log(`${modeEmoji} Mode: ${mode}`);
          this.currentMode = mode;

          if (mode === 'speaking') {
            this.updateVoiceButtonStatus(true, 'speaking');
          } else if (mode === 'listening') {
            this.updateVoiceButtonStatus(true, 'listening');
          }
        },
        onStatusChange: (status) => {
          console.log('📡 Status:', status);
          if (status === 'disconnected') {
            this.isActive = false;
            this.isConnecting = false; // Clear flags
            this.updateVoiceButtonStatus(false);
          }
        }
      });

      console.log('Conversation started with ID:', this.conversation.getId());
      this.isActive = true;
      this.isConnecting = false; // Clear connecting flag on success

    } catch (error) {
      console.error('Error starting voice conversation:', error);
      this.isConnecting = false; // Clear connecting flag on error
      this.isActive = false; // Make sure active is also cleared
      this.updateVoiceButtonStatus(false);

      // Show error message with more details
      const errorMessage = error.code === 3000 ?
        'Authentication failed. Please check your Agent ID or allowed origins.' :
        'Failed to start voice call. Please try again later.';

      this.widget.addMessage({
        type: 'system',
        content: errorMessage
      });
    }
  }

  /**
   * End the current voice conversation
   */
  async endVoiceConversation() {
    if (!this.conversation && !this.isActive) return;

    console.log('Ending voice conversation');

    try {
      // Update button state immediately
      this.updateVoiceButtonStatus(false);

      // End the conversation session
      if (this.conversation) {
        await this.conversation.endSession();
        console.log('Conversation ended');
      }

      // Reset ALL state
      this.isActive = false;
      this.isConnecting = false;
      this.conversation = null;
      this.currentMode = 'idle';

    } catch (error) {
      console.error('Error ending voice conversation:', error);

      // Force reset everything even if there was an error
      this.isActive = false;
      this.isConnecting = false;
      this.conversation = null;
      this.currentMode = 'idle';
      this.updateVoiceButtonStatus(false);
    }
  }

  /**
   * Update voice button status
   * @param {boolean} active - Whether voice is active
   * @param {string} [state='idle'] - Voice state (idle, connecting, listening, speaking)
   */
  updateVoiceButtonStatus(active, state = 'idle') {
    const voiceButton = document.getElementById('btn-voice');
    if (!voiceButton) return;

    // Update button class
    if (active) {
      voiceButton.classList.add('active');
    } else {
      voiceButton.classList.remove('active');
    }

    // Update icon based on state
    let icon = 'fa-microphone';
    if (active) {
      switch (state) {
        case 'connecting':
          icon = 'fa-circle-notch fa-spin';
          break;
        case 'listening':
          icon = 'fa-microphone-alt';
          break;
        case 'speaking':
          icon = 'fa-volume-up';
          break;
        default:
          icon = 'fa-microphone-alt';
      }
    } else {
      icon = 'fa-microphone';
    }

    // Add widget-icon class to ensure the icon picks up accent color from CSS variables
    voiceButton.innerHTML = `<i class="fa-solid ${icon} widget-icon"></i>`;
  }

  /**
   * Set the volume of the conversation
   * @param {number} volume - Volume level between 0 and 1
   */
  async setVolume(volume) {
    if (!this.conversation || !this.isActive) return;

    try {
      await this.conversation.setVolume({ volume });
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }

  /**
   * Get the current input volume level
   * @returns {number} Volume level between 0 and 1
   */
  async getInputVolume() {
    if (!this.conversation || !this.isActive) return 0;

    try {
      return await this.conversation.getInputVolume();
    } catch (error) {
      console.error('Error getting input volume:', error);
      return 0;
    }
  }

  /**
   * Get the current output volume level
   * @returns {number} Volume level between 0 and 1
   */
  async getOutputVolume() {
    if (!this.conversation || !this.isActive) return 0;

    try {
      return await this.conversation.getOutputVolume();
    } catch (error) {
      console.error('Error getting output volume:', error);
      return 0;
    }
  }

  /**
   * Send a message to the voice conversation
   * This can be useful for system messages or context
   * @param {string} message - Message to send
   */
  sendMessage(message) {
    // Currently ElevenLabs doesn't seem to have a direct way to send text messages
    // to an ongoing conversation. This would need to be implemented if the feature
    // becomes available.
    console.warn('sendMessage is not implemented for ElevenLabs conversations');
  }
}

// Export as default and named export
export default ElevenLabsVoiceModule;