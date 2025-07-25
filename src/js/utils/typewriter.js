/**
 * Typewriter Effect
 * 
 * Creates a typing animation effect for text content
 */

// Speed presets (characters per time interval)
const SPEED_PRESETS = {
  verySlow: { chars: 1, delay: 200 },    // ~5 chars per second
  slow: { chars: 1, delay: 100 },        // ~10 chars per second
  normal: { chars: 1, delay: 30 },       // ~33 chars per second
  fast: { chars: 3, delay: 30 },         // ~100 chars per second
  veryFast: { chars: 5, delay: 20 },     // ~250 chars per second
  ultraFast: { chars: 10, delay: 10 }    // ~1000 chars per second
};

/**
 * TypewriterEffect class
 */
export class TypewriterEffect {
  /**
   * Animate text with typewriter effect
   * @param {Object} options - Animation options
   * @param {HTMLElement} options.element - Target element
   * @param {string} options.text - Text to animate
   * @param {string} [options.speed='normal'] - Speed preset
   * @param {number} [options.speedMultiplier=1] - Speed multiplier
   * @param {string} [options.contentSize='regular'] - Content size (regular or large)
   * @param {boolean} [options.useMarkdown=false] - Whether to use markdown
   * @param {Function} [options.onComplete] - Callback when animation completes
   */
  static animate({ 
    element, 
    text, 
    speed = 'normal', 
    speedMultiplier = 1,
    contentSize = 'regular',
    useMarkdown = false,
    onComplete = null
  }) {
    if (!element || !text) return;
    
    // For large content, use a faster speed preset to avoid jerky animations
    if (text.length > 500) {
      speed = 'fast';
      contentSize = 'large';
    }
    
    console.log(`Animating text with typewriter. Length: ${text.length}, speed: ${speed}, useMarkdown: ${useMarkdown}`);
    
    // Clear any existing content
    element.textContent = '';
    
    // Get typing configuration
    const config = TypewriterEffect.getTypingConfig(speed, speedMultiplier, contentSize);
    
    // If markdown is enabled and the library is available, prepare the HTML
    if (useMarkdown && window.marked) {
      try {
        // For markdown content, render the complete content at once
        // This avoids issues with partial markdown parsing
        element.innerHTML = window.marked.parse(text);
        
        // Make all text initially invisible
        const allNodes = TypewriterEffect.getAllTextAndElementNodes(element);
        
        // Hide all content initially
        allNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            // For text nodes, replace with spans for each word
            if (node.textContent.trim()) {
              const words = node.textContent.split(/(\s+)/);
              const fragment = document.createDocumentFragment();
              
              words.forEach(word => {
                const span = document.createElement('span');
                span.textContent = word;
                span.style.opacity = '0';
                fragment.appendChild(span);
              });
              
              node.parentNode.replaceChild(fragment, node);
            }
          } else if (node.nodeType === Node.ELEMENT_NODE && !TypewriterEffect.isInlineElement(node)) {
            // For block elements, hide them
            node.style.opacity = '0';
          }
        });
        
        // Get all hidden spans/elements
        const hiddenElements = element.querySelectorAll('span[style*="opacity: 0"], [style*="opacity: 0"]');
        const elementsArray = Array.from(hiddenElements);
        
        // Reveal elements in sequence
        let index = 0;
        const revealNextElement = () => {
          if (index < elementsArray.length) {
            // Show the next batch of elements (word by word)
            const batchSize = config.charsPerChunk * 3; // Show multiple words at once
            const endIndex = Math.min(index + batchSize, elementsArray.length);
            
            for (let i = index; i < endIndex; i++) {
              elementsArray[i].style.opacity = '1';
              // Add a slight transition for smoother appearance
              elementsArray[i].style.transition = 'opacity 0.1s ease-in-out';
            }
            
            index = endIndex;
            setTimeout(revealNextElement, config.delayBetweenChunks);
          } else {
            // Animation complete
            if (typeof onComplete === 'function') {
              onComplete();
            }
          }
        };
        
        // Start revealing
        setTimeout(revealNextElement, 0);
        
      } catch (error) {
        console.error('Error parsing markdown:', error);
        // Fall back to text-only approach
        TypewriterEffect.animateTextWordByWord(element, text, config, onComplete);
      }
    } else {
      // For plain text, use word-by-word animation
      TypewriterEffect.animateTextWordByWord(element, text, config, onComplete);
    }
  }
  
  /**
   * Animate text word by word
   * @param {HTMLElement} element - Target element
   * @param {string} text - Text to animate
   * @param {Object} config - Animation configuration
   * @param {Function} onComplete - Callback when animation completes
   */
  static animateTextWordByWord(element, text, config, onComplete) {
    // Split text into words
    const words = text.split(/(\s+)/);
    
    let currentIndex = 0;
    
    // Create typing indicator
    const indicator = document.createElement('span');
    indicator.className = 'typing-indicator';
    element.appendChild(indicator);
    
    // Function to add the next batch of words
    const addNextWords = () => {
      if (currentIndex < words.length) {
        // Add multiple words at once for smoother animation
        const wordsPerChunk = Math.max(1, Math.ceil(config.charsPerChunk / 5));
        const endIndex = Math.min(currentIndex + wordsPerChunk, words.length);
        
        const fragment = document.createDocumentFragment();
        for (let i = currentIndex; i < endIndex; i++) {
          const span = document.createElement('span');
          span.textContent = words[i];
          fragment.appendChild(span);
        }
        
        // Insert before the indicator
        element.insertBefore(fragment, indicator);
        
        currentIndex = endIndex;
        
        // Schedule next batch
        setTimeout(addNextWords, config.delayBetweenChunks);
      } else {
        // Animation complete
        indicator.remove();
        
        // Call onComplete callback if provided
        if (typeof onComplete === 'function') {
          onComplete();
        }
      }
    };
    
    // Start typing
    setTimeout(addNextWords, 0);
  }
  
  /**
   * Get all text and element nodes from an element
   * @param {HTMLElement} element - Element to scan
   * @returns {Array} Array of nodes
   */
  static getAllTextAndElementNodes(element) {
    const nodes = [];
    
    const traverse = node => {
      if (node.nodeType === Node.TEXT_NODE) {
        nodes.push(node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        nodes.push(node);
        Array.from(node.childNodes).forEach(traverse);
      }
    };
    
    traverse(element);
    return nodes;
  }
  
  /**
   * Check if an element is an inline element
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} True if inline element
   */
  static isInlineElement(element) {
    const inlineElements = [
      'a', 'span', 'strong', 'em', 'b', 'i', 'code', 'mark', 'small', 'del', 'ins', 'sub', 'sup'
    ];
    return inlineElements.includes(element.tagName.toLowerCase());
  }
  
  /**
   * Get typing configuration based on presets and content size
   * @param {string} speedPreset - Speed preset name
   * @param {number} speedMultiplier - Speed multiplier
   * @param {string} contentSize - Content size (regular or large)
   * @returns {Object} Typing configuration
   */
  static getTypingConfig(speedPreset, speedMultiplier, contentSize) {
    // Start with the selected preset
    let preset = SPEED_PRESETS[speedPreset] || SPEED_PRESETS.normal;
    
    // Adjust based on content length
    if (contentSize === 'large') {
      // For large content, increase speed by using a faster preset
      preset = speedPreset === 'verySlow' || speedPreset === 'slow' 
        ? SPEED_PRESETS.normal 
        : SPEED_PRESETS.fast;
    }
    
    // Apply the speed multiplier
    return {
      charsPerChunk: Math.max(1, Math.round(preset.chars * speedMultiplier)),
      delayBetweenChunks: Math.max(1, Math.round(preset.delay / speedMultiplier))
    };
  }
  
  /**
   * Process markdown text to HTML
   * @param {string} text - Markdown text
   * @returns {string} HTML content
   */
  static processMarkdown(text) {
    if (!window.marked || !text) return text;
    
    try {
      // Configure marked options
      window.marked.setOptions({
        breaks: true,  // Convert \n to <br>
        gfm: true      // GitHub Flavored Markdown
      });
      
      // Convert markdown to HTML
      return window.marked.parse(text);
    } catch (error) {
      console.error('Error processing markdown:', error);
      return text;
    }
  }
}

export default TypewriterEffect;