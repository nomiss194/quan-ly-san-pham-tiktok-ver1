// ==================================
// --- API Functions Module ---
// ==================================

// Centralized fetch function with authentication handling
// Throws specific error 'Authentication failed' on 401 for caller to handle logout
export async function fetchApi(url, options = {}) {
    const token = localStorage.getItem('token');
    // No token check here, let the server return 401 if needed,
    // or rely on middleware protection for most routes.
    // If a route *requires* auth and might be called before login,
    // the caller should check for token first.

    try {
        const defaultHeaders = {
            'Authorization': token ? `Bearer ${token}` : undefined, // Add token if available
            // 'Content-Type': 'application/json' // Default Content-Type removed here
            // 'Content-Type': 'application/json' // Default Content-Type removed here
        };
        // Remove undefined Authorization header if token doesn't exist
        if (!defaultHeaders.Authorization) delete defaultHeaders.Authorization;

        // Conditionally add Content-Type if body is not FormData
        const headers = {
            ...defaultHeaders,
            ...options.headers,
        };
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        } else {
            // Let the browser set the Content-Type for FormData
            delete headers['Content-Type'];
        }


        const config = {
            ...options,
            headers: headers
        };

        const response = await fetch(url, config);

        if (response.status === 401) {
            // Throw specific error for the caller (e.g., main.js) to handle logout
            throw new Error('Authentication failed');
        }
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: `HTTP error! Status: ${response.status}, Response not JSON.` };
            }
            // Use error message from server response if available
            throw new Error(errorData.error || `Failed to fetch ${url}`);
        }
        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return null; // Handle No Content response
        }
        return await response.json(); // Parse JSON response
    } catch (error) {
        // Log error and re-throw for caller to handle UI feedback
        console.error(`[fetchApi] Error fetching ${url}:`, error.message); // Log only message for clarity
        if (error.message === 'Authentication failed') {
            console.log("[fetchApi] Authentication failed error detected.");
        }
        throw error; // Re-throw the original error object
    }
}

// --- Auth API Calls (will be called by auth.js module) ---
export async function loginApi(email, password) {
    // Login doesn't need Authorization header, handled by fetchApi logic
    return fetch('/api/auth/login', { // Use fetch directly or a modified fetchApi without auth
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(async response => {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
            throw new Error(errorData.error || 'Login failed');
        }
        return response.json();
    });
}

export async function registerApi(email, password, name) {
    return fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    }).then(async response => {
        if (!response.ok) {
           const errorData = await response.json().catch(() => ({ error: 'Registration failed' }));
           throw new Error(errorData.error || 'Registration failed');
        }
        return response.json();
    });
}


// --- Product API Calls ---
export async function fetchProducts(filters = {}, page = 1, limit = 30) {
    const queryParams = new URLSearchParams();
    if (filters.purchased !== undefined && filters.purchased !== '') queryParams.append('purchased', filters.purchased);
    if (filters.tags) queryParams.append('tags', filters.tags);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.maxVideoCount !== undefined && filters.maxVideoCount !== '') queryParams.append('maxVideoCount', filters.maxVideoCount);

    // Add pagination parameters
    queryParams.append('page', page);
    queryParams.append('limit', limit);

    const queryString = queryParams.toString();
    return fetchApi(`/api/products${queryString ? `?${queryString}` : ''}`);
}

export async function addProduct(productData) {
    return fetchApi('/api/products', {
        method: 'POST',
        body: JSON.stringify(productData)
    });
}

export async function updateProduct(id, productData) {
    return fetchApi(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
    });
}

export async function deleteProduct(id) { // Soft delete
    return fetchApi(`/api/products/${id}`, { method: 'DELETE' });
}

// --- Goal API Calls ---
export async function fetchGoals() {
    return fetchApi('/api/goals');
}

export async function createOrUpdateGoal(goalData) {
    return fetchApi('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goalData)
    });
}

export async function deleteGoal(id) {
    return fetchApi(`/api/goals/${id}`, { method: 'DELETE' });
}

export async function fetchGoalStats(month, year) {
     return fetchApi(`/api/goals/stats?month=${month}&year=${year}`);
}

// --- Video Log API Calls ---
export async function addVideoLog(productId, date, count) {
    return fetchApi(`/api/products/${productId}/video_logs`, {
        method: 'POST',
        body: JSON.stringify({ date, count })
    });
}

export async function getVideoLogForDate(productId, date) {
    return fetchApi(`/api/products/${productId}/video_logs?date=${date}`);
}

export async function fetchVideoLogs(productId) {
    return fetchApi(`/api/products/${productId}/video_logs/all`);
}

// --- Trash API Calls ---
export async function fetchTrash() {
    return fetchApi('/api/products/trash');
}

export async function restoreProduct(id) {
    return fetchApi(`/api/products/${id}/restore`, { method: 'POST' });
}

export async function permanentDeleteProduct(id) {
    return fetchApi(`/api/products/${id}/permanent`, { method: 'DELETE' });
}

// --- Tag API Calls ---
export async function fetchAllTags() {
    return fetchApi('/api/tags');
}

export async function createTag(tagData) {
    return fetchApi('/api/tags', { method: 'POST', body: JSON.stringify(tagData) });
}

export async function updateTag(id, tagData) {
    return fetchApi(`/api/tags/${id}`, { method: 'PUT', body: JSON.stringify(tagData) });
}

export async function deleteTagApi(id) {
    return fetchApi(`/api/tags/${id}`, { method: 'DELETE' });
}

// Add a tag to a specific product
export async function addProductTag(productId, tagData) {
    // tagData could be { name: 'newTag' } or potentially { id: existingTagId }
    // Backend should handle finding or creating the tag and associating it.
    return fetchApi(`/api/products/${productId}/tags`, {
        method: 'POST',
        body: JSON.stringify(tagData)
    });
}

// Remove a tag from a specific product
export async function removeProductTag(productId, tagId) {
    return fetchApi(`/api/products/${productId}/tags/${tagId}`, {
        method: 'DELETE'
    });
}