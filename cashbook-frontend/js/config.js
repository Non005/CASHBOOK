/**
 * YOGI MANAGEMENT SYSTEM — Global Configuration (FULL STABLE VERSION)
 * File: js/config.js
 */
(function () {
  "use strict";

  // ကမ္မဋ္ဌာန်း အဆင့်များ စာရင်း (1 to 7 + Stage 8 Alumni)
  window.LEVELS = [
    { id: 1, key: "level1", name: "သတိကိုယ့်စိတ် ကိုယ်သိပါ", icon: "fa-hands-praying", color: "amber" },
    { id: 2, key: "level2", name: "ရုပ် ကမ္မဋ္ဌာန်း", icon: "fa-leaf", color: "emerald" },
    { id: 3, key: "level3", name: "နာမ် ကမ္မဋ္ဌာန်း", icon: "fa-brain", color: "sky" },
    { id: 4, key: "level4", name: "ရုပ်နာမ် ကမ္မဋ္ဌာန်း", icon: "fa-atom", color: "cyan" },
    { id: 5, key: "level5", name: "ခန္ဓာငါးပါး ကမ္မဋ္ဌာန်း", icon: "fa-layer-group", color: "rose" },
    { id: 6, key: "level6", name: "ဥပါဒါနက္ခန္ဓာငါးပါး ကမ္မဋ္ဌာန်း", icon: "fa-circle-nodes", color: "teal" },
    { id: 7, key: "level7", name: "သိ-ပါယ်-ဆိုက်-ပွား ကမ္မဋ္ဌာန်း", icon: "fa-sun", color: "indigo" },
    { id: 8, key: "old_yogis", name: "ယောဂီ စာရင်းဟောင်း", icon: "fa-box-archive", color: "purple" }
  ];

  // Pre-seeded Login User Accounts
  window.LOGIN_USERS = [
    "Admin",
    "ဓမ္မဝန်ဆောင် ၁", "ဓမ္မဝန်ဆောင် ၂", "ဓမ္မဝန်ဆောင် ၃", "ဓမ္မဝန်ဆောင် ၄", "ဓမ္မဝန်ဆောင် ၅",
    "ဓမ္မဝန်ဆောင် ၆", "ဓမ္မဝန်ဆောင် ၇", "ဓမ္မဝန်ဆောင် ၈", "ဓမ္မဝန်ဆောင် ၉", "ဓမ္မဝန်ဆောင် ၁၀"
  ];

  /**
   * Resolves API URL based on Environment
   */
  function getApiUrl() {
    const hostname = window.location.hostname;
    
    // Local Development Mode
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      const devUrl = localStorage.getItem("dev_api_url");
      if (devUrl) return devUrl.replace(/\/$/, "");
      return "http://localhost:8787";
    }
    
    // Custom Override
    const prodUrl = localStorage.getItem("prod_api_url");
    if (prodUrl) return prodUrl.replace(/\/$/, "");
    
    // Production Cloudflare Worker API Endpoint
    return "https://yogi-list.kotuntunwin1985.workers.dev";
  }

  function getLevelById(id) {
    const numId = Number(id);
    return window.LEVELS.find(l => l.id === numId) || {
      id: numId,
      name: numId === 8 ? "ယောဂီ စာရင်းဟောင်း" : `အဆင့် (${numId})`,
      icon: "fa-dharmachakra",
      color: "amber"
    };
  }

  function getLevelByKey(key) {
    return window.LEVELS.find(l => l.key === key) || null;
  }

  function getEnvironmentInfo() {
    return {
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      isDevelopment: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1",
      apiUrl: getApiUrl(),
      timestamp: new Date().toISOString()
    };
  }

  // Global Exports
  window.getApiUrl = getApiUrl;
  window.getLevelById = getLevelById;
  window.getLevelByKey = getLevelByKey;
  window.getEnvironmentInfo = getEnvironmentInfo;

  window.CONFIG = {
    get API_URL() { return getApiUrl(); },
    STORAGE_KEY_TOKEN: "yogi_auth_token",
    STORAGE_KEY_USER: "yogi_user_name",
    STORAGE_KEY_EXPIRES: "yogi_token_expires_at",
    DEFAULT_PAGE_SIZE: 25,
    
    // 💡 Timeout ကို 20 စက္ကန့်သို့ တိုးမြှင့်ထားပါသည် (Slow Connection များအတွက်)
    API_TIMEOUT_MS: 20000, 
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 1500,
    
    get ENVIRONMENT_INFO() { return getEnvironmentInfo(); }
  };
})();
