/**
 * ========================================================================
 * YOGI MANAGEMENT SYSTEM — Cloudflare Worker API (worker.js)
 * ========================================================================
 */

const LEVELS = [
  { id: 1, name: "သတိကိုယ့်စိတ် ကိုယ်သိပါ" },
  { id: 2, name: "ရုပ် ကမ္မဋ္ဌာန်း" },
  { id: 3, name: "နာမ် ကမ္မဋ္ဌာန်း" },
  { id: 4, name: "ရုပ်နာမ် ကမ္မဋ္ဌာန်း" },
  { id: 5, name: "ခန္ဓာငါးပါး ကမ္မဋ္ဌာန်း" },
  { id: 6, name: "ဥပါဒါနက္ခန္ဓာငါးပါး ကမ္မဋ္ဌာန်း" },
  { id: 7, name: "သိ-ပါယ်-ဆိုက်-ပွား ကမ္မဋ္ဌာန်း" },
  { id: 8, name: "ယောဂီ စာရင်းဟောင်း" }
];

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

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function genId(prefix) {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${t}-${r}`.toUpperCase();
}

// Map D1 snake_case columns to Frontend camelCase
function mapYogiRow(r) {
  if (!r) return r;
  return {
    id: r.id,
    uniqueId: r.unique_id,
    groupId: r.group_id,
    level: r.level,
    seqNo: r.seq_no,
    regDate: r.reg_date,
    name: r.name,
    age: r.age,
    occupation: r.occupation || "",
    phone: r.phone,
    address: r.address,
    introducer: r.introducer,
    email: r.email,
    gender: r.gender,
    status: r.status,
    statusDate: r.status_date || r.reg_date,
    posted: r.posted,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

function mapLeaderRow(r) {
  if (!r) return r;
  return {
    id: r.id,
    uniqueId: r.unique_id,
    seqNo: r.seq_no,
    regDate: r.reg_date,
    name: r.name,
    age: r.age,
    phone: r.phone,
    address: r.address,
    email: r.email,
    gender: r.gender,
    status: r.status,
    statusDate: r.status_date || r.reg_date,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

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

/* --------------------------- Login Handler --------------------------- */

async function handleCheckLogin(db, payload, env) {
  const username = String(payload.username || "").trim();
  const password = String(payload.password || "").trim();

  if (!username || !password) {
    return { success: false, message: "အသုံးပြုသူအမည်နှင့် လျှို့ဝှက်နံပါတ် ဖြည့်သွင်းပါ။" };
  }

  // 💡 1. Admin & ဓမ္မဝန်ဆောင် တိုက်ရိုက် သုံးနိုင်သော Fallback Passwords မဖြစ်မနေ အရင်စစ်မည်
  const isFallbackAdmin = (username === 'Admin' && (password === 'Admin@123' || password === 'Admin@2026'));
  const isFallbackDhamma = (username.startsWith('ဓမ္မဝန်ဆောင်') && (password.includes('@123') || password.includes('@2026')));

  if (isFallbackAdmin || isFallbackDhamma) {
    const expiresInMs = 24 * 60 * 60 * 1000;
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

  // 💡 2. Database (users table) ထဲတွင် ရှာဖွေစစ်ဆေးခြင်း
  try {
    const user = await db.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
    if (user) {
      const hash = await sha256Hex(password);
      const isMatch = (hash === user.password_hash) || (password === user.password_hash);
      if (isMatch) {
        const expiresInMs = 24 * 60 * 60 * 1000;
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
    console.error("[DB Login Warning] users table error or empty:", err);
  }

  return { success: false, message: "အသုံးပြုသူအမည် သို့မဟုတ် လျှို့ဝှက်နံပါတ် မှားယွင်းနေပါသည်။" };
}

/* --------------------------- Dashboard Stats --------------------------- */

async function handleGetDashboardData(db) {
  const overall = await db.prepare(
    `SELECT
       SUM(CASE WHEN status='Active' AND level <= 7 THEN 1 ELSE 0 END) as totalActive,
       SUM(CASE WHEN status='Active' AND level <= 7 AND gender='ကျား' THEN 1 ELSE 0 END) as activeMale,
       SUM(CASE WHEN status='Active' AND level <= 7 AND gender='မ' THEN 1 ELSE 0 END) as activeFemale
     FROM yogis`
  ).first().catch(() => null);

  const perLevelRes = await db.prepare(
    `SELECT level,
        SUM(CASE WHEN status='Active' AND gender='ကျား' THEN 1 ELSE 0 END) as male,
        SUM(CASE WHEN status='Active' AND gender='မ' THEN 1 ELSE 0 END) as female,
        SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) as total
     FROM yogis WHERE level <= 7 GROUP BY level`
  ).all().catch(() => ({ results: [] }));

  const perLevelMap = {};
  (perLevelRes.results || []).forEach(r => { perLevelMap[r.level] = r; });

  const perLevel = LEVELS.filter(l => l.id <= 7).map(l => ({
    level: l.id,
    name: l.name,
    male: (perLevelMap[l.id] && perLevelMap[l.id].male) || 0,
    female: (perLevelMap[l.id] && perLevelMap[l.id].female) || 0,
    total: (perLevelMap[l.id] && perLevelMap[l.id].total) || 0
  }));

  const leaderAgg = await db.prepare(
    `SELECT
       SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) as total,
       SUM(CASE WHEN status='Active' AND gender='ကျား' THEN 1 ELSE 0 END) as male,
       SUM(CASE WHEN status='Active' AND gender='မ' THEN 1 ELSE 0 END) as female
     FROM leaders`
  ).first().catch(() => null);

  return {
    success: true,
    data: {
      totalActive: (overall && overall.totalActive) || 0,
      activeMale: (overall && overall.activeMale) || 0,
      activeFemale: (overall && overall.activeFemale) || 0,
      perLevel,
      leaders: {
        total: (leaderAgg && leaderAgg.total) || 0,
        male: (leaderAgg && leaderAgg.male) || 0,
        female: (leaderAgg && leaderAgg.female) || 0
      }
    }
  };
}

/* --------------------------- Yogi Level Handlers --------------------------- */

async function handleGetYogiData(db, payload) {
  const level = Number(payload.level || 1);
  const page = Math.max(1, Number(payload.page || 1));
  const limit = Math.max(1, Math.min(200, Number(payload.limit || 30)));
  const offset = (page - 1) * limit;
  const search = String(payload.searchVal || "").trim();

  let where = "WHERE level = ?";
  const binds = [];
  binds.push(level);

  if (search) {
    where += " AND (name LIKE ? OR phone LIKE ? OR address LIKE ? OR unique_id LIKE ?)";
    const s = `%${search}%`;
    binds.push(s, s, s, s);
  }

  const countRow = await db.prepare(`SELECT COUNT(*) as c FROM yogis ${where}`).bind(...binds).first().catch(() => ({ c: 0 }));
  const aggRow = await db.prepare(
    `SELECT
       SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) as activeTotal,
       SUM(CASE WHEN status='Active' AND gender='ကျား' THEN 1 ELSE 0 END) as activeMale,
       SUM(CASE WHEN status='Active' AND gender='မ' THEN 1 ELSE 0 END) as activeFemale
     FROM yogis ${where}`
  ).bind(...binds).first().catch(() => null);

  const rowsRes = await db.prepare(
    `SELECT * FROM yogis ${where}
     ORDER BY (status='Active') DESC, COALESCE(status_date, reg_date, created_at) DESC, id DESC
     LIMIT ? OFFSET ?`
  ).bind(...binds, limit, offset).all().catch(() => ({ results: [] }));

  return {
    success: true,
    data: {
      rows: (rowsRes.results || []).map(mapYogiRow),
      total: (countRow && countRow.c) || 0,
      page,
      limit,
      activeTotal: (aggRow && aggRow.activeTotal) || 0,
      activeMale: (aggRow && aggRow.activeMale) || 0,
      activeFemale: (aggRow && aggRow.activeFemale) || 0
    }
  };
}

async function handleSaveYogi(db, payload, session) {
  const level = Number(payload.level || 1);
  const name = String(payload.name || "").trim();
  if (!name) return { success: false, message: "အမည် ဖြည့်သွင်းရန် လိုအပ်ပါသည်။" };

  const uniqueId = genId(`Y${level}`);
  const groupId = genId("G");
  const regDate = payload.regDate || todayStr();
  const now = new Date().toISOString();

  await db.prepare(
    `INSERT INTO yogis
      (unique_id, group_id, level, seq_no, reg_date, name, age, occupation, phone, address, introducer, email, gender, status, status_date, posted, created_by, created_at, updated_at)
     VALUES (?, ?, ?, (SELECT COALESCE(MAX(seq_no),0)+1 FROM yogis WHERE level=?), ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, 0, ?, ?, ?)`
  ).bind(
    uniqueId, groupId, level, level, regDate, name,
    payload.age || null, payload.occupation || "", payload.phone || "", payload.address || "",
    payload.introducer || "", payload.email || "", payload.gender || "ကျား",
    regDate, session ? session.u : "System", now, now
  ).run();

  return { success: true, message: "ယောဂီစာရင်း အောင်မြင်စွာ သွင်းပြီးပါပြီ။", uniqueId };
}

async function handleUpdateYogi(db, payload, session) {
  const id = Number(payload.id);
  if (!id) return { success: false, message: "ID မတွေ့ပါ။" };

  const name = String(payload.name || "").trim();
  if (!name) return { success: false, message: "အမည် ဖြည့်သွင်းရန် လိုအပ်ပါသည်။" };

  const now = new Date().toISOString();

  await db.prepare(
    `UPDATE yogis SET
      name = ?,
      gender = ?,
      age = ?,
      occupation = ?,
      phone = ?,
      address = ?,
      introducer = ?,
      email = ?,
      updated_at = ?
     WHERE id = ?`
  ).bind(
    name,
    payload.gender || "ကျား",
    payload.age || null,
    payload.occupation || "",
    payload.phone || "",
    payload.address || "",
    payload.introducer || "",
    payload.email || "",
    now,
    id
  ).run();

  return { success: true, message: "ယောဂီ အချက်အလက် ပြင်ဆင်ပြီးပါပြီ။" };
}

async function handleToggleYogiStatus(db, payload) {
  const id = Number(payload.id);
  if (!id) return { success: false, message: "ID မတွေ့ပါ။" };

  const row = await db.prepare("SELECT * FROM yogis WHERE id=?").bind(id).first();
  if (!row) return { success: false, message: "စာရင်း မတွေ့ပါ။" };

  const newStatus = payload.status || (row.status === "Active" ? "Inactive" : "Active");
  const clickDate = payload.regDate || todayStr();

  await db.prepare("UPDATE yogis SET status=?, status_date=?, updated_at=? WHERE id=?")
    .bind(newStatus, clickDate, new Date().toISOString(), id).run();

  return { success: true, message: `Status → ${newStatus}`, status: newStatus };
}

async function handlePostYogi(db, payload, session) {
  const id = Number(payload.id);
  if (!id) return { success: false, message: "ID မတွေ့ပါ။" };

  const row = await db.prepare("SELECT * FROM yogis WHERE id=?").bind(id).first();
  if (!row) return { success: false, message: "စာရင်း မတွေ့ပါ။" };

  const currentLevel = Number(row.level);
  const nextLevel = currentLevel < 7 ? currentLevel + 1 : 8;
  const postDate = payload.postDate || todayStr();
  const now = new Date().toISOString();

  await db.prepare(
    `UPDATE yogis SET level=?, status_date=?, posted=0, updated_at=? WHERE id=?`
  ).bind(nextLevel, postDate, now, id).run();

  const nextLevelObj = LEVELS.find(l => l.id === nextLevel);
  const targetName = nextLevelObj ? nextLevelObj.name : "ယောဂီ စာရင်းဟောင်း";

  return { success: true, message: `${targetName} စာရင်းသို့ အောင်မြင်စွာ ရွှေ့လိုက်ပါပြီ။` };
}

async function handleDeleteYogi(db, payload, session) {
  if (session && session.u !== "Admin") {
    return { success: false, message: "Admin သာလျှင် စာရင်း ဖျက်ပစ်ခွင့် ရှိပါသည်။" };
  }

  const id = Number(payload.id);
  if (!id) return { success: false, message: "ID မတွေ့ပါ။" };
  await db.prepare("DELETE FROM yogis WHERE id=?").bind(id).run();
  return { success: true, message: "စာရင်း ဖျက်ပြီးပါပြီ။" };
}

async function handleImportYogi(db, payload, session) {
  const level = Number(payload.level || 1);
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  if (!rows.length) return { success: false, message: "Import လုပ်ရန် ဒေတာ မတွေ့ပါ။" };

  const now = new Date().toISOString();
  let inserted = 0;
  const stmts = [];
  for (const r of rows) {
    const name = String(r.name || "").trim();
    if (!name) continue;
    const uniqueId = genId(`Y${level}`);
    const groupId = genId("G");
    const regDate = r.regDate || todayStr();
    stmts.push(
      db.prepare(
        `INSERT INTO yogis
          (unique_id, group_id, level, seq_no, reg_date, name, age, occupation, phone, address, introducer, email, gender, status, status_date, posted, created_by, created_at, updated_at)
         VALUES (?, ?, ?, (SELECT COALESCE(MAX(seq_no),0)+1 FROM yogis WHERE level=?), ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, 0, ?, ?, ?)`
      ).bind(
        uniqueId, groupId, level, level, regDate, name,
        r.age || null, r.occupation || "", r.phone || "", r.address || "", r.introducer || "",
        r.email || "", r.gender || "ကျား", regDate, session ? session.u : "System", now, now
      )
    );
    inserted++;
  }
  if (stmts.length) await db.batch(stmts);

  return { success: true, message: `${inserted} ဦး Import အောင်မြင်ပါသည်။`, count: inserted };
}

/* --------------------------- Leaders Handlers --------------------------- */

async function handleGetLeaderData(db, payload) {
  const page = Math.max(1, Number(payload.page || 1));
  const limit = Math.max(1, Math.min(200, Number(payload.limit || 30)));
  const offset = (page - 1) * limit;
  const search = String(payload.searchVal || "").trim();

  let where = "WHERE 1=1";
  const binds = [];
  if (search) {
    where += " AND (name LIKE ? OR phone LIKE ? OR address LIKE ? OR unique_id LIKE ?)";
    const s = `%${search}%`;
    binds.push(s, s, s, s);
  }

  const countRow = await db.prepare(`SELECT COUNT(*) as c FROM leaders ${where}`).bind(...binds).first().catch(() => ({ c: 0 }));
  const aggRow = await db.prepare(
    `SELECT
       SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) as activeTotal,
       SUM(CASE WHEN status='Active' AND gender='ကျား' THEN 1 ELSE 0 END) as activeMale,
       SUM(CASE WHEN status='Active' AND gender='မ' THEN 1 ELSE 0 END) as activeFemale
     FROM leaders ${where}`
  ).bind(...binds).first().catch(() => null);

  const rowsRes = await db.prepare(
    `SELECT * FROM leaders ${where}
     ORDER BY (status='Active') DESC, COALESCE(status_date, reg_date, created_at) DESC, id DESC
     LIMIT ? OFFSET ?`
  ).bind(...binds, limit, offset).all().catch(() => ({ results: [] }));

  return {
    success: true,
    data: {
      rows: (rowsRes.results || []).map(mapLeaderRow),
      total: (countRow && countRow.c) || 0,
      page, limit,
      activeTotal: (aggRow && aggRow.activeTotal) || 0,
      activeMale: (aggRow && aggRow.activeMale) || 0,
      activeFemale: (aggRow && aggRow.activeFemale) || 0
    }
  };
}

async function handleSaveLeader(db, payload, session) {
  const name = String(payload.name || "").trim();
  if (!name) return { success: false, message: "အမည် ဖြည့်သွင်းရန် လိုအပ်ပါသည်။" };

  const uniqueId = genId("L");
  const regDate = payload.regDate || todayStr();
  const now = new Date().toISOString();

  await db.prepare(
    `INSERT INTO leaders
      (unique_id, seq_no, reg_date, name, age, phone, address, email, gender, status, status_date, created_by, created_at, updated_at)
     VALUES (?, (SELECT COALESCE(MAX(seq_no),0)+1 FROM leaders), ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?)`
  ).bind(
    uniqueId, regDate, name, payload.age || null, payload.phone || "",
    payload.address || "", payload.email || "", payload.gender || "ကျား",
    regDate, session ? session.u : "System", now, now
  ).run();

  return { success: true, message: "ဦးဆောင်ဆွေးနွေးယောဂီ အောင်မြင်စွာ သွင်းပြီးပါပြီ။", uniqueId };
}

async function handleUpdateLeader(db, payload, session) {
  const id = Number(payload.id);
  if (!id) return { success: false, message: "ID မတွေ့ပါ။" };

  const name = String(payload.name || "").trim();
  if (!name) return { success: false, message: "အမည် ဖြည့်သွင်းရန် လိုအပ်ပါသည်။" };

  const now = new Date().toISOString();

  await db.prepare(
    `UPDATE leaders SET
      name = ?,
      gender = ?,
      age = ?,
      phone = ?,
      address = ?,
      email = ?,
      updated_at = ?
     WHERE id = ?`
  ).bind(
    name,
    payload.gender || "ကျား",
    payload.age || null,
    payload.phone || "",
    payload.address || "",
    payload.email || "",
    now,
    id
  ).run();

  return { success: true, message: "ဦးဆောင်ယောဂီ အချက်အလက် ပြင်ဆင်ပြီးပါပြီ။" };
}

async function handleToggleLeaderStatus(db, payload) {
  const id = Number(payload.id);
  if (!id) return { success: false, message: "ID မတွေ့ပါ။" };

  const row = await db.prepare("SELECT * FROM leaders WHERE id=?").bind(id).first();
  if (!row) return { success: false, message: "စာရင်း မတွေ့ပါ။" };

  const newStatus = payload.status || (row.status === "Active" ? "Inactive" : "Active");
  const clickDate = payload.regDate || todayStr();

  // 💡 Keep original reg_date intact
  await db.prepare("UPDATE leaders SET status=?, status_date=?, updated_at=? WHERE id=?")
    .bind(newStatus, clickDate, new Date().toISOString(), id).run();

  return { success: true, message: `Status → ${newStatus}`, status: newStatus };
}

async function handleDeleteLeader(db, payload, session) {
  if (session && session.u !== "Admin") {
    return { success: false, message: "Admin သာလျှင် စာရင်း ဖျက်ပစ်ခွင့် ရှိပါသည်။" };
  }

  const id = Number(payload.id);
  if (!id) return { success: false, message: "ID မတွေ့ပါ။" };
  await db.prepare("DELETE FROM leaders WHERE id=?").bind(id).run();
  return { success: true, message: "စာရင်း ဖျက်ပြီးပါပြီ။" };
}

/* --------------------------- Total Summary List Rollup --------------------------- */

async function handleGetTotalListData(db) {
  const out = [];
  for (let i = 1; i <= 7; i++) {
    const l = LEVELS.find(x => x.id === i);
    const res = await db.prepare(
      `SELECT id, unique_id, name, age, occupation, gender, phone, reg_date, status_date, status
       FROM yogis WHERE level=? AND status='Active' ORDER BY id DESC`
    ).bind(i).all().catch(() => ({ results: [] }));
    out.push({ level: i, name: l.name, rows: (res.results || []).map(mapYogiRow) });
  }
  return { success: true, data: out };
}

/* --------------------------------- Router --------------------------------- */

const PUBLIC_ACTIONS = new Set(["checkLogin", "ping"]);

async function routeAction(action, payload, env, session) {
  const db = env.DB;

  switch (action) {
    case "ping":
      return { success: true, message: "pong" };

    case "checkLogin":
      return handleCheckLogin(db, payload, env);

    case "getDashboardData":
      return handleGetDashboardData(db);

    case "getTotalListData":
      return handleGetTotalListData(db);

    case "getYogiData":
      return handleGetYogiData(db, payload);

    case "saveYogi":
      return handleSaveYogi(db, payload, session);

    case "updateYogi":
      return handleUpdateYogi(db, payload, session);

    case "deleteYogi":
      return handleDeleteYogi(db, payload, session);

    case "toggleYogiStatus":
      return handleToggleYogiStatus(db, payload);

    case "postYogi":
      return handlePostYogi(db, payload, session);

    case "importYogi":
      return handleImportYogi(db, payload, session);

    case "getLeaderData":
      return handleGetLeaderData(db, payload);

    case "saveLeader":
      return handleSaveLeader(db, payload, session);

    case "updateLeader":
      return handleUpdateLeader(db, payload, session);

    case "deleteLeader":
      return handleDeleteLeader(db, payload, session);

    case "toggleLeaderStatus":
      return handleToggleLeaderStatus(db, payload);

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

export default {
  async fetch(request, env) {
    // 💡 1. Preflight OPTIONS Handling with HTTP 204
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (!env.DB) {
      return json({ success: false, message: "D1 database binding (DB) is not configured on this worker." }, 500);
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
