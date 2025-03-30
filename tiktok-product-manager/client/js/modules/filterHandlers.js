// ==================================
// --- Filter Handlers Module ---
// Handles applying and resetting product filters
// ==================================

import { loadProductsList } from './dataLoaders.js';
import { fetchAllTags } from './api.js';
import { closeModal } from './modal.js';
import { updateActiveStatButton } from './uiRender.js'; // Import function to update button state

// --- Helper to format date as YYYY-MM-DD ---
function formatDate(date) {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// --- Tagify Instance for Filter --- 
let filterTagifyInstance = null;

// --- Helper to initialize Tagify for Filter --- 
async function initializeFilterTagify() {
    const input = document.getElementById('filter-tags-input');
    if (!input) {
        console.error(`Tagify input element #filter-tags-input not found.`);
        return;
    }

    // Destroy previous instance if exists
    if (filterTagifyInstance) {
        filterTagifyInstance.destroy();
        filterTagifyInstance = null;
    }

    let tagWhitelist = [];
    try {
        const tags = await fetchAllTags();
        // Store the full tag object in the whitelist for later ID retrieval
        tagWhitelist = tags.map(tag => ({ id: tag.id, value: tag.name, color: tag.color })); // Keep 'value' for display/matching
    } catch (error) {
        console.error("Failed to fetch tags for Tagify whitelist:", error);
    }

    filterTagifyInstance = new Tagify(input, {
        whitelist: tagWhitelist,
        dropdown: {
            maxItems: 20,
            enabled: 0,
            closeOnSelect: false
        },
        // Keep settings simple for filter
    });

    // Optional: Load tags from previous filter state if needed
    // const currentFilters = getCurrentFilterState(); // Need a way to store/retrieve filter state
    // if (currentFilters.tags) {
    //    filterTagifyInstance.loadOriginalValues(currentFilters.tags.split(','));
    // }
}


// --- Handler for Date Range Quick Select Buttons ---
export function handleDateRangeClick(event) {
 // Added export keyword
    const button = event.target.closest('.date-range-btn');
    if (!button) return;

    const rangeType = button.dataset.range;
    const startDateInput = document.getElementById('filter-start-date');
    const endDateInput = document.getElementById('filter-end-date');
    const allButtons = document.querySelectorAll('#date-quick-select .date-range-btn');

    if (!startDateInput || !endDateInput) {
        console.error("Date input fields not found");
        return;
    }

    let startDate = new Date();
    let endDate = new Date();

    switch (rangeType) {
        case 'today':
            // startDate and endDate are already today
            break;
        case 'yesterday':
            startDate.setDate(startDate.getDate() - 1);
            endDate.setDate(endDate.getDate() - 1);
            break;
        case 'last7':
            startDate.setDate(startDate.getDate() - 6);
            // endDate is today
            break;
        case 'last30':
            startDate.setDate(startDate.getDate() - 29);
            // endDate is today
            break;
        case 'all':
            startDate = null; // Representing 'all' by clearing dates
            endDate = null;
            break;
        default:
            return; // Do nothing if range is unknown
    }

    startDateInput.value = formatDate(startDate);
    endDateInput.value = formatDate(endDate);

    // Update active button style
    allButtons.forEach(btn => btn.classList.remove('bg-blue-100', 'border-blue-300')); // Remove active style from all
    button.classList.add('bg-blue-100', 'border-blue-300'); // Add active style to clicked button
}


// Apply filters and reload product list
export function applyFilters() {
    // Get tags from Tagify instance
    let filterTagIds = '';
    if (filterTagifyInstance && filterTagifyInstance.value.length > 0) {
        // Map the selected tag objects to their IDs.
        // Tagify's value contains the full objects from the whitelist now.
        filterTagIds = filterTagifyInstance.value
            .map(tagData => tagData.id) // Get the ID from the tag object
            .filter(id => id !== undefined) // Ensure we only have valid IDs
            .join(',');
    }

    const filters = {
        purchased: document.getElementById('filter-purchased')?.value,
        tags: filterTagIds, // Send comma-separated IDs
        search: document.getElementById('filter-search')?.value,
        startDate: document.getElementById('filter-start-date')?.value,
        endDate: document.getElementById('filter-end-date')?.value,
        maxVideoCount: document.getElementById('filter-max-videos')?.value,
    };
    // Remove empty/null/undefined filters before loading
    Object.keys(filters).forEach(key => (filters[key] === '' || filters[key] === undefined || filters[key] === null) && delete filters[key]);
    
    // Update the active stat button based on the 'purchased' filter being applied
    updateActiveStatButton(filters.purchased); 

    loadProductsList(filters, 1); // Pass filters and reset to page 1
    updateFilterCountBadge(); // Update badge after applying
    closeModal('filter-modal'); // Close modal after applying
}

// Reset all filter inputs and reload product list without filters
export function resetFilters() {
    // console.log("Attempting to reset filters");
    const purchasedFilter = document.getElementById('filter-purchased');
    if (purchasedFilter) purchasedFilter.value = '';
    // const tagsFilter = document.getElementById('filter-tags'); // Old input
    // if (tagsFilter) tagsFilter.value = ''; // Old input
    if (filterTagifyInstance) {
        filterTagifyInstance.removeAllTags(); // Clear Tagify input
    }
    const searchFilter = document.getElementById('filter-search');
    if (searchFilter) searchFilter.value = '';
    const startDateFilter = document.getElementById('filter-start-date');
    if (startDateFilter) startDateFilter.value = '';
    const endDateFilter = document.getElementById('filter-end-date');
    if (endDateFilter) endDateFilter.value = '';
    const maxVideosFilter = document.getElementById('filter-max-videos');
    if (maxVideosFilter) maxVideosFilter.value = '';

    updateActiveStatButton(''); // Reset active button to 'All' (empty status)
    loadProductsList({}, 1); // Load all products (empty filters) and reset to page 1

    updateFilterCountBadge(); // Update badge after resetting
    closeModal('filter-modal'); // Close modal after resetting
}
// Function to update the filter count badge
export function updateFilterCountBadge() {
    // Get tags from Tagify instance if it exists
    const filterTagsValue = (filterTagifyInstance && filterTagifyInstance.value.length > 0)
        ? filterTagifyInstance.value.map(tag => tag.value).join(',')
        : '';

    const filters = {
        purchased: document.getElementById('filter-purchased')?.value,
        tags: filterTagsValue, // Use value from Tagify
        search: document.getElementById('filter-search')?.value,
        startDate: document.getElementById('filter-start-date')?.value,
        endDate: document.getElementById('filter-end-date')?.value,
        maxVideoCount: document.getElementById('filter-max-videos')?.value,
    };


    let activeFilterCount = 0;
    Object.values(filters).forEach(value => {
        // Incorrectly placed function removed from here.
        if (value !== '' && value !== undefined && value !== null) {
            activeFilterCount++;
        }
    });

    const badge = document.getElementById('filter-count-badge');
    if (badge) {
        if (activeFilterCount > 0) {
            badge.textContent = activeFilterCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}



// Function to setup listeners specific to the filter modal
// Should be called from main.js or wherever the modal open/close is handled
export function setupFilterModalListeners() {
    const openBtn = document.getElementById('open-filter-modal-btn');
    const closeBtn = document.getElementById('close-filter-modal-btn');
    // Apply and Reset buttons have listeners in main.js, no need to re-add here

    openBtn?.addEventListener('click', () => {
        // Initialize Tagify when the modal is opened
        initializeFilterTagify();
        // Note: openModal itself is likely called from main.js
    });

    closeBtn?.addEventListener('click', () => {
        // Destroy Tagify instance when the modal is closed
        if (filterTagifyInstance) {
            filterTagifyInstance.destroy();
            filterTagifyInstance = null;
        }
        // Note: closeModal itself handles hiding the modal
    });
}

// --- New Handler for Stat Filter Button Clicks ---
export function handleStatFilterClick(event) {
    const button = event.target.closest('.stat-filter-btn');
    if (!button) return;

    const statusToFilter = button.dataset.filterStatus; // '', 'true', or 'false'

    // Update the hidden select dropdown in the filter modal (if it exists)
    // This keeps the filter modal consistent if opened later
    const purchasedSelect = document.getElementById('filter-purchased');
    if (purchasedSelect) {
        purchasedSelect.value = statusToFilter;
    }

    // Apply the filter immediately
    applyFilters(); 
    // applyFilters already calls updateActiveStatButton, so no need to call it again here.
}
