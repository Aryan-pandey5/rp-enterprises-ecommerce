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
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  const origin = API_BASE_URL.replace(/\/api\/?$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${origin}${cleanPath}`;
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
