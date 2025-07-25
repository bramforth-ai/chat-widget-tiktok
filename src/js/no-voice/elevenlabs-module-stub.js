/**
 * Stubbed ElevenLabs Voice Module
 * Provides styling fixes without mic activation
 */

export class ElevenLabsVoiceModule {
  /**
   * Constructor - preserve styling fixes but skip mic initialization
   */
  constructor(config, widgetCore) {
    this.config = config;
    this.widget = widgetCore;

    console.log('Created ElevenLabs stub module (no voice)');

    // CRITICAL: Add the custom styles that make messages visible
    this.addCustomStyles();
  }

  /**
   * Initialize module - add style fixes without mic activation
   */
  init() {
    console.log('Initializing stub ElevenLabs module (no voice)');

    // CRITICAL: Override the addMessage method to fix styling issues
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

              // Apply explicit styles to ensure visibility
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

              console.log(`Fixed styling for ${messageElements.length} assistant messages`);
            }
          } catch (error) {
            console.error('Error fixing message styles:', error);
          }
        }, 50);
      };

      console.log('Successfully overrode widget.addMessage method to fix styling');
    }
  }

  /**
   * Add custom CSS styles for proper message display
   * EXACT COPY from the original ElevenLabs module
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
        background-color: var(--assistant-message-bg, var(--bg-white)) !important;
        color: var(--assistant-message-text, var(--text-dark)) !important;
        border-bottom-left-radius: 0 !important;
        box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)) !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
      }
      
      /* Ensure prose content inside assistant messages is visible */
      .message.assistant .message-content .prose {
        color: var(--assistant-message-text, var(--text-dark)) !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
      }
    `;

      // Add to document head
      document.head.appendChild(styleEl);
      console.log('Added custom styles for message visibility using CSS variables');
    } catch (error) {
      console.error('Error adding custom styles:', error);
    }
  }

  // Add stub methods for any other functionality the widget might call
  toggleVoice() {
    console.log('Voice toggling is disabled in text-only mode');
  }
}

export default ElevenLabsVoiceModule;