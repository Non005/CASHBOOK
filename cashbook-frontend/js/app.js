/**
 * YOGI MANAGEMENT SYSTEM — Main Router & Navigation Logic (FULL FIXED & COMPLETE)
 * File: js/app.js  
 */

// 💡 အဆင့် (၁ မှ ၈) အားလုံးအတွက် သင့်လျော်သော FontAwesome Icons များကို တွဲဖက်သတ်မှတ်ပေးထားပါသည်
const DEFAULT_LEVELS = [
  { id: 1, name: "သတိကိုယ့်စိတ်ကိုယ်သိပါ", icon: "fa-brain" },
  { id: 2, name: "ရုပ် ကမ္မဋ္ဌာန်း", icon: "fa-person-walking" },
  { id: 3, name: "နာမ် ကမ္မဋ္ဌာန်း", icon: "fa-spa" },
  { id: 4, name: "ရုပ်နာမ် ကမ္မဋ္ဌာန်း", icon: "fa-yin-yang" },
  { id: 5, name: "ခန္ဓာငါးပါး ကမ္မဋ္ဌာန်း", icon: "fa-hand" },
  { id: 6, name: "ဥပါဒါနက်ခန္ဓာငါးပါး ကမ္မဋ္ဌာန်း", icon: "fa-fire" },
  { id: 7, name: "သိ-ပါယ်-ဆိုက်-ပွား", icon: "fa-dharmachakra" },
  { id: 8, name: "ယောဂီ စာရင်းဟောင်း", icon: "fa-box-archive" }
];

let liveSyncInterval = null;


/**
 * 💡 Mobile & Tablet Sidebar Controls (Responsive Fix)
 */
window.toggleMobileSidebar = function (forceClose = false) {
  const sidebar = document.getElementById("main-sidebar");
  const backdrop =
    document.getElementById("sidebar-backdrop") ||
    document.getElementById("mobile-sidebar-backdrop");

  if (!sidebar) return;

  // CSS နဲ့ကိုက်ညီတဲ့ class ကို စစ်ဆေးမယ်
  const isOpen = sidebar.classList.contains("sidebar-open");

  if (forceClose || isOpen) {
    // Sidebar ပိတ်မယ်
    sidebar.classList.remove("sidebar-open");

    if (backdrop) {
      backdrop.style.setProperty("display", "none", "important");
    }
  } else {
    // Sidebar ဖွင့်မယ်
    sidebar.classList.add("sidebar-open");

    if (backdrop) {
      backdrop.style.setProperty("display", "block", "important");
    }
  }
};

// Sidebar ကို အတင်းပိတ်ရန်
window.closeMobileSidebar = function () {
  window.toggleMobileSidebar(true);
};

/**
 * 💡 Smart Live Sync Auto-Refresh Manager
 */
window.startLiveSync = function () {
  if (liveSyncInterval) clearInterval(liveSyncInterval);

  liveSyncInterval = setInterval(() => {
    const token = localStorage.getItem("yogi_auth_token");
    if (!token) return;

    if (document.hidden) return;

    // 💡 User သည် Search Box သို့မဟုတ် Input တစ်ခုခုတွင် စာရိုက်နေပါက Refresh မလုပ်ဘဲ စောင့်ပေးခြင်း
    const isTyping = document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
    if (isTyping) return;

    const isModalOpen = document.querySelector('.modal-overlay-bg:not(.hidden), #loading-overlay:not(.hidden)');
    if (isModalOpen) return;

    if (!window.AppState) return;
    const currentTab = window.AppState.currentTab || "home";
    const currentParam = window.AppState.currentParam;

    if (currentTab === "home" || currentTab === "dashboard") {
      if (typeof window.renderDashboard === "function") {
        window.renderDashboard(true);
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
    // 💡 ငွေစာရင်း Auto-Refresh တွင် Next နှိပ်ထားသော Page မပျောက်စေရန် ထိန်းသိမ်းခြင်း
    } else if (currentTab === "cashbook" || currentTab === "cash") {
      if (typeof window.renderCashbook === "function") {
        const fromDate = document.getElementById("cash-from-date") ? document.getElementById("cash-from-date").value : "";
        const toDate = document.getElementById("cash-to-date") ? document.getElementById("cash-to-date").value : "";
        const search = document.getElementById("cash-search-input") ? document.getElementById("cash-search-input").value.trim() : "";
        
        const page = window.currentCashPage || 1;
        window.renderCashbook(page, search, fromDate, toDate, true);
      }
    }
  }, 5000);
};

/**
 * App Initialization
 */
window.initApp = function () {
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
    b.classList.remove("nav-btn-active", "bg-amber-500/20", "text-amber-300", "border-r-2", "border-amber-400");
    const btnTab = b.getAttribute("data-tab");
    const btnParam = b.getAttribute("data-param");

    if (btnTab === tabName) {
      if (param !== null && param !== undefined) {
        if (String(btnParam) === String(param)) {
          b.classList.add("nav-btn-active", "bg-amber-500/20", "text-amber-300", "border-r-2", "border-amber-400");
        }
      } else if (!btnParam) {
        b.classList.add("nav-btn-active", "bg-amber-500/20", "text-amber-300", "border-r-2", "border-amber-400");
      }
    }
  });
}

/**
 * Main Tab Router Function
 */
window.switchTab = function (tabName, param = null) {
  if (window.AppState) {
    window.AppState.currentTab = tabName;
    window.AppState.currentParam = param;
  }

  updateActiveNav(tabName, param);

  // 💡 1280px အောက် (ဖုန်းနှင့် Tablet) ဖြစ်ပါက Menu Link နှိပ်ပြီးလျှင် Sidebar ကို အလိုအလျောက် ပိတ်ပေးခြင်း
  if (window.innerWidth < 1280) {
    window.closeMobileSidebar();
  }

  const pageTitleEl = document.getElementById("page-title");
  const sourceLevels = (window.LEVELS && window.LEVELS.length > 0) ? window.LEVELS : DEFAULT_LEVELS;

  if (tabName === "home" || tabName === "dashboard") {
    if (pageTitleEl) pageTitleEl.innerText = "ပင်မစာမျက်နှာ";
    if (typeof window.renderDashboard === "function") window.renderDashboard();
  } else if (tabName === "cashbook" || tabName === "cash") {
    if (pageTitleEl) pageTitleEl.innerText = "ငွေစာရင်း (Cashbook)";
    if (typeof window.renderCashbook === "function") window.renderCashbook(window.currentCashPage || 1);
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
 * 💡 Renders Dynamic Sidebar Navigation (Icon များနှင့် ပြင်ဆင်ပြီး)
 */
function renderSidebar() {
  const nav = document.getElementById("sidebar-nav");
  if (!nav) return;

  let html = `
    <!-- ပင်မစာမျက်နှာ -->
    <button data-tab="home" onclick="switchTab('home')" class="nav-btn w-full text-left p-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2.5 hover:bg-slate-800/80 transition cursor-pointer text-slate-200">
      <i class="fa-solid fa-house text-amber-400 text-sm shrink-0 w-5 text-center"></i>
      <span class="truncate">ပင်မစာမျက်နှာ</span>
    </button>

    <!-- ငွေစာရင်း ကဏ္ဍ -->
    <p class="pt-3 pb-1 px-3 text-[10px] font-black text-amber-400/70 uppercase tracking-widest">ငွေစာရင်း ကဏ္ဍ</p>
    <button data-tab="cashbook" onclick="switchTab('cashbook')" class="nav-btn w-full text-left p-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2.5 hover:bg-slate-800/80 transition cursor-pointer text-slate-200">
      <i class="fa-solid fa-wallet text-amber-400 text-sm shrink-0 w-5 text-center"></i>
      <span class="truncate">ငွေစာရင်း</span>
    </button>

    <!-- ကမ္မဋ္ဌာန်း အဆင့်များ -->
    <p class="pt-3 pb-1 px-3 text-[10px] font-black text-amber-400/70 uppercase tracking-widest">ကမ္မဋ္ဌာန်း အဆင့်များ</p>
  `;

  const sourceLevels = (window.LEVELS && window.LEVELS.length > 0) ? window.LEVELS : DEFAULT_LEVELS;
  const levels = sourceLevels.filter(l => l.id <= 7);

  // 💡 အဆင့် (၁ မှ ၇) ခလုတ်များတွင် နံပါတ်ကွက်ရော Icon ပါ သပ်ရပ်စွာ ပူးတွဲဖော်ပြထားပါသည်
  levels.forEach(l => {
    const iconClass = l.icon ? l.icon : "fa-dharmachakra";
    html += `
      <button data-tab="level" data-param="${l.id}" onclick="switchTab('level', ${l.id})" class="nav-btn w-full text-left p-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-800/80 transition cursor-pointer text-slate-300">
        <span class="w-5 h-5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-[10px] shrink-0 font-mono font-extrabold">${l.id}</span>
        <i class="fa-solid ${iconClass} text-amber-400/80 text-xs shrink-0 w-4 text-center"></i>
        <span class="truncate">${l.name}</span>
      </button>
    `;
  });

  html += `
    <p class="pt-3 pb-1 px-3 text-[10px] font-black text-amber-400/70 uppercase tracking-widest">အခြား စာရင်းများ</p>
    <button data-tab="total_summary" onclick="switchTab('total_summary')" class="nav-btn w-full text-left p-2 rounded-xl font-bold text-xs flex items-center gap-2.5 hover:bg-slate-800/80 transition cursor-pointer text-slate-300">
      <i class="fa-solid fa-list-check text-emerald-400 text-sm shrink-0 w-5 text-center"></i>
      <span class="truncate">ယောဂီ စုစုပေါင်း စာရင်း</span>
    </button>
    <button data-tab="level" data-param="8" onclick="switchTab('level', 8)" class="nav-btn w-full text-left p-2 rounded-xl font-bold text-xs flex items-center gap-2.5 hover:bg-slate-800/80 transition cursor-pointer text-slate-300">
      <i class="fa-solid fa-box-archive text-purple-400 text-sm shrink-0 w-5 text-center"></i>
      <span class="truncate">ယောဂီ စာရင်းဟောင်း</span>
    </button>
    <button data-tab="leaders" onclick="switchTab('leaders')" class="nav-btn w-full text-left p-2 rounded-xl font-bold text-xs flex items-center gap-2.5 hover:bg-slate-800/80 transition cursor-pointer text-slate-300">
      <i class="fa-solid fa-user-tie text-indigo-400 text-sm shrink-0 w-5 text-center"></i>
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

  // 💡 Screen 1280px (Desktop) သို့ ချဲ့လိုက်ပါက Backdrop ကို အလိုအလျောက် ဖျောက်ပေးခြင်း
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1280) {
      const backdrop = document.getElementById("sidebar-backdrop") || document.getElementById("mobile-sidebar-backdrop");
      if (backdrop) backdrop.classList.add("hidden");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      window.closeMobileSidebar();
    }
  });
});
