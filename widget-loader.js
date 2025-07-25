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

    // Add basic compatibility CSS
    function addCompatibilityCSS() {
        const style = document.createElement('style');
        style.textContent = `
        /* Container needs to allow pointer events */
        #chat-widget-container {
          pointer-events: auto !important;
        }
      `;
        document.head.appendChild(style);
    }

    // Load and initialize widget
    async function loadAndInitializeWidget(container) {
        // Only pass the essential credentials
        const elevenLabsConfig = {
            elevenLabsAgentId: "6OFeXYiQ86ij4TkiYiy6"
        };

        return new Promise((resolve) => {
            // Disable auto-init
            window.ChatWidgetAutoInitDisabled = true;

            // Load the widget script
            const script = document.createElement('script');
            script.src = `${baseUrl}widget-elevenlabs.min.js`;
            script.async = true;
            script.onload = function () {
                if (window.ChatWidget && window.ChatWidget.init) {
                    // Initialize widget with minimal configuration
                    const widget = window.ChatWidget.init(elevenLabsConfig);

                    // Move widget to our container for isolation
                    setTimeout(() => {
                        const widgetElement = document.getElementById('chat-widget');
                        if (widgetElement && widgetElement.parentNode !== container) {
                            container.appendChild(widgetElement);

                            // Ensure widget starts closed
                            const chatContainer = widgetElement.querySelector('.chat-container');
                            if (chatContainer) {
                                chatContainer.classList.remove('active');
                                
                                if (widget && widget.widget && typeof widget.widget.toggleChat === 'function') {
                                    widget.widget.isOpen = false;
                                }
                            }
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