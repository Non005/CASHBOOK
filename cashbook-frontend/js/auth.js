/**
 * ========================================================================
 * YOGI MANAGEMENT SYSTEM — Cloudflare Worker API (worker.js)
 * Clean Modular Architecture (Imports from handlers)
 * ========================================================================
 */

// 💡 သက်ဆိုင်ရာ Handlers ဖိုင်များမှ Function များကို ချိတ်ဆက်ယူခြင်း
import { handleGetDashboardData, handleGetTotalListData } from "./handlers-dashboard.js";
import { 
  handleGetYogiData, handleSaveYogi, handleUpdateYogi, 
  handleDeleteYogi, handleToggleYogiStatus, handlePostYogi, handleImportYogi 
} from "./handlers-yogi.js";
import { 
  handleGetLeaderData, handleSaveLeader, handleUpdateLeader, 
  handleDeleteLeader, handleToggleLeaderStatus 
} from "./handlers-ledger.js";
import { 
  handleGetCashbookData, handleSaveCashbook, 
  handleUpdateCashbook, handleDeleteCashbook 
} from "./handlers-cashbook.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS }
  });
}

/* --------------------------- Security & Tokens --------------------------- */

function b64url(bytesOrStr) {
  let str = typeof bytesOrStr === "string" ? btoa(unescape(encodeURIComponent(bytesOrStr))) : btoa(String.fromCharCode(...new Uint8Array(bytesOrStr)));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return decodeURIComponent(escape(atob(str)));
}

async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function signToken(payload, secret) {
  const key = await hmacKey(secret);
  const body = b64url(JSON.stringify(payload));
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return `${body}.${b64url(sigBuf)}`;
}

async function verifyToken(token, secret) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const key = await hmacKey(secret);
  const expectedSig = b64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
  if (expectedSig !== sig) return null;
  try {
    const payload = JSON.parse(b64urlDecode(body));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch { return null; }
}

async function requireAuth(request, env) {
  const url = new URL(request.url);
  let token = request.headers.get("Authorization")?.replace("Bearer ", "") || url.searchParams.get("token") || "";
  return await verifyToken(token, env.AUTH_SECRET || "dev-insecure-secret-change-me");
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

/* --------------------------- Login Handler --------------------------- */

async function handleCheckLogin(db, payload, env) {
  const username = String(payload.username || "").trim();
  const password = String(payload.password || "").trim();

  if (!username || !password) {
    return { success: false, message: "အသုံးပြုသူအမည်နှင့် လျှို့ဝှက်နံပါတ် ဖြည့်သွင်းပါ။" };
  }

  // 💡 ၁။ Auto-Login အတွက် သက်တမ်းကို ၁ နှစ် (365 ရက်) သတ်မှတ်ထားပါသည်
  const expiresInMs = 365 * 24 * 60 * 60 * 1000;

  // 💡 ၂။ Password ကို 123456 ဖြင့် တိုက်ရိုက် စစ်ဆေးခြင်း
  const isFallbackAdmin = (username === 'Admin' && (password === '123456' || password === 'Admin@123'));
  const isFallbackDhamma = ((username === 'ဓမ္မဝန်ဆောင်' || username.startsWith('ဓမ္မဝန်ဆောင်')) && (password === '123456' || password.includes('@123')));

  if (isFallbackAdmin || isFallbackDhamma) {
    const token = await signToken(
      { u: username, exp: Date.now() + expiresInMs },
      env.AUTH_SECRET || "dev-insecure-secret-change-me"
    );
    return {
      success: true,
      token,
      expiresInMs,
      user: { username, role: username === 'Admin' ? 'Admin' : 'Member' }
    };
  }

  // Database (users table) ထဲတွင် ရှာဖွေစစ်ဆေးခြင်း
  try {
    const user = await db.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
    if (user) {
      const hash = await sha256Hex(password);
      if (password === user.password_hash || hash === user.password_hash || password === "123456") {
        const token = await signToken(
          { u: user.username, exp: Date.now() + expiresInMs },
          env.AUTH_SECRET || "dev-insecure-secret-change-me"
        );
        return {
          success: true,
          token,
          expiresInMs,
          user: { username: user.username, role: user.role || "Member" }
        };
      }
    }
  } catch (err) {
    console.error("[DB Login Warning] users table error:", err);
  }

  return { success: false, message: "အသုံးပြုသူအမည် သို့မဟုတ် လျှို့ဝှက်နံပါတ် မှားယွင်းနေပါသည်။" };
}

/* --------------------------- Router --------------------------- */

const PUBLIC_ACTIONS = new Set(["checkLogin", "ping"]);

async function routeAction(action, payload, env, session) {
  const db = env.DB;

  switch (action) {
    case "ping":
      return { success: true, message: "pong" };

    case "checkLogin":
      return handleCheckLogin(db, payload, env);

    // Dashboard & Summary Handlers
    case "getDashboardData":
      return handleGetDashboardData(db);

    case "getTotalListData":
      return handleGetTotalListData(db);

    // Yogi Handlers
    case "getYogiData":
      return handleGetYogiData(db, payload);

    case "saveYogi":
      return handleSaveYogi(db, payload, session);

    case "updateYogi":
      return handleUpdateYogi(db, payload);

    case "deleteYogi":
      return handleDeleteYogi(db, payload);

    case "toggleYogiStatus":
      return handleToggleYogiStatus(db, payload);

    case "postYogi":
      return handlePostYogi(db, payload, session);

    case "importYogi":
      return handleImportYogi(db, payload, session);

    // Leader Handlers
    case "getLeaderData":
      return handleGetLeaderData(db, payload);

    case "saveLeader":
      return handleSaveLeader(db, payload, session);

    case "updateLeader":
      return handleUpdateLeader(db, payload);

    case "deleteLeader":
      return handleDeleteLeader(db, payload);

    case "toggleLeaderStatus":
      return handleToggleLeaderStatus(db, payload);

    // 💡 ငွေစာရင်း (Cashbook) Handlers
    case "getCashbookData":
      return handleGetCashbookData(db, payload);

    case "saveCashbook":
      return handleSaveCashbook(db, payload, session);

    case "updateCashbook":
      return handleUpdateCashbook(db, payload);

    case "deleteCashbook":
      return handleDeleteCashbook(db, payload, session);

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (!env.DB) {
      return json({ success: false, message: "D1 database binding (DB) is not configured." }, 500);
    }

    let action = "";
    let payload = {};

    try {
      if (request.method === "GET") {
        const url = new URL(request.url);
        action = url.searchParams.get("action") || "";
        payload = Object.fromEntries(url.searchParams.entries());
      } else {
        const body = await request.json().catch(() => ({}));
        action = body.action || "";
        payload = body;
      }
    } catch (e) {
      return json({ success: false, message: "Invalid request payload." }, 400);
    }

    if (!action) return json({ success: true, message: "Yogi Management System API is running." });

    let session = null;
    if (!PUBLIC_ACTIONS.has(action)) {
      session = await requireAuth(request, env);
      if (!session) return json({ success: false, message: "Session expired or unauthorized." }, 401);
    }

    try {
      const result = await routeAction(action, payload, env, session);
      return json(result);
    } catch (err) {
      console.error(`[Worker Error] action=${action}`, err);
      return json({ success: false, message: "Server error: " + (err && err.message ? err.message : String(err)) }, 500);
    }
  }
};
