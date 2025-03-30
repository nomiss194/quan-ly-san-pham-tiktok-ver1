// ==================================
// --- Image Handling Module ---
// Handles pasting image from clipboard and uploading image file
// ==================================
import { fetchApi } from './api.js'; // Import fetchApi


// Handle image paste event
export async function handleImagePaste(event, inputElementId, previewElementId) {
  const items = (event.clipboardData || event.originalEvent.clipboardData)?.items;
  if (!items) return;

  const inputElement = document.getElementById(inputElementId);
  const previewElement = document.getElementById(previewElementId);

  if (!inputElement || !previewElement) return;

  for (const item of items) {
    if (item.type.indexOf('image') !== -1) {
      const blob = item.getAsFile();
      if (blob) {
        event.preventDefault(); // Prevent default paste behavior

        // Show a temporary loading state (optional)
        previewElement.src = '/images/loading.gif'; // Replace with your loading indicator path
        previewElement.classList.remove('hidden');
        inputElement.disabled = true; // Disable input while uploading

        const formData = new FormData();
        // Append the blob as a file. Provide a filename.
        formData.append('imageFile', blob, 'pasted-image.png');

        try {
          const response = await fetchApi('/api/upload/image', {
            method: 'POST',
            body: formData,
            // Headers are automatically set for FormData by fetch
          });

          if (response && response.success && response.imageUrl) {
            inputElement.value = response.imageUrl; // Set input value to the uploaded image URL
            previewElement.src = response.imageUrl; // Update preview
            console.log('Image pasted and uploaded successfully:', response.imageUrl);
          } else {
            throw new Error(response?.message || 'Image upload failed.');
          }
        } catch (error) {
          console.error('Error uploading pasted image:', error);
          alert(`Failed to upload pasted image: ${error.message}`);
          // Clear preview on error
          previewElement.src = '#';
          previewElement.classList.add('hidden');
          inputElement.value = ''; // Clear input value
        } finally {
          inputElement.disabled = false; // Re-enable input
        }
        return; // Handle only the first image found
      }
    }
  }
}

// Handle image file upload event
export async function handleImageUpload(event, inputElementId, previewElementId) { // Make async
    const file = event.target.files?.[0];
    if (!file) return;

    const inputElement = document.getElementById(inputElementId);
    const previewElement = document.getElementById(previewElementId);

    if (!inputElement || !previewElement) return;

    // Show a temporary loading state (optional)
    previewElement.src = '/images/loading.gif'; // Replace with your loading indicator path
    previewElement.classList.remove('hidden');
    inputElement.disabled = true; // Disable input while uploading
    event.target.disabled = true; // Disable file input button

    const formData = new FormData();
    formData.append('imageFile', file); // Append the file directly

    try {
      const response = await fetchApi('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (response && response.success && response.imageUrl) {
        inputElement.value = response.imageUrl; // Set input value to the uploaded image URL
        previewElement.src = response.imageUrl; // Update preview
        console.log('Image uploaded successfully:', response.imageUrl);
      } else {
        throw new Error(response?.message || 'Image upload failed.');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Failed to upload image: ${error.message}`);
      // Clear preview on error
      previewElement.src = '#';
      previewElement.classList.add('hidden');
      inputElement.value = ''; // Clear input value
    } finally {
      inputElement.disabled = false; // Re-enable input
      event.target.disabled = false; // Re-enable file input button
      event.target.value = ''; // Clear the file input so the same file can be selected again if needed
    }
}