main Widget Loader file - Wordpress;


(() => {
    // Get base URL for resources
    const scriptElement = document.currentScript;
    const scriptUrl = scriptElement.src;
    const baseUrl = scriptUrl.substring(0, scriptUrl.lastIndexOf('/') + 1);

    // Create a separate container to isolate the widget
    function createIsolatedContainer() {
        const container = document.createElement('div');
        container.id = 'chat-widget-container';
        container.style.cssText = `
        position: fixed;
        bottom: 0;
        right: 0;
        z-index: 999999;
        width: 0;
        height: 0;
        overflow: visible;
      `;
        document.body.appendChild(container);
        return container;
    }

    // Load Font Awesome
    function loadFontAwesome() {
        return new Promise((resolve) => {
            // Check if Font Awesome is already loaded
            if (document.querySelector('link[href*="font-awesome"]')) {
                resolve();
                return;
            }

            const fontAwesome = document.createElement('link');
            fontAwesome.rel = 'stylesheet';
            fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            fontAwesome.onload = resolve;
            document.head.appendChild(fontAwesome);
        });
    }

    // Load widget styles
    function loadWidgetStyles() {
        return new Promise((resolve) => {
            const widgetStyles = document.createElement('link');
            widgetStyles.rel = 'stylesheet';
            widgetStyles.href = `${baseUrl}styles.min.css`;
            widgetStyles.onload = resolve;
            document.head.appendChild(widgetStyles);
        });
    }

    // Add compatibility CSS
    function addCompatibilityCSS() {
        const style = document.createElement('style');
        style.textContent = `
        /* Container needs to allow pointer events */
        #chat-widget-container {
          pointer-events: auto !important;
        }
        
        /* Ensure the widget button is sized correctly */
        #chat-widget .chat-button {
          position: relative !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 56px !important; /* Fixed size instead of variable */
          height: 56px !important; /* Fixed size instead of variable */
          border-radius: 9999px !important;
          cursor: pointer !important;
          border: none !important;
          background-image: linear-gradient(to right, var(--primary-color, #1e293b), var(--primary-hover, #0f172a)) !important;
          color: #ffffff !important;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05) !important;
          transition: transform 0.2s !important;
          padding: 0 !important;
          margin: 1rem !important;
          overflow: hidden !important;
          transform: scale(1) !important;
        }
        
        #chat-widget .chat-button:hover {
          transform: scale(1.05) !important;
        }
        
        /* Fix for widget icon */
        #chat-widget .widget-icon {
          color: var(--accent-color, #3b82f6) !important;
          font-size: 24px !important;
        }
        
        /* Make sure chat container appears correctly */
        #chat-widget .chat-container {
          position: absolute !important;
          bottom: 4.5rem !important;
          right: 0 !important;
          width: var(--widget-width, 24rem) !important;
          max-width: var(--widget-max-width, 90vw) !important;
          height: var(--widget-height, 70vh) !important;
          max-height: var(--widget-max-height, 31.25rem) !important;
          background-color: #ffffff !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05) !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
          transition: opacity 0.3s, transform 0.3s !important;
        }
        
        /* Fix active class that controls visibility */
        #chat-widget .chat-container.active {
          opacity: 1 !important;
          transform: translateY(0) !important;
          pointer-events: all !important;
        }
        
        /* Make sure the container is initially hidden properly */
        #chat-widget .chat-container:not(.active) {
          opacity: 0 !important;
          transform: translateY(1.25rem) !important;
          pointer-events: none !important;
        }

        /*
        * ADD YOUR OVERRIDES HERE:
        * Force smaller icons for send/mic or any other large icons
        * Force input to be a smaller or consistent font-size
        */
        #chat-widget .btn-send i,
        #chat-widget .btn-voice i {
        font-size: 1.2rem !important;  /* Adjust as desired */
        line-height: 1 !important;
        }

        /* Optionally adjust the chat input's size if needed */
        #chat-widget .chat-input {
        font-size: 0.875rem !important; /* e.g., ~14px */
        line-height: 1.2 !important;
        }
      `;
        document.head.appendChild(style);
    }

    // Load and initialize widget
    async function loadAndInitializeWidget(container) {
        // Critical: This Vapi credentials object ONLY includes what's needed for voice
        const vapiCredentials = {
            vapiApiKey: "3305f30f-8797-43cf-ade8-652c1ff145ee",
            vapiAssistantId: "491318fa-9f4d-43e8-a6a5-0883057bb0c7"
        };

        return new Promise((resolve) => {
            // Disable auto-init
            window.ChatWidgetAutoInitDisabled = true;

            // Load voice version of widget
            const script = document.createElement('script');
            script.src = `${baseUrl}widget-voice.min.js`;
            script.async = true;
            script.onload = function () {
                if (window.ChatWidget && window.ChatWidget.init) {
                    // Initialize widget with only Vapi credentials
                    const widget = window.ChatWidget.init(vapiCredentials);

                    // Move widget to our container for isolation
                    setTimeout(() => {
                        const widgetElement = document.getElementById('chat-widget');
                        if (widgetElement && widgetElement.parentNode !== container) {
                            container.appendChild(widgetElement);

                            // FIXED: Ensure widget starts closed
                            const chatContainer = widgetElement.querySelector('#chat-container');
                            if (chatContainer) {
                                // Force widget to closed state initially
                                chatContainer.classList.remove('active');
                                
                                // Reset to default state if widget object is available
                                if (widget && widget.widget && typeof widget.widget.toggleChat === 'function') {
                                    // Set the internal state to closed
                                    widget.widget.isOpen = false;
                                }
                            }

                            // Don't add a new click handler at all - rely on the existing one
                            // The original handler in widget-core.js should work correctly
                        }
                    }, 100);

                    resolve(widget);
                } else {
                    console.error('Chat widget failed to load correctly');
                    resolve(null);
                }
            };
            document.body.appendChild(script);
        });
    }

    // Main initialization function
    async function initializeWidget() {
        try {
            const container = createIsolatedContainer();
            await loadFontAwesome();
            await loadWidgetStyles();
            addCompatibilityCSS();
            await loadAndInitializeWidget(container);
        } catch (error) {
            console.error('Error initializing chat widget:', error);
        }
    }

    // Run when the page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWidget);
    } else {
        initializeWidget();
    }
})();




Script for Wordpress

<script>
  // Create a script element
  var script = document.createElement('script');
  script.src = "https://path_to_your_widget_here/widget-loader.js";
  script.async = true;
  
  // Append to head
  document.head.appendChild(script);
</script>


Or one line;

<script src="https://path_to_your_widget_here/widget-loader.js"></script>