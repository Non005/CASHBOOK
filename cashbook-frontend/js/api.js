/**
 * YOGI MANAGEMENT SYSTEM — API Bridge
 * File: js/api.js 
 */

const CONFIG_KEYS = {
  TOKEN: (window.CONFIG && window.CONFIG.STORAGE_KEY_TOKEN) || "yogi_auth_token",
  USER: (window.CONFIG && window.CONFIG.STORAGE_KEY_USER) || "yogi_user_name",
  EXPIRES: (window.CONFIG && window.CONFIG.STORAGE_KEY_EXPIRES) || "yogi_token_expires_at"
};

window.AppState = window.AppState || {
  currentUser: localStorage.getItem(CONFIG_KEYS.USER) || null,
  authToken: localStorage.getItem(CONFIG_KEYS.TOKEN) || null,
  currentTab: "home"
};

// Global Read Cache Container
window.gReadCache = window.gReadCache || {};

/**
 * Clears cached read requests
 */
window.clearReadCache = function (prefix) {
  if (!prefix) { 
    window.gReadCache = {}; 
    return; 
  }
  Object.keys(window.gReadCache).forEach(k => {
    if (k.startsWith(prefix)) delete window.gReadCache[k];
  });
};

/**
 * Toggle Fullscreen Loading Overlay
 */
window.toggleLoading = function (show) {
  const overlay = document.getElementById("loading-overlay");
  if (!overlay) return;
  overlay.classList.toggle("hidden", !show);
};

/**
 * XSS Helper
 */
window.escapeHtml = function (str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

/**
 * Toast Notification Popup
 */
window.showToast = function (type, message) {
  const box = document.getElementById("toast-container");
  if (!box) return;

  const el = document.createElement("div");
  const isSuccess = String(type).toUpperCase() === "SUCCESS";
  
  el.className = `p-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-extrabold transition-all transform translate-y-4 opacity-0 duration-300 pointer-events-auto bg-[#0e172a] border ${
    isSuccess ? "border-emerald-500/50 text-emerald-300 shadow-emerald-500/10" : "border-rose-500/50 text-rose-300 shadow-rose-500/10"
  }`;
  
  el.innerHTML = `
    <div class="w-6 h-6 rounded-lg ${isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'} flex items-center justify-center shrink-0">
      <i class="fa-solid ${isSuccess ? "fa-circle-check" : "fa-circle-exclamation"} text-sm"></i>
    </div>
    <span>${window.escapeHtml(message)}</span>
  `;
  
  box.appendChild(el);
  requestAnimationFrame(() => el.classList.remove("translate-y-4", "opacity-0"));

  setTimeout(() => {
    el.classList.add("translate-y-4", "opacity-0");
    setTimeout(() => el.remove(), 300);
  }, 3600);
};

/**
 * Central API Request Bridge
 */
window.callApi = async function (action, payload = {}, opts = {}) {
  const method = opts.method || (action.startsWith("get") || action === "ping" ? "GET" : "POST");
  const isRead = action.startsWith("get");
  const cacheKey = `${action}:${JSON.stringify(payload)}`;

  // Return cached data if available and not forced refresh
  if (isRead && !opts.forceRefresh && window.gReadCache[cacheKey]) {
    return window.gReadCache[cacheKey];
  }

  const token = window.AppState.authToken || localStorage.getItem(CONFIG_KEYS.TOKEN) || "";
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Resolve API Base URL safely from config.js or fallback
  let baseUrl = (typeof window.getApiUrl === "function" && window.getApiUrl()) ||
                (window.CONFIG && window.CONFIG.API_URL) || 
                "https://yogi-list.kotuntunwin1985.workers.dev";

  const fetchOpts = { method, headers };

  // Remove null/undefined values
  const cleanPayload = {};
  Object.keys(payload).forEach(key => {
    if (payload[key] !== undefined && payload[key] !== null) {
      cleanPayload[key] = payload[key];
    }
  });

  let url = baseUrl;
  if (method === "GET") {
    const params = new URLSearchParams({ action, token, ...cleanPayload });
    url += (url.includes("?") ? "&" : "?") + params.toString();
  } else {
    fetchOpts.body = JSON.stringify({ action, token, ...cleanPayload });
  }

  let response;
  try {
    response = await fetch(url, fetchOpts);
  } catch (err) {
    console.error("Fetch Error:", err);
    window.showToast("ERROR", `ဆာဗာ ချိတ်ဆက်၍မရပါ: အင်တာနက် ချိတ်ဆက်မှုကို စစ်ဆေးပါ။`);
    throw err;
  }

  // Handle Unauthorized / Token Expired
  if (response.status === 401) {
    if (typeof window.handleSessionExpired === "function") {
      window.handleSessionExpired();
    } else if (typeof window.handleLogout === "function") {
      window.handleLogout();
    }
    throw new Error("Session expired");
  }

  let result;
  try {
    result = await response.json();
  } catch {
    result = { success: false, message: "Server response ကို ဖတ်၍မရပါ။" };
  }

  if (!response.ok && result.success !== false) {
    result = { success: false, message: result.message || `HTTP ${response.status}` };
  }

  // Update Cache
  if (isRead && result.success) {
    window.gReadCache[cacheKey] = result;
  }
  if (!isRead && result.success) {
    window.clearReadCache();
  }

  return result;
};
