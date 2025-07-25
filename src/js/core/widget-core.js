/**
 * Chat Widget Core
 * Main widget functionality, handles UI interactions and coordinates with other modules
 */

import { DOMCreator } from './dom-creator.js';
import { ChatWebSocket } from '../utils/websocket.js';
import { TypewriterEffect } from '../utils/typewriter.js';
import { applyCustomStyles } from '../utils/style-manager.js';

export class WidgetCore {
  /**
   * Constructor
   * @param {Object} config - Widget configuration
   */
  constructor(config) {
    this.config = config;
    this.domCreator = new DOMCreator(config);
    this.websocket = null;

    // State variables
    this.isOpen = false;
    this.currentStreamingMessageId = null;
  }

  /**
   * Enhance PDF download links to open in new tabs with better styling
   * @param {HTMLElement} container - Container element to search for links
   */
  enhancePdfLinks(container) {
    if (!container) return;

    // Find all links that contain '/api/files/' (PDF download links)
    const pdfLinks = container.querySelectorAll('a[href*="/api/files/"]');

    if (pdfLinks.length === 0) return;

    console.log(`🔗 Enhancing ${pdfLinks.length} PDF download link(s)`);

    pdfLinks.forEach(link => {
      // Make PDF links open in new tab
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      // Add PDF icon if not already present
      if (!link.textContent.includes('📄')) {
        link.innerHTML = '📄 ' + link.innerHTML;
      }

      // Add visual styling to make it look like a download button
      link.style.cssText = `
      display: inline-block;
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white !important;
      padding: 10px 16px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 8px 0;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);
      cursor: pointer;
    `;

      // Add hover effects
      link.addEventListener('mouseenter', () => {
        link.style.transform = 'translateY(-1px)';
        link.style.boxShadow = '0 4px 8px rgba(0, 123, 255, 0.3)';
        link.style.background = 'linear-gradient(135deg, #0056b3, #004085)';
      });

      link.addEventListener('mouseleave', () => {
        link.style.transform = 'translateY(0)';
        link.style.boxShadow = '0 2px 4px rgba(0, 123, 255, 0.2)';
        link.style.background = 'linear-gradient(135deg, #007bff, #0056b3)';
      });

      // Add click feedback
      link.addEventListener('mousedown', () => {
        link.style.transform = 'translateY(1px)';
      });

      link.addEventListener('mouseup', () => {
        link.style.transform = 'translateY(-1px)';
      });
    });
  }

  /**
   * Initialize the widget
   * @param {HTMLElement} [targetElement=document.body] - Target element to mount the widget
   */
  // Then in the init method:
  init(targetElement = document.body) {
    // Create DOM structure
    this.widgetElement = this.domCreator.createWidgetDOM();

    // Apply custom styles
    applyCustomStyles(this.widgetElement, this.config);

    // Get references to DOM elements
    this.elements = this.domCreator.getElements();

    // Append widget to target element
    targetElement.appendChild(this.widgetElement);

    // Bind event listeners
    this.bindEvents();

    // Initialize WebSocket if needed
    this.initWebSocket();

    console.log('Chat widget initialized with config:', this.config);

    return this;
  }

  /**
   * Initialize WebSocket connection
   */
  initWebSocket() {
    if (!this.websocket && this.config.websocketUrl) {
      this.websocket = new ChatWebSocket({
        onMessage: this.handleWebSocketMessage.bind(this),
        onStatusChange: this.handleConnectionStatus.bind(this),
        serverUrl: this.config.websocketUrl
      });

      // Store handler references for cleanup
      this._wsHideLoaderHandler = () => {
        this.hideLoadingIndicator();
      };

      this._wsNewMessageHandler = (e) => {
        const { type, content, id, isStreaming, contentSize, isHtml, rawContent } = e.detail;
        this.addMessage({
          type,
          content,
          id,
          isStreaming,
          contentSize,
          isHtml,
          rawContent
        });

        // Hide loading indicator when a new message comes in
        this.hideLoadingIndicator();
      };

      this._wsUpdateMessageHandler = (e) => {
        const { id, content, isComplete, isHtml, rawContent } = e.detail;
        this.updateStreamingMessage(id, content, isComplete, isHtml, rawContent);
      };

      this._wsShowFormHandler = () => {
        this.showUserDetailsForm();
      };

      // Listen for WebSocket events with stored handlers
      document.addEventListener('ws:hide-loader', this._wsHideLoaderHandler);
      document.addEventListener('ws:new-message', this._wsNewMessageHandler);
      document.addEventListener('ws:update-message', this._wsUpdateMessageHandler);
      document.addEventListener('ws:show-user-form', this._wsShowFormHandler);
    }
  }

  /**
   * Bind event listeners for UI interactions - ENHANCED VERSION
   */
  bindEvents() {
    // STORE BOUND FUNCTIONS so they can be removed later
    this._toggleChatHandler = () => this.toggleChat();
    this._closeChatHandler = () => this.toggleChat(false);
    this._handleSubmitHandler = (e) => this.handleSubmit(e);
    this._handleUserDetailsSubmitHandler = (e) => this.handleUserDetailsSubmit(e);
    this._hideUserDetailsFormHandler = () => this.hideUserDetailsForm();
    this._popstateHandler = (e) => {
      if (this.isOpen) {
        e.preventDefault();
        this.toggleChat(false);
        return false;
      }
    };
    this._touchmoveHandler = (e) => {
      e.stopPropagation();
    };

    // CRITICAL: Store voice toggle handler
    this._voiceToggleHandler = () => {
      console.log('Voice button clicked');
      const event = new CustomEvent('widget:voice-toggle');
      document.dispatchEvent(event);
    };

    // Apply event listeners using stored functions
    this.elements.toggleButton.addEventListener('click', this._toggleChatHandler);
    this.elements.closeButton.addEventListener('click', this._closeChatHandler);
    this.elements.chatForm.addEventListener('submit', this._handleSubmitHandler);

    // Handle voice button if it exists
    if (this.elements.voiceButton) {
      console.log('Voice button found, binding click event');
      this.elements.voiceButton.addEventListener('click', this._voiceToggleHandler);
    } else {
      console.log('Voice button not found in DOM elements');
    }

    // Handle user details form
    this.elements.userForm.addEventListener('submit', this._handleUserDetailsSubmitHandler);
    this.elements.formCancelButton.addEventListener('click', this._hideUserDetailsFormHandler);

    // Handle mobile back button
    window.addEventListener('popstate', this._popstateHandler);

    // Prevent body scroll when chat is open on mobile
    this.elements.chatContainer.addEventListener('touchmove', this._touchmoveHandler);
  }

  /**
   * Toggle chat window open/close
   * @param {boolean} [force] - Force a specific state
   */
  toggleChat(force = null) {
    this.isOpen = force !== null ? force : !this.isOpen;

    if (this.isOpen) {
      this.elements.chatContainer.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Connect to WebSocket when opening
      if (this.websocket) {
        this.websocket.connect();
      }

      // Focus input field
      setTimeout(() => {
        this.elements.chatInput.focus();
      }, 300);
    } else {
      this.elements.chatContainer.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  }

  /**
   * Handle chat form submission
   * @param {Event} e - Form submit event
   */
  handleSubmit(e) {
    e.preventDefault();

    const message = this.elements.chatInput.value.trim();
    if (!message) return;

    // Add user message to the chat
    this.addMessage({
      type: 'user',
      content: message
    });

    // Clear input field
    this.elements.chatInput.value = '';

    // Send message to WebSocket
    if (this.websocket) {
      this.websocket.sendMessage(message);
      this.showLoadingIndicator();
    } else {
      // For testing without WebSocket
      this.simulateResponse(message);
    }
  }

  /**
   * Simulate a response (for testing without WebSocket)
   * @param {string} message - User message
   */
  simulateResponse(message) {
    // Show loading indicator
    this.showLoadingIndicator();

    // Simulate typing delay
    setTimeout(() => {
      // Hide loading indicator
      this.hideLoadingIndicator();

      // Add assistant message
      if (message.toLowerCase().includes('form')) {
        this.showUserDetailsForm();
      } else {
        this.addMessage({
          type: 'assistant',
          content: `I received your message: "${message}". This is a simulated response.`
        });
      }
    }, 1000);
  }

  /**
   * Show user details form
   */
  showUserDetailsForm() {
    this.elements.userDetailsForm.classList.remove('hidden');
    this.elements.chatForm.classList.add('hidden');
    this.elements.messagesContainer.classList.add('hidden');
  }

  /**
   * Hide user details form
   */
  hideUserDetailsForm() {
    this.elements.userDetailsForm.classList.add('hidden');
    this.elements.chatForm.classList.remove('hidden');
    this.elements.messagesContainer.classList.remove('hidden');

    // Notify server that user cancelled form (if WebSocket is connected)
    if (this.websocket) {
      this.websocket.notifyFormCancelled();
    }
  }

  /**
   * Handle user details form submission
   * @param {Event} e - Form submit event
   */
  handleUserDetailsSubmit(e) {
    e.preventDefault();

    const formData = {
      name: document.getElementById('user-name').value,
      email: document.getElementById('user-email').value,
      phone: document.getElementById('user-phone').value
    };

    // Hide form
    this.hideUserDetailsForm();

    // Show loading indicator
    this.showLoadingIndicator();

    // Submit form data to WebSocket
    if (this.websocket) {
      this.websocket.submitUserDetails(formData);
    } else {
      // For testing without WebSocket
      setTimeout(() => {
        this.hideLoadingIndicator();
        this.addMessage({
          type: 'assistant',
          content: `Thank you, ${formData.name}! Your details have been submitted.`
        });
      }, 1000);
    }
  }

  /**
   * Add a message to the chat
   * @param {Object} messageData - Message data
   * @param {string} messageData.type - Message type (user, assistant, system)
   * @param {string} messageData.content - Message content
   * @param {boolean} [messageData.isStreaming] - Whether the message is still streaming
   * @param {string} [messageData.id] - Message ID (used for updating streaming messages)
   * @param {boolean} [messageData.isHtml] - Whether content is HTML
   * @param {string} [messageData.rawContent] - Raw content before HTML conversion
   */
  addMessage(messageData) {
    // Create message element
    const messageEl = this.domCreator.createMessage(messageData);

    // Set as current streaming message if streaming
    if (messageData.isStreaming) {
      this.currentStreamingMessageId = messageEl.id;
    }

    // Add to messages container
    this.elements.messagesContainer.appendChild(messageEl);

    // Apply typewriter effect for assistant messages if enabled
    if (messageData.type === 'assistant' && !messageData.isStreaming &&
      this.config.enableMarkdown && !messageData.skipTypewriter) {
      const contentEl = messageEl.querySelector('.prose');
      if (contentEl && typeof TypewriterEffect.animate === 'function') {
        TypewriterEffect.animate({
          element: contentEl,
          text: messageData.content,
          speed: this.config.typingSpeed,
          useMarkdown: this.config.enableMarkdown
        });

        // Enhance PDF links after typewriter completes
        setTimeout(() => {
          this.enhancePdfLinks(messageEl);
        }, 100);
      }
    } else if (messageData.isHtml) {
      // If it's HTML content, render it directly
      const contentEl = messageEl.querySelector('.prose');
      if (contentEl) {
        contentEl.innerHTML = messageData.content;

        // Enhance PDF links immediately for HTML content
        setTimeout(() => {
          this.enhancePdfLinks(messageEl);
        }, 50);
      }
    }

    // Enhance PDF links for any other content types (fallback)
    setTimeout(() => {
      this.enhancePdfLinks(messageEl);
    }, 100);

    // Scroll to bottom
    this.scrollToBottom();
  }

  /**
   * Update an existing streaming message
   * @param {string} messageId - Message ID
   * @param {string} content - New content
   * @param {boolean} isComplete - Whether the message is complete
   * @param {boolean} [isHtml=false] - Whether content is HTML
   * @param {string} [rawContent] - Raw content before HTML conversion
   */
  updateStreamingMessage(messageId, content, isComplete = false, isHtml = false, rawContent) {
    const messageEl = document.getElementById(messageId);
    if (!messageEl) {
      console.warn(`Message element ${messageId} not found`);
      return;
    }

    const contentEl = messageEl.querySelector('.prose');
    if (!contentEl) {
      console.warn(`Prose element in message ${messageId} not found`);
      return;
    }

    // For smoother updates, use a debounce approach - only update content
    // when there's a significant change or if it's the final update
    if (isComplete || this._lastContentLength === undefined ||
      Math.abs(content.length - this._lastContentLength) > 15) {

      this._lastContentLength = content.length;

      // Update content
      if (isHtml) {
        contentEl.innerHTML = content;
        // Enhance PDF links for HTML content
        this.enhancePdfLinks(messageEl);
      } else if (this.config.enableMarkdown && window.marked) {
        try {
          contentEl.innerHTML = window.marked.parse(content);
          // Enhance PDF links for markdown content
          this.enhancePdfLinks(messageEl);
        } catch (error) {
          console.error('Error rendering markdown:', error);
          contentEl.textContent = content;
        }
      } else {
        contentEl.textContent = content;
      }
    }

    // Handle message completion
    if (isComplete) {
      // Reset content length tracking
      this._lastContentLength = undefined;

      // Remove typing indicator
      const indicator = messageEl.querySelector('.typing-indicator');
      if (indicator) {
        indicator.remove();
      }

      // Final enhancement of PDF links when message is complete
      this.enhancePdfLinks(messageEl);
    }

    // Scroll to bottom
    this.scrollToBottom();
  }

  /**
   * Scroll chat to bottom
   */
  scrollToBottom() {
    this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
  }

  /**
   * Show loading indicator
   */
  showLoadingIndicator() {
    // Remove existing loader if any
    this.hideLoadingIndicator();

    // Create loader element
    const loaderEl = this.domCreator.createLoadingIndicator();

    // Add to messages container
    this.elements.messagesContainer.appendChild(loaderEl);

    // Scroll to bottom
    this.scrollToBottom();
  }

  /**
   * Hide loading indicator
   */
  hideLoadingIndicator() {
    const loaderEl = document.getElementById('message-loader');
    if (loaderEl) {
      loaderEl.remove();
    }
  }

  /**
   * Handle WebSocket connection status change
   * @param {string} status - Connection status
   */
  handleConnectionStatus(status) {
    console.log(`WebSocket status: ${status}`);

    if (status === 'connected') {
      // Enable chat input
      this.elements.chatInput.disabled = false;
      this.elements.sendButton.disabled = false;
    } else {
      // Disable chat input
      this.elements.chatInput.disabled = true;
      this.elements.sendButton.disabled = true;

      // Show system message for disconnection
      if (status === 'disconnected' || status === 'error') {
        this.addMessage({
          type: 'system',
          content: 'Connection lost. Trying to reconnect...'
        });
      }
    }
  }

  /**
   * Handle WebSocket messages
   * @param {Object} response - WebSocket response
   */
  handleWebSocketMessage(response) {
    console.log('Received message:', response);

    // For direct handling of specific message types
    if (response.type === 'function_result' && response.name === 'displayUserDetailsForm') {
      this.showUserDetailsForm();
    } else if (response.type === 'user_details_form') {
      this.showUserDetailsForm();
    } else if (response.type === 'booking_confirmed') {
      // Handle booking confirmation
      this.hideLoadingIndicator();

      // Format message properly
      let content = '';
      if (response.message) {
        content += response.message;
      }

      // Add booking link if available
      if (response.bookingLink) {
        // Add the booking link as a properly formatted link
        this.addMessage({
          type: 'assistant',
          content: content,
          skipTypewriter: true // Skip typewriter to avoid span wrapping issues
        });

        // Add the link as a separate, styled element
        setTimeout(() => {
          this.addMessage({
            type: 'assistant',
            content: `<a href="${response.bookingLink}" target="_blank" class="booking-link">Click here to access your booking</a>`,
            isHtml: true,
            skipTypewriter: true
          });
        }, 100);
      } else {
        // No link, just show the message
        if (content) {
          this.addMessage({
            type: 'assistant',
            content: content
          });
        }
      }
    }
  }

  /**
   * Destroy the widget instance - ENHANCED VERSION
   * Cleans up event listeners and removes DOM elements
   */
  destroy() {
    console.log('🔥 Running complete widget destruction...');

    // NEW: Force end any active voice conversations FIRST
    if (window.currentVoiceModule) {
      try {
        console.log('🔇 Ending voice conversation in destroy...');
        window.currentVoiceModule.endVoiceConversation();
        window.currentVoiceModule = null;
      } catch (error) {
        console.warn('Error ending voice in destroy:', error);
      }
    }

    // Remove WebSocket event listeners with stored handlers
    if (this._wsHideLoaderHandler) {
      document.removeEventListener('ws:hide-loader', this._wsHideLoaderHandler);
      this._wsHideLoaderHandler = null;
    }
    if (this._wsNewMessageHandler) {
      document.removeEventListener('ws:new-message', this._wsNewMessageHandler);
      this._wsNewMessageHandler = null;
    }
    if (this._wsUpdateMessageHandler) {
      document.removeEventListener('ws:update-message', this._wsUpdateMessageHandler);
      this._wsUpdateMessageHandler = null;
    }
    if (this._wsShowFormHandler) {
      document.removeEventListener('ws:show-user-form', this._wsShowFormHandler);
      this._wsShowFormHandler = null;
    }

    // Clean up UI event listeners - STORE BOUND FUNCTIONS FIRST
    if (this.elements) {
      // Remove toggle button listener
      if (this.elements.toggleButton && this._toggleChatHandler) {
        this.elements.toggleButton.removeEventListener('click', this._toggleChatHandler);
      }

      // Remove close button listener  
      if (this.elements.closeButton && this._closeChatHandler) {
        this.elements.closeButton.removeEventListener('click', this._closeChatHandler);
      }

      // Remove form submit listener
      if (this.elements.chatForm && this._handleSubmitHandler) {
        this.elements.chatForm.removeEventListener('submit', this._handleSubmitHandler);
      }

      // CRITICAL: Remove voice button listener
      if (this.elements.voiceButton && this._voiceToggleHandler) {
        this.elements.voiceButton.removeEventListener('click', this._voiceToggleHandler);
      }

      // Remove user form listeners
      if (this.elements.userForm && this._handleUserDetailsSubmitHandler) {
        this.elements.userForm.removeEventListener('submit', this._handleUserDetailsSubmitHandler);
      }
      if (this.elements.formCancelButton && this._hideUserDetailsFormHandler) {
        this.elements.formCancelButton.removeEventListener('click', this._hideUserDetailsFormHandler);
      }

      // Remove mobile listeners
      if (this.elements.chatContainer && this._touchmoveHandler) {
        this.elements.chatContainer.removeEventListener('touchmove', this._touchmoveHandler);
      }
    }

    // Remove window event listeners - CRITICAL FOR ZOMBIE PREVENTION
    if (this._popstateHandler) {
      window.removeEventListener('popstate', this._popstateHandler);
      this._popstateHandler = null;
    }

    // CRITICAL: Remove the voice toggle event listener from document
    if (this._voiceToggleDocumentHandler) {
      document.removeEventListener('widget:voice-toggle', this._voiceToggleDocumentHandler);
      this._voiceToggleDocumentHandler = null;
    }

    // Close WebSocket connection if open
    if (this.websocket) {
      this.websocket.disconnect();
      this.websocket = null;
    }

    // Remove DOM elements
    if (this.widgetElement && this.widgetElement.parentNode) {
      this.widgetElement.parentNode.removeChild(this.widgetElement);
    }

    // Nullify all references to help garbage collection
    this.widgetElement = null;
    this.elements = null;
    this.domCreator = null;
    this.config = null;
    this.isOpen = false;
    this.currentStreamingMessageId = null;

    console.log('🗑️ Widget destroyed completely');
  }
}

export default WidgetCore;