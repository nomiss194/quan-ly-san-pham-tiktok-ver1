// ==================================
// --- Product Event Handlers Module ---
// ==================================

import {
    addVideoLog,
    getVideoLogForDate,
    deleteProduct as deleteProductApi, // Rename to avoid conflict
    updateProduct,
    fetchApi // Needed for fetching product details for inline tag editing
} from './api.js';
import { loadProductsList } from './dataLoaders.js'; // Assuming loadProductsList will be here
import { renderDashboardStats } from './uiRender.js'; // Assuming renderDashboardStats is here
import { openEditModal } from './modal.js'; // Assuming openEditModal is here


// Import Tagify (assuming it's globally available)
// import Tagify from '@yaireo/tagify'; // Uncomment if using npm module

import {
    fetchAllTags,
    // addProductTag, // Handled by updateProduct with tags array
    // removeProductTag // Handled by updateProduct with tags array
    // updateProductNotes // Assuming updateProduct can handle notes
} from './api.js';

// Store fetched tags to avoid refetching
let allTagsWhitelist = [];

// Safe JSON serialization helper to prevent issues with HTML attributes
function safeJSONStringify(obj) {
    if (!obj) return '[]';
    try {
        // Ensure we're working with valid tag objects
        const sanitizedObj = Array.isArray(obj) ? obj.filter(Boolean).map(tag => {
            // Only include valid properties
            return {
                id: tag.id,
                name: tag.name || '',
                color: tag.color || ''
            };
        }) : [];
        return JSON.stringify(sanitizedObj);
    } catch (error) {
        console.error('Error stringifying tags:', error);
        return '[]';
    }
}

// Safe JSON parse helper to prevent "undefined" is not valid JSON errors
function safeJSONParse(jsonString, defaultValue = []) {
    // Debug the input value to identify problematic strings
    // console.log('Attempting to parse JSON string:', JSON.stringify(jsonString));

    // Handle undefined, null, empty strings, or literal "undefined" string
    if (jsonString === undefined ||
        jsonString === null ||
        jsonString === '' ||
        jsonString === 'undefined' ||
        jsonString === 'null') {
        // console.log('Invalid JSON input detected, using default value:', defaultValue);
        return defaultValue;
    }

    try {
        const parsed = JSON.parse(jsonString);
        // console.log('Successfully parsed JSON:', parsed);
        return parsed;
    } catch (error) {
        console.error('JSON parsing error:', error.message, 'for input:', jsonString);
        return defaultValue;
    }
}

// Helper function to determine text color based on background hex color
// (Ensure this is defined before it's used in Tagify templates)
function getContrastYIQ(hexcolor){
    if (!hexcolor) return '#000000';
    hexcolor = hexcolor.replace("#", "");
    const r = parseInt(hexcolor.substr(0,2),16);
    const g = parseInt(hexcolor.substr(2,2),16);
    const b = parseInt(hexcolor.substr(4,2),16);
    const yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
}


// --- Inline Editing Handlers ---

async function handleInlineNotesUpdate(event) {
    const textarea = event.target;
    const productId = textarea.dataset.productId;
    const originalValue = textarea.dataset.originalValue || '';
    const newValue = textarea.value;

    if (!productId) return;

    // Only save if value actually changed
    if (newValue !== originalValue) {
        console.log(`Updating notes for product ${productId}...`);
        try {
            textarea.disabled = true; // Prevent further edits while saving
            textarea.classList.add('opacity-50'); // Visual feedback
            await updateProduct(productId, { notes: newValue });
            textarea.dataset.originalValue = newValue; // Update original value on success
            console.log(`Notes updated for product ${productId}`);
            // Optional: Add success visual feedback (e.g., green border briefly)
            textarea.classList.add('border-green-500');
            setTimeout(() => textarea.classList.remove('border-green-500'), 1000);
        } catch (error) {
            console.error(`Failed to update notes for product ${productId}:`, error);
            alert(`Error saving notes: ${error.message}`);
            // Optionally revert to original value
            // textarea.value = originalValue;
            textarea.classList.add('border-red-500');
             setTimeout(() => textarea.classList.remove('border-red-500'), 1000);
        } finally {
            textarea.disabled = false;
            textarea.classList.remove('opacity-50');
        }
    }
}

// Function to initialize Tagify and Notes listeners within a given container
export async function initializeInlineEditing(containerElement) {
    console.log('Initializing inline editing for container:', containerElement);

    // 1. Fetch all tags for whitelist (if not already fetched)
    if (allTagsWhitelist.length === 0) {
        try {
            const tags = await fetchAllTags();
            // Map to the format Tagify expects for whitelist: [{id: 1, value: 'TagName', color: '#hex'}, ...]
            allTagsWhitelist = tags.map(tag => ({ id: tag.id, value: tag.name, color: tag.color }));
            console.log('Fetched tags for whitelist:', allTagsWhitelist);
        } catch (error) {
            console.error('Failed to fetch tags for inline editing whitelist:', error);
            // Proceed without whitelist? Or show error?
            alert('Could not load tags for editing. Please try refreshing.');
            return; // Stop initialization if tags failed to load
        }
    }

    // 2. Initialize Tagify for all tag inputs in the container
    const tagInputs = containerElement.querySelectorAll('.inline-tagify-input');
    console.log(`Found ${tagInputs.length} tag inputs to initialize in container`);

    tagInputs.forEach((input, index) => {
        // Avoid re-initializing if already done
        if (input.tagify) {
            // console.log(`Skipping already initialized tag input #${index}`);
            return;
        }

        const productId = input.dataset.productId;
        // console.log(`Initializing tag input #${index} for product ID: ${productId}`);

        // Parse initial tags from the original data stored during render
        let initialTags = [];
        const tagsDataValue = input.dataset.originalTags;
        // console.log(`Original tags data for product ${productId}:`, tagsDataValue, typeof tagsDataValue);

        initialTags = safeJSONParse(tagsDataValue, []);
        // console.log(`Parsed initial tags for product ${productId}:`, initialTags);

        const tagify = new Tagify(input, {
            whitelist: allTagsWhitelist,
            dropdown: {
                maxItems: 20,
                enabled: 0, // Show suggestions on focus
                closeOnSelect: false // Allow multiple selections
            },
            enforceWhitelist: false, // Allow creating new tags (if backend supports it)
            // Add custom styling for tags based on color
            templates: {
                tag: function(tagData) {
                    // *** DEBUG LOG ***
                    console.log('[Tagify Template] Rendering tag with data:', tagData);
                    // *** END DEBUG LOG ***
                    const bgColor = tagData.color || '#cccccc'; // Use tag color or default gray
                    const textColor = getContrastYIQ(bgColor); // Calculate contrast color (getContrastYIQ must be defined in scope)
                    return `<tag title="${tagData.value}" contenteditable='false' spellcheck='false' tabIndex="-1" class="${this.settings.classNames.tag} ${tagData.class ? tagData.class : ""}" ${this.getAttributes(tagData)} style="--tag-bg:${bgColor}; --tag-text-color:${textColor};">
                            <x class="${this.settings.classNames.tagX}" role='button' aria-label='remove tag'></x>
                            <div>
                                <span class="tagify__tag-text">${tagData.value}</span>
                            </div>
                        </tag>`;
                }
            }
        });

        // Handler for saving tags on blur
        async function handleInlineTagBlur(e) {
            // console.log('[handleInlineTagBlur] Blur event triggered.');
            const tagify = e.detail?.tagify;
            if (!tagify) {
                console.error('[handleInlineTagBlur] Could not find Tagify instance from event detail.');
                return;
            }
            const inputEl = tagify.DOM.originalInput;
            if (!inputEl) {
                console.error('[handleInlineTagBlur] Could not find original input element.');
                return;
            }
            const productId = inputEl.dataset.productId;
            if (!productId) {
                console.error('[handleInlineTagBlur] Missing productId.');
                return;
            }

            // console.log('[handleInlineTagBlur] Found Tagify instance and productId:', { productId });

            try {
                // Get complete product data to ensure we have ALL current tags
                const completeProduct = await fetchApi(`/api/products/${productId}`);
                if (!completeProduct) {
                    console.error('[handleInlineTagBlur] Failed to fetch complete product data.');
                    return;
                }

                const currentTagData = tagify.value; // Tags currently in the input
                // console.log('[handleInlineTagBlur] Current tag data from Tagify:', currentTagData);
                const currentTagNames = currentTagData.map(t => t.value);

                const originalTagsData = safeJSONParse(inputEl.dataset.originalTags, []);
                const originalTagNames = originalTagsData.map(t => t.value);
                // console.log('[handleInlineTagBlur] Original tag names from dataset:', originalTagNames);

                // Determine changes
                const tagsToAdd = currentTagNames.filter(name => !originalTagNames.includes(name));
                const tagsToRemove = originalTagNames.filter(name => !currentTagNames.includes(name));

                // console.log(`[handleInlineTagBlur] Tag changes for product ${productId}:`, { toAdd: tagsToAdd, toRemove: tagsToRemove });

                if (tagsToAdd.length > 0 || tagsToRemove.length > 0) {
                    try {
                        inputEl.disabled = true;
                        tagify.loading(true);

                        // Construct the final list of tag names to send to the backend
                        const finalTagNames = currentTagNames; // Send the current state

                        console.log(`[handleInlineTagBlur] Updating product ${productId} with tags:`, finalTagNames);
                        await updateProduct(productId, { tags: finalTagNames });

                        // Update the originalTags dataset with the new state AFTER successful save
                        const updatedProduct = await fetchApi(`/api/products/${productId}`); // Re-fetch to get IDs and confirm state
                        if (updatedProduct && updatedProduct.Tags) {
                            const newTagsJson = safeJSONStringify(updatedProduct.Tags);
                            inputEl.dataset.originalTags = newTagsJson;
                            console.log(`Tags saved successfully for product ${productId}. New originalTags:`, newTagsJson);
                            // Optionally re-render tagify if needed, though usually not necessary if names match
                            // tagify.loadOriginalValues(updatedProduct.Tags.map(t => t.name));
                        } else {
                             console.warn(`Could not verify tag save for product ${productId}, originalTags dataset might be stale.`);
                             inputEl.dataset.originalTags = safeJSONStringify(currentTagData.map(t => ({name: t.value}))); // Update with current names as fallback
                        }


                        inputEl.classList.add('border-green-500');
                        setTimeout(() => inputEl.classList.remove('border-green-500'), 1000);

                    } catch (error) {
                        console.error(`Failed to update tags for product ${productId}:`, error);
                        alert(`Error saving tags: ${error.message}`);
                        // Revert Tagify to original state
                        tagify.loadOriginalValues(originalTagNames); // Revert to names from dataset
                        inputEl.classList.add('border-red-500');
                        setTimeout(() => inputEl.classList.remove('border-red-500'), 1000);
                    } finally {
                        inputEl.disabled = false;
                        tagify.loading(false);
                    }
                } else {
                    // console.log(`[handleInlineTagBlur] No tag changes detected for product ${productId}`);
                }
            } catch (error) {
                console.error(`Failed to fetch complete data for product ${productId}:`, error);
                alert(`Error fetching product data: ${error.message}`);
            }
        }

        tagify.on('blur', handleInlineTagBlur);

        input.tagify = tagify; // Mark as initialized
        // console.log(`Successfully initialized tagify for product ${productId}`);
    });

    // 3. Add listeners for notes textareas
    const noteTextareas = containerElement.querySelectorAll('.inline-notes-textarea');
    noteTextareas.forEach(textarea => {
        // Avoid adding listeners multiple times
        if (textarea.dataset.inlineListenersAttached) return;

        textarea.addEventListener('blur', handleInlineNotesUpdate);
        textarea.addEventListener('keydown', (event) => {
            // Save on Enter (Cmd/Ctrl + Enter might be better to allow newlines)
            if (event.key === 'Enter' && !event.shiftKey) { // Save on Enter only
                event.preventDefault(); // Prevent newline
                handleInlineNotesUpdate(event); // Trigger save
                textarea.blur(); // Remove focus
            }
        });
        textarea.dataset.inlineListenersAttached = 'true'; // Mark as attached
    });
}


// Handler for saving video log
export async function handleAddVideoLog(productId, dateElement, countElement) {
    const date = dateElement.value;
    const count = parseInt(countElement.value);

    if (!date || count === undefined || count < 0) {
        alert('Please enter a valid date and a non-negative count.');
        return;
    }

    try {
        await addVideoLog(productId, date, count);
        alert(`Log saved: ${count} videos for ${date}.`);
        loadProductsList(); // Refresh product list
        if (window.location.pathname === '/') renderDashboardStats(); // Refresh dashboard if visible
    } catch (error) {
        alert(error.message || 'Failed to add video log.');
    }
}

// Handler for date change to fetch existing count
export async function handleVideoLogDateChange(productId, dateElement, countElement) {
    const date = dateElement.value;
    if (!date) {
        countElement.value = '';
        return;
    }
    try {
        const log = await getVideoLogForDate(productId, date);
        countElement.value = log?.count || '';
    } catch (error) {
        console.error(`Failed to get video log for ${date}:`, error);
        countElement.value = '';
    }
}

// Handler for soft deleting a product
export async function handleDeleteProduct(productId) {
    if (!confirm('Bạn có chắc chắn muốn chuyển sản phẩm này vào thùng rác?')) return;
    try {
        await deleteProductApi(productId); // Use renamed API function
        await loadProductsList(); // Refresh product list
        if (window.location.pathname === '/') renderDashboardStats(); // Refresh dashboard if visible
        alert('Sản phẩm đã được chuyển vào thùng rác.');
    } catch (error) {
        alert(error.message || 'Failed to delete product.');
    }
}

// --- Event Delegation Handler for Products List (Table and Cards) ---
// This single handler manages clicks on various buttons/elements within the product list container
export async function handleProductListActions(event) {
    const target = event.target; // Define target first
    // console.log('[handleProductListActions] Click detected. Target:', target); // Log removed

    // Find the closest relevant element (button, span, or the card/row itself for context)
    const actionButton = target.closest('button[data-action]');
    const actionSpan = target.closest('span[data-action]');
    const actionElement = actionButton || actionSpan;

    if (!actionElement) return; // Exit if the click wasn't on an actionable element

    const action = actionElement.dataset.action;
    const productItem = target.closest('tr[data-product-id], div.product-card[data-product-id]'); // Find parent row or card
    const productId = productItem?.dataset.productId;
    // console.log('[handleProductListActions] Action element found:', actionElement, 'Action:', action, 'ProductId:', productId); // Log removed

    if (!productId) {
        console.warn("Could not find product ID for action:", action, target);
        return;
    }

    // --- Action Handlers ---
    if (action === 'edit') {
        openEditModal(productId);
    }
    else if (action === 'delete') {
        handleDeleteProduct(productId);
    }
    else if (action === 'save-video-log') {
        // This action only exists in the table view
        const dateInput = productItem.querySelector('.video-log-date');
        const countInput = productItem.querySelector('.video-log-count');
        if (dateInput && countInput) {
            handleAddVideoLog(productId, dateInput, countInput);
        } else {
             console.error("Could not find date/count inputs for save-video-log in:", productItem);
        }
    }
    else if (action === 'toggle-purchase') {
        const currentStatus = actionElement.dataset.currentStatus === 'true';
        const newStatus = !currentStatus;
        try {
            await updateProduct(productId, { purchased: newStatus });
            // Update both table cell and card badge if they exist
            const statusElements = document.querySelectorAll(`[data-product-id="${productId}"] [data-action="toggle-purchase"]`);
            statusElements.forEach(el => {
                el.textContent = newStatus ? 'Đã mua' : 'Đang chờ';
                el.dataset.currentStatus = newStatus;
                el.classList.remove(
                    currentStatus ? 'bg-green-100' : 'bg-yellow-100',
                    currentStatus ? 'text-green-800' : 'text-yellow-800',
                    currentStatus ? 'hover:bg-green-200' : 'hover:bg-yellow-200'
                );
                el.classList.add(
                    newStatus ? 'bg-green-100' : 'bg-yellow-100',
                    newStatus ? 'text-green-800' : 'text-yellow-800',
                    newStatus ? 'hover:bg-green-200' : 'hover:bg-yellow-200'
                );
            });

            if (window.location.pathname === '/') renderDashboardStats();
        } catch (error) {
            alert(error.message || 'Failed to update status');
        }
    }
    else if (action === 'toggle-actions-menu') {
        // Specific to card view
        const menu = productItem.querySelector('.card-actions-menu');
        if (menu) {
            menu.classList.toggle('hidden');
        }
    }
}