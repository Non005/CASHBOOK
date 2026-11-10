/**
 * ========================================================================
 * YOGI HANDLERS (handlers-yogi.js)
 * Hardened Security & D1 Quota Optimized
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

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function genId(prefix) {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${t}-${r}`.toUpperCase();
}

function levelName(level) {
  const l = LEVELS.find(x => x.id === Number(level));
  return l ? l.name : `Level ${level}`;
}

function isValidDate(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(Date.parse(dateStr));
}

// Map D1 SQLite snake_case columns to Frontend camelCase
function toYogiRow(r) {
  if (!r) return r;
  return {
    id: r.id,
    uniqueId: r.unique_id,
    groupId: r.group_id,
    level: r.level,
    levelName: levelName(r.level),
    seqNo: r.seq_no,
    regDate: r.reg_date,
    name: r.name,
    age: r.age,
    occupation: r.occupation || "",
    phone: r.phone,
    address: r.address,
    introducer: r.introducer,
    email: r.email,
    gender: r.gender || "ကျား",
    status: r.status,
    statusDate: r.status_date || r.reg_date,
    posted: !!r.posted,
    canPost: !r.posted,
    createdBy: r.created_by,
    updatedBy: r.updated_by || r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

/**
 * ၁။ ယောဂီစာရင်း ဆွဲထုတ်ခြင်း (D1 Read ချွေတာထားသော Single-Agg Query)
 */
export async function handleGetYogiData(db, payload) {
  const level = Math.max(1, Math.min(8, Number(payload.level || 1)));
  const page = Math.max(1, Number(payload.page || 1));
  const limit = Math.max(1, Math.min(200, Number(payload.limit || 30)));
  const offset = (page - 1) * limit;
  const search = String(payload.searchVal || "").trim();

  let where = "WHERE level = ?";
  const binds = [level];

  if (search) {
    where += " AND (name LIKE ? OR phone LIKE ? OR address LIKE ? OR unique_id LIKE ?)";
    const s = `%${search}%`;
    binds.push(s, s, s, s);
  }

  // Count နှင့် Gender Breakdown ကို Single Query ဖြင့် ပေါင်းဆွဲယူခြင်း (Row Scanned သက်သာစေသည်)
  const aggRow = await db.prepare(
    `SELECT
       COUNT(*) as totalCount,
       SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) as activeTotal,
       SUM(CASE WHEN status='Active' AND gender='ကျား' THEN 1 ELSE 0 END) as activeMale,
       SUM(CASE WHEN status='Active' AND gender='မ' THEN 1 ELSE 0 END) as activeFemale
     FROM yogis ${where}`
  ).bind(...binds).first().catch(() => ({
    totalCount: 0,
    activeTotal: 0,
    activeMale: 0,
    activeFemale: 0
  }));

  const rowsRes = await db.prepare(
    `SELECT * FROM yogis ${where}
     ORDER BY (status='Active') DESC, COALESCE(status_date, reg_date, created_at) DESC, id DESC
     LIMIT ? OFFSET ?`
  ).bind(...binds, limit, offset).all().catch(() => ({ results: [] }));

  return {
    success: true,
    data: {
      rows: (rowsRes.results || []).map(toYogiRow),
      total: (aggRow && aggRow.totalCount) || 0,
      page,
      limit,
      activeTotal: (aggRow && aggRow.activeTotal) || 0,
      activeMale: (aggRow && aggRow.activeMale) || 0,
      activeFemale: (aggRow && aggRow.activeFemale) || 0
    }
  };
}

/**
 * ၂။ ယောဂီ အသစ်စာရင်းသွင်းခြင်း
 */
export async function handleSaveYogi(db, payload, session) {
  const level = Math.max(1, Math.min(8, Number(payload.level || 1)));
  const name = String(payload.name || "").trim();
  if (!name) return { success: false, message: "အမည် ဖြည့်သွင်းရန် လိုအပ်ပါသည်။" };

  const uniqueId = genId(`Y${level}`);
  const groupId = genId("G");
  let regDate = String(payload.regDate || "").trim();
  if (!isValidDate(regDate)) regDate = todayStr();

  const now = new Date().toISOString();
  const user = session ? session.u : "System";
  const gender = payload.gender === "မ" ? "မ" : "ကျား";

  await db.prepare(
    `INSERT INTO yogis
      (unique_id, group_id, level, seq_no, reg_date, name, age, occupation, phone, address, introducer, email, gender, status, status_date, posted, created_by, updated_by, created_at, updated_at)
     VALUES (?, ?, ?, (SELECT COALESCE(MAX(seq_no),0)+1 FROM yogis WHERE level=?), ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, 0, ?, ?, ?, ?)`
  ).bind(
    uniqueId, groupId, level, level, regDate, name,
    payload.age || null, payload.occupation || "", payload.phone || "", payload.address || "",
    payload.introducer || "", payload.email || "", gender,
    regDate, user, user, now, now
  ).run();

  return { success: true, message: "ယောဂီစာရင်း အောင်မြင်စွာ သွင်းပြီးပါပြီ။", uniqueId };
}

/**
 * ၃။ ယောဂီ အချက်အလက် ပြင်ဆင်ခြင်း
 */
export async function handleUpdateYogi(db, payload, session) {
  const id = Number(payload.id);
  if (!id) return { success: false, message: "ID မတွေ့ပါ။" };

  const name = String(payload.name || "").trim();
  if (!name) return { success: false, message: "အမည် ဖြည့်သွင်းရန် လိုအပ်ပါသည်။" };

  const now = new Date().toISOString();
  const user = session ? session.u : "System";
  const gender = payload.gender === "မ" ? "မ" : "ကျား";

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
      updated_by = ?,
      updated_at = ?
     WHERE id = ?`
  ).bind(
    name,
    gender,
    payload.age || null,
    payload.occupation || "",
    payload.phone || "",
    payload.address || "",
    payload.introducer || "",
    payload.email || "",
    user,
    now,
    id
  ).run();

  return { success: true, message: "ယောဂီ အချက်အလက် ပြင်ဆင်ပြီးပါပြီ။" };
}

/**
 * ၄။ ယောဂီ ဖျက်ပစ်ခြင်း (Admin သာလျှင် ခွင့်ပြုသည်)
 */
export async function handleDeleteYogi(db, payload, session) {
  const role = session ? session.role : "";
  const username = session ? session.u : "";
  if (role !== "Admin" && username !== "Admin") {
    return { success: false, message: "Admin သာလျှင် ယောဂီစာရင်း ဖျက်ပစ်ခွင့် ရှိပါသည်။" };
  }

  const id = Number(payload.id);
  if (!id) return { success: false, message: "ID မတွေ့ပါ။" };

  await db.prepare("DELETE FROM yogis WHERE id=?").bind(id).run();
  return { success: true, message: "စာရင်း ဖျက်ပြီးပါပြီ။" };
}

/**
 * ၅။ Active / Inactive Status ပြောင်းလဲခြင်း
 */
export async function handleToggleYogiStatus(db, payload, session) {
  const id = Number(payload.id);
  if (!id) return { success: false, message: "ID မတွေ့ပါ။" };

  const row = await db.prepare("SELECT * FROM yogis WHERE id=?").bind(id).first();
  if (!row) return { success: false, message: "စာရင်း မတွေ့ပါ။" };

  const newStatus = payload.status || (row.status === "Active" ? "Inactive" : "Active");
  let clickDate = String(payload.regDate || "").trim();
  if (!isValidDate(clickDate)) clickDate = todayStr();

  const user = session ? session.u : "System";

  await db.prepare("UPDATE yogis SET status=?, status_date=?, reg_date=?, updated_by=?, updated_at=? WHERE id=?")
    .bind(newStatus, clickDate, clickDate, user, new Date().toISOString(), id).run();

  return { success: true, message: `Status → ${newStatus}`, status: newStatus };
}

/**
 * ၆။ Post Yogi (အဆင့်မြှင့်တင်ခြင်း / နောက်တစ်ဆင့်သို့ ရွှေ့ခြင်း)
 */
export async function handlePostYogi(db, payload, session) {
  const id = Number(payload.id);
  if (!id) return { success: false, message: "ID မတွေ့ပါ။" };

  const row = await db.prepare("SELECT * FROM yogis WHERE id=?").bind(id).first();
  if (!row) return { success: false, message: "စာရင်း မတွေ့ပါ။" };

  const currentLevel = Number(row.level);
  const nextLevel = currentLevel < 7 ? currentLevel + 1 : 8;
  
  let postDate = String(payload.postDate || "").trim();
  if (!isValidDate(postDate)) postDate = todayStr();

  const now = new Date().toISOString();
  const user = session ? session.u : "System";

  await db.prepare(
    `UPDATE yogis SET level=?, status_date=?, posted=0, updated_by=?, updated_at=? WHERE id=?`
  ).bind(nextLevel, postDate, user, now, id).run();

  const targetName = levelName(nextLevel);
  return { success: true, message: `${targetName} စာရင်းသို့ အောင်မြင်စွာ ရွှေ့လိုက်ပါပြီ။` };
}

/**
 * ၇။ Excel Import (Batch Chunking & Quota Safe)
 */
export async function handleImportYogi(db, payload, session) {
  const level = Math.max(1, Math.min(8, Number(payload.level || 1)));
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  if (!rows.length) return { success: false, message: "Import လုပ်ရန် ဒေတာ မတွေ့ပါ။" };

  const now = new Date().toISOString();
  const user = session ? session.u : "System";
  let inserted = 0;
  const stmts = [];

  for (const r of rows) {
    const name = String(r.name || "").trim();
    if (!name) continue;
    const uniqueId = genId(`Y${level}`);
    const groupId = genId("G");
    let regDate = r.regDate || todayStr();
    if (!isValidDate(regDate)) regDate = todayStr();

    stmts.push(
      db.prepare(
        `INSERT INTO yogis
          (unique_id, group_id, level, seq_no, reg_date, name, age, occupation, phone, address, introducer, email, gender, status, status_date, posted, created_by, updated_by, created_at, updated_at)
         VALUES (?, ?, ?, (SELECT COALESCE(MAX(seq_no),0)+1 FROM yogis WHERE level=?), ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, 0, ?, ?, ?, ?)`
      ).bind(
        uniqueId, groupId, level, level, regDate, name,
        r.age || null, r.occupation || "", r.phone || "", r.address || "", r.introducer || "",
        r.email || "", r.gender === "မ" ? "မ" : "ကျား", regDate, user, user, now, now
      )
    );
    inserted++;
  }

  // D1 Batch Chunking (၅၀ စီ ခွဲ၍ သိမ်းဆည်းခြင်း)
  const chunkSize = 50;
  for (let i = 0; i < stmts.length; i += chunkSize) {
    const chunk = stmts.slice(i, i + chunkSize);
    await db.batch(chunk);
  }

  return { success: true, message: `${inserted} ဦး Import အောင်မြင်ပါသည်။`, count: inserted };
}
