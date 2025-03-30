// ==================================
// --- Routing Module ---
// Handles client-side navigation and content display switching
// ==================================

// Import necessary functions from other modules
import { logout, showAuth } from './auth.js';
// Corrected imports for data loading functions
import { loadProductsList, loadGoalsList, loadTrashList } from './dataLoaders.js';
import { renderDashboardStats } from './uiRender.js';

// Function to show the main dashboard section and hide auth
export function showDashboard() {
    // console.log("showDashboard called");
    document.getElementById('auth-section')?.classList.add('hidden');
    document.getElementById('dashboard-section')?.classList.remove('hidden');
    // Logout button listener might be better placed in main.js after login/initial load
    // document.getElementById('logout-btn')?.addEventListener('click', logout);
    setupTabNavigation();
    handleRoute(); // Initial route handling after showing dashboard
}

// Function to handle route changes and display appropriate content
export function handleRoute() {
  const path = window.location.pathname;
  console.log(`Handling route: ${path}`); // Keep for debugging

  const dashboardTab = document.getElementById('dashboard-tab');
  const productsTab = document.getElementById('products-tab');
  const goalsTab = document.getElementById('goals-tab');
  const trashTab = document.getElementById('trash-tab');
  const dashboardContent = document.getElementById('dashboard-content');
  const productsContent = document.getElementById('products-content');
  const goalsContent = document.getElementById('goals-content');
  const trashContent = document.getElementById('trash-content');

  // Check if all elements exist
  if (!dashboardTab || !productsTab || !goalsTab || !trashTab || !dashboardContent || !productsContent || !goalsContent || !trashContent) {
      console.error("Required elements for routing not found!");
      return;
  }

  // Reset all tabs and hide all content sections first
  [dashboardTab, productsTab, goalsTab, trashTab].forEach(tab => {
      if(tab) {
          tab.classList.remove('bg-gray-100', 'text-blue-600');
          tab.classList.add('text-gray-500', 'hover:text-blue-600');
      }
  });
  [dashboardContent, productsContent, goalsContent, trashContent].forEach(content => {
      if(content) content.classList.add('hidden');
  });

  // Activate the correct tab and show the correct content based on path
  if (path === '/products') {
    productsTab.classList.remove('text-gray-500', 'hover:text-blue-600');
    productsTab.classList.add('bg-gray-100', 'text-blue-600');
    productsContent.classList.remove('hidden');
    console.log('[handleRoute] Made #products-content visible.'); // DEBUG LOG
    // DEBUG LOG: Check computed styles immediately after showing parent
    try {
        const tableContainer = document.getElementById('product-table-container');
        const cardsContainer = document.getElementById('product-cards-container');
        if (tableContainer && cardsContainer) {
            // Use setTimeout to allow browser a tick to apply styles after class change
            setTimeout(() => {
                console.log('[handleRoute] Computed display - Table Container (after show):', window.getComputedStyle(tableContainer).display);
                console.log('[handleRoute] Computed display - Cards Container (after show):', window.getComputedStyle(cardsContainer).display);
            }, 0); // Delay slightly
        } else {
            console.warn('[handleRoute] Could not find containers for computed style check after show.');
        }
    } catch (e) {
        console.error('[handleRoute] Error checking computed styles after show:', e);
    }

    loadProductsList(); // Load products (filters might be applied elsewhere)
  } else if (path === '/goals') {
    goalsTab.classList.remove('text-gray-500', 'hover:text-blue-600');
    goalsTab.classList.add('bg-gray-100', 'text-blue-600');
    goalsContent.classList.remove('hidden');
    loadGoalsList();
  } else if (path === '/trash') {
    trashTab.classList.remove('text-gray-500', 'hover:text-blue-600');
    trashTab.classList.add('bg-gray-100', 'text-blue-600');
    trashContent.classList.remove('hidden');
    loadTrashList();
  } else { // Default to Dashboard
    dashboardTab.classList.remove('text-gray-500', 'hover:text-blue-600');
    dashboardTab.classList.add('bg-gray-100', 'text-blue-600');
    dashboardContent.classList.remove('hidden');
    renderDashboardStats(); // Render dashboard stats
  }
}

// Function to set up tab navigation listeners
export function setupTabNavigation() {
    const tabs = ['dashboard-tab', 'products-tab', 'goals-tab', 'trash-tab'];
    tabs.forEach(tabId => {
        const tabElement = document.getElementById(tabId);
        if (tabElement) {
            // Remove existing listener before adding a new one to prevent duplicates if called multiple times
            // Note: This simple approach might remove other listeners if not careful.
            // A more robust solution might involve storing listener references.
            // For now, assuming it's called once during setup.
            tabElement.replaceWith(tabElement.cloneNode(true)); // Simple way to remove all listeners
            document.getElementById(tabId)?.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPath = tabId === 'dashboard-tab' ? '/' : `/${tabId.split('-')[0]}`;
                if (window.location.pathname !== targetPath) {
                    history.pushState({}, '', targetPath); // Update URL
                    handleRoute(); // Handle the route change
                }
            });
        }
    });
    // Handle browser back/forward button navigation
    // Ensure this listener is added only once
    if (!window.hasPopstateListener) {
        window.addEventListener('popstate', handleRoute);
        window.hasPopstateListener = true; // Flag to prevent adding multiple listeners
    }
}