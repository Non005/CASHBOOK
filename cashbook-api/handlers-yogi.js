/**
 * ========================================================================
 * YOGI HANDLERS (handlers-yogi.js)
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
    phone: r.phone,
    address: r.address,
    introducer: r.introducer,
    email: r.email,
    gender: r.gender || "ကျား",
    status: r.status,
    statusDate: r.status_date,
    posted: !!r.posted,
    canPost: !r.posted,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

export async function handleGetYogiData(db, payload) {
  const level = Number(payload.level || 1);
  const page = Math.max(1, Number(payload.page || 1));
  const limit = Math.max(1, Math.min(200, Number(payload.limit || 25)));
  const offset = (page - 1) * limit;
  const search = String(payload.searchVal || "").trim();

  let where = "WHERE level = ?";
  
  // 💡 Fixed TS2345 Error: Initialize binds as flexible array
  const binds = [];
  binds.push(level);

  if (search) {
    where += " AND (name LIKE ? OR phone LIKE ? OR address LIKE ? OR unique_id LIKE ?)";
    const s = `%${search}%`;
    binds.push(s, s, s, s);
  }

  const countRow = await db.prepare(`SELECT COUNT(*) as c FROM yogis ${where}`).bind(...binds).first();
  const aggRow = await db.prepare(
    `SELECT
       SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) as activeTotal,
       SUM(CASE WHEN status='Active' AND gender='ကျား' THEN 1 ELSE 0 END) as activeMale,
       SUM(CASE WHEN status='Active' AND gender='မ' THEN 1 ELSE 0 END) as activeFemale
     FROM yogis ${where}`
  ).bind(...binds).first();

  // Sort Active on Top, Inactive at Bottom by status_date/reg_date
  const rowsRes = await db.prepare(
    `SELECT * FROM yogis ${where}
     ORDER BY (status='Active') DESC, COALESCE(status_date, reg_date, created_at) DESC, id DESC
     LIMIT ? OFFSET ?`
  ).bind(...binds, limit, offset).all();

  return {
    success: true,
    data: {
      rows: (rowsRes.results || []).map(toYogiRow),
      total: (countRow && countRow.c) || 0,
      page,
      limit,
      activeTotal: (aggRow && aggRow.activeTotal) || 0,
      activeMale: (aggRow && aggRow.activeMale) || 0,
      activeFemale: (aggRow && aggRow.activeFemale) || 0
    }
  };
}

export async function handleSaveYogi(db, payload, session) {
  const level = Number(payload.level || 1);
  const name = String(payload.name || "").trim();
  if (!name) return { success: false, message: "အမည် ဖြည့်သွင်းရန် လိုအပ်ပါသည်။" };

  const uniqueId = genId(`Y${level}`);
  const groupId = genId("G");
  const regDate = payload.regDate || todayStr();
  const now = new Date().toISOString();

  await db.prepare(
    `INSERT INTO yogis
      (unique_id, group_id, level, seq_no, reg_date, name, age, phone, address, introducer, email, gender, status, status_date, posted, created_by, created_at, updated_at)
     VALUES (?, ?, ?, (SELECT COALESCE(MAX(seq_no),0)+1 FROM yogis WHERE level=?), ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, 0, ?, ?, ?)`
  ).bind(
    uniqueId, groupId, level, level, regDate, name,
    payload.age || null, payload.phone || "", payload.address || "",
    payload.introducer || "", payload.email || "", payload.gender || "ကျား",
    regDate, session ? session.u : "System", now, now
  ).run();

  return { success: true, message: "ယောဂီစာရင်း အောင်မြင်စွာ သွင်းပြီးပါပြီ။", uniqueId };
}

export async function handleUpdateYogi(db, payload) {
  const id = Number(payload.id);
  if (!id) return { success: false, message: "ID မတွေ့ပါ။" };

  const name = String(payload.name || "").trim();
  if (!name) return { success: false, message: "အမည် ဖြည့်သွင်းရန် လိုအပ်ပါသည်။" };

  const now = new Date().toISOString();

  // Preserves original reg_date and created_by on Edit!
  await db.prepare(
    `UPDATE yogis SET
      name = ?,
      gender = ?,
      age = ?,
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
    payload.phone || "",
    payload.address || "",
    payload.introducer || "",
    payload.email || "",
    now,
    id
  ).run();

  return { success: true, message: "ယောဂီ အချက်အလက် ပြင်ဆင်ပြီးပါပြီ။" };
}

export async function handleDeleteYogi(db, payload) {
  const id = Number(payload.id);
  if (!id) return { success: false, message: "ID မတွေ့ပါ။" };
  await db.prepare("DELETE FROM yogis WHERE id=?").bind(id).run();
  return { success: true, message: "စာရင်း ဖျက်ပြီးပါပြီ။" };
}

export async function handleToggleYogiStatus(db, payload) {
  const id = Number(payload.id);
  if (!id) return { success: false, message: "ID မတွေ့ပါ။" };

  const row = await db.prepare("SELECT * FROM yogis WHERE id=?").bind(id).first();
  if (!row) return { success: false, message: "စာရင်း မတွေ့ပါ။" };

  const newStatus = payload.status || (row.status === "Active" ? "Inactive" : "Active");
  const clickDate = payload.regDate || todayStr();

  // Updates reg_date & status_date when toggling Active so it moves back to the top!
  await db.prepare("UPDATE yogis SET status=?, status_date=?, reg_date=?, updated_at=? WHERE id=?")
    .bind(newStatus, clickDate, clickDate, new Date().toISOString(), id).run();

  return { success: true, message: `Status → ${newStatus}`, status: newStatus };
}

/**
 * Post Yogi Logic:
 * Stage 1-6 -> Promote to Next Stage
 * Stage 7 (သိ-ပါယ်-ဆိုက်-ပွား) -> Move to Stage 8 (ယောဂီ စာရင်းဟောင်း)
 */
export async function handlePostYogi(db, payload, session) {
  const id = Number(payload.id);
  if (!id) return { success: false, message: "ID မတွေ့ပါ။" };

  const row = await db.prepare("SELECT * FROM yogis WHERE id=?").bind(id).first();
  if (!row) return { success: false, message: "စာရင်း မတွေ့ပါ။" };
  if (row.posted) return { success: false, message: "ဤစာရင်းကို Post လုပ်ပြီးသားဖြစ်ပါသည်။" };

  const currentLevel = Number(row.level);
  const nextLevel = currentLevel < 7 ? currentLevel + 1 : 8; // Stage 7 posted goes to Stage 8 (Old Yogis)
  const postDate = payload.postDate || todayStr();
  const now = new Date().toISOString();
  const uniqueId = genId(`Y${nextLevel}`);

  await db.batch([
    db.prepare(
      `INSERT INTO yogis
        (unique_id, group_id, level, seq_no, reg_date, name, age, phone, address, introducer, email, gender, status, status_date, posted, created_by, created_at, updated_at)
       VALUES (?, ?, ?, (SELECT COALESCE(MAX(seq_no),0)+1 FROM yogis WHERE level=?), ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, 0, ?, ?, ?)`
    ).bind(
      uniqueId, row.group_id, nextLevel, nextLevel, postDate, row.name,
      row.age, row.phone, row.address, row.introducer, row.email, row.gender,
      postDate, session ? session.u : "System", now, now
    ),
    db.prepare("UPDATE yogis SET posted=1, updated_at=? WHERE id=?").bind(now, id)
  ]);

  const targetName = levelName(nextLevel);
  return { success: true, message: `${targetName} စာရင်းသို့ Auto ရောက်ရှိသွားပါပြီ။`, uniqueId };
}

export async function handleImportYogi(db, payload, session) {
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
          (unique_id, group_id, level, seq_no, reg_date, name, age, phone, address, introducer, email, gender, status, status_date, posted, created_by, created_at, updated_at)
         VALUES (?, ?, ?, (SELECT COALESCE(MAX(seq_no),0)+1 FROM yogis WHERE level=?), ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, 0, ?, ?, ?)`
      ).bind(
        uniqueId, groupId, level, level, regDate, name,
        r.age || null, r.phone || "", r.address || "", r.introducer || "",
        r.email || "", r.gender || "ကျား", regDate, session ? session.u : "System", now, now
      )
    );
    inserted++;
  }

  if (stmts.length) await db.batch(stmts);

  return { success: true, message: `${inserted} ဦး Import အောင်မြင်ပါသည်။`, count: inserted };
}