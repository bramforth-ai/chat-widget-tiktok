/**
 * DOM Creator for Chat Widget
 * Creates and manages the HTML elements for the chat widget
 */

export class DOMCreator {
  /**
   * Constructor
   * @param {Object} config - Widget configuration
   */
  constructor(config) {
    this.config = config;
    this.elements = {};
  }

  /**
   * Create the chat widget DOM structure
   * @returns {HTMLElement} The root widget element
   */
  createWidgetDOM() {
    // Create root widget container
    const widget = document.createElement('div');
    widget.id = 'chat-widget';
    widget.className = 'chat-widget';

    // Add position class
    const position = this.config.position || 'bottom-right';
    widget.classList.add(`chat-widget--${position}`);

    // Create chat button
    const toggleButton = document.createElement('button');
    toggleButton.id = 'chat-toggle';
    toggleButton.className = 'chat-button';

    // Handle button icon (support icon or image)
    const buttonIcon = this.config.icons.button;
    if (buttonIcon.type === 'image') {
      toggleButton.innerHTML = `<img src="${buttonIcon.value}" alt="Chat" class="icon-image" style="max-width: 80%; max-height: 80%; object-fit: cover; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">`;
      toggleButton.style.position = 'relative';
      toggleButton.style.overflow = 'hidden';
    } else {
      // Use widget-icon class as in original
      toggleButton.innerHTML = `<i class="fa-solid ${buttonIcon.value} widget-icon"></i>`;
    }

    // Create chat container
    const chatContainer = document.createElement('div');
    chatContainer.id = 'chat-container';
    chatContainer.className = 'chat-container';

    // Create chat header
    const header = this.createChatHeader();

    // Create messages container
    const messagesContainer = document.createElement('div');
    messagesContainer.id = 'chat-messages';
    messagesContainer.className = 'chat-messages';

    // Add initial message if provided
    if (this.config.initialMessage) {
      const initialMessage = this.createMessage({
        type: 'assistant',
        content: this.config.initialMessage
      });
      messagesContainer.appendChild(initialMessage);
    }

    // Create user input form
    const chatForm = this.createChatForm();

    // Create user details form
    const userDetailsForm = this.createUserDetailsForm();

    // Assemble the components
    chatContainer.appendChild(header);
    chatContainer.appendChild(messagesContainer);
    chatContainer.appendChild(chatForm);
    chatContainer.appendChild(userDetailsForm);

    widget.appendChild(toggleButton);
    widget.appendChild(chatContainer);

    // Store references to key elements
    this.elements = {
      widget,
      toggleButton,
      chatContainer,
      header,
      messagesContainer,
      chatForm,
      chatInput: chatForm.querySelector('#chat-input'),
      sendButton: chatForm.querySelector('#btn-send'),
      voiceButton: chatForm.querySelector('#btn-voice'),
      closeButton: header.querySelector('#chat-close'),
      userDetailsForm,
      userForm: userDetailsForm.querySelector('#user-form'),
      formCancelButton: userDetailsForm.querySelector('#form-cancel')
    };

    return widget;
  }

  /**
   * Create chat header
   * @returns {HTMLElement} Header element
   */
  createChatHeader() {
    const header = document.createElement('div');
    header.className = 'chat-header';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'chat-header-title';

    // Handle assistant icon in header (support icon or image)
    const assistantIcon = this.config.icons.assistant;
    let assistantHtml = '';

    if (assistantIcon.type === 'image') {
      assistantHtml = `<img src="${assistantIcon.value}" alt="Assistant" class="icon-image" style="width: 36px; height: 36px; object-fit: cover; border-radius: 50%; vertical-align: middle; margin-right: 8px;">`;
    } else {
      // Use widget-icon class as in original
      assistantHtml = `<i class="fa-solid ${assistantIcon.value} widget-icon"></i>`;
    }

    titleDiv.innerHTML = `
      ${assistantHtml}
      <h3>${this.config.widgetTitle}</h3>
    `;

    const closeButton = document.createElement('button');
    closeButton.id = 'chat-close';
    closeButton.className = 'chat-close';

    // Handle close icon
    const closeIcon = this.config.icons.close;
    if (closeIcon.type === 'image') {
      closeButton.innerHTML = `<img src="${closeIcon.value}" alt="Close" class="icon-image">`;
    } else {
      // Removed inline style; add widget-icon class instead
      closeButton.innerHTML = `<i class="fa-solid ${closeIcon.value} widget-icon"></i>`;
    }

    header.appendChild(titleDiv);
    header.appendChild(closeButton);

    return header;
  }

  /**
   * Create chat input form
   * @returns {HTMLElement} Form element
   */
  createChatForm() {
    const form = document.createElement('form');
    form.id = 'chat-form';
    form.className = 'chat-form';

    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';

    const chatInput = document.createElement('input');
    chatInput.type = 'text';
    chatInput.id = 'chat-input';
    chatInput.className = 'chat-input';
    chatInput.placeholder = 'Type your message...';
    chatInput.autocomplete = 'off';

    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';

    // Add debug code right before the if statement
    console.log('Voice config check:', {
      enableVoice: this.config.enableVoice,
      config: this.config
    });

    // Add direct text-only mode detection
    const urlParams = new URLSearchParams(window.location.search);
    const isTextOnlyMode = urlParams.get('textOnly') === 'true' ||
      window.location.href.includes('text') ||
      (typeof window.WIDGET_TEXT_ONLY !== 'undefined' && window.WIDGET_TEXT_ONLY);

    // Only add voice button if voice is enabled AND not in text-only mode
    let voiceButton = null;
    if (this.config.enableVoice && !isTextOnlyMode) {
      console.log('Creating voice button - voice is enabled and not in text-only mode', {
        configEnableVoice: this.config.enableVoice,
        isTextOnlyMode: isTextOnlyMode
      });

      voiceButton = document.createElement('button');
      voiceButton.type = 'button';
      voiceButton.id = 'btn-voice';
      voiceButton.className = 'btn-voice';

      // Handle microphone icon
      const micIcon = this.config.icons.microphone;
      if (micIcon.type === 'image') {
        voiceButton.innerHTML = `<img src="${micIcon.value}" alt="Voice" class="icon-image">`;
      } else {
        // Removed inline style; add widget-icon class instead
        voiceButton.innerHTML = `<i class="fa-solid ${micIcon.value} widget-icon"></i>`;
      }

      buttonGroup.appendChild(voiceButton);
    } else {
      console.log('Voice button not created - voice disabled or in text-only mode', {
        configEnableVoice: this.config.enableVoice,
        isTextOnlyMode: isTextOnlyMode
      });
    }

    const sendButton = document.createElement('button');
    sendButton.type = 'submit';
    sendButton.id = 'btn-send';
    sendButton.className = 'btn-send';

    // Handle send icon
    const sendIcon = this.config.icons.send;
    if (sendIcon.type === 'image') {
      sendButton.innerHTML = `<img src="${sendIcon.value}" alt="Send" class="icon-image">`;
    } else {
      // Removed inline style; add widget-icon class instead
      sendButton.innerHTML = `<i class="fa-solid ${sendIcon.value} widget-icon"></i>`;
    }

    buttonGroup.appendChild(sendButton);
    inputGroup.appendChild(chatInput);
    inputGroup.appendChild(buttonGroup);
    form.appendChild(inputGroup);

    return form;
  }

  /**
   * Create user details form
   * @returns {HTMLElement} User details form element
   */
  createUserDetailsForm() {
    const formContainer = document.createElement('div');
    formContainer.id = 'user-details-form';
    formContainer.className = 'user-details-form hidden';

    const heading = document.createElement('h2');
    heading.textContent = 'Please enter your details for the booking link to be sent to you.';

    const form = document.createElement('form');
    form.id = 'user-form';

    // Name field
    const nameGroup = document.createElement('div');
    nameGroup.className = 'form-group';

    const nameLabel = document.createElement('label');
    nameLabel.htmlFor = 'user-name';
    nameLabel.textContent = 'Name:';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'user-name';
    nameInput.required = true;

    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);

    // Email field
    const emailGroup = document.createElement('div');
    emailGroup.className = 'form-group';

    const emailLabel = document.createElement('label');
    emailLabel.htmlFor = 'user-email';
    emailLabel.textContent = 'Email:';

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'user-email';
    emailInput.required = true;

    emailGroup.appendChild(emailLabel);
    emailGroup.appendChild(emailInput);

    // Phone field
    const phoneGroup = document.createElement('div');
    phoneGroup.className = 'form-group';

    const phoneLabel = document.createElement('label');
    phoneLabel.htmlFor = 'user-phone';
    phoneLabel.textContent = 'Telephone:';

    const phoneInput = document.createElement('input');
    phoneInput.type = 'text';
    phoneInput.id = 'user-phone';
    phoneInput.required = true;

    phoneGroup.appendChild(phoneLabel);
    phoneGroup.appendChild(phoneInput);

    // Form actions
    const actionGroup = document.createElement('div');
    actionGroup.className = 'form-actions';

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'btn-submit';
    submitButton.textContent = 'Submit';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.id = 'form-cancel';
    cancelButton.className = 'btn-cancel';
    cancelButton.textContent = 'Cancel';

    actionGroup.appendChild(submitButton);
    actionGroup.appendChild(cancelButton);

    // Assemble the form
    form.appendChild(nameGroup);
    form.appendChild(emailGroup);
    form.appendChild(phoneGroup);
    form.appendChild(actionGroup);

    formContainer.appendChild(heading);
    formContainer.appendChild(form);

    return formContainer;
  }

  /**
   * Create a message element
   * @param {Object} messageData - Message data
   * @param {string} messageData.type - Message type (user, assistant, system)
   * @param {string} messageData.content - Message content
   * @param {string} [messageData.id] - Message ID
   * @returns {HTMLElement} Message element
   */
  createMessage(messageData) {
    const { type, content, id = `message-${Date.now()}` } = messageData;

    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.id = id;

    // Add message content HTML
    let messageHtml = '';

    // Add assistant icon for assistant messages
    if (type === 'assistant') {
      const assistantIcon = this.config.icons.assistant;
      if (assistantIcon.type === 'image') {
        messageHtml += `<div class="avatar-container" style="position: relative; display: inline-block; vertical-align: top;"><img src="${assistantIcon.value}" alt="Assistant" class="avatar-image" style="max-width: 70%; max-height: 70%; object-fit: cover; border-radius: 50%; position: relative; top: 50%; transform: translateY(-50%);"></div>`;
      } else {
        // Use widget-icon class as in original
        messageHtml += `<i class="fa-solid ${assistantIcon.value} widget-icon"></i>`;
      }
    }

    // Add message content container
    messageHtml += '<div class="message-content">';

    // Add content based on type
    if (type === 'assistant') {
      messageHtml += `<div class="prose">${content}</div>`;
    } else {
      messageHtml += content;
    }

    messageHtml += '</div>';

    // Set message HTML
    messageEl.innerHTML = messageHtml;

    return messageEl;
  }

  /**
   * Create loading indicator element
   * @returns {HTMLElement} Loading indicator element
   */
  createLoadingIndicator() {
    const loaderEl = document.createElement('div');
    loaderEl.className = 'message assistant';
    loaderEl.id = 'message-loader';

    // Use assistant icon for the loader
    const assistantIcon = this.config.icons.assistant;
    let iconHtml = '';

    if (assistantIcon.type === 'image') {
      iconHtml = `<img src="${assistantIcon.value}" alt="Assistant" class="avatar-image">`;
    } else {
      // Removed inline style; add widget-icon class instead
      iconHtml = `<i class="fa-solid ${assistantIcon.value} widget-icon"></i>`;
    }

    loaderEl.innerHTML = `
      ${iconHtml}
      <div class="message-content">
        <div class="loader">
          <span class="loader-dot"></span>
          <span class="loader-dot"></span>
          <span class="loader-dot"></span>
        </div>
      </div>
    `;

    return loaderEl;
  }

  /**
   * Get all widget elements
   * @returns {Object} Object containing all widget elements
   */
  getElements() {
    return this.elements;
  }
}

export default DOMCreator;
