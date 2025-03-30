// ==================================
// --- Goal Event Handlers Module ---
// ==================================

import { createOrUpdateGoal, deleteGoal as deleteGoalApi } from './api.js';
import { loadGoalsList } from './dataLoaders.js'; // For refreshing goals list
import { closeModal } from './modal.js';
import { renderDashboardStats } from './uiRender.js'; // Import for updating the dashboard

// Handler for deleting a goal
export async function handleDeleteGoal(goalId) {
    if (!confirm('Are you sure you want to delete this goal? This cannot be undone.')) return;
    try {
        await deleteGoalApi(goalId); // Use renamed API function
        await loadGoalsList(); // Refresh goal list
        
        // If on dashboard page, update the stats
        if (window.location.pathname === '/' || window.location.pathname === '') {
            await renderDashboardStats();
        }
        
        alert('Mục tiêu đã được xóa thành công.');
    } catch (error) {
        alert(error.message || 'Xóa mục tiêu thất bại.');
    }
}

// Handler for Add/Update Goal form submission
export async function handleGoalFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const id = form.id === 'edit-goal-form' ? document.getElementById('edit-goal-id').value : undefined;
    const month = document.getElementById(id ? 'edit-goal-month' : 'goal-month').value;
    const year = document.getElementById(id ? 'edit-goal-year' : 'goal-year').value;
    const product_goal = document.getElementById(id ? 'edit-goal-product' : 'goal-product').value;
    const video_goal = document.getElementById(id ? 'edit-goal-video' : 'goal-video').value;

    const categoryContainerId = id ? 'edit-category-goals-container' : 'category-goals-container';
    const categoryGoalsInputs = document.querySelectorAll(`#${categoryContainerId} .category-goal-item`);
    const category_goals = Array.from(categoryGoalsInputs).map(item => ({
        tag_name: item.querySelector('.category-goal-tag').value,
        product_goal: item.querySelector('.category-goal-value').value
    })).filter(cg => cg.tag_name && cg.product_goal);

    const goalData = { month, year, product_goal, video_goal, category_goals };
    if (id) {
        goalData.id = id; // Add id if updating
    }

    try {
        await createOrUpdateGoal(goalData);
        closeModal(id ? 'edit-goal-modal' : 'goal-modal');
        
        // Always refresh the goals list if it exists
        await loadGoalsList();
        
        // If on dashboard page, update the stats
        if (window.location.pathname === '/' || window.location.pathname === '') {
            await renderDashboardStats();
        }
        
        alert(`Goal ${id ? 'updated' : 'saved'} successfully!`);
    } catch (error) {
        alert(error.message || `Failed to ${id ? 'update' : 'save'} goal`);
    }
}

// Helper function (might move to modal.js or keep here if only used for goals)
// This function is called from modal.js (populateGoalForm)
export function addCategoryGoalInput(modalType = 'add', tagName = '', goalValue = '') {
    const containerId = modalType === 'edit' ? 'edit-category-goals-container' : 'category-goals-container';
    const container = document.getElementById(containerId);
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'category-goal-item grid grid-cols-3 gap-2 items-center';
    div.innerHTML = `
        <input type="text" value="${tagName}" class="category-goal-tag col-span-2 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Category Name">
        <input type="number" value="${goalValue}" min="0" class="category-goal-value block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Goal">
        <button type="button" class="remove-category-goal text-red-500 hover:text-red-700 justify-self-start"><i data-lucide="x-circle" class="h-4 w-4"></i></button>
    `;
    div.querySelector('.remove-category-goal').addEventListener('click', () => div.remove());

    const addButtonId = modalType === 'edit' ? 'edit-add-category-goal-btn' : 'add-category-goal-btn';
    const addButton = document.getElementById(addButtonId);
    if (addButton) {
        container.insertBefore(div, addButton);
    } else {
        container.appendChild(div);
    }
    if (typeof lucide !== 'undefined') { // Check if lucide is available
        lucide.createIcons();
    }
}