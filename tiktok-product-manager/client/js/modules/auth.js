// ==================================
// --- Auth Module ---
// Handles login, registration, logout logic and showing auth UI
// ==================================

// Import API functions (assuming api.js is in the same directory)
import { loginApi, registerApi } from './api.js';
// Import routing function (will be defined in routing.js)
import { showDashboard } from './routing.js';

// Function to handle login logic
export async function login(email, password) {
  try {
    const data = await loginApi(email, password); // Call the specific API function
    localStorage.setItem('token', data.token);
    showDashboard(); // Switch to dashboard view after successful login
    return data.user;
  } catch (error) {
    console.error('Login error:', error);
    // Re-throw the error for the caller (e.g., event listener) to handle UI feedback
    throw error;
  }
}

// Function to handle registration logic
export async function register(email, password, name) {
  try {
    const data = await registerApi(email, password, name); // Call the specific API function
    // Optionally automatically log in the user after registration,
    // or just show a success message and let them log in manually.
    // For now, just return the result.
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

// Function to handle logout
export function logout() {
  localStorage.removeItem('token');
  showAuth(); // Show login page after logout
}

// Function to show the authentication section and hide the dashboard
export function showAuth() {
    // console.log("showAuth called");
    document.getElementById('auth-section')?.classList.remove('hidden');
    document.getElementById('dashboard-section')?.classList.add('hidden');
    // Reset forms when showing auth section
    document.getElementById('login-form')?.reset();
    document.getElementById('register-form')?.reset();
    // Ensure login form is visible and register form is hidden initially
    document.getElementById('register-form')?.classList.add('hidden');
    document.getElementById('login-form')?.classList.remove('hidden');
    document.getElementById('show-register')?.classList.remove('hidden');
}