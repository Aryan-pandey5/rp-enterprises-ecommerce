// Centralized API configuration and reusable API request helpers for R.P. Enterprises.

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

/**
 * Normalizes image & media URLs across development and production environments.
 * Handles relative paths (/media/...), full URLs (http/https), blob preview URLs, data URLs, and nulls.
 * @param {string} url - Image URL string from API or file preview
 * @returns {string|null} - Formatted absolute or blob image URL, or null if empty
 */
export const getMediaUrl = (url) => {
  if (!url) return null;
  if (typeof url !== 'string') return null;
  let trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  const backendOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
  const isProdBackend = !backendOrigin.includes('localhost') && !backendOrigin.includes('127.0.0.1');

  // Fix legacy or local DB URLs containing localhost / 127.0.0.1 when running against production backend
  if ((trimmed.includes('127.0.0.1') || trimmed.includes('localhost')) && isProdBackend) {
    const pathIndex = trimmed.indexOf('/media/');
    if (pathIndex !== -1) {
      trimmed = trimmed.substring(pathIndex);
    }
  }

  // Prepend backend origin if relative path
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    trimmed = `${backendOrigin}${cleanPath}`;
  }

  // Enforce HTTPS if frontend page is served over HTTPS to avoid Mixed Content browser blocking
  if (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:') {
    if (trimmed.startsWith('http://') && !trimmed.includes('localhost') && !trimmed.includes('127.0.0.1')) {
      trimmed = trimmed.replace(/^http:\/\//i, 'https://');
    }
  }

  return trimmed;
};

/**
 * Retrieves the stored access token from localStorage.
 */
export const getAuthToken = () => localStorage.getItem('rp_access_token');

/**
 * Helper to fetch data with automatic authorization headers.
 * @param {string} endpoint - The API endpoint starting with '/'
 * @param {object} options - Fetch configuration options
 */
export const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
};

// Auth API endpoints
export const authService = {
  me: () => apiFetch('/auth/me/'),
  login: (mobileNumber, password) =>
    fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile_number: mobileNumber, password }),
    }),
  signup: (payload) =>
    fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  adminLogin: (mobileNumber, password) =>
    fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile_number: mobileNumber, password }),
    }),
  requestPasswordReset: (email) =>
    fetch(`${API_BASE_URL}/auth/password-reset/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }),
  confirmPasswordReset: (uidb64, token, password, confirmPassword) =>
    fetch(`${API_BASE_URL}/auth/password-reset/confirm/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uidb64, token, password, confirm_password: confirmPassword }),
    }),
  changePassword: (oldPassword, newPassword, confirmPassword) =>
    apiFetch('/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    }),
};


// Product API endpoints
export const productService = {
  getAll: (params = '') => apiFetch(`/products/${params ? `?${params}` : ''}`),
  getById: (id) => apiFetch(`/products/${id}/`),
};

// Order API endpoints
export const orderService = {
  create: (orderData) =>
    apiFetch('/orders/', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),
  getMyOrders: () => apiFetch('/orders/my_orders/'),
  getById: (id) => apiFetch(`/orders/${id}/`),
};

// Customer API endpoints
export const customerService = {
  getProfile: () => apiFetch('/auth/me/'),
};

export default apiFetch;
