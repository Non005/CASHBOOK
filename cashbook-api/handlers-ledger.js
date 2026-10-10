/**
 * ========================================================================
 * handlers-ledger.js LEADERS HANDLERS
 * ========================================================================
 */

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function genId(prefix) {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${t}-${r}`.toUpperCase();
}

// Map D1 SQLite snake_case columns to Frontend camelCase
function toLeaderRow(r) {
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
    gender: r.gender || "ကျား",
    status: r.status,
    statusDate: r.status_date,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

export async function handleGetLeaderData(db, payload) {
  const page = Math.max(1, Number(payload.page || 1));
  const limit = Math.max(1, Math.min(200, Number(payload.limit || 25)));
  const offset = (page - 1) * limit;
  const search = String(payload.searchVal || "").trim();

  let where = "WHERE 1=1";
  const binds = [];
  if (search) {
    where += " AND (name LIKE ? OR phone LIKE ? OR address LIKE ? OR unique_id LIKE ?)";
    const s = `%${search}%`;
    binds.push(s, s, s, s);
  }

  const countRow = await db.prepare(`SELECT COUNT(*) as c FROM leaders ${where}`).bind(...binds).first();
  const aggRow = await db.prepare(
    `SELECT
       SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) as activeTotal,
       SUM(CASE WHEN status='Active' AND gender='ကျား' THEN 1 ELSE 0 END) as activeMale,
       SUM(CASE WHEN status='Active' AND gender='မ' THEN 1 ELSE 0 END) as activeFemale
     FROM leaders ${where}`
  ).bind(...binds).first();

  // Sort Active on Top, Inactive at Bottom by status_date/reg_date
  const rowsRes = await db.prepare(
    `SELECT * FROM leaders ${where}
     ORDER BY (status='Active') DESC, COALESCE(status_date, reg_date, created_at) DESC, id DESC
     LIMIT ? OFFSET ?`
  ).bind(...binds, limit, offset).all();

  return {
    success: true,
    data: {
      rows: (rowsRes.results || []).map(toLeaderRow),
      total: (countRow && countRow.c) || 0,
      page, limit,
      activeTotal: (aggRow && aggRow.activeTotal) || 0,
      activeMale: (aggRow && aggRow.activeMale) || 0,
      activeFemale: (aggRow && aggRow.activeFemale) || 0
    }
  };
}

export async function handleSaveLeader(db, payload, session) {
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

export async function handleUpdateLeader(db, payload) {
  const id = Number(payload.id);
  if (!id) return { success: false, message: "ID မတွေ့ပါ။" };

  const name = String(payload.name || "").trim();
  if (!name) return { success: false, message: "အမည် ဖြည့်သွင်းရန် လိုအပ်ပါသည်။" };

  const now = new Date().toISOString();

  // Preserves original reg_date and created_by on Edit!
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

export async function handleDeleteLeader(db, payload) {
  const id = Number(payload.id);
  if (!id) return { success: false, message: "ID မတွေ့ပါ။" };
  await db.prepare("DELETE FROM leaders WHERE id=?").bind(id).run();
  return { success: true, message: "စာရင်း ဖျက်ပြီးပါပြီ။" };
}

export async function handleToggleLeaderStatus(db, payload) {
  const id = Number(payload.id);
  if (!id) return { success: false, message: "ID မတွေ့ပါ။" };

  const row = await db.prepare("SELECT * FROM leaders WHERE id=?").bind(id).first();
  if (!row) return { success: false, message: "စာရင်း မတွေ့ပါ။" };

  const newStatus = payload.status || (row.status === "Active" ? "Inactive" : "Active");
  const clickDate = payload.regDate || todayStr();

  // Updates reg_date & status_date when toggling Active so it moves back to the top!
  await db.prepare("UPDATE leaders SET status=?, status_date=?, reg_date=?, updated_at=? WHERE id=?")
    .bind(newStatus, clickDate, clickDate, new Date().toISOString(), id).run();

  return { success: true, message: `Status → ${newStatus}`, status: newStatus };
}

export async function handleImportLeader(db, payload, session) {
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  if (!rows.length) return { success: false, message: "Import လုပ်ရန် ဒေတာ မတွေ့ပါ။" };

  const now = new Date().toISOString();
  const stmts = [];
  let inserted = 0;

  for (const r of rows) {
    const name = String(r.name || "").trim();
    if (!name) continue;
    const uniqueId = genId("L");
    const regDate = r.regDate || todayStr();
    stmts.push(
      db.prepare(
        `INSERT INTO leaders
          (unique_id, seq_no, reg_date, name, age, phone, address, email, gender, status, status_date, created_by, created_at, updated_at)
         VALUES (?, (SELECT COALESCE(MAX(seq_no),0)+1 FROM leaders), ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?)`
      ).bind(
        uniqueId, regDate, name, r.age || null, r.phone || "",
        r.address || "", r.email || "", r.gender || "ကျား",
        regDate, session ? session.u : "System", now, now
      )
    );
    inserted++;
  }
  if (stmts.length) await db.batch(stmts);

  return { success: true, message: `${inserted} ဦး Import အောင်မြင်ပါသည်။`, count: inserted };
}