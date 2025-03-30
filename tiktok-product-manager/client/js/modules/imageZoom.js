// ==================================
// --- Image Zoom Module ---
// Handles zooming product images in a modal overlay
// ==================================

// Create the zoom modal once when module loads
function createZoomModal() {
    // Check if modal already exists
    if (document.getElementById('image-zoom-modal')) {
        return;
    }

    // Create modal elements
    const modal = document.createElement('div');
    modal.id = 'image-zoom-modal';
    modal.classList.add(
        'fixed', 'inset-0', 'z-50', 'hidden', 'flex', 'items-center', 
        'justify-center', 'bg-black', 'bg-opacity-80'
    );

    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.classList.add('max-w-[90%]', 'max-h-[90%]', 'relative');

    // Create the zoomed image element
    const image = document.createElement('img');
    image.id = 'zoomed-image';
    image.classList.add('max-w-full', 'max-h-[85vh]', 'object-contain');
    image.alt = 'Zoomed product image';

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.id = 'zoom-close-btn';
    closeButton.classList.add(
        'absolute', 'top-0', 'right-0', 'bg-gray-800', 'text-white',
        'rounded-full', 'p-2', 'transform', 'translate-x-1/2', '-translate-y-1/2'
    );
    closeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

    // Assemble the modal
    imageContainer.appendChild(image);
    imageContainer.appendChild(closeButton);
    modal.appendChild(imageContainer);

    // Append to body
    document.body.appendChild(modal);

    // Add event listeners
    closeButton.addEventListener('click', closeZoomModal);
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeZoomModal();
        }
    });
    
    // Add keyboard listener to close on Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeZoomModal();
        }
    });
}

// Open zoom modal with a specific image
export function openZoomModal(imageUrl) {
    // Ensure modal exists
    createZoomModal();
    
    const modal = document.getElementById('image-zoom-modal');
    const zoomedImage = document.getElementById('zoomed-image');
    
    if (!modal || !zoomedImage) return;
    
    // Set image source and display modal
    zoomedImage.src = imageUrl;
    modal.classList.remove('hidden');
    
    // Prevent body scrolling when modal is open
    document.body.classList.add('overflow-hidden');
}

// Close zoom modal
export function closeZoomModal() {
    const modal = document.getElementById('image-zoom-modal');
    if (!modal) return;
    
    modal.classList.add('hidden');
    
    // Re-enable body scrolling
    document.body.classList.remove('overflow-hidden');
}

// Initialize click listeners for product images
export function initImageZoomListeners() {
    // Create modal if it doesn't exist
    createZoomModal();
    
    // Add click handlers to product images in product cards and tables
    document.querySelectorAll('.product-image').forEach(img => {
        // Only add listener if not already added
        if (!img.dataset.zoomInitialized) {
            img.addEventListener('click', function() {
                // Get full resolution image URL (could be same as src)
                const imageUrl = img.src || img.dataset.fullImageUrl;
                if (imageUrl) {
                    openZoomModal(imageUrl);
                }
            });
            
            // Mark as initialized to prevent duplicate listeners
            img.dataset.zoomInitialized = 'true';
            
            // Add visual cue that image is clickable
            img.classList.add('cursor-pointer');
            img.title = 'Click to zoom';
        }
    });
    
    // Add click handlers to product image previews in modals
    ['product-image-preview', 'edit-product-image-preview'].forEach(id => {
        const preview = document.getElementById(id);
        if (preview && !preview.dataset.zoomInitialized) {
            preview.addEventListener('click', function() {
                if (!preview.classList.contains('hidden')) {
                    openZoomModal(preview.src);
                }
            });
            preview.dataset.zoomInitialized = 'true';
            preview.classList.add('cursor-pointer');
            preview.title = 'Click to zoom';
        }
    });
}