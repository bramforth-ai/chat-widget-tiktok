/**
 * Style Manager
 * Applies custom styles based on configuration
 */

/**
 * Apply custom styles to the widget
 * @param {HTMLElement} widgetElement - The root widget element
 * @param {Object} config - Widget configuration
 */
export function applyCustomStyles(widgetElement, config) {
  // Apply colors
  applyColors(widgetElement, config.colors);
  
  // Apply sizes
  applySizes(widgetElement, config.size);
  
  // Apply position
  applyPosition(widgetElement, config.position);
}

/**
 * Apply custom colors to the widget
 * @param {HTMLElement} element - Target element
 * @param {Object} colors - Custom colors
 */
function applyColors(element, colors) {
  if (!colors) return;
  
  // Map all color properties to CSS variables
  const colorMap = {
    // Basic colors
    primaryColor: '--primary-color',
    primaryHover: '--primary-hover',
    accentColor: '--accent-color',
    accentHover: '--accent-hover',
    textLight: '--text-light',
    textDark: '--text-dark',
    bgLight: '--bg-light',
    bgWhite: '--bg-white',
    borderColor: '--border-color',
    
    // Message specific colors
    assistantMessageBg: '--assistant-message-bg',
    assistantMessageText: '--assistant-message-text',
    userMessageBg: '--user-message-bg',
    userMessageText: '--user-message-text',
    systemMessageBg: '--system-message-bg',
    systemMessageText: '--system-message-text',
    
    // UI element colors
    loadingIndicator: '--loading-indicator-color',
    links: '--link-color'
  };
  
  // Apply each color
  Object.entries(colors).forEach(([key, value]) => {
    const cssVar = colorMap[key];
    if (cssVar && value) {
      element.style.setProperty(cssVar, value);
    }
  });
}

/**
 * Apply custom sizes to the widget
 * @param {HTMLElement} element - Target element
 * @param {Object} size - Size settings
 */
function applySizes(element, size) {
  if (!size) return;
  
  const sizeMap = {
    width: '--widget-width',
    maxWidth: '--widget-max-width',
    height: '--widget-height',
    maxHeight: '--widget-max-height',
    buttonSize: '--button-size'
  };
  
  Object.entries(size).forEach(([key, value]) => {
    const cssVar = sizeMap[key];
    if (cssVar && value) {
      element.style.setProperty(cssVar, value);
    }
  });
}

/**
 * Apply position to the widget
 * @param {HTMLElement} element - Widget element
 * @param {string} position - Position preset
 */
function applyPosition(element, position) {
  if (!position) return;
  
  // Reset position variables
  element.style.setProperty('--position-top', 'auto');
  element.style.setProperty('--position-right', 'auto');
  element.style.setProperty('--position-bottom', 'auto');
  element.style.setProperty('--position-left', 'auto');
  
  // Apply new position
  switch (position) {
    case 'bottom-left':
      element.style.setProperty('--position-bottom', '1rem');
      element.style.setProperty('--position-left', '1rem');
      break;
    case 'top-right':
      element.style.setProperty('--position-top', '1rem');
      element.style.setProperty('--position-right', '1rem');
      break;
    case 'top-left':
      element.style.setProperty('--position-top', '1rem');
      element.style.setProperty('--position-left', '1rem');
      break;
    case 'bottom-right':
    default:
      element.style.setProperty('--position-bottom', '1rem');
      element.style.setProperty('--position-right', '1rem');
      break;
  }
}

export default { applyCustomStyles };