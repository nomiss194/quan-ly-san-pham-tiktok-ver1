// ==================================
// --- Data Loading Module ---
// Handles fetching data and triggering UI rendering
// ==================================

import { fetchProducts, fetchGoals, fetchTrash, fetchApi } from './api.js';
// Import renderPaginationControls as well
import { renderProducts, renderGoals, renderTrash, renderProductStats, renderPaginationControls } from './uiRender.js';

// Load and render products, accepting optional filters
export async function loadProductsList(filters = {}, page = 1) {
    try {
        const limit = 30; // Define limit here or get from config/constant
        // Get the full response including products and stats
        // Pass page and limit to fetchProducts
        const response = await fetchProducts(filters, page, limit);
        // Destructure pagination data from response
        const { products, totalProducts, currentPage, totalPages, stats } = response;

        // If filtering by tags, fetch complete data for each product to ensure all tags are preserved
        // Always use the initial fetch result as backend should provide complete tags
        renderProducts(products); // Call render function from uiRender module

        // Render the stats regardless of tag filtering
        // Note: Stats are calculated based on baseWhere in backend, not affected by pagination
        if (stats) {
            renderProductStats(stats);
        }

        // Render pagination controls using the data from the response
        renderPaginationControls(totalProducts, currentPage, totalPages, limit);

    } catch (error) {
        console.error('[loadProductsList] Failed to load products:', error.message); // Log only message
        if (error.message === 'Xác thực thất bại') {
            console.log('[loadProductsList] Authentication failed, likely redirecting to login.');
            // Consider calling logout() or showAuth() here directly if this is the desired behavior
            // For now, just logging. The error will bubble up.
        }
        // Attempt to update the product cards container with an error message
        const cardsContainer = document.getElementById('product-cards-container');
        if(cardsContainer) {
            cardsContainer.innerHTML = '<p class="text-center py-4 text-red-500 col-span-full">Failed to load products.</p>';
        } else {
             // Fallback if cards container isn't found (e.g., if called before products tab is active)
             console.error("Product cards container not found to display error.");
        }
        // Clear pagination on error? Or display an error message there too?
        const paginationContainer = document.getElementById('pagination-controls');
        if (paginationContainer) paginationContainer.innerHTML = ''; // Clear pagination on error
    }
}

// Load and render goals
export async function loadGoalsList() {
    try {
        const goals = await fetchGoals();
        renderGoals(goals); // Call render function from uiRender module
    } catch (error) {
        console.error('Tải mục tiêu thất bại:', error);
        const listContainer = document.getElementById('goals-list');
        if(listContainer) listContainer.innerHTML = '<p class="text-center text-red-500">Failed to load goals.</p>';
    }
}

// Load and render trash items
export async function loadTrashList() {
    try {
        const products = await fetchTrash();
        renderTrash(products); // Call render function from uiRender module
    } catch (error) {
        console.error('Failed to load trash:', error);
        const tbody = document.getElementById('trash-list');
        // Ensure colspan matches the number of columns in renderTrash
        if(tbody) tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-red-500">Failed to load trash.</td></tr>';
    }
}