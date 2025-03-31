// ==================================
// --- Main Entry Point ---
// Imports modules and sets up initial event listeners
// ==================================

// Import API functions (though most might be called via handlers)
import { addProduct, updateProduct, createOrUpdateGoal } from './modules/api.js';

// Import Auth functions
import { login, register, logout, showAuth } from './modules/auth.js';

// Import Routing functions
import { showDashboard, handleRoute, setupTabNavigation } from './modules/routing.js';

// Import Modal functions
import { openModal, closeModal, openEditModal, populateGoalForm, openEditGoalModal } from './modules/modal.js';

// Import Image Handlers
import { handleImagePaste, handleImageUpload } from './modules/imageHandlers.js';

// Import Image Zoom functionality
import { initImageZoomListeners } from './modules/imageZoom.js';

// Import Data Loaders (might be called directly or via routing)
import { loadProductsList, loadGoalsList } from './modules/dataLoaders.js';

// Import Event Handlers
import { handleGoalFormSubmit, handleDeleteGoal, addCategoryGoalInput } from './modules/goalHandlers.js';
import { handleProductListActions } from './modules/productHandlers.js'; // Main delegation handler
import { handleRestoreProduct, handlePermanentDeleteProduct } from './modules/trashHandlers.js';
import { applyFilters, resetFilters, setupFilterModalListeners, updateFilterCountBadge, handleStatFilterClick } from './modules/filterHandlers.js'; // Added handleStatFilterClick
// Removed duplicate import line that was here
import { openTagManager, setupTagManagerListeners } from './modules/tagManager.js'; // Import new functions for refactored tag manager
// import { updateFilterCountBadge } from './modules/filterHandlers.js'; // Moved to line 28


// --- DOMContentLoaded ---
// Ensures the DOM is fully loaded before attaching listeners or manipulating elements
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM Content Loaded - Setting up listeners"); // Keep for initial debug

  // --- Auth Listeners ---
  document.getElementById('show-register')?.addEventListener('click', () => {
    document.getElementById('login-form')?.classList.add('hidden');
    document.getElementById('register-form')?.classList.remove('hidden');
    document.getElementById('show-register')?.classList.add('hidden');
  });
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      await login(email, password); // Calls login from auth.js
      // showDashboard is called inside login on success
    } catch (error) {
      alert(error.message || 'Đăng nhập thất bại');
    }
  });
  document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    try {
      await register(email, password, name);
      alert('Registration successful! Please log in.');
      // Switch back to login form after successful registration
      document.getElementById('register-form')?.classList.add('hidden');
      document.getElementById('login-form')?.classList.remove('hidden');
      document.getElementById('show-register')?.classList.remove('hidden');
      document.getElementById('login-form')?.reset();
    } catch (error) {
      alert(error.message || 'Registration failed');
    }
  });
  document.getElementById('logout-btn')?.addEventListener('click', logout);

  // --- Modal Trigger Listeners ---
  document.getElementById('add-product-btn')?.addEventListener('click', () => openModal('add-product-modal'));
  document.getElementById('close-modal-btn')?.addEventListener('click', () => closeModal('add-product-modal'));
  document.getElementById('close-edit-modal-btn')?.addEventListener('click', () => closeModal('edit-product-modal'));
  document.getElementById('add-goal-btn')?.addEventListener('click', () => {
      populateGoalForm(); // Populate with defaults for adding
      openModal('goal-modal');
  });
   // Listener for the "Edit Goals" button on the dashboard
   document.getElementById('edit-goals-btn')?.addEventListener('click', () => {
        // Find the goal for the current month/year to pre-populate the edit form
        // This requires fetching goals or having them available
        // For simplicity, let's just open the 'Add/Update' modal for now
        // A better UX might involve fetching the current month's goal and opening the edit modal
        populateGoalForm(); // Or fetch current month goal and call populateGoalForm(currentGoal)
        openModal('goal-modal'); // Open the combined Add/Update modal
    });
  document.getElementById('close-goal-modal-btn')?.addEventListener('click', () => closeModal('goal-modal'));
  document.getElementById('close-edit-goal-modal-btn')?.addEventListener('click', () => closeModal('edit-goal-modal'));
  // Listener for manage-tags-btn moved to setupTagManagerListeners in tagManager.js
  // document.getElementById('close-tag-manager-modal-btn')?.addEventListener('click', () => closeModal('tag-manager-modal')); // Listener moved to setupTagManagerListeners
  document.getElementById('open-filter-modal-btn')?.addEventListener('click', () => openModal('filter-modal')); // Added listener for filter modal button
  document.getElementById('close-filter-modal-btn')?.addEventListener('click', () => closeModal('filter-modal'));



  // --- Form Submission Listeners ---
  document.getElementById('add-product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('product-url').value;
    const image_url = document.getElementById('product-image-url').value;
    const notes = document.getElementById('product-notes').value;
    // Get tags from Tagify input
    let tags = [];
    const tagifyInput = document.getElementById('add-product-tags-input');
    if (tagifyInput && tagifyInput.value) {
        try {
            tags = JSON.parse(tagifyInput.value).map(tag => tag.value);
        } catch (parseError) {
            console.error("Error parsing Tagify value:", parseError);
            // Keep tags as empty array if parsing fails
        }
    }

    try {
      await addProduct({ url, image_url, notes, tags });
      closeModal('add-product-modal');
      if (window.location.pathname === '/products') loadProductsList();
    } catch (error) {
      alert(error.message || 'Failed to add product');
    }
  });
  document.getElementById('edit-product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-product-id').value;
    const url = document.getElementById('edit-product-url').value;
    const image_url = document.getElementById('edit-product-image-url').value;
    const notes = document.getElementById('edit-product-notes').value;
    // Get tags from Tagify input
    let tags = [];
    const tagifyInput = document.getElementById('edit-product-tags-input');
    if (tagifyInput && tagifyInput.value) {
        try {
            tags = JSON.parse(tagifyInput.value).map(tag => tag.value);
        } catch (parseError) {
            console.error("Error parsing Tagify value:", parseError);
            // Keep tags as empty array if parsing fails
        }
    }
    const purchased = document.getElementById('edit-product-purchased').value === 'true';
    try {
      await updateProduct(id, { url, image_url, notes, tags, purchased });
      closeModal('edit-product-modal');
      if (window.location.pathname === '/products') loadProductsList();

    } catch (error) {
      alert(error.message || 'Failed to update product');
    }
  });
  document.getElementById('goal-form')?.addEventListener('submit', handleGoalFormSubmit);
  document.getElementById('edit-goal-form')?.addEventListener('submit', handleGoalFormSubmit);
  // document.getElementById('tag-manager-form')?.addEventListener('submit', handleCreateOrUpdateTag); // Commented out for refactor


  // --- Other UI Interaction Listeners ---
  document.getElementById('add-category-goal-btn')?.addEventListener('click', () => addCategoryGoalInput('add'));
  document.getElementById('edit-add-category-goal-btn')?.addEventListener('click', () => addCategoryGoalInput('edit'));
  document.getElementById('product-image-url')?.addEventListener('paste', (e) => handleImagePaste(e, 'product-image-url', 'product-image-preview'));
  document.getElementById('edit-product-image-url')?.addEventListener('paste', (e) => handleImagePaste(e, 'edit-product-image-url', 'edit-product-image-preview'));
  document.getElementById('product-image-upload')?.addEventListener('change', (e) => handleImageUpload(e, 'product-image-url', 'product-image-preview'));
  document.getElementById('edit-product-image-upload')?.addEventListener('change', (e) => handleImageUpload(e, 'edit-product-image-url', 'edit-product-image-preview'));
  // document.getElementById('tag-cancel-edit-btn')?.addEventListener('click', resetTagForm); // Commented out for refactor
  /* Commented out color picker/input listeners for refactor
  document.getElementById('tag-color-picker')?.addEventListener('input', (e) => {
      const colorInput = document.getElementById('tag-color-input');
      if(colorInput) colorInput.value = e.target.value;
  });
  document.getElementById('tag-color-input')?.addEventListener('input', (e) => {
      const colorRegex = /^#[0-9A-F]{6}$/i;
      const colorPicker = document.getElementById('tag-color-picker');
      if (colorPicker && colorRegex.test(e.target.value)) {
          colorPicker.value = e.target.value;
      }
  });
  */
   // Listener for View All Products button on dashboard
   document.getElementById('view-all-products-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        history.pushState({}, '', '/products');
        handleRoute();
    });


  
    // --- Event Delegation Listeners ---
    // Attach listener to a more stable parent container like #products-content
    document.getElementById('products-content')?.addEventListener('click', handleProductListActions);
    // Add event delegation for stat filter buttons within #products-content
    document.getElementById('products-content')?.addEventListener('click', handleStatFilterClick);

    document.getElementById('products-content')?.addEventListener('change', (e) => { // Also update change listener if needed
        const target = e.target;
        // Check if the change event is from the video log date input within a table row
        if (target.classList.contains('video-log-date')) {
            const row = target.closest('tr'); // Assuming it's in a table row
            const productId = row?.dataset.productId;
            const countInput = row?.querySelector('.video-log-count'); // Find count input within the same row

            if (productId && countInput) {
                // Dynamically import handler to avoid circular dependency if needed,
                // or ensure productHandlers is loaded before main.js runs this part.
                import('./modules/productHandlers.js').then(({ handleVideoLogDateChange }) => {
                    handleVideoLogDateChange(productId, target, countInput);
                }).catch(err => console.error("Failed to load product handler for date change:", err));
            }
        }
    });
  document.getElementById('goals-list')?.addEventListener('click', (e) => {
      const target = e.target.closest('button');
      if (!target) return;
      const action = target.dataset.action;
      const goalItem = target.closest('.goal-item');
      const goalId = goalItem?.dataset.goalId;
      if (!goalId) return;
      if (action === 'edit-goal') {
          openEditGoalModal(goalId);
      } else if (action === 'delete-goal') {
          handleDeleteGoal(goalId);
      }
  });
  document.getElementById('trash-list')?.addEventListener('click', (e) => {
      const target = e.target.closest('button');
      if (!target) return;
      const action = target.dataset.action;
      const row = target.closest('tr');
      const productId = row?.dataset.productId;
      if (!productId) return;
      if (action === 'restore') {
          handleRestoreProduct(productId);
      } else if (action === 'permanent-delete') {
          handlePermanentDeleteProduct(productId);
      }
  });
  /* Commented out event delegation for old tag list (Block 1)
  document.getElementById('tag-manager-list')?.addEventListener('click', (e) => {
      const target = e.target.closest('button');
      if (!target) return;
      const action = target.dataset.action;
      if (action === 'edit-tag') {
          handleEditTagClick(target);
      } else if (action === 'delete-tag') {
          handleDeleteTagClick(target);
      }
  });
  */


    // --- Pagination Controls Listener ---
    document.getElementById('pagination-controls')?.addEventListener('click', (e) => {
        const target = e.target.closest('button[data-page]');
        if (!target || target.disabled) return; // Ignore clicks on non-buttons or disabled buttons

        const newPage = parseInt(target.dataset.page);
        if (isNaN(newPage)) return;

        // Get current filters (similar logic to applyFilters in filterHandlers.js)
        let currentFilters = {};
        try {
            const purchased = document.getElementById('filter-purchased')?.value;
            const search = document.getElementById('filter-search')?.value;
            const startDate = document.getElementById('filter-start-date')?.value;
            const endDate = document.getElementById('filter-end-date')?.value;
            const maxVideoCount = document.getElementById('filter-max-videos')?.value;

            let filterTagIds = '';
            // Access Tagify instance - Assuming filterTagifyInstance is accessible or we need a getter
            // For now, let's assume it might be null if modal isn't open, handle gracefully
            const filterTagifyInput = document.querySelector('#filter-tags-input.tagify');
            if (filterTagifyInput && filterTagifyInput.tagify) {
                 filterTagIds = filterTagifyInput.tagify.value
                    .map(tagData => tagData.id) // Get the ID from the tag object
                    .filter(id => id !== undefined) // Ensure we only have valid IDs
                    .join(',');
            }

            currentFilters = {
                purchased: purchased,
                tags: filterTagIds,
                search: search,
                startDate: startDate,
                endDate: endDate,
                maxVideoCount: maxVideoCount,
            };
            // Remove empty/null/undefined filters
            Object.keys(currentFilters).forEach(key => (currentFilters[key] === '' || currentFilters[key] === undefined || currentFilters[key] === null) && delete currentFilters[key]);

        } catch (error) {
            console.error("Error getting current filters for pagination:", error);
            // Decide if we should proceed with empty filters or stop
        }

        console.log(`Pagination: Loading page ${newPage} with filters:`, currentFilters);
        loadProductsList(currentFilters, newPage);
    });

  // --- Filter Button Listeners ---
  document.getElementById('apply-filters-btn')?.addEventListener('click', applyFilters);
  document.getElementById('reset-filters-btn')?.addEventListener('click', resetFilters);



  // --- Mobile Sidebar Toggle ---
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  mobileMenuBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('-translate-x-full');
    sidebarOverlay?.classList.toggle('hidden');
  });

  sidebarOverlay?.addEventListener('click', () => {
    sidebar?.classList.add('-translate-x-full');
    sidebarOverlay?.classList.add('hidden');
  });

  // Optional: Close sidebar when a nav link is clicked
  sidebar?.querySelectorAll('nav a')?.forEach(link => {
    link.addEventListener('click', () => {
        sidebar?.classList.add('-translate-x-full');
        sidebarOverlay?.classList.add('hidden');
        // Note: handleRoute will be called by the existing tab navigation setup
    });
  });


  // --- Tag Manager Listeners (Now handled in setupTagManagerListeners) ---
  // document.getElementById('manage-tags-btn')?.addEventListener('click', openTagManager); // Duplicate listener removed
  // document.getElementById('close-tag-manager-modal-btn')?.addEventListener('click', () => closeModal('tag-manager-modal')); // Listener moved to setupTagManagerListeners
  // document.getElementById('tag-manager-form')?.addEventListener('submit', handleCreateOrUpdateTag); // Listener moved to setupTagManagerListeners
  // document.getElementById('tag-cancel-edit-btn')?.addEventListener('click', resetTagForm); // Listener moved to setupTagManagerListeners
  // document.getElementById('tag-color-picker')?.addEventListener('input', (e) => { // Listener moved to setupTagManagerListeners
      // const colorInput = document.getElementById('tag-color-input'); // Part of commented out listener
      // if(colorInput) colorInput.value = e.target.value; // Part of commented out listener
  // }); // Commented out closing bracket for the listener above
  // document.getElementById('tag-color-input')?.addEventListener('input', (e) => { // Listener moved to setupTagManagerListeners
      // const colorRegex = /^#[0-9A-F]{6}$/i; // Part of commented out listener
      // const colorPicker = document.getElementById('tag-color-picker'); // Part of commented out listener
      // if (colorPicker && colorRegex.test(e.target.value)) { // Part of commented out listener
          // colorPicker.value = e.target.value; // Part of commented out listener
      // } // Part of commented out listener
  // }); // Commented out closing bracket for the listener above
  /* Commented out event delegation for old tag list (Block 2)
  document.getElementById('tag-manager-list')?.addEventListener('click', (e) => {
      const target = e.target.closest('button');
      if (!target) return;
      const action = target.dataset.action;
      if (action === 'edit-tag') {
          handleEditTagClick(target);
      } else if (action === 'delete-tag') {
          handleDeleteTagClick(target);
      }
  });

  */

  // --- Initial Page Load Check ---
  if (localStorage.getItem('token')) {
    showDashboard(); // This also calls setupTabNavigation and handleRoute
  } else {
    showAuth();
  }
  setupTagManagerListeners(); // Setup listeners for the new tag manager modal
  setupFilterModalListeners(); // Setup listeners for the filter modal (including Tagify)
  initImageZoomListeners(); // Initialize image zoom functionality

  // --- Listener to close open card action menus on outside click (moved inside DOMContentLoaded) ---
  document.addEventListener('click', (event) => {
    // Find any open menus
    const openMenus = document.querySelectorAll('.card-actions-menu:not(.hidden)');

    openMenus.forEach(menu => {
      const card = menu.closest('.product-card'); // Find the parent card of the open menu

      // If the click target is NOT inside the parent card of the open menu, hide the menu
      if (card && !card.contains(event.target)) {
        menu.classList.add('hidden');
      }
    });
  });

});
updateFilterCountBadge(); // Initial update on load (Keep outside DOMContentLoaded if needed immediately)
