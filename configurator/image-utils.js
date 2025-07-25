// Utility functions for image processing

/**
 * Handle image file upload
 * @param {string} iconName - The name of the icon (button or assistant)
 * @param {Event} event - The file input change event
 */
function handleImageUpload(iconName, event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const previewElement = document.getElementById(`${iconName}-image-preview`);
  const urlInput = document.getElementById(`${iconName}-image-url`);
  
  // Check file size (max 1MB)
  if (file.size > 1024 * 1024) {
    previewElement.innerHTML = '<div class="preview-placeholder">Image too large (max 1MB)</div>';
    event.target.value = ''; // Clear the file input
    return;
  }
  
  // Show loading state
  previewElement.innerHTML = '<div class="preview-placeholder">Processing image...</div>';
  
  // Read and process the image
  const reader = new FileReader();
  
  reader.onload = function(e) {
    const base64Image = e.target.result;
    
    // Resize the image
    resizeImage(base64Image, 128, 128)
      .then(resizedImage => {
        // Update URL input with base64 data
        urlInput.value = resizedImage;
        
        // Update preview
        previewElement.innerHTML = '';
        const img = document.createElement('img');
        img.src = resizedImage;
        img.alt = `${iconName} icon`;
        previewElement.appendChild(img);
      })
      .catch(error => {
        console.error('Error resizing image:', error);
        previewElement.innerHTML = '<div class="preview-placeholder">Error processing image</div>';
      });
  };
  
  reader.onerror = function() {
    previewElement.innerHTML = '<div class="preview-placeholder">Error reading file</div>';
  };
  
  reader.readAsDataURL(file);
}

/**
 * Resize an image to specified dimensions
 * @param {string} base64Image - Base64 encoded image data
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} maxHeight - Maximum height in pixels
 * @returns {Promise<string>} Resized base64 image data
 */
function resizeImage(base64Image, maxWidth, maxHeight) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = function() {
      // Calculate the new dimensions
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      // Create a canvas for resizing
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Draw the resized image
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Get the resized base64 data
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = function() {
      reject(new Error('Failed to load image'));
    };
    
    img.src = base64Image;
  });
}