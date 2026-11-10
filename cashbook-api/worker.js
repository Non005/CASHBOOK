/**
 * ========================================================================
 * YOGI & CASHBOOK MANAGEMENT SYSTEM — Cloudflare Worker API (worker.js)
 * Clean Modular Architecture (Hardened Security & D1 Quota Optimized)
 * ========================================================================
 */

import { handleGetDashboardData, handleGetTotalListData } from "./handlers-dashboard.js";
import { 
  handleGetYogiData, handleSaveYogi, handleUpdateYogi, 
  handleDeleteYogi, handleToggleYogiStatus, handlePostYogi, handleImportYogi 
} from "./handlers-yogi.js";
import { 
  handleGetLeaderData, handleSaveLeader, handleUpdateLeader, 
  handleDeleteLeader, handleToggleLeaderStatus, handleImportLeader 
} from "./handlers-ledger.js";
import { 
  handleGetCashbookData, handleSaveCashbook, 
  handleUpdateCashbook, handleDeleteCashbook, handleImportCashbook 
} from "./handlers-cashbook.js";

/* --------------------------- CORS Configurations --------------------------- */
function getCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders
    }
  });
}

/* --------------------------- Cryptography & Tokens --------------------------- */

function b64url(bytesOrStr) {
  let str = typeof bytesOrStr === "string" 
    ? btoa(unescape(encodeURIComponent(bytesOrStr))) 
    : btoa(String.fromCharCode(...new Uint8Array(bytesOrStr)));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return decodeURIComponent(escape(atob(str)));
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw", 
    new TextEncoder().encode(secret), 
    { name: "HMAC", hash: "SHA-256" }, 
    false, 
    ["sign", "verify"]
  );
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
  } catch { 
    return null; 
  }
}

/**
 * Header-Only Token Verification (ကာကွယ်ရေး: URL Query param token မသုံးရ)
 */
async function requireAuth(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  const secret = env.AUTH_SECRET;
  if (!secret) {
    console.error("[CRITICAL] AUTH_SECRET is not configured in Wrangler environment variables.");
    return null;
  }
  return await verifyToken(token, secret);
}

/* --------------------------- Password Hashing Engine --------------------------- */

// PBKDF2 Password Verifier
async function verifyPassword(password, storedHash) {
  if (!storedHash || !password) return false;

  // ၁။ PBKDF2 format: "pbkdf2$<iterations>$<saltHex>$<hashHex>"
  if (storedHash.startsWith("pbkdf2$")) {
    const parts = storedHash.split("$");
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = new Uint8Array(parts[2].match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const expectedHashHex = parts[3];

    const passKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations,
        hash: "SHA-256"
      },
      passKey,
      256
    );
    const derivedHex = [...new Uint8Array(derivedBits)].map(b => b.toString(16).padStart(2, "0")).join("");
    return derivedHex === expectedHashHex;
  }

  // ၂။ Legacy SHA-256 Compatibility Check (စာရင်းဟောင်းအတွက်)
  const legacyBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  const legacyHex = [...new Uint8Array(legacyBuf)].map(b => b.toString(16).padStart(2, "0")).join("");
  return legacyHex === storedHash || password === storedHash;
}

/* --------------------------- Login Handler --------------------------- */

async function handleCheckLogin(db, payload, env) {
  const username = String(payload.username || "").trim();
  const password = String(payload.password || "").trim();

  if (!username || !password) {
    return { success: false, message: "အသုံးပြုသူအမည်နှင့် လျှို့ဝှက်နံပါတ် ဖြည့်သွင်းပါ။" };
  }

  const secret = env.AUTH_SECRET;
  if (!secret) {
    return { success: false, message: "Server authentication setup မပြည့်စုံပါ။ (AUTH_SECRET လိုအပ်သည်)" };
  }

  // Token သက်တမ်း ၃၀ ရက် သတ်မှတ်ခြင်း (Security Best Practice)
  const expiresInMs = 30 * 24 * 60 * 60 * 1000;

  try {
    const user = await db.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
    
    if (user) {
      const isValid = await verifyPassword(password, user.password_hash);
      if (isValid) {
        const role = user.role || (username.toLowerCase() === "admin" ? "Admin" : "Member");
        const token = await signToken(
          { u: user.username, role, exp: Date.now() + expiresInMs },
          secret
        );
        return {
          success: true,
          token,
          expiresInMs,
          user: { username: user.username, role }
        };
      }
    }
  } catch (err) {
    console.error("[Login Error] DB Query Exception:", err);
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
      return handleUpdateYogi(db, payload, session);

    case "deleteYogi":
      return handleDeleteYogi(db, payload, session);

    case "toggleYogiStatus":
      return handleToggleYogiStatus(db, payload, session);

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
      return handleUpdateLeader(db, payload, session);

    case "deleteLeader":
      return handleDeleteLeader(db, payload, session);

    case "toggleLeaderStatus":
      return handleToggleLeaderStatus(db, payload, session);

    case "importLeader":
      return handleImportLeader(db, payload, session);

    // Cashbook Handlers
    case "getCashbookData":
      return handleGetCashbookData(db, payload);

    case "saveCashbook":
      return handleSaveCashbook(db, payload, session);

    case "updateCashbook":
      return handleUpdateCashbook(db, payload, session);

    case "deleteCashbook":
      return handleDeleteCashbook(db, payload, session);

    case "importCashbook":
      return handleImportCashbook(db, payload, session);

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

export default {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (!env.DB) {
      return json({ success: false, message: "D1 database connection မရှိပါ။" }, 500, corsHeaders);
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
    } catch {
      return json({ success: false, message: "Invalid request payload." }, 400, corsHeaders);
    }

    if (!action) {
      return json({ success: true, message: "Yogi & Cashbook System API is running." }, 200, corsHeaders);
    }

    let session = null;
    if (!PUBLIC_ACTIONS.has(action)) {
      session = await requireAuth(request, env);
      if (!session) {
        return json({ success: false, message: "Session သက်တမ်းကုန်ဆုံးသွားပါပြီ။ ကျေးဇူးပြု၍ ပြန်လည် Login ဝင်ပါ။" }, 401, corsHeaders);
      }
    }

    try {
      const result = await routeAction(action, payload, env, session);
      return json(result, 200, corsHeaders);
    } catch (err) {
      console.error(`[Worker Execution Error] action=${action}`, err);
      return json({ success: false, message: "ဆာဗာတွင် လုပ်ဆောင်ချက် မှားယွင်းနေပါသည်။ ခေတ္တစောင့်ပြီး ပြန်လည်ကြိုးစားပါ။" }, 500, corsHeaders);
    }
  }
};
