/**
 * API Service with Auth Support
 */

import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Track refresh state
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response interceptor for auto token refresh
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/verify-email") ||
      originalRequest.url?.includes("/auth/forgot-password") ||
      originalRequest.url?.includes("/auth/reset-password")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => API(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await API.post("/auth/refresh");
        processQueue(null);
        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        window.dispatchEvent(new CustomEvent("auth:logout"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/* =====================================================
   AUTH API
===================================================== */

export const authAPI = {
  login: (credentials) => API.post("/auth/login", credentials),
  register: (userData) => API.post("/auth/register", userData),
  logout: () => API.post("/auth/logout"),
  logoutAll: () => API.post("/auth/logout-all"),
  refresh: () => API.post("/auth/refresh"),
  getMe: () => API.get("/auth/me"),
  getSessions: () => API.get("/auth/sessions"),
  verifyEmail: (token) => API.post("/auth/verify-email", { token }),
  resendVerification: (email) => API.post("/auth/resend-verification", { email }),
  getVerificationStatus: () => API.get("/auth/verification-status"),
  forgotPassword: (email) => API.post("/auth/forgot-password", { email }),
  resetPassword: (data) => API.post("/auth/reset-password", data),
};

/* =====================================================
   PRODUCTS API
===================================================== */

export const getProducts = (params) => API.get("/products", { params });

export const filterProducts = (params) => API.get("/products/filter", { params });

export const searchProducts = (q) => API.get("/products/search", { params: { q } });

export const compareByModel = (model_id) =>
  API.get("/products/compare", { params: { model_id } });

export const getLatestTVs = getProducts;

export const getBestDeals = (params) => API.get("/products/best-deals", { params });

/* =====================================================
   ANALYTICS API
===================================================== */

export const getBrandAnalytics = () => API.get("/analytics/brands");

export const getPlatformAnalytics = () => API.get("/analytics/platforms");

export const getProductAnalytics = () => API.get("/analytics/products");

/* =====================================================
   PLATFORMS API
===================================================== */

export const getPlatformList = () => API.get("/platforms/list");

export const getBrandsByPlatform = (platform) =>
  API.get(`/platforms/${platform}/brands`);

export const getModelsByPlatformBrand = (platform, brand, page = 1, pageSize = 20) =>
  API.get(`/platforms/${platform}/brands/${brand}/models`, {
    params: { page, page_size: pageSize },
  });

/* =====================================================
   FILTERS API
===================================================== */

export const getAllBrands = () => API.get("/filters/brands");

export const getPriceRange = () => API.get("/filters/price-range");

/* =====================================================
   WISHLIST API
===================================================== */

export const wishlistAPI = {
  getWishlist: () => API.get("/wishlist"),
  addToWishlist: (modelId) => API.post("/wishlist", { model_id: modelId }),
  removeFromWishlist: (modelId) => API.delete(`/wishlist/${modelId}`),
  checkStatus: (modelId) => API.get(`/wishlist/check/${modelId}`),
  checkBulk: (modelIds) => API.post("/wishlist/check-bulk", modelIds),
  toggle: (modelId) => API.post(`/wishlist/toggle/${modelId}`),
  getCount: () => API.get("/wishlist/count"),
};

/* =====================================================
   PRICE ALERTS API
===================================================== */

export const alertsAPI = {
  getAlerts: () => API.get("/alerts"),
  createAlert: (modelId, targetPrice) => 
    API.post("/alerts", { model_id: modelId, target_price: targetPrice }),
  updateAlert: (alertId, data) => API.patch(`/alerts/${alertId}`, data),
  deleteAlert: (alertId) => API.delete(`/alerts/${alertId}`),
  checkStatus: (modelId) => API.get(`/alerts/check/${modelId}`),
  toggleAlert: (alertId) => API.post(`/alerts/toggle/${alertId}`),
  getNotifications: (limit = 50) => API.get(`/alerts/notifications?limit=${limit}`),
  getCount: () => API.get("/alerts/count"),
};

/* =====================================================
   ADMIN API (with Scrapers & ETL)
===================================================== */

export const adminAPI = {
  // Dashboard
  getDashboard: () => API.get("/admin/dashboard"),
  
  // Users
  getUsers: (params) => API.get("/admin/users", { params }),
  updateUser: (userId, data) => API.patch(`/admin/users/${userId}`, data),
  deleteUser: (userId) => API.delete(`/admin/users/${userId}`),
  
  // Analytics
  getMostWishlisted: (limit = 10) => API.get(`/admin/analytics/most-wishlisted?limit=${limit}`),
  getMostAlerted: (limit = 10) => API.get(`/admin/analytics/most-alerted?limit=${limit}`),
  getRecentNotifications: (limit = 50) => API.get(`/admin/analytics/recent-notifications?limit=${limit}`),
  getUserGrowth: (days = 30) => API.get(`/admin/analytics/user-growth?days=${days}`),
  getAlertsActivity: (days = 30) => API.get(`/admin/analytics/alerts-activity?days=${days}`),
  
  // Actions
  runAlertEngine: () => API.post("/admin/run-alert-engine"),
  
  // Scrapers & ETL Control
  getScraperStatus: () => API.get("/admin/scrapers/status"),
  getJobStatus: (jobId) => API.get(`/admin/scrapers/job/${jobId}`),
  runScraper: (scraperName) => API.post(`/admin/scrapers/run/${scraperName}`),
  runETL: () => API.post("/admin/etl/run"),
  runFullPipeline: () => API.post("/admin/scrapers/run-full-pipeline"),
  clearCompletedJobs: () => API.delete("/admin/scrapers/jobs/clear"),
};

/* =====================================================
   USER SETTINGS API
===================================================== */

export const settingsAPI = {
  getProfile: () => API.get("/settings/profile"),
  updateProfile: (data) => API.patch("/settings/profile", null, { params: data }),
  changePassword: (data) => API.post("/settings/change-password", null, { params: data }),
  getAlertPreferences: () => API.get("/settings/alert-preferences"),
  disableAllAlerts: () => API.post("/settings/disable-all-alerts"),
  enableAllAlerts: () => API.post("/settings/enable-all-alerts"),
  deleteAllAlerts: () => API.delete("/settings/delete-all-alerts"),
  clearWishlist: () => API.delete("/settings/clear-wishlist"),
  exportData: () => API.get("/settings/export-data"),
  deleteAccount: (password, confirm = true) => 
    API.delete("/settings/delete-account", { params: { password, confirm } }),
  unsubscribe: (email) => API.post("/settings/unsubscribe", null, { params: { email } }),
};

/* =====================================================
   PRICE HISTORY CHART ENDPOINTS
===================================================== */

export const getPriceHistoryCharts = (modelId, days = 30) => {
  return API.get(`/products/${modelId}/charts/price-history`, {
    params: { days }
  });
};

export const getBestPriceChart = (modelId, days = 30) => {
  return API.get(`/products/${modelId}/charts/best-price`, {
    params: { days }
  });
};

export const getPriceHistoryData = (modelId, days = 30) => {
  return API.get(`/products/${modelId}/price-history-data`, { params: { days } });
};

/* =====================================================
   ALIASES
===================================================== */

export const getBrands = getBrandAnalytics;
export const getPlatforms = getPlatformAnalytics;

export default API;