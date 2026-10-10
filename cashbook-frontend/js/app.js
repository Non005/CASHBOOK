/**
 * YOGI MANAGEMENT SYSTEM — Main Router & Navigation Logic (FULL FIXED & COMPLETE)
 * File: js/app.js  
 */

// Default Fallback Levels in case window.LEVELS is not loaded yet
const DEFAULT_LEVELS = [
  { id: 1, name: "သတိကိုယ့်စိတ်ကိုယ်သိပါ" },
  { id: 2, name: "ရုပ် ကမ္မဋ္ဌာန်း" },
  { id: 3, name: "နာမ် ကမ္မဋ္ဌာန်း" },
  { id: 4, name: "ရုပ်နာမ် ကမ္မဋ္ဌာန်း" },
  { id: 5, name: "ခန္ဓာငါးပါး ကမ္မဋ္ဌာန်း" },
  { id: 6, name: "ဥပါဒါနက်ခန္ဓာငါးပါး ကမ္မဋ္ဌာန်း" },
  { id: 7, name: "သိ-ပါယ်-ဆိုက်-ပွား" },
  { id: 8, name: "ယောဂီ စာရင်းဟောင်း" }
];

let liveSyncInterval = null;

/**
 * 💡 Mobile & Tablet Sidebar Controls (Android / iPhone / Tablet အဖွင့်/အပိတ် Logic)
 */
window.toggleMobileSidebar = function (forceClose = false) {
  const sidebar = document.getElementById("main-sidebar");
  const backdrop = document.getElementById("sidebar-backdrop") || document.getElementById("mobile-sidebar-backdrop");

  if (!sidebar) return;

  // Sidebar လက်ရှိ ပိတ်ထားသလား စစ်ဆေးခြင်း
  const isClosed = sidebar.classList.contains("-translate-x-full");

  if (forceClose || !isClosed) {
    // ပိတ်မည်
    sidebar.classList.add("-translate-x-full");
    sidebar.classList.remove("translate-x-0");
    if (backdrop) {
      backdrop.classList.add("hidden");
    }
  } else {
    // ဖွင့်မည်
    sidebar.classList.remove("-translate-x-full");
    sidebar.classList.add("translate-x-0");
    if (backdrop) {
      backdrop.classList.remove("hidden");
    }
  }
};

window.closeMobileSidebar = function () {
  window.toggleMobileSidebar(true);
};

/**
 * 💡 Smart Live Sync Auto-Refresh Manager (၅ စက္ကန့်တစ်ကြိမ် နောက်ကွယ်မှ Auto Refresh လုပ်ပေးမည်)
 */
window.startLiveSync = function () {
  if (liveSyncInterval) clearInterval(liveSyncInterval);

  liveSyncInterval = setInterval(() => {
    // ၁။ Token မရှိလျှင် မလုပ်ပါ
    const token = localStorage.getItem("yogi_auth_token");
    if (!token) return;

    // ၂။ Screen မီးပိတ်ထားလျှင် သို့မဟုတ် အခြား Tab သို့ ရောက်နေလျှင် မလုပ်ပါ
    if (document.hidden) return;

    // ၃။ Modal ပွင့်နေချိန် စာရိုက်မပျက်အောင် Auto Sync ခဏ ရပ်မည်
    const isModalOpen = document.querySelector('.modal-overlay-bg:not(.hidden), #loading-overlay:not(.hidden)');
    if (isModalOpen) return;

    // ၄။ ရောက်နေသော Tab အလိုက် Silent Refresh ခေါ်ယူခြင်း
    if (!window.AppState) return;
    const currentTab = window.AppState.currentTab || "home";
    const currentParam = window.AppState.currentParam;

    if (currentTab === "home" || currentTab === "dashboard") {
      if (typeof window.renderDashboard === "function") {
        window.renderDashboard(true); // silent refresh
      }
    } else if (currentTab === "level" || currentTab === "yogi" || currentTab === "stage") {
      const levelId = Number(currentParam || 1);
      if (typeof window.renderYogiStage === "function") {
        const page = window.currentYogiPage || 1;
        const search = window.currentYogiSearch || "";
        window.renderYogiStage(levelId, page, search, true);
      }
    } else if (currentTab === "total_summary") {
      if (typeof window.renderTotalSummary === "function") {
        window.renderTotalSummary(window.currentSummarySearch || "", true);
      }
    } else if (currentTab === "leaders" || currentTab === "leader") {
      if (typeof window.renderLeaders === "function") {
        const page = window.currentLeaderPage || 1;
        const search = window.currentLeaderSearch || "";
        window.renderLeaders(page, search, true);
      }
    }
  }, 5000);
};

/**
 * App Initialization
 */
window.initApp = function () {
  // Live User Display ချိတ်ဆက်ခြင်း (AppState မရှိပါက LocalStorage မှ fallback ယူမည်)
  const liveUserEl = document.getElementById("live-user-name");
  if (liveUserEl) {
    const activeUser = (window.AppState && window.AppState.currentUser) || localStorage.getItem("yogi_user_name") || localStorage.getItem("yogi_user") || "Admin";
    liveUserEl.innerText = String(activeUser);
  }

  renderSidebar();

  const currentTab = (window.AppState && window.AppState.currentTab) || "home";
  const currentParam = (window.AppState && window.AppState.currentParam) || null;
  window.switchTab(currentTab, currentParam);

  if (typeof window.startLiveSync === "function") {
    window.startLiveSync();
  }
};

/**
 * Updates Active Highlight Class on Sidebar Buttons
 */
function updateActiveNav(tabName, param) {
  const nav = document.getElementById("sidebar-nav");
  if (!nav) return;

  const btns = nav.querySelectorAll(".nav-btn");
  btns.forEach(b => {
    b.classList.remove("nav-btn-active", "bg-amber-500/20", "text-amber-300");
    const btnTab = b.getAttribute("data-tab");
    const btnParam = b.getAttribute("data-param");

    if (btnTab === tabName) {
      if (param !== null && param !== undefined) {
        if (String(btnParam) === String(param)) {
          b.classList.add("nav-btn-active", "bg-amber-500/20", "text-amber-300");
        }
      } else if (!btnParam) {
        b.classList.add("nav-btn-active", "bg-amber-500/20", "text-amber-300");
      }
    }
  });
}

/**
 * Main Tab Router Function (စာမျက်နှာ ကူးပြောင်းခြင်း)
 */
window.switchTab = function (tabName, param = null) {
  if (window.AppState) {
    window.AppState.currentTab = tabName;
    window.AppState.currentParam = param;
  }

  // Active Highlight ညှိခြင်း
  updateActiveNav(tabName, param);

  // 💡 ဖုန်း သို့မဟုတ် Tablet (Screen width < 1024px) တွင် Menu တစ်ခုခုနှိပ်လိုက်ပါက Sidebar ကို အလိုအလျောက် ပိတ်ပေးမည်
  if (window.innerWidth < 1024) {
    window.closeMobileSidebar();
  }

  // Header Title ကို သက်ဆိုင်ရာ နာမည်အလိုက် ပြောင်းလဲပေးခြင်း
  const pageTitleEl = document.getElementById("page-title");
  const sourceLevels = (window.LEVELS && window.LEVELS.length > 0) ? window.LEVELS : DEFAULT_LEVELS;

  if (tabName === "home" || tabName === "dashboard") {
    if (pageTitleEl) pageTitleEl.innerText = "ပင်မစာမျက်နှာ";
    if (typeof window.renderDashboard === "function") window.renderDashboard();
  } else if (tabName === "level" || tabName === "yogi" || tabName === "stage") {
    const levelId = Number(param || 1);
    const currentLevelObj = sourceLevels.find(l => l.id === levelId);
    if (pageTitleEl && currentLevelObj) {
      pageTitleEl.innerText = levelId === 8 ? "ယောဂီ စာရင်းဟောင်း" : `အဆင့် (${levelId}) - ${currentLevelObj.name}`;
    }
    if (typeof window.renderYogiStage === "function") window.renderYogiStage(levelId);
  } else if (tabName === "total_summary") {
    if (pageTitleEl) pageTitleEl.innerText = "ယောဂီ စုစုပေါင်း စာရင်း";
    if (typeof window.renderTotalSummary === "function") window.renderTotalSummary();
  } else if (tabName === "leaders" || tabName === "leader") {
    if (pageTitleEl) pageTitleEl.innerText = "ဦးဆောင်ဆွေးနွေး ယောဂီများ";
    if (typeof window.renderLeaders === "function") window.renderLeaders();
  }
};

/**
 * Renders Dynamic Sidebar Navigation
 */
function renderSidebar() {
  const nav = document.getElementById("sidebar-nav");
  if (!nav) return;

  let html = `
    <button data-tab="home" onclick="switchTab('home')" class="nav-btn w-full text-left p-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2.5 hover:bg-slate-800/80 transition cursor-pointer">
      <i class="fa-solid fa-house text-amber-400 text-sm shrink-0"></i>
      <span class="truncate">ပင်မစာမျက်နှာ</span>
    </button>
    <p class="pt-3 pb-1 px-3 text-[10px] font-black text-amber-400/70 uppercase tracking-widest">ကမ္မဋ္ဌာန်း အဆင့်များ</p>
  `;

  const sourceLevels = (window.LEVELS && window.LEVELS.length > 0) ? window.LEVELS : DEFAULT_LEVELS;
  const levels = sourceLevels.filter(l => l.id <= 7);

  levels.forEach(l => {
    html += `
      <button data-tab="level" data-param="${l.id}" onclick="switchTab('level', ${l.id})" class="nav-btn w-full text-left p-2 rounded-xl font-bold text-xs flex items-center gap-2.5 hover:bg-slate-800/80 transition cursor-pointer">
        <span class="w-5 h-5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-[10px] shrink-0 font-mono font-extrabold">${l.id}</span>
        <span class="truncate">${l.name}</span>
      </button>
    `;
  });

  html += `
    <p class="pt-3 pb-1 px-3 text-[10px] font-black text-amber-400/70 uppercase tracking-widest">အခြား စာရင်းများ</p>
    <button data-tab="total_summary" onclick="switchTab('total_summary')" class="nav-btn w-full text-left p-2 rounded-xl font-bold text-xs flex items-center gap-2.5 hover:bg-slate-800/80 transition cursor-pointer">
      <i class="fa-solid fa-list-check text-emerald-400 text-sm shrink-0"></i>
      <span class="truncate">ယောဂီ စုစုပေါင်း စာရင်း</span>
    </button>
    <button data-tab="level" data-param="8" onclick="switchTab('level', 8)" class="nav-btn w-full text-left p-2 rounded-xl font-bold text-xs flex items-center gap-2.5 hover:bg-slate-800/80 transition cursor-pointer">
      <i class="fa-solid fa-box-archive text-purple-400 text-sm shrink-0"></i>
      <span class="truncate">ယောဂီ စာရင်းဟောင်း</span>
    </button>
    <button data-tab="leaders" onclick="switchTab('leaders')" class="nav-btn w-full text-left p-2 rounded-xl font-bold text-xs flex items-center gap-2.5 hover:bg-slate-800/80 transition cursor-pointer">
      <i class="fa-solid fa-user-tie text-indigo-400 text-sm shrink-0"></i>
      <span class="truncate">ဦးဆောင်ဆွေးနွေး ယောဂီ</span>
    </button>
  `;

  nav.innerHTML = html;

  if (window.AppState) {
    updateActiveNav(window.AppState.currentTab || "home", window.AppState.currentParam);
  }
}

window.renderSidebar = renderSidebar;

/**
 * DOMContentLoaded Event
 */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.checkExistingSession === "function") {
    window.checkExistingSession();
  } else if (typeof window.initApp === "function") {
    const token = localStorage.getItem("yogi_auth_token");
    if (token) window.initApp();
  }

  if (typeof window.startLiveSync === "function") {
    window.startLiveSync();
  }

  // 💡 Screen အကျယ်ပြောင်းလဲသည့်အခါ (Tablet Screen လှည့်သည့်အခါ) Drawer အလိုအလျောက် ညှိပေးခြင်း
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024) {
      const backdrop = document.getElementById("sidebar-backdrop");
      if (backdrop) backdrop.classList.add("hidden");
    }
  });

  // 💡 Keyboard မှ Escape (Esc) နှိပ်လျှင် Sidebar ပိတ်ပေးခြင်း
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      window.closeMobileSidebar();
    }
  });
});
