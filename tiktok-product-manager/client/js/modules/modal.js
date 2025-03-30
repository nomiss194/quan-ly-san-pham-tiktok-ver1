// ==================================
// --- Modal Handling Module ---
// ==================================

import { fetchApi } from './api.js'; // Needed for openEditModal, openEditGoalModal
import { fetchAllTags } from './api.js'; // Needed for Tagify whitelist


// Import date range handler from filterHandlers
import { handleDateRangeClick } from './filterHandlers.js';

// --- Tagify Instances --- 
let addProductTagifyInstance = null;
let editProductTagifyInstance = null;

// --- Helper to initialize Tagify --- 
async function initializeTagify(inputId, initialTags = []) {
    const input = document.getElementById(inputId);
    if (!input) {
        console.error(`Tagify input element #${inputId} not found.`);
        return null;
    }

    // Destroy previous instance if exists
    if (inputId === 'add-product-tags-input' && addProductTagifyInstance) {
        addProductTagifyInstance.destroy();
        addProductTagifyInstance = null;
    } else if (inputId === 'edit-product-tags-input' && editProductTagifyInstance) {
        editProductTagifyInstance.destroy();
        editProductTagifyInstance = null;
    }

    let tagWhitelist = [];
    try {
        const tags = await fetchAllTags();
        tagWhitelist = tags.map(tag => tag.name);
    } catch (error) {
        console.error("Failed to fetch tags for Tagify whitelist:", error);
        // Continue without whitelist if fetch fails
    }

    const tagify = new Tagify(input, {
        whitelist: tagWhitelist,
        dropdown: {
            maxItems: 20,
            classname: "tags-look", // Optional: Class for dropdown styling
            enabled: 0, // Show suggestions on focus
            closeOnSelect: false // Keep dropdown open after selection
        },
        // Optional: Add settings for styling, duplicates, etc.
        // enforceWhitelist: true, // Uncomment if you only want tags from the list
    });

    // Load initial tags if provided (for edit modal)
    if (initialTags.length > 0) {
        tagify.loadOriginalValues(initialTags);
    }

    // Store the instance
    if (inputId === 'add-product-tags-input') {
        addProductTagifyInstance = tagify;
    } else if (inputId === 'edit-product-tags-input') {
        editProductTagifyInstance = tagify;
    }

    return tagify;
}

import { addCategoryGoalInput } from './goalHandlers.js'; // Assuming this will be in goalHandlers.js

// Generic function to open a modal
export function openModal(modalId) {
    console.log(`[modal.js] openModal called with ID: ${modalId}`); // DEBUG LOG

    // console.log(`[modal.js] openModal called with ID: ${modalId}`); // DEBUG LOG removed

    // console.log(`openModal called with ID: ${modalId}`); // DEBUG
    const modal = document.getElementById(modalId);
    // console.log('Modal element found:', modal); // DEBUG
    if (modal) {
        // console.log(`[modal.js] Found modal element:`, modal); // DEBUG LOG removed

        modal.classList.remove('hidden');

        // Initialize Tagify for product modals
        if (modalId === 'add-product-modal') {
            initializeTagify('add-product-tags-input');
        }
        // Attach listener for date quick select buttons when filter modal opens
        if (modalId === 'filter-modal') {
            const dateQuickSelectContainer = modal.querySelector('#date-quick-select');
            dateQuickSelectContainer?.addEventListener('click', handleDateRangeClick);
        }
        // Note: Tagify for edit modal is initialized in openEditModal

        // Re-initialize icons within the modal if needed (assuming lucide is global)
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } else {
        console.error(`Modal with ID ${modalId} not found!`);
    }
}

// Generic function to close a modal and reset its form/previews
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        const form = modal.querySelector('form');
        if (form) form.reset();
        const previews = modal.querySelectorAll('img[id$="-image-preview"]');
        previews.forEach(p => {
            p.src = ''; // Clear src
            p.classList.add('hidden');
        });
        // Reset category goal inputs if it's a goal modal
        const categoryContainer = modal.querySelector('[id$="-category-goals-container"]');
        if (categoryContainer) {
             categoryContainer.querySelectorAll('.category-goal-item').forEach(item => item.remove());
        }

        // Destroy Tagify instances if closing product modals
        if (modalId === 'add-product-modal' && addProductTagifyInstance) {
            addProductTagifyInstance.destroy();
            addProductTagifyInstance = null;
        } else if (modalId === 'edit-product-modal' && editProductTagifyInstance) {
            editProductTagifyInstance.destroy();
            editProductTagifyInstance = null;
        }

        // Detach listener and reset date buttons when filter modal closes
        if (modalId === 'filter-modal') {
            const dateQuickSelectContainer = modal.querySelector('#date-quick-select');
            dateQuickSelectContainer?.removeEventListener('click', handleDateRangeClick);
            // Reset active state of date buttons
            dateQuickSelectContainer?.querySelectorAll('.date-range-btn').forEach(btn => {
                btn.classList.remove('bg-blue-100', 'border-blue-300');
            });
        }
    }
}

// Specific function to open and populate the Edit Product modal
export async function openEditModal(productId) { // Make async to await initializeTagify
    try {
        const product = await fetchApi(`/api/products/${productId}`);
        if (!product) {
            console.error('Không tìm thấy sản phẩm hoặc lỗi API');
            alert('Tải chi tiết sản phẩm thất bại.');
            return;
        }
        // Populate common fields
        document.getElementById('edit-product-id').value = product.id;
        document.getElementById('edit-product-url').value = product.url;
        document.getElementById('edit-product-image-url').value = product.image_url || '';
        document.getElementById('edit-product-notes').value = product.notes || '';
        // document.getElementById('edit-product-tags').value = product.Tags ? product.Tags.map(t => t.name).join(', ') : ''; // Old tag input handling removed
        document.getElementById('edit-product-purchased').value = product.purchased ? 'true' : 'false';

        // Initialize Tagify with current product tags
        const initialTags = product.Tags ? product.Tags.map(t => t.name) : [];
        await initializeTagify('edit-product-tags-input', initialTags);

        // Handle image preview
            const previewElement = document.getElementById('edit-product-image-preview');
            if (previewElement) {
                if (product.image_url) {
                    previewElement.src = product.image_url;
                    previewElement.classList.remove('hidden');
                } else {
                    previewElement.src = '';
                    previewElement.classList.add('hidden');
                }
            }
            openModal('edit-product-modal');
    } catch (err) { // Correct catch block for the try starting at line 113
        console.error("Error loading product details:", err);
        alert(`Failed to load product details: ${err.message}`);
    }
}

// Helper function to populate goal forms (Add or Edit)
export function populateGoalForm(goal = null) {
    const prefix = goal ? 'edit-' : '';
    const idInput = document.getElementById(`${prefix}goal-id`);
    const monthSelect = document.getElementById(`${prefix}goal-month`);
    const yearInput = document.getElementById(`${prefix}goal-year`);
    const productInput = document.getElementById(`${prefix}goal-product`);
    const videoInput = document.getElementById(`${prefix}goal-video`);
    const categoryContainer = document.getElementById(`${prefix}category-goals-container`);
    const monthDisplay = document.getElementById('edit-goal-month-display'); // Only for edit

    if (!goal) { // Populating Add form
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        if (monthSelect) {
            monthSelect.innerHTML = '';
            for (let i = 1; i <= 12; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = new Date(currentYear, i - 1, 1).toLocaleString('default', { month: 'long' });
                if (i === currentMonth) option.selected = true;
                monthSelect.appendChild(option);
            }
        }
        if (yearInput) yearInput.value = currentYear;
        if (productInput) productInput.value = 0;
        if (videoInput) videoInput.value = 0;
    } else { // Populating Edit form
        if (idInput) idInput.value = goal.id;
        if (monthDisplay) monthDisplay.value = new Date(goal.year, goal.month - 1, 1).toLocaleString('default', { month: 'long' });
        // Assuming edit-goal-month is a hidden input in the edit form
        const hiddenMonthInput = document.getElementById('edit-goal-month');
        if (hiddenMonthInput) hiddenMonthInput.value = goal.month;
        if (yearInput) yearInput.value = goal.year;
        
        // Ensure that product goal and video goal are properly set with the goal values
        if (productInput) {
            productInput.value = goal.product_goal || 0;
            console.log(`Setting product goal value to: ${goal.product_goal || 0}`);
        }
        if (videoInput) {
            videoInput.value = goal.video_goal || 0;
            console.log(`Setting video goal value to: ${goal.video_goal || 0}`);
        }
    }

    // Populate category goals for both Add (empty) and Edit
    if (categoryContainer) {
        categoryContainer.querySelectorAll('.category-goal-item').forEach(item => item.remove());
        if (goal && goal.CategoryGoals) {
            goal.CategoryGoals.forEach(cg => {
                addCategoryGoalInput(prefix, cg.Tag?.name, cg.product_goal);
            });
        }
    }
}

// Specific function to open and populate the Edit Goal modal
export function openEditGoalModal(goalId) {
    console.log(`Opening edit goal modal for goal ID: ${goalId}`);

    // Make sure we have a valid goalId
    if (!goalId) {
        console.error('Invalid goal ID');
        alert('Cannot edit: Invalid goal ID');
        return;
    }
    
    fetchApi(`/api/goals/${goalId}`)
        .then(goal => {
            if (!goal) {
                console.error('Goal not found or API error');
                alert('Failed to load goal details: Goal not found.');
                return;
            }
            
            console.log('Retrieved goal data:', goal);
            
            try {
                // First open the modal so the form elements are visible in the DOM
                openModal('edit-goal-modal');
                
                // Then populate the form without delay
                // Get references to all form elements
                const form = document.getElementById('edit-goal-form');
                const idInput = document.getElementById('edit-goal-id');
                const monthDisplay = document.getElementById('edit-goal-month-display');
                const hiddenMonthInput = document.getElementById('edit-goal-month');
                const yearInput = document.getElementById('edit-goal-year');
                const productInput = document.getElementById('edit-goal-product');
                const videoInput = document.getElementById('edit-goal-video');
                
                // Reset the form to clear any previous values
                if (form) form.reset();
                
                // Basic fields
                if (idInput) idInput.value = goal.id;
                if (monthDisplay) {
                    const monthName = new Date(goal.year, goal.month - 1, 1).toLocaleString('default', { month: 'long' });
                    monthDisplay.value = monthName;
                }
                if (hiddenMonthInput) hiddenMonthInput.value = goal.month;
                if (yearInput) yearInput.value = goal.year;
                
                // Important: Double-check the goal data has proper values
                const productGoal = typeof goal.product_goal !== 'undefined' ? goal.product_goal : 0;
                const videoGoal = typeof goal.video_goal !== 'undefined' ? goal.video_goal : 0;
                
                // Set product and video goal values directly with explicit values
                if (productInput) {
                    productInput.value = productGoal;
                    console.log(`Setting product goal input value to: ${productGoal}`);
                }
                
                if (videoInput) {
                    videoInput.value = videoGoal;
                    console.log(`Setting video goal input value to: ${videoGoal}`);
                }
                
                // Clear any existing category goals
                const categoryContainer = document.getElementById('edit-category-goals-container');
                if (categoryContainer) {
                    categoryContainer.querySelectorAll('.category-goal-item').forEach(item => item.remove());
                    
                    // Add category goals if available
                    if (goal.CategoryGoals && goal.CategoryGoals.length > 0) {
                        goal.CategoryGoals.forEach(cg => {
                            const tagName = cg.Tag ? cg.Tag.name : '';
                            const goalValue = cg.product_goal || 0;
                            addCategoryGoalInput('edit', tagName, goalValue);
                        });
                    }
                }
                
                // Force a validation check on the form to ensure required fields are properly set
                setTimeout(() => {
                    // Double check that our values are set correctly
                    if (productInput && productInput.value != productGoal) {
                        console.warn(`Product goal value not set correctly. Expected: ${productGoal}, Actual: ${productInput.value}`);
                        productInput.value = productGoal;
                    }
                    
                    if (videoInput && videoInput.value != videoGoal) {
                        console.warn(`Video goal value not set correctly. Expected: ${videoGoal}, Actual: ${videoInput.value}`);
                        videoInput.value = videoGoal;
                    }
                }, 200);
                
            } catch (formError) {
                console.error('Error populating goal form:', formError);
                alert('Error populating form with goal data. Please try again.');
            }
        })
        .catch(err => {
            console.error("Full error loading goal details:", err);
            alert(`Failed to load goal details. Check console for more info.`);
        });
}