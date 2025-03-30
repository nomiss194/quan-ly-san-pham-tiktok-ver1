// ==================================
// --- UI Rendering Module ---
// Contains functions to render different parts of the UI
// ==================================

import { fetchApi } from './api.js'; // Needed for fetchAndRenderGoalStats
import { initializeInlineEditing } from './productHandlers.js'; // Import the new function
import { initImageZoomListeners } from './imageZoom.js'; // Import image zoom functionality

// Helper function to determine text color based on background hex color
function getContrastYIQ(hexcolor){
    if (!hexcolor) return '#000000';
    hexcolor = hexcolor.replace("#", "");
    const r = parseInt(hexcolor.substr(0,2),16);
    const g = parseInt(hexcolor.substr(2,2),16);
    const b = parseInt(hexcolor.substr(4,2),16);
    const yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
}


// Helper function to format created_at date relatively
function formatRelativeCreatedAt(dateString) {
    if (!dateString) return 'N/A';

    try {
        const inputDate = new Date(dateString);
        const now = new Date();

        // Get time string (HH:MM:SS)
        const timeString = inputDate.toLocaleTimeString('vi-VN');

        // Normalize dates to midnight for comparison
        const inputDateOnly = new Date(inputDate);
        inputDateOnly.setHours(0, 0, 0, 0);
        const todayOnly = new Date(now);
        todayOnly.setHours(0, 0, 0, 0);

        // Calculate difference in days
        const diffTime = todayOnly - inputDateOnly;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return `Hôm nay, ${timeString}`;
        } else if (diffDays === 1) {
            return `Hôm qua, ${timeString}`;
        } else if (diffDays <= 7) {
            return `${diffDays} ngày trước, ${timeString}`;
        } else {
            // Use full date and time for older dates
            return inputDate.toLocaleString('vi-VN');
        }
    } catch (error) {
        console.error("Error formatting date:", dateString, error);
        return 'N/A'; // Return N/A on error
    }
}

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

export async function renderProducts(products) { // Made async to handle potential data fetching
    console.log('[renderProducts] Starting render...'); // DEBUG LOG
    const cardsContainer = document.getElementById('product-cards-container');
    const productsContent = document.getElementById('products-content'); // Get parent container

    if (!cardsContainer || !productsContent) { // Removed tableBody check
        console.error("[renderProducts] Required product containers not found. CardsContainer:", cardsContainer, "ProductsContent:", productsContent); // DEBUG LOG - Removed tableBody
        return;
    }
    console.log('[renderProducts] Found containers:', { cardsContainer }); // DEBUG LOG - Removed tableBody

    // Clear previous content
    // tableBody.innerHTML = ''; // Removed
    cardsContainer.innerHTML = '';
    console.log('[renderProducts] Cleared containers.'); // DEBUG LOG

    if (!products || products.length === 0) {
        console.log('[renderProducts] No products found.'); // DEBUG LOG
        const noProductsMsg = '<p class="text-center py-4 text-gray-500 col-span-full">Không tìm thấy sản phẩm nào.</p>'; // Use col-span-full for grid
        // tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">No products found.</td></tr>`; // Removed
        cardsContainer.innerHTML = noProductsMsg;
        return;
    }
    console.log(`[renderProducts] Rendering ${products.length} products.`); // DEBUG LOG

    // --- Pre-fetch complete data if needed ---
    // Create a map to store potentially updated product data
    const productDataMap = new Map(products.map(p => [p.id, { ...p, needsCompleteDataCheck: !p.Tags || p.Tags.length === 0 }]));
    const productsToFetch = products.filter(p => productDataMap.get(p.id).needsCompleteDataCheck);

    if (productsToFetch.length > 0) {
        console.log(`[renderProducts] Fetching complete data for ${productsToFetch.length} products.`); // DEBUG LOG
        await Promise.all(productsToFetch.map(async (product) => {
            try {
                const completeProduct = await fetchApi(`/api/products/${product.id}`);
                if (completeProduct) {
                    productDataMap.set(product.id, { ...completeProduct, needsCompleteDataCheck: false }); // Update map with full data
                } else {
                     productDataMap.get(product.id).needsCompleteDataCheck = false; // Mark as checked even if fetch failed
                }
            } catch (error) {
                console.error(`[renderProducts] Error fetching complete product data for ID ${product.id}:`, error.message); // DEBUG LOG
                 productDataMap.get(product.id).needsCompleteDataCheck = false; // Mark as checked on error
            }
        }));
        console.log('[renderProducts] Finished fetching complete data.'); // DEBUG LOG
    }
    // --- End Pre-fetch ---


    // --- Render each product ---
    let cardCount = 0; // DEBUG LOG
    productDataMap.forEach(product => {
        const productId = product.id;
        const tagsJson = safeJSONStringify(product.Tags);
        const notes = product.notes || '';
        const today = new Date().toISOString().split('T')[0];
        const imageUrl = product.image_url || 'https://via.placeholder.com/150'; // Use a slightly larger placeholder for cards

        // --- Table Row Creation Removed ---

        // --- Create Card Element (Always) ---
        const card = document.createElement('div');
        card.className = 'product-card bg-white rounded-lg border shadow-sm p-4 flex flex-col space-y-3'; // Added product-card class
        card.dataset.productId = productId;
        // console.log(`[renderProducts] Creating card for product ${productId}`); // DEBUG LOG

        card.innerHTML = `
            <div class="relative">
                <img src="${imageUrl}" alt="Sản phẩm" class="product-image w-full aspect-square object-cover rounded-md cursor-pointer" title="Nhấn để phóng to">
                <div class="absolute top-2 right-2">
                     <button data-action="toggle-actions-menu" class="p-1 bg-white rounded-full shadow text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                         <i data-lucide="more-vertical" class="h-4 w-4"></i>
                     </button>
                     <!-- Actions Dropdown Menu (Initially Hidden) -->
                     <div class="card-actions-menu hidden absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border z-10">
                         <button data-action="edit" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sửa</button>
                         <button data-action="delete" class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Xóa</button>
                     </div>
                </div>
            </div>
            <a href="${product.url}" target="_blank" class="text-sm font-medium text-blue-600 hover:underline truncate">${product.url}</a>
            <span
              class="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer w-fit ${product.purchased ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}"
              data-action="toggle-purchase"
              data-current-status="${product.purchased}"
            >
              ${product.purchased ? 'Đã mua' : 'Đang chờ'}
            </span>
            <p class="text-xs text-gray-500 mt-1">
                Tạo lúc: ${formatRelativeCreatedAt(product.created_at)}
            </p>
            <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">Thẻ</label>
                <input
                    class="inline-tagify-input block w-full text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    data-product-id="${productId}"
                    placeholder="Thêm thẻ..."
                    value="${product.Tags?.map(t => t.name).join(',') || ''}"
                    data-original-tags='${tagsJson}'
                 >
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">Ghi chú</label>
                <textarea
                    class="inline-notes-textarea block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows="2"
                    data-product-id="${productId}"
                    data-original-value="${notes}"
                    placeholder="Thêm ghi chú..."
                 >${notes}</textarea>
            </div>
        `;
        // console.log(`[renderProducts] Appending card for product ${productId} to cardsContainer`); // DEBUG LOG
        cardsContainer.appendChild(card);
        cardCount++; // DEBUG LOG

    });
    // --- End Render Loop ---
    console.log(`[renderProducts] Finished loop. Appended ${cardCount} cards.`); // DEBUG LOG
    console.log('[renderProducts] cardsContainer childElementCount:', cardsContainer.childElementCount); // DEBUG LOG

    lucide.createIcons(); // Initialize icons for both table and cards

    // Initialize features on the parent container to cover both table and cards
    console.log('[renderProducts] Initializing inline editing and image zoom...'); // DEBUG LOG
    initializeInlineEditing(productsContent);
    initImageZoomListeners(productsContent);
    console.log('[renderProducts] Finished initializing features.'); // DEBUG LOG

    // DEBUG LOG: Check computed styles after rendering and initialization
    try {
        // const tableContainer = document.querySelector('#products-content > div:first-child'); // Removed table container check
        const cardsContainer = document.getElementById('product-cards-container');
        if (cardsContainer) { // Removed tableContainer check
            // console.log('[renderProducts] Computed display - Table Container:', window.getComputedStyle(tableContainer).display); // Removed
            console.log('[renderProducts] Computed display - Cards Container:', window.getComputedStyle(cardsContainer).display);
        } else {
            console.warn('[renderProducts] Could not find cards container for computed style check.'); // Updated warning
        }
    } catch (e) {
        console.error('[renderProducts] Error checking computed styles:', e);
    }

}

export async function renderDashboardStats() {
    try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        // Import fetchProducts and fetchTrash locally if not already imported globally
        const { fetchProducts, fetchTrash, fetchApi } = await import('./api.js');

        // Fetch all data concurrently
        const [productResponse, trashItems, currentMonthStats] = await Promise.all([
            fetchProducts(), // This now returns { products: [], stats: {} }
            fetchTrash(),
            fetchApi(`/api/goals/stats?month=${currentMonth}&year=${currentYear}`).catch(err => {
                console.warn("No goal found for current month or error fetching stats:", err.message);
                return null;
            })
        ]);

        // Correctly extract the products array from the response
        const products = productResponse?.products || []; // Use optional chaining and default to empty array

        // Now use the 'products' array for calculations
        const totalProducts = products.length;
        const purchasedProducts = products.filter(p => p.purchased).length;
        const purchasedRatio = totalProducts > 0 ? (purchasedProducts / totalProducts) * 100 : 0;
        const totalVideos = products.reduce((sum, p) => sum + (p.video_count || 0), 0);
        const trashCount = trashItems.length;

        const videosThisMonth = currentMonthStats?.actual?.videos_logged || 0;
        const videoGoalThisMonth = currentMonthStats?.goal?.video_goal || 0;
        const videosMonthRatio = videoGoalThisMonth > 0 ? (videosThisMonth / videoGoalThisMonth) * 100 : 0;

        const goalProgress = currentMonthStats?.progress?.product_progress || 0;
        const goalActual = currentMonthStats?.actual?.products_purchased || 0;
        const goalTarget = currentMonthStats?.goal?.product_goal || 0;

        document.getElementById('stat-total-products').textContent = totalProducts;
        document.getElementById('stat-purchased-ratio').textContent = `${purchasedProducts}/${totalProducts}`;
        document.getElementById('stat-purchased-bar').style.width = `${purchasedRatio.toFixed(0)}%`;

        document.getElementById('stat-total-videos').textContent = totalVideos;
        document.getElementById('stat-videos-month-ratio').textContent = `${videosThisMonth}/${videoGoalThisMonth}`;
        document.getElementById('stat-videos-month-bar').style.width = `${videosMonthRatio.toFixed(0)}%`;

        document.getElementById('stat-goal-percentage').textContent = `${goalProgress.toFixed(0)}%`;
        document.getElementById('stat-goal-ratio').textContent = `${goalActual}/${goalTarget}`;
        document.getElementById('stat-goal-bar').style.width = `${goalProgress.toFixed(0)}%`;

        document.getElementById('stat-trash-count').textContent = trashCount;

        const recentProductsContainer = document.getElementById('dashboard-recent-products');
        if (recentProductsContainer) {
            recentProductsContainer.innerHTML = '';
            // Sort products by created_at descending (newest first) before slicing
            const sortedProducts = products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            const recent = sortedProducts.slice(0, 3); // Get the first 3 (newest)
            if (recent.length === 0) {
                recentProductsContainer.innerHTML = '<p class="text-sm text-gray-500">Không có sản phẩm gần đây.</p>';
            } else {
                recent.forEach(product => {
                    const div = document.createElement('div');
                    div.className = 'flex items-start gap-4 p-3 border rounded-lg';
                    const createdAtFormatted = formatRelativeCreatedAt(product.created_at); // Use helper function
                    div.innerHTML = `
                        <div class="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-md overflow-hidden"> <!-- Increased from w-16 h-16 to w-24 h-24 -->
                          <img src="${product.image_url || 'https://via.placeholder.com/120'}" alt="Sản phẩm" class="product-image w-full h-full object-cover cursor-pointer" title="Nhấn để phóng to">
                        </div>
                        <div class="flex-1 min-w-0 overflow-hidden">
                          <a href="${product.url}" target="_blank" class="text-sm font-medium hover:underline" style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${product.url}</a>
                          <div class="flex items-center flex-wrap gap-1 mt-1">
                             ${product.Tags?.map(t => `<span class="text-xs px-2 py-0.5 rounded" style="background-color: ${t.color || '#cccccc'}; color: ${getContrastYIQ(t.color || '#cccccc')}; border: 1px solid #ccc;">${t.name}</span>`).join('') || ''}
                          </div>
                          <div class="flex items-center justify-between mt-2">
                            <div class="flex items-center gap-2 text-sm text-gray-500">
                              <i data-lucide="film" class="h-4 w-4"></i>
                              <span>${product.video_count || 0} videos</span>
                            </div>
                            
                            <span class="text-xs text-gray-400">${createdAtFormatted}</span>
                          </div>
                        </div>
                    `;
                    recentProductsContainer.appendChild(div);
                });
            }
        }

        const monthlyGoalContainer = document.getElementById('dashboard-monthly-goal-details');
        const monthlyGoalTitle = document.getElementById('dashboard-monthly-goal-title');
        if (monthlyGoalContainer && monthlyGoalTitle) {
             const monthName = new Date(currentYear, currentMonth - 1, 1).toLocaleString('default', { month: 'long' });
             monthlyGoalTitle.textContent = `Mục tiêu ${monthName}`;

            if (!currentMonthStats) {
                monthlyGoalContainer.innerHTML = '<p class="text-sm text-gray-500">No goal set for this month.</p>';
            } else {
                const stats = currentMonthStats;
                const productProgress = stats.progress.product_progress.toFixed(0);
                const videoProgress = stats.progress.video_progress.toFixed(0);
                monthlyGoalContainer.innerHTML = `
                    <div>
                      <div class="flex justify-between text-sm font-medium mb-1">
                        <span>Sản phẩm đã thêm</span>
                        <span>${stats.actual.products_purchased} / ${stats.goal.product_goal}</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${productProgress}%"></div>
                      </div>
                    </div>
                    <div>
                      <div class="flex justify-between text-sm font-medium mb-1">
                        <span>Video đã quay</span>
                        <span>${stats.actual.videos_logged} / ${stats.goal.video_goal}</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-green-600 h-2 rounded-full" style="width: ${videoProgress}%"></div>
                      </div>
                    </div>
                    ${stats.goal.category_goals && stats.goal.category_goals.length > 0 ? `
                    <div class="pt-4 border-t">
                      <h3 class="text-sm font-medium mb-2">Theo Danh mục</h3>
                      <div class="space-y-3">
                        ${stats.goal.category_goals.map(cg => {
                            const categoryGoalTarget = cg.product_goal;
                            const categoryActual = 0; // Placeholder - Needs actual data
                            const categoryProgress = categoryGoalTarget > 0 ? (categoryActual / categoryGoalTarget) * 100 : 0;
                            return `
                            <div>
                              <div class="flex justify-between text-xs mb-1">
                                <span>${cg.Tag?.name || 'Không xác định'}</span>
                                <span>${categoryActual}/${categoryGoalTarget}</span>
                              </div>
                              <div class="w-full bg-gray-200 rounded-full h-1.5">
                                <div class="bg-purple-600 h-1.5 rounded-full" style="width: ${categoryProgress.toFixed(0)}%"></div>
                              </div>
                            </div>
                            `;
                        }).join('')}
                      </div>
                    </div>
                    ` : ''}
                `;
            }
        }

        lucide.createIcons();
        initImageZoomListeners(document.getElementById('dashboard-content')); // Initialize zoom for dashboard

    } catch (error) {
        console.error('[renderDashboardStats] Failed to load dashboard stats:', error.message); // Log only message
        if (error.message === 'Authentication failed') {
            console.log('[renderDashboardStats] Authentication failed, likely redirecting to login.');
            // Consider calling logout() or showAuth() here directly
        }
        const dashboardContent = document.querySelector('#dashboard-content');
        if(dashboardContent) dashboardContent.innerHTML = '<p class="text-red-500">Error loading dashboard data.</p>';
    }
}

async function fetchAndRenderGoalStats(goal, goalElement) {
    try {
        const { fetchApi } = await import('./api.js'); // Import locally if needed
        const stats = await fetchApi(`/api/goals/stats?month=${goal.month}&year=${goal.year}`);
        const statsContainer = goalElement.querySelector('.goal-stats-container');

        if (statsContainer && stats) {
            const productProgress = stats.progress.product_progress.toFixed(0);
            const videoProgress = stats.progress.video_progress.toFixed(0);

            statsContainer.innerHTML = `
                <div class="mt-4 pt-4 border-t">
                  <h4 class="text-sm font-medium mb-2">Tiến độ</h4>
                  <div class="space-y-3">
                    <div>
                      <div class="flex justify-between text-sm font-medium mb-1">
                        <span>Sản phẩm đã thêm</span>
                        <span>${stats.actual.products_purchased} / ${stats.goal.product_goal}</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${productProgress}%"></div>
                      </div>
                    </div>
                    <div>
                      <div class="flex justify-between text-sm font-medium mb-1">
                        <span>Video đã quay</span>
                        <span>${stats.actual.videos_logged} / ${stats.goal.video_goal}</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-green-600 h-2 rounded-full" style="width: ${videoProgress}%"></div>
                      </div>
                    </div>
                  </div>
                </div>
            `;
        }
    } catch (error) {
        console.error(`Failed to fetch stats for goal ${goal.id}:`, error);
        const statsContainer = goalElement.querySelector('.goal-stats-container');
        if(statsContainer) statsContainer.innerHTML = `<p class="text-xs text-red-500 mt-4">Error loading progress.</p>`;
    }
}

export function renderGoals(goals) {
    console.log('Rendering goals:', goals);
    const listContainer = document.getElementById('goals-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    if (!goals || goals.length === 0) {
        listContainer.innerHTML = '<p class="text-center text-gray-500">No goals set yet.</p>';
        return;
    }

    goals.forEach(goal => {
        const goalElement = document.createElement('div');
        goalElement.className = 'goal-item rounded-xl border bg-white p-6 shadow-sm mb-4';
        goalElement.dataset.goalId = goal.id;
        goalElement.innerHTML = `
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold">${new Date(goal.year, goal.month - 1).toLocaleString('default', { month: 'long' })} ${goal.year}</h3>
              <div>
                <button data-action="edit-goal" class="text-blue-600 hover:text-blue-900 text-sm mr-2">Sửa</button>
                <button data-action="delete-goal" class="text-red-600 hover:text-red-900 text-sm">Xóa</button>
              </div>
            </div>
            <div class="space-y-2">
              <div>
                <div class="flex justify-between text-sm font-medium mb-1">
                  <span>Mục tiêu thêm sản phẩm</span>
                  <span>${goal.product_goal}</span>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm font-medium mb-1">
                  <span>Mục tiêu Video đã quay</span>
                  <span>${goal.video_goal}</span>
                </div>
              </div>
              ${goal.CategoryGoals && goal.CategoryGoals.length > 0 ? `
              <div class="pt-2 border-t">
                <h4 class="text-xs font-medium mb-1">Theo Danh mục:</h4>
                <div class="space-y-1">
                  ${goal.CategoryGoals.map(cg => `
                    <div class="flex justify-between text-xs">
                      <span>${cg.Tag?.name || 'Thẻ không xác định'}</span>
                      <span>${cg.product_goal} products</span>
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}
            </div>
            <div class="goal-stats-container">
                <p class="text-xs text-gray-400 mt-4">Loading progress...</p>
            </div>
        `;
        listContainer.appendChild(goalElement);
        fetchAndRenderGoalStats(goal, goalElement); // Call the async function
    });
}

export function renderTrash(products) {
    const tbody = document.getElementById('trash-list');
    const trashContent = document.getElementById('trash-content'); // Get parent for zoom init
    if (!tbody || !trashContent) return;
    tbody.innerHTML = '';

    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-gray-500">Trash is empty.</td></tr>';
        return;
    }

    products.forEach(product => {
      const row = document.createElement('tr');
      row.dataset.productId = product.id;
      const deletedDate = product.deleted_at ? new Date(product.deleted_at).toLocaleDateString() : 'N/A';
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div class="flex-shrink-0 h-16 w-16 bg-gray-200 rounded-md overflow-hidden">
              <img src="${product.image_url || 'https://via.placeholder.com/60'}" alt="Sản phẩm" class="product-image h-full w-full object-cover cursor-pointer" title="Nhấn để phóng to">
            </div>
            <div class="ml-4">
              <div class="text-sm font-medium text-gray-900 truncate max-w-xs"><a href="${product.url}" target="_blank" class="hover:underline">${product.url}</a></div>
              <div class="flex items-center flex-wrap gap-1 mt-1">
                 ${product.Tags?.map(t => `<span class="text-xs px-2 py-0.5 rounded" style="background-color: ${t.color || '#cccccc'}; color: ${getContrastYIQ(t.color || '#cccccc')}; border: 1px solid #ccc;">${t.name}</span>`).join('') || '<span class="text-xs text-gray-400">No tags</span>'}
              </div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${deletedDate}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button data-action="restore" class="text-green-600 hover:text-green-900 mr-3">Khôi phục</button>
          <button data-action="permanent-delete" class="text-red-600 hover:text-red-900">Xóa vĩnh viễn</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    initImageZoomListeners(trashContent); // Initialize image zoom for trash
}

// Render product statistics
export function renderProductStats(stats) {
    const totalCountEl = document.getElementById('stat-total-count');
    const pendingCountEl = document.getElementById('stat-pending-count');
    const purchasedCountEl = document.getElementById('stat-purchased-count');

    if (totalCountEl) totalCountEl.textContent = stats?.total ?? 0;
    if (pendingCountEl) pendingCountEl.textContent = stats?.pending ?? 0;
    if (purchasedCountEl) purchasedCountEl.textContent = stats?.purchased ?? 0;
}


// Update the active state of stat filter buttons
export function updateActiveStatButton(activeStatus) {
    const buttons = document.querySelectorAll('.stat-filter-btn');
    buttons.forEach(button => {
        const buttonStatus = button.dataset.filterStatus;
        // Convert activeStatus to string for comparison, handle null/undefined for 'All'
        // Ensure empty string ('') from 'All' button matches undefined/null activeStatus
        const isActive = (activeStatus === undefined || activeStatus === null || activeStatus === '')
                         ? buttonStatus === ''
                         : String(buttonStatus) === String(activeStatus);
        button.dataset.active = isActive ? 'true' : 'false';
        // Optionally add/remove Tailwind classes for more complex styling
        // if (isActive) {
        //     button.classList.add('ring-2', 'ring-blue-500');
        // } else {
        //     button.classList.remove('ring-2', 'ring-blue-500');
        // }
    });
}



// --- Pagination Rendering ---
export function renderPaginationControls(totalProducts, currentPage, totalPages, limit) {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) {
        console.error("Pagination container '#pagination-controls' not found.");
        return;
    }

    paginationContainer.innerHTML = ''; // Clear previous controls

    if (totalPages <= 1) {
        return; // No need for pagination if there's only one page or less
    }

    const createButton = (text, page, isDisabled = false, isCurrent = false) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.dataset.page = page;
        button.disabled = isDisabled;
        button.className = `px-3 py-1 border rounded text-sm `;
        if (isCurrent) {
            button.className += ' bg-blue-500 text-white border-blue-500';
        } else if (isDisabled) {
            button.className += ' bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed';
        } else {
            button.className += ' bg-white text-gray-700 border-gray-300 hover:bg-gray-50';
        }
        return button;
    };

    // Previous Button
    const prevButton = createButton('Previous', currentPage - 1, currentPage === 1);
    paginationContainer.appendChild(prevButton);

    // Page Info (Simple version)
    const pageInfo = document.createElement('span');
    pageInfo.className = 'text-sm text-gray-600 px-3';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    paginationContainer.appendChild(pageInfo);

    // Next Button
    const nextButton = createButton('Next', currentPage + 1, currentPage === totalPages);
    paginationContainer.appendChild(nextButton);

    // TODO: Implement more sophisticated page number generation if needed (e.g., ellipsis)
}
