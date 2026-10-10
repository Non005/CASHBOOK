/**
 * YOGI MANAGEMENT SYSTEM — Authentication Logic
 * File: js/auth.js 
 */

function getStorageKeys() {
  return {
    TOKEN: (window.CONFIG && window.CONFIG.STORAGE_KEY_TOKEN) || "yogi_auth_token",
    USER: (window.CONFIG && window.CONFIG.STORAGE_KEY_USER) || "yogi_user_name",
    EXPIRES: (window.CONFIG && window.CONFIG.STORAGE_KEY_EXPIRES) || "yogi_token_expires_at"
  };
}

/**
 * Check Session Validity on Page Load
 */
function checkExistingSession() {
  const keys = getStorageKeys();
  const token = localStorage.getItem(keys.TOKEN);
  const expiresAt = Number(localStorage.getItem(keys.EXPIRES) || 0);
  const user = localStorage.getItem(keys.USER);

  if (token && expiresAt && Date.now() < expiresAt && user) {
    if (window.AppState) {
      window.AppState.authToken = token;
      window.AppState.currentUser = user;
    }
    document.documentElement.className = "dark is-authed";
    
    const liveUserEl = document.getElementById("live-user-name");
    if (liveUserEl) liveUserEl.innerText = user;

    if (typeof window.initApp === "function") {
      window.initApp();
    }
  } else {
    document.documentElement.className = "dark not-authed";
  }
}

/**
 * Handle Login Form Submit
 */
async function handleLoginSubmit(event) {
  event.preventDefault();
  
  const usernameSelect = document.getElementById("login-username");
  const passwordInput = document.getElementById("login-password");
  const errorDiv = document.getElementById("login-error");

  if (!usernameSelect || !passwordInput) return;

  const username = usernameSelect.value.trim();
  const password = passwordInput.value.trim();

  if (errorDiv) {
    errorDiv.innerText = "";
    errorDiv.classList.add("hidden");
  }
  
  if (typeof window.toggleLoading === "function") window.toggleLoading(true);

  try {
    const res = await window.callApi("checkLogin", { username, password });

    if (res && res.success) {
      const keys = getStorageKeys();
      const userName = (res.user && res.user.username) ? res.user.username : username;
      const expiresInMs = res.expiresInMs || (24 * 60 * 60 * 1000); // 24 Hours fallback

      if (window.AppState) {
        window.AppState.authToken = res.token;
        window.AppState.currentUser = userName;
      }

      localStorage.setItem(keys.TOKEN, res.token);
      localStorage.setItem(keys.USER, userName);
      localStorage.setItem(keys.EXPIRES, Date.now() + expiresInMs);

      document.documentElement.className = "dark is-authed";

      const liveUserEl = document.getElementById("live-user-name");
      if (liveUserEl) liveUserEl.innerText = userName;

      // Reset password field
      passwordInput.value = "";

      if (typeof window.initApp === "function") {
        window.initApp();
      }

      if (typeof window.showToast === "function") {
        window.showToast("SUCCESS", `${userName} မင်္ဂလာပါ! အကောင့်ဝင်ရောက်မှု အောင်မြင်ပါသည်။`);
      }
    } else {
      if (errorDiv) {
        errorDiv.innerText = (res && res.message) || "အသုံးပြုသူအမည် သို့မဟုတ် လျှို့ဝှက်နံပါတ် မှားယွင်းနေပါသည်။";
        errorDiv.classList.remove("hidden");
      }
    }
  } catch (err) {
    if (errorDiv) {
      errorDiv.innerText = `ဆာဗာ အမှား: ${err.message || String(err)}`;
      errorDiv.classList.remove("hidden");
    }
  } finally {
    if (typeof window.toggleLoading === "function") window.toggleLoading(false);
  }
}

/**
 * Handle Manual Logout
 */
function handleLogout() {
  const keys = getStorageKeys();
  localStorage.removeItem(keys.TOKEN);
  localStorage.removeItem(keys.EXPIRES);
  // Keep localStorage.getItem(keys.USER) for dropdown memory if needed

  if (window.AppState) {
    window.AppState.authToken = null;
    window.AppState.currentUser = null;
  }

  // Clear password input
  const passInput = document.getElementById("login-password");
  if (passInput) passInput.value = "";

  document.documentElement.className = "dark not-authed";
  if (typeof window.showToast === "function") {
    window.showToast("SUCCESS", "အကောင့်မှ ထွက်ရှိပြီးပါပြီ။");
  }
}

/**
 * Handle Session Expiry (Unauthorized 401)
 */
function handleSessionExpired() {
  const keys = getStorageKeys();
  localStorage.removeItem(keys.TOKEN);
  localStorage.removeItem(keys.EXPIRES);

  if (window.AppState) {
    window.AppState.authToken = null;
    window.AppState.currentUser = null;
  }

  const passInput = document.getElementById("login-password");
  if (passInput) passInput.value = "";

  document.documentElement.className = "dark not-authed";
  if (typeof window.showToast === "function") {
    window.showToast("ERROR", "Session ကုန်ဆုံးသွားပါပြီ။ ပြန်လည် Login ဝင်ပေးပါ။");
  }
}

/**
 * Load 11 Pre-seeded Accounts into Dropdown
 */
function loadUsersDropdown() {
  const select = document.getElementById("login-username");
  if (!select) return;

  const keys = getStorageKeys();
  const lastUser = localStorage.getItem(keys.USER) || "Admin";

  const users = window.LOGIN_USERS || [
    "Admin",
    "ဓမ္မဝန်ဆောင် ၁", "ဓမ္မဝန်ဆောင် ၂", "ဓမ္မဝန်ဆောင် ၃", "ဓမ္မဝန်ဆောင် ၄", "ဓမ္မဝန်ဆောင် ၅",
    "ဓမ္မဝန်ဆောင် ၆", "ဓမ္မဝန်ဆောင် ၇", "ဓမ္မဝန်ဆောင် ၈", "ဓမ္မဝန်ဆောင် ၉", "ဓမ္မဝန်ဆောင် ၁၀"
  ];

  select.innerHTML = users.map(u => `<option value="${u}" ${u === lastUser ? 'selected' : ''}>${u}</option>`).join("");
}

// Global Window Exports
window.checkExistingSession = checkExistingSession;
window.handleLoginSubmit = handleLoginSubmit;
window.handleLogout = handleLogout;
window.handleSessionExpired = handleSessionExpired;
window.loadUsersDropdown = loadUsersDropdown;

document.addEventListener("DOMContentLoaded", () => {
  loadUsersDropdown();
  checkExistingSession();
});
