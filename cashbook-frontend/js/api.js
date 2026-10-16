/**
 * YOGI MANAGEMENT SYSTEM — API Bridge & Offline-First Sync Engine
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

// Global Read Cache
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
  if (show) {
    overlay.style.setProperty('display', 'flex', 'important');
    overlay.classList.remove('hidden');
  } else {
    overlay.style.setProperty('display', 'none', 'important');
    overlay.classList.add('hidden');
  }
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
 * 💡 Toast Notification Popup (SUCCESS: အစိမ်း, WARN: အဝါ, ERROR: အနီ)
 */
window.showToast = function (type, message) {
  const box = document.getElementById("toast-container");
  if (!box) return;

  const el = document.createElement("div");
  const t = String(type).toUpperCase();
  const isSuccess = t === "SUCCESS";
  const isWarn = t === "WARN" || t === "OFFLINE";
  
  let borderColor = "border-rose-500/50 text-rose-300 shadow-rose-500/10";
  let iconBg = "bg-rose-500/20 text-rose-400";
  let iconClass = "fa-circle-exclamation";

  if (isSuccess) {
    borderColor = "border-emerald-500/50 text-emerald-300 shadow-emerald-500/10";
    iconBg = "bg-emerald-500/20 text-emerald-400";
    iconClass = "fa-circle-check";
  } else if (isWarn) {
    borderColor = "border-amber-500/50 text-amber-300 shadow-amber-500/10";
    iconBg = "bg-amber-500/20 text-amber-400";
    iconClass = "fa-triangle-exclamation";
  }

  el.className = `p-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-extrabold transition-all transform translate-y-4 opacity-0 duration-300 pointer-events-auto bg-[#0e172a] border ${borderColor}`;
  
  el.innerHTML = `
    <div class="w-6 h-6 rounded-lg ${iconBg} flex items-center justify-center shrink-0">
      <i class="fa-solid ${iconClass} text-sm"></i>
    </div>
    <span>${window.escapeHtml(message)}</span>
  `;
  
  box.appendChild(el);
  requestAnimationFrame(() => el.classList.remove("translate-y-4", "opacity-0"));

  setTimeout(() => {
    el.classList.add("translate-y-4", "opacity-0");
    setTimeout(() => el.remove(), 300);
  }, 4200);
};

/* ========================================================================
   💡 INDEXED-DB OFFLINE QUEUE & AUTO-SYNC ENGINE
   (အင်တာနက်မရှိချိန် စက်ထဲသိမ်းပြီး လိုင်းရပါက D1 သို့ Auto-Upload လုပ်ခြင်း)
   ======================================================================== */

const OFFLINE_DB_NAME = "YogiOfflineDB";
const OFFLINE_STORE_NAME = "offline_sync_queue";

function openOfflineDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }
    const req = window.indexedDB.open(OFFLINE_DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(OFFLINE_STORE_NAME)) {
        db.createObjectStore(OFFLINE_STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => resolve(null);
  });
}

// အော့ဖ်လိုင်းမှတ်တမ်း စက်ထဲသိမ်းခြင်း
async function addToOfflineQueue(action, payload) {
  try {
    const db = await openOfflineDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(OFFLINE_STORE_NAME, "readwrite");
      const store = tx.objectStore(OFFLINE_STORE_NAME);
      store.add({
        action,
        payload,
        createdAt: new Date().toISOString()
      });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

// အော့ဖ်လိုင်းမှတ်တမ်းများ ပြန်ဆွဲထုတ်ခြင်း
async function getOfflineQueue() {
  try {
    const db = await openOfflineDB();
    if (!db) return [];
    return new Promise((resolve) => {
      const tx = db.transaction(OFFLINE_STORE_NAME, "readonly");
      const store = tx.objectStore(OFFLINE_STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

// ပို့ပြီးသား မှတ်တမ်းအား စက်ထဲမှ ရှင်းထုတ်ခြင်း
async function removeOfflineQueueItem(id) {
  try {
    const db = await openOfflineDB();
    if (!db) return;
    const tx = db.transaction(OFFLINE_STORE_NAME, "readwrite");
    tx.objectStore(OFFLINE_STORE_NAME).delete(id);
  } catch { }
}

let isAutoSyncing = false;

/**
 * 💡 Background Auto-Sync: လိုင်းရလာသည်နှင့် D1 ဆီသို့ စာရင်းများ အလိုအလျောက် ပို့ပေးခြင်း
 */
window.processOfflineQueue = async function () {
  if (!navigator.onLine || isAutoSyncing) return;

  const queue = await getOfflineQueue();
  if (!queue || queue.length === 0) return;

  isAutoSyncing = true;
  let syncedCount = 0;

  for (const item of queue) {
    try {
      // Force direct API call without recursive queueing
      const res = await window.callApi(item.action, item.payload, { skipOfflineQueue: true });
      if (res && res.success) {
        await removeOfflineQueueItem(item.id);
        syncedCount++;
      }
    } catch (e) {
      console.warn("[Auto-Sync Warning] Item failed, will retry later:", e);
      break; // လိုင်းမတည်ငြိမ်ပါက နောက်မှ ထပ်စမ်းမည်
    }
  }

  isAutoSyncing = false;

  if (syncedCount > 0) {
    window.clearReadCache();
    window.showToast("SUCCESS", `✅ အော့ဖ်လိုင်း မှတ်တမ်း (${syncedCount}) ခုကို ဆာဗာသို့ အောင်မြင်စွာ တင်ပြီးပါပြီ။`);

    // လက်ရှိ စာမျက်နှာကို ဒေတာအသစ်ဖြင့် အလိုအလျောက် Refresh လုပ်ပေးခြင်း
    if (window.AppState) {
      const tab = window.AppState.currentTab;
      if (tab === "cashbook" && typeof window.renderCashbook === "function") {
        window.renderCashbook(window.currentCashPage || 1, "", "", "", true);
      } else if (tab === "home" && typeof window.renderDashboard === "function") {
        window.renderDashboard(true);
      } else if (tab === "level" && typeof window.renderYogiStage === "function") {
        window.renderYogiStage(window.AppState.currentParam || 1, window.currentYogiPage || 1, "", true);
      }
    }
  }
};

// လိုင်း ပြန်ရလာချိန်တွင် အလိုအလျောက် Auto-Sync စတင်ခေါ်ယူခြင်း
window.addEventListener("online", () => {
  setTimeout(() => window.processOfflineQueue(), 1500);
});

/* ========================================================================
   CENTRAL API REQUEST BRIDGE
   ======================================================================== */

// အော့ဖ်လိုင်းအချိန်တွင် စက်ထဲသိမ်းဆည်းမည့် စာရင်းသွင်း/ပြင်/ဖျက် Actions များ
const WRITE_ACTIONS = new Set([
  "saveYogi", "updateYogi", "deleteYogi", "toggleYogiStatus", "postYogi", "importYogi",
  "saveLeader", "updateLeader", "deleteLeader", "toggleLeaderStatus",
  "saveCashbook", "updateCashbook", "deleteCashbook", "importCashbook"
]);

window.callApi = async function (action, payload = {}, opts = {}) {
  const method = opts.method || (action.startsWith("get") || action === "ping" ? "GET" : "POST");
  const isRead = action.startsWith("get");
  const isWrite = WRITE_ACTIONS.has(action);
  const cacheKey = `${action}:${JSON.stringify(payload)}`;

  // ၁။ Read Request ဖြစ်ပါက Cache ထဲမှ အရင်ထုတ်ယူခြင်း
  if (isRead && !opts.forceRefresh && window.gReadCache[cacheKey]) {
    return window.gReadCache[cacheKey];
  }

  // 💡 ၂။ အင်တာနက် မရှိချိန် (Offline) ဖြစ်ပါက စက်ထဲသို့ တိုက်ရိုက် သိမ်းဆည်းခြင်း
  if (!navigator.onLine && isWrite && !opts.skipOfflineQueue) {
    await addToOfflineQueue(action, payload);
    window.showToast("WARN", "အင်တာနက် မရှိသဖြင့် စက်ထဲတွင် ယာယီသိမ်းထားပါသည်။ လိုင်းရပါက ဆာဗာသို့ အလိုအလျောက် ပို့ပေးပါမည်။");
    return {
      success: true,
      offline: true,
      message: "အော့ဖ်လိုင်း ယာယီသိမ်းဆည်းပြီးပါပြီ။"
    };
  }

  const token = window.AppState.authToken || localStorage.getItem(CONFIG_KEYS.TOKEN) || "";
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // 💡 Subdomain အသစ်သို့ Fallback ပြင်ဆင်ထားပါသည်
  let baseUrl = (typeof window.getApiUrl === "function" && window.getApiUrl()) ||
                (window.CONFIG && window.CONFIG.API_URL) || 
                "https://yogi-list.pathana.workers.dev";

  const fetchOpts = { method, headers };

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
    console.warn("Fetch Network Issue:", err);

    // 💡 ၃။ Fetch လုပ်နေစဉ် လိုင်းပြတ်တောက်သွားပါက အလိုအလျောက် Offline Queue ထဲ ထည့်ပေးခြင်း
    if (isWrite && !opts.skipOfflineQueue) {
      await addToOfflineQueue(action, payload);
      window.showToast("WARN", "လိုင်းပြတ်သွားသဖြင့် စက်ထဲတွင် ယာယီသိမ်းထားပါသည်။ လိုင်းပြန်ရပါက ဆာဗာသို့ အလိုအလျောက် ပို့ပေးပါမည်။");
      return {
        success: true,
        offline: true,
        message: "အော့ဖ်လိုင်း ယာယီသိမ်းဆည်းပြီးပါပြီ။"
      };
    }

    if (isRead && window.gReadCache[cacheKey]) {
      return window.gReadCache[cacheKey]; // အရင်ဒေတာဟောင်း ပြန်ပြပေးခြင်း
    }

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

// စာမျက်နှာ စတင်ပွင့်ချိန်တွင် အော့ဖ်လိုင်းကျန်နေသော စာရင်းများရှိပါက Auto-Sync စစ်ဆေးခြင်း
document.addEventListener("DOMContentLoaded", () => {
  if (navigator.onLine) {
    setTimeout(() => window.processOfflineQueue(), 2000);
  }
});
