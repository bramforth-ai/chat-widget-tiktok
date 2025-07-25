/**
 * WebSocket Handler for Chat Widget
 * Manages WebSocket connection to the chat server
 */

export class ChatWebSocket {
  // Constructor remains the same
  constructor({
    onMessage,
    onStatusChange,
    serverUrl
  }) {
    // Configuration
    this.serverUrl = serverUrl || 'wss://responses-api-pabau-whatsapp-new.onrender.com';
    this.onMessage = onMessage;
    this.onStatusChange = onStatusChange;

    // State
    this.ws = null;
    this.status = 'disconnected';
    this.heartbeatInterval = null;
    this.reconnectTimeout = null;
    this.lastAssistantMessageId = null;
    this.currentResponse = '';
    this.sessionId = null; // Track session ID
    this.isThinking = false; // Track thinking state
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    // Don't connect if already connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    // Update status
    this.setStatus('connecting');

    // Create WebSocket
    this.ws = new WebSocket(this.serverUrl);

    // Set up event handlers
    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onerror = this.handleError.bind(this);
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }

    // Clear intervals/timeouts
    this.clearTimers();
  }

  /**
   * Set connection status and notify callback
   * @param {string} status - New status
   */
  setStatus(status) {
    this.status = status;

    // Notify callback
    if (typeof this.onStatusChange === 'function') {
      this.onStatusChange(status);
    }
  }

  /**
   * Handle WebSocket open event
   */
  handleOpen() {
    console.log('WebSocket connection established');

    // Update status
    this.setStatus('connected');

    // Set up heartbeat with minimal format
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Send a minimal heartbeat
        this.ws.send(JSON.stringify({
          type: 'heartbeat',
          sessionId: this.sessionId
        }));
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Handle WebSocket message event
   * @param {MessageEvent} event - WebSocket message event
   */
  handleMessage(event) {
    try {
      console.log('Raw message received:', event.data);
      const response = JSON.parse(event.data);
      console.log('Received:', response);

      // Track session ID if it's a connection established message
      if (response.type === 'connection_established') {
        this.sessionId = response.sessionId;
        console.log(`Session established: ${this.sessionId}`);
        return; // Don't process further
      }

      // For debugging only
      if (typeof this.onMessage === 'function') {
        this.onMessage(response);
      }

      // Handle thinking states
      if (response.type === 'thinking_started' || response.type === 'thinking_start') {
        // Show thinking indicator
        document.dispatchEvent(new CustomEvent('ws:thinking-start'));
        return; // Don't process further
      }

      if (response.type === 'thinking_complete') {
        // Hide thinking indicator
        document.dispatchEvent(new CustomEvent('ws:thinking-complete'));
        return; // Don't process further
      }

      // Don't show error messages directly in the chat
      if (response.type === 'error') {
        console.warn('Server error:', response.message);
        return; // Skip displaying errors
      }

      // IMPORTANT: For identification_request, we want to show a form or special UI
      // rather than displaying as a regular message
      if (response.type === 'identification_request') {
        // Instead of showing this as a regular message, we could:
        // 1. Show a form
        // 2. Highlight the input field
        // 3. Show a specialized prompt

        // For now, we'll just log it and NOT display as a chat message
        console.log('Identification requested:', response.requestedInfo);

        // Maybe show a system message with instructions if needed
        // this.handleSystemMessage(`Please enter your ${response.requestedInfo}`);

        // Skip displaying this as a regular chat message
        return;
      }

      // Handle regular chat responses
      if ((response.type === 'chat_response' || !response.type) && response.message) {
        // Process as a standard assistant message
        this.handleAssistantMessage(response);
        return;
      }

      // Handle other specific message types
      switch (response.type) {
        case 'function_call':
        case 'function_result':
          this.handleFunctionResult(response);
          break;

        case 'user_details_form':
          this.handleUserDetailsForm(response);
          break;

        case 'booking_confirmed':
          this.handleBookingConfirmed(response);
          break;

        default:
          console.log(`Unhandled message type: ${response.type}`);
          // Don't display unhandled message types in the UI
          break;
      }
    } catch (err) {
      console.error('Error processing WebSocket message:', err);
    }
  }

  /**
   * Handle WebSocket open event
   */
  handleOpen() {
    console.log('WebSocket connection established');

    // Update status
    this.setStatus('connected');
  }

  /**
   * Handle thinking start state
   */
  handleThinkingStart() {
    if (this.isThinking) return; // Prevent duplicates
    this.isThinking = true;

    // Show "thinking" indicator in the UI
    const event = new CustomEvent('ws:thinking-start');
    document.dispatchEvent(event);
  }

  /**
   * Handle thinking update state
   * @param {Object} response - Thinking update response
   */
  handleThinkingUpdate(response) {
    // Update thinking state if needed
    const event = new CustomEvent('ws:thinking-update', {
      detail: { message: response.message || 'Still thinking...' }
    });
    document.dispatchEvent(event);
  }

  /**
   * Handle thinking complete state
   */
  handleThinkingComplete() {
    if (!this.isThinking) return;
    this.isThinking = false;

    // Hide the thinking indicator
    const event = new CustomEvent('ws:thinking-complete');
    document.dispatchEvent(event);
  }

  /**
   * Handle assistant message
   * @param {Object} response - Assistant message response
   */
  handleAssistantMessage(response) {
    // End thinking state if active
    if (this.isThinking) {
      this.handleThinkingComplete();
    }

    // Hide any existing loading indicators
    document.dispatchEvent(new CustomEvent('ws:hide-loader'));

    // Only process if there's actual content
    if (!response.message && !response.content) {
      console.warn('Assistant message with no content received');
      return;
    }

    const messageContent = response.message || response.content;

    // Create a new message event
    const messageEvent = new CustomEvent('ws:new-message', {
      detail: {
        type: 'assistant',
        content: messageContent,
        id: `message-${Date.now()}`,
        isHtml: false,
        skipTypewriter: false
      }
    });
    document.dispatchEvent(messageEvent);
  }

  /**
   * Handle function result message
   * @param {Object} response - Function result response
   */
  handleFunctionResult(response) {
    // Check for specific function types
    if (response.name === 'displayUserDetailsForm') {
      const event = new CustomEvent('ws:show-user-form');
      document.dispatchEvent(event);
    }

    // Other function calls can be handled here
    console.log('Function call/result:', response);
  }

  /**
   * Handle user details form message
   * @param {Object} response - User details form response
   */
  handleUserDetailsForm(response) {
    const event = new CustomEvent('ws:show-user-form');
    document.dispatchEvent(event);
  }

  /**
   * Handle booking confirmed message
   * @param {Object} response - Booking confirmed response
   */
  handleBookingConfirmed(response) {
    // Hide loading indicator
    document.dispatchEvent(new CustomEvent('ws:hide-loader'));

    // End thinking state if active
    if (this.isThinking) {
      this.handleThinkingComplete();
    }

    // Format message and link
    let message = response.message || 'Your booking is confirmed.';
    let linkText = 'Access your booking';
    let linkUrl = response.bookingLink || '#';

    // Create a message without using the typewriter effect
    const event = new CustomEvent('ws:new-message', {
      detail: {
        type: 'assistant',
        content: message,
        id: `message-${Date.now()}`,
        isHtml: false,
        skipTypewriter: true
      }
    });
    document.dispatchEvent(event);

    // Add booking link if available
    if (response.bookingLink) {
      setTimeout(() => {
        const linkEvent = new CustomEvent('ws:new-message', {
          detail: {
            type: 'assistant',
            content: `<a href="${linkUrl}" target="_blank" class="booking-link">${linkText}</a>`,
            id: `message-link-${Date.now()}`,
            isHtml: true,
            skipTypewriter: true
          }
        });
        document.dispatchEvent(linkEvent);
      }, 100);
    }
  }

  /**
   * Handle WebSocket close event
   * @param {CloseEvent} event - WebSocket close event
   */
  handleClose(event) {
    this.clearTimers();
    console.log('WebSocket connection closed:', event.code, event.reason);

    // End thinking state if active
    if (this.isThinking) {
      this.handleThinkingComplete();
    }

    // Update status
    this.setStatus('disconnected');

    // Try to reconnect unless it was a normal closure
    if (event.code !== 1000) {
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, 3000);
    }
  }

  /**
   * Handle WebSocket error event
   * @param {Event} error - WebSocket error event
   */
  handleError(error) {
    console.error('WebSocket error:', error);

    // End thinking state if active
    if (this.isThinking) {
      this.handleThinkingComplete();
    }

    // Update status
    this.setStatus('error');
  }

  /**
   * Send a message to the WebSocket server
   * @param {string} message - Message to send
   */
  sendMessage(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message: WebSocket not connected');
      return;
    }

    try {
      // Format message as in the working implementation
      this.ws.send(JSON.stringify({
        type: 'chat_message',
        sessionId: this.sessionId,
        message: message.trim()
      }));

      console.log('Sent message:', { type: 'chat_message', message: message.trim() });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  /**
   * Send image message to the WebSocket server
   * @param {string} message - Message text
   * @param {string} imageUrl - URL of the image
   */
  sendImageMessage(message, imageUrl) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Cannot send image message: WebSocket not connected');
      return;
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'image_message',
        sessionId: this.sessionId,
        message: message.trim(),
        imageUrl: imageUrl
      }));

      console.log('Sent image message:', { message, imageUrl });
    } catch (error) {
      console.error('Error sending image message:', error);
    }
  }

  /**
   * Submit user details to the WebSocket server
   * @param {Object} formData - User details form data
   */
  submitUserDetails(formData) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Cannot submit user details: WebSocket not connected');
      return;
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'user_details_submit',
        sessionId: this.sessionId,
        data: formData
      }));
    } catch (error) {
      console.error('Error submitting user details:', error);
    }
  }

  /**
   * Notify server that user cancelled the form
   */
  notifyFormCancelled() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Cannot notify form cancelled: WebSocket not connected');
      return;
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'user_details_cancelled',
        sessionId: this.sessionId
      }));
    } catch (error) {
      console.error('Error notifying form cancelled:', error);
    }
  }

  /**
   * Set user preference
   * @param {string} preference - Preference name
   * @param {boolean} enabled - Preference value
   */
  setPreference(preference, enabled) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Cannot set preference: WebSocket not connected');
      return;
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'set_preference',
        sessionId: this.sessionId,
        preference,
        enabled
      }));

      console.log('Set preference:', { preference, enabled });
    } catch (error) {
      console.error('Error setting preference:', error);
    }
  }

  /**
   * Clear intervals and timeouts
   */
  clearTimers() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

export default ChatWebSocket;