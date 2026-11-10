/**
 * ========================================================================
 * handlers-cashbook.js — HARDENED & OPTIMIZED CASHBOOK HANDLERS (D1 SQLite)
 * ========================================================================
 */

const INCOME_CATEGORIES = ["အလှူရရှိ", "အလှူငွေ", "စာအုပ်ရောင်းရငွေ", "ဘဏ်တိုး"];
const EXPENSE_CATEGORIES = [
  "ပုံနှိပ်တိုက်ပေးငွေ",
  "ပုံနှိပ်တိုက်ထုတ်ပေးငွေ",
  "တရားစခန်းအလှူငွေ",
  "တရားစခန်း အလှူငွေ",
  "အထွေထွေအသုံးစရိတ်",
  "အထွေထွေ အသုံးစရိတ်"
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function genId(prefix) {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${t}-${r}`.toUpperCase();
}

function cleanCat(str) {
  return String(str || "").replace(/\s+/g, "").trim();
}

function isValidDate(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(Date.parse(dateStr));
}

function toCashRow(r) {
  if (!r) return r;
  return {
    id: r.id,
    uniqueId: r.unique_id,
    txDate: r.tx_date,
    category: r.category,
    description: r.description,
    type: r.type,
    income: Number(r.income || 0),
    expense: Number(r.expense || 0),
    balance: Number(r.balance || 0),
    leaderName: r.leader_name,
    createdBy: r.created_by,
    updatedBy: r.updated_by || r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

/**
 * ၁။ ငွေစာရင်းများ ဆွဲထုတ်ခြင်း (Pagination & Aggregation)
 */
export async function handleGetCashbookData(db, payload) {
  const page = Math.max(1, Number(payload.page || 1));
  const limit = Math.max(1, Math.min(200, Number(payload.limit || 30)));
  const offset = (page - 1) * limit;

  const search = String(payload.searchVal || "").trim();
  const fromDate = String(payload.fromDate || "").trim();
  const toDate = String(payload.toDate || "").trim();

  let where = "WHERE 1=1";
  const binds = [];

  if (search) {
    where += " AND (leader_name LIKE ? OR description LIKE ? OR category LIKE ?)";
    const s = `%${search}%`;
    binds.push(s, s, s);
  }

  if (fromDate && isValidDate(fromDate)) {
    where += " AND tx_date >= ?";
    binds.push(fromDate);
  }

  if (toDate && isValidDate(toDate)) {
    where += " AND tx_date <= ?";
    binds.push(toDate);
  }

  // စုစုပေါင်း ဝင်ငွေ၊ ထွက်ငွေ၊ စာအုပ်ရောင်းရငွေ နှင့် Record အရေအတွက်ကို တစ်ကြိမ်တည်းဖြင့် ဖတ်ယူခြင်း
  const aggRow = await db.prepare(
    `SELECT 
       COUNT(*) as totalCount,
       COALESCE(SUM(income), 0) as totalIncome,
       COALESCE(SUM(expense), 0) as totalExpense,
       COALESCE(SUM(CASE WHEN REPLACE(category, ' ', '') = 'စာအုပ်ရောင်းရငွေ' THEN income ELSE 0 END), 0) as totalBookSales
     FROM cashbook ${where}`
  ).bind(...binds).first().catch(() => ({
    totalCount: 0,
    totalIncome: 0,
    totalExpense: 0,
    totalBookSales: 0
  }));

  const totalIncome = (aggRow && aggRow.totalIncome) || 0;
  const totalExpense = (aggRow && aggRow.totalExpense) || 0;
  const totalBookSales = (aggRow && aggRow.totalBookSales) || 0;
  const balance = totalIncome - totalExpense;
  const totalCount = (aggRow && aggRow.totalCount) || 0;

  // Running balance calculation (Window function optimized with indexing)
  const rowsRes = await db.prepare(
    `WITH RankedCB AS (
       SELECT 
         id, unique_id, tx_date, category, description, type, income, expense, leader_name, 
         created_by, updated_by, created_at, updated_at,
         SUM(income - expense) OVER (ORDER BY tx_date ASC, id ASC) as balance
       FROM cashbook
       ${where}
     )
     SELECT * FROM RankedCB
     ORDER BY tx_date DESC, id DESC
     LIMIT ? OFFSET ?`
  ).bind(...binds, limit, offset).all().catch(() => ({ results: [] }));

  return {
    success: true,
    data: {
      rows: (rowsRes.results || []).map(toCashRow),
      total: totalCount,
      page,
      limit,
      totalIncome,
      totalExpense,
      totalBookSales,
      balance
    }
  };
}

/**
 * ၂။ ငွေစာရင်း အသစ်ထည့်သွင်းခြင်း (Validation & Idempotency Key ပါဝင်သည်)
 */
export async function handleSaveCashbook(db, payload, session) {
  const category = String(payload.category || "").trim();
  const description = String(payload.description || "").trim();
  const leaderName = String(payload.leaderName || "").trim();
  const amount = Number(payload.amount);
  const clientTxId = String(payload.clientTxId || "").trim(); // Client မှ ပို့ပေးသော Offline UUID

  if (!category) return { success: false, message: "ခေါင်းစဉ် ရွေးချယ်ရန် လိုအပ်ပါသည်။" };
  if (!description) return { success: false, message: "အကြောင်းအရာ ဖြည့်သွင်းရန် လိုအပ်ပါသည်။" };
  if (!leaderName) return { success: false, message: "ဦးဆောင်သူ အမည် ဖြည့်သွင်းရန် လိုအပ်ပါသည်။" };
  if (isNaN(amount) || amount <= 0 || amount > 10000000000) {
    return { success: false, message: "ငွေပမာဏ မှန်ကန်စွာ ဖြည့်သွင်းပါရန်။" };
  }

  // Idempotency Check: အကယ်၍ ဤ clientTxId ဖြင့် စာရင်းသွင်းပြီးသားရှိပါက နှစ်ခါမထည့်ဘဲ မူလ data ကိုသာ ပြန်ပေးမည်
  if (clientTxId) {
    const existing = await db.prepare(
      "SELECT unique_id FROM cashbook WHERE unique_id = ? OR description LIKE ?"
    ).bind(clientTxId, `%[IDEM:${clientTxId}]%`).first().catch(() => null);

    if (existing) {
      return { 
        success: true, 
        message: "ငွေစာရင်း သိမ်းဆည်းပြီးဖြစ်ပါသည်။ (Duplicate ကာကွယ်ထားသည်)", 
        uniqueId: existing.unique_id 
      };
    }
  }

  const isIncome = INCOME_CATEGORIES.some(c => cleanCat(c) === cleanCat(category));
  const type = isIncome ? "income" : "expense";
  const income = isIncome ? amount : 0;
  const expense = isIncome ? 0 : amount;

  const uniqueId = clientTxId || genId("CB");
  let txDate = String(payload.txDate || "").trim();
  if (!isValidDate(txDate)) {
    txDate = todayStr();
  }
  const now = new Date().toISOString();
  const user = session ? session.u : "System";

  await db.prepare(
    `INSERT INTO cashbook
      (unique_id, tx_date, category, description, type, income, expense, leader_name, created_by, updated_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    uniqueId, txDate, category, description, type,
    income, expense, leaderName,
    user, user, now, now
  ).run();

  return { success: true, message: "ငွေစာရင်း အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။", uniqueId };
}

/**
 * ၃။ ငွေစာရင်း ပြင်ဆင်ခြင်း (Admin Only သို့မဟုတ် Role စစ်ဆေးမှု)
 */
export async function handleUpdateCashbook(db, payload, session) {
  // Authorization: Admin သာလျှင် စာရင်းပြင်ဆင်ခွင့်ရှိသည်
  const role = session ? session.role : "";
  const username = session ? session.u : "";
  if (role !== "Admin" && username !== "Admin") {
    return { success: false, message: "Admin သာလျှင် ငွေစာရင်း ပြင်ဆင်ခွင့် ရှိပါသည်။" };
  }

  const id = Number(payload.id);
  if (!id) return { success: false, message: "ID မတွေ့ပါ။" };

  const category = String(payload.category || "").trim();
  const description = String(payload.description || "").trim();
  const leaderName = String(payload.leaderName || "").trim();
  const amount = Number(payload.amount);

  if (!category || !description || !leaderName) {
    return { success: false, message: "အချက်အလက်များ ပြည့်စုံစွာ ဖြည့်သွင်းပါ။" };
  }
  if (isNaN(amount) || amount <= 0) {
    return { success: false, message: "ငွေပမာဏ မှန်ကန်စွာ ဖြည့်သွင်းပါရန်။" };
  }

  const isIncome = INCOME_CATEGORIES.some(c => cleanCat(c) === cleanCat(category));
  const type = isIncome ? "income" : "expense";
  const income = isIncome ? amount : 0;
  const expense = isIncome ? 0 : amount;
  
  let txDate = String(payload.txDate || "").trim();
  if (!isValidDate(txDate)) {
    txDate = todayStr();
  }
  const now = new Date().toISOString();

  await db.prepare(
    `UPDATE cashbook SET
      tx_date = ?,
      category = ?,
      description = ?,
      type = ?,
      income = ?,
      expense = ?,
      leader_name = ?,
      updated_by = ?,
      updated_at = ?
     WHERE id = ?`
  ).bind(
    txDate,
    category,
    description,
    type,
    income,
    expense,
    leaderName,
    username || "Admin",
    now,
    id
  ).run();

  return { success: true, message: "ငွေစာရင်း ပြင်ဆင်ပြီးပါပြီ။" };
}

/**
 * ၄။ ငွေစာရင်း ဖျက်ပစ်ခြင်း (Admin Only)
 */
export async function handleDeleteCashbook(db, payload, session) {
  const role = session ? session.role : "";
  const username = session ? session.u : "";
  if (role !== "Admin" && username !== "Admin") {
    return { success: false, message: "Admin သာလျှင် စာရင်း ဖျက်ပစ်ခွင့် ရှိပါသည်။" };
  }

  const id = Number(payload.id);
  if (!id) return { success: false, message: "ID မတွေ့ပါ။" };

  await db.prepare("DELETE FROM cashbook WHERE id = ?").bind(id).run();
  return { success: true, message: "ငွေစာရင်း ဖျက်ပြီးပါပြီ။" };
}

/**
 * ၅။ Excel Import (Batch Chunking & Quota Safe)
 */
export async function handleImportCashbook(db, payload, session) {
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  if (!rows.length) return { success: false, message: "Import လုပ်ရန် ဒေတာ မတွေ့ပါ။" };

  const now = new Date().toISOString();
  const user = session ? session.u : "System";
  let inserted = 0;
  const stmts = [];

  for (const r of rows) {
    const description = String(r.description || "").trim();
    const amount = Math.abs(Number(r.amount || 0));
    if (!description || isNaN(amount) || amount <= 0) continue;

    const category = r.category || "အလှူရရှိ";
    const isIncome = INCOME_CATEGORIES.some(c => cleanCat(c) === cleanCat(category));
    const type = isIncome ? "income" : "expense";
    const income = isIncome ? amount : 0;
    const expense = isIncome ? 0 : amount;
    const uniqueId = genId("CB");
    let txDate = r.txDate || todayStr();
    if (!isValidDate(txDate)) txDate = todayStr();

    stmts.push(
      db.prepare(
        `INSERT INTO cashbook
          (unique_id, tx_date, category, description, type, income, expense, leader_name, created_by, updated_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        uniqueId, txDate, category, description, type,
        income, expense, r.leaderName || "Admin",
        user, user, now, now
      )
    );
    inserted++;
  }

  // D1 Batch Execution (တစ်ကြိမ်လျှင် ၅၀ စီ chunk ခွဲ၍ execute လုပ်ခြင်း)
  const chunkSize = 50;
  for (let i = 0; i < stmts.length; i += chunkSize) {
    const chunk = stmts.slice(i, i + chunkSize);
    await db.batch(chunk);
  }

  return { success: true, message: `${inserted} ခု Import အောင်မြင်ပါသည်။`, count: inserted };
}
