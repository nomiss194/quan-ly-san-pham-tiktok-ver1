// ==================================
// --- New Tag Manager Module ---
// Handles UI and logic for the refactored Tag Manager modal
// ==================================

import { fetchAllTags, createTag, updateTag, deleteTagApi } from './api.js';
import { openModal, closeModal } from './modal.js';

// --- State ---
let allTags = []; // Holds the complete list of tags fetched from API
let filteredTags = []; // Holds the tags currently displayed (after search/sort)
let currentSort = 'name-asc'; // Example: 'name-asc', 'name-desc'
let searchTerm = '';

// --- DOM Elements ---
const getElement = (id) => document.getElementById(id);
const getModal = () => getElement('tag-manager-modal');
const getListContainer = () => getElement('tag-manager-list');
const getSearchInput = () => getElement('tag-search-input');
const getForm = () => getElement('tag-manager-form');
const getFormTitle = () => getElement('tag-form-title');
const getIdInput = () => getElement('tag-edit-id');
const getNameInput = () => getElement('tag-name-input');
const getColorInput = () => getElement('tag-color-input');
const getColorPicker = () => getElement('tag-color-picker');
const getCancelBtn = () => getElement('tag-cancel-edit-btn');
const getSaveBtn = () => getElement('tag-save-btn');

// --- Helper Functions ---

// Contrast checker for tag text color
function getContrastYIQ(hexcolor){
    if (!hexcolor) return '#000000';
    hexcolor = hexcolor.replace("#", "");
    if (hexcolor.length === 3) {
        hexcolor = hexcolor.split('').map(char => char + char).join('');
    }
    const r = parseInt(hexcolor.substr(0,2),16);
    const g = parseInt(hexcolor.substr(2,2),16);
    const b = parseInt(hexcolor.substr(4,2),16);
    const yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
}

// Apply current search and sort to allTags to update filteredTags
function applyFiltersAndSort() {
    let result = [...allTags];

    // Filter by search term
    if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        result = result.filter(tag => tag.name.toLowerCase().includes(lowerCaseSearchTerm));
    }

    // Sort (add more sort options later if needed)
    result.sort((a, b) => {
        if (currentSort === 'name-asc') {
            return a.name.localeCompare(b.name);
        } else if (currentSort === 'name-desc') {
            return b.name.localeCompare(a.name);
        }
        return 0; // Default no sort
    });

    filteredTags = result;
}

// --- Rendering ---

// Render the list of tags in the modal
function renderTagList() {
    const listContainer = getListContainer();
    if (!listContainer) return;
    listContainer.innerHTML = ''; // Clear previous list

    applyFiltersAndSort(); // Ensure filteredTags is up-to-date

    if (!filteredTags || filteredTags.length === 0) {
        listContainer.innerHTML = `<p class="text-sm text-gray-500 px-2">${searchTerm ? 'No tags match your search.' : 'No tags created yet.'}</p>`;
        return;
    }

    filteredTags.forEach(tag => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-2 border-b border-gray-100 hover:bg-gray-50';
        // Store color hex and name directly in dataset for easier access
        div.dataset.tagId = tag.id;
        div.dataset.tagName = tag.name;
        div.dataset.tagColor = tag.color || '#cccccc';

        div.innerHTML = `
            <span class="flex items-center flex-grow mr-2 overflow-hidden">
                <span class="w-4 h-4 rounded-full mr-2 flex-shrink-0" style="background-color: ${tag.color || '#cccccc'}; border: 1px solid #ccc;"></span>
                <span class="tag-name text-sm truncate" title="${tag.name}">${tag.name}</span>
            </span>
            <span class="flex-shrink-0">
                <button data-action="edit-tag" class="text-blue-500 hover:text-blue-700 mr-2 p-1"><i data-lucide="edit-2" class="h-4 w-4 pointer-events-none"></i></button>
                <button data-action="delete-tag" class="text-red-500 hover:text-red-700 p-1"><i data-lucide="trash-2" class="h-4 w-4 pointer-events-none"></i></button>
            </span>
        `;
        listContainer.appendChild(div);
    });

    // Re-initialize icons if necessary (Lucide specific)
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}



// --- Form Handling ---

// Reset the Add/Edit form
export function resetTagForm() {
    const title = getFormTitle();
    const idInput = getIdInput();
    const nameInput = getNameInput();
    const colorInput = getColorInput();
    const colorPicker = getColorPicker();
    const cancelBtn = getCancelBtn();
    const saveBtn = getSaveBtn();

    if (title) title.textContent = 'Thêm thẻ mới';
    if (idInput) idInput.value = '';
    if (nameInput) nameInput.value = '';
    if (colorInput) colorInput.value = '#cccccc';
    // console.log('[tagManager.js] resetTagForm: Finished.'); // DEBUG LOG removed

    if (colorPicker) colorPicker.value = '#cccccc';
    if (cancelBtn) cancelBtn.classList.add('hidden');
    if (saveBtn) saveBtn.textContent = 'Lưu thẻ';
    getForm()?.reset(); // Also reset native form state
}

// Populate the form for editing
function populateFormForEdit(tagElement) {
    const { tagId, tagName, tagColor } = tagElement.dataset;

    const title = getFormTitle();
    const idInput = getIdInput();
    const nameInput = getNameInput();
    const colorInput = getColorInput();
    const colorPicker = getColorPicker();
    const cancelBtn = getCancelBtn();
    const saveBtn = getSaveBtn();

    if (title) title.textContent = 'Edit Tag';
    if (idInput) idInput.value = tagId;
    if (nameInput) nameInput.value = tagName;
    // Ensure color has a '#' prefix for color input/picker
    const validColor = tagColor.startsWith('#') ? tagColor : `#${tagColor}`;
    if (colorInput) colorInput.value = validColor;
    if (colorPicker) colorPicker.value = validColor;
    if (cancelBtn) cancelBtn.classList.remove('hidden');
    if (saveBtn) saveBtn.textContent = 'Update Tag';
}

// Handle form submission (Create or Update)
export async function handleCreateOrUpdateTag(event) {
    event.preventDefault();
    const id = getIdInput()?.value;
    const name = getNameInput()?.value.trim();
    let color = getColorInput()?.value.trim() || '#cccccc';

    // Basic validation
    if (!name) {
        alert('Tag name is required.');
        getNameInput()?.focus();
        return;
    }
    // Ensure color has '#' prefix
    if (!color.startsWith('#')) {
        color = `#${color}`;
    }
    // Validate hex color format (#RGB or #RRGGBB)
    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
         alert('Invalid color format. Please use #RRGGBB or #RGB.');
         getColorInput()?.focus();
         return;
    }


    const tagData = { name, color };
    const saveBtn = getSaveBtn();
    const originalButtonText = saveBtn.textContent;
    saveBtn.textContent = id ? 'Updating...' : 'Saving...';
    saveBtn.disabled = true;

    try {
        if (id) {
            await updateTag(id, tagData);
            alert('Tag updated successfully!');
        } else {
            await createTag(tagData);
            alert('Tag created successfully!');
        }
        resetTagForm();
        await refreshTags(); // Refetch and re-render
    } catch (error) {
        alert(error.message || `Failed to ${id ? 'update' : 'create'} tag.`);
    } finally {
        saveBtn.textContent = originalButtonText; // Restore button text even on error
         saveBtn.disabled = false;
    }
}

// --- Tag Actions ---

// Handle click on Edit button
export function handleEditTagClick(target) {
    const tagElement = target.closest('[data-tag-id]');
    if (tagElement) {
        populateFormForEdit(tagElement);
        getNameInput()?.focus(); // Focus name input for editing
    }
}

// Handle click on Delete button
export async function handleDeleteTagClick(target) {
    const tagElement = target.closest('[data-tag-id]');
    if (!tagElement) return;

    const { tagId, tagName } = tagElement.dataset;

    if (!confirm(`Are you sure you want to delete the tag "${tagName}"? This will remove it from all products.`)) {
        return;
    }

    try {
        await deleteTagApi(tagId);
        alert('Tag deleted successfully!');
        // If the deleted tag was being edited, reset the form
        if (getIdInput()?.value === tagId) {
            resetTagForm();
        }
        await refreshTags(); // Refetch and re-render
    } catch (error) {
        alert(error.message || 'Xóa thẻ thất bại.');
    }
}

// --- Search and Sort Handling ---

// Handle search input changes
export function handleSearchInput() {
    searchTerm = getSearchInput()?.value || '';
    renderTagList(); // Re-render the list with the new search term
}

    // console.log('[tagManager.js] refreshTags: Starting...'); // DEBUG LOG removed

// --- Initialization and Data Fetching ---

// Fetch tags from API, update state, and render
async function refreshTags() {
        console.log('[tagManager.js] refreshTags: Fetching tags...');

    const listContainer = getListContainer();
    try {
        // console.log('[tagManager.js] refreshTags: Rendering tags...'); // DEBUG LOG removed

        if(listContainer) listContainer.innerHTML = '<p class="text-sm text-gray-500 px-2">Loading tags...</p>'; // Show loading state
        allTags = await fetchAllTags();
        renderTagList(); // Render based on fetched data and current filters/sort
        // Misplaced console.error removed from here

    } catch (error) {
        console.error("Failed to load tags:", error.message); // Log only message for clarity
        if(listContainer) listContainer.innerHTML = '<p class="text-red-500 px-2">Failed to load tags.</p>';
        allTags = []; // Reset state on error
        filteredTags = [];
    console.log('[tagManager.js] refreshTags: Finished.');

    }
}

// --- Public API ---

// Open the Tag Manager modal
export async function openTagManager() {
    console.log('[tagManager.js] openTagManager: Starting...');
    resetTagForm();
    searchTerm = ''; // Reset search term
    
    const searchInput = getSearchInput();
    if (searchInput) searchInput.value = ''; // Clear search input visually
    
    console.log('[tagManager.js] openTagManager: Opening modal...');
    openModal('tag-manager-modal');
    await refreshTags(); // Fetch and render tags
    console.log('[tagManager.js] openTagManager: Finished.');
}

// Function to setup listeners specific to the tag manager
// To be called from main.js after DOMContentLoaded
export function setupTagManagerListeners() {
    console.log('[tagManager.js] Running setupTagManagerListeners...');

    const modal = getModal();
    if (!modal) {
        console.error('[tagManager.js] Tag manager modal not found in DOM!');
        return;
    }

    // Listener for the main button that opens this modal
    const manageTagsBtn = document.getElementById('manage-tags-btn');
    if (manageTagsBtn) {
        console.log('[tagManager.js] Found #manage-tags-btn, adding listener.');
        manageTagsBtn.addEventListener('click', () => {
            console.log('[tagManager.js] #manage-tags-btn clicked! Opening tag manager...');
            openTagManager();
        });
    } else {
        console.error('[tagManager.js] Could not find #manage-tags-btn to add listener. Make sure this element exists in your HTML.');
    }

    // Search input listener
    getSearchInput()?.addEventListener('input', handleSearchInput);

    // Form submission listener
    getForm()?.addEventListener('submit', handleCreateOrUpdateTag);

    // Cancel edit button listener
    getCancelBtn()?.addEventListener('click', resetTagForm);

    // Color picker/input synchronization listeners
    getColorPicker()?.addEventListener('input', (e) => {
        const colorInput = getColorInput();
        if(colorInput) colorInput.value = e.target.value;
    });
    
    getColorInput()?.addEventListener('input', (e) => {
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i;
        const colorPicker = getColorPicker();
        if (colorPicker && colorRegex.test(e.target.value)) {
            colorPicker.value = e.target.value;
        }
    });

    // Event delegation for edit/delete buttons within the list
    getListContainer()?.addEventListener('click', (e) => {
        const editButton = e.target.closest('button[data-action="edit-tag"]');
        const deleteButton = e.target.closest('button[data-action="delete-tag"]');

        if (editButton) {
            handleEditTagClick(editButton);
        } else if (deleteButton) {
            handleDeleteTagClick(deleteButton);
        }
    });

     // Close button listener (assuming it exists in the new HTML)
     getElement('close-tag-manager-modal-btn')?.addEventListener('click', () => closeModal('tag-manager-modal'));
}