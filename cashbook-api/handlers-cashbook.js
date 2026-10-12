/**
 * ========================================================================
 * handlers-cashbook.js — CASHBOOK HANDLERS (D1 SQLite)
 * ========================================================================
 */

// 💡 ဝင်ငွေ/ထွက်ငွေ ခေါင်းစဉ်များ (စာလုံးပေါင်း space ကွာဟမှုများပါ အဆင်ပြေစေရန် စီစဉ်ထားသည်)
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
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

export async function handleGetCashbookData(db, payload) {
  const page = Math.max(1, Number(payload.page || 1));
  const limit = Math.max(1, Math.min(500, Number(payload.limit || 30)));
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

  if (fromDate) {
    where += " AND tx_date >= ?";
    binds.push(fromDate);
  }

  if (toDate) {
    where += " AND tx_date <= ?";
    binds.push(toDate);
  }

  // 💡 ၁။ စုစုပေါင်း ဝင်ငွေ၊ ထွက်ငွေ နှင့် စာအုပ်ရောင်းရငွေ အားလုံးကို DB ထဲမှ တိုက်ရိုက် အတိအကျ ပေါင်းထုတ်ခြင်း
  const aggRow = await db.prepare(
    `SELECT 
       COALESCE(SUM(income), 0) as totalIncome,
       COALESCE(SUM(expense), 0) as totalExpense,
       COALESCE(SUM(CASE WHEN REPLACE(category, ' ', '') = 'စာအုပ်ရောင်းရငွေ' THEN income ELSE 0 END), 0) as totalBookSales
     FROM cashbook ${where}`
  ).bind(...binds).first().catch(() => ({ totalIncome: 0, totalExpense: 0, totalBookSales: 0 }));

  const totalIncome = (aggRow && aggRow.totalIncome) || 0;
  const totalExpense = (aggRow && aggRow.totalExpense) || 0;
  const totalBookSales = (aggRow && aggRow.totalBookSales) || 0;
  const balance = totalIncome - totalExpense;

  const countRow = await db.prepare(
    `SELECT COUNT(*) as c FROM cashbook ${where}`
  ).bind(...binds).first().catch(() => ({ c: 0 }));

  // Cumulative Running Balance (လက်ကျန်ငွေ) တွက်ချက်ခြင်း
  const rowsRes = await db.prepare(
    `WITH RankedCB AS (
       SELECT 
         id, unique_id, tx_date, category, description, type, income, expense, leader_name, created_by, created_at, updated_at,
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
      total: (countRow && countRow.c) || 0,
      page,
      limit,
      totalIncome,
      totalExpense,
      totalBookSales, // 💡 Box ၄ အတွက် စာအုပ်ရောင်းရငွေ စုစုပေါင်း
      balance
    }
  };
}

export async function handleSaveCashbook(db, payload, session) {
  const category = String(payload.category || "").trim();
  const description = String(payload.description || "").trim();
  const leaderName = String(payload.leaderName || "").trim();
  const amount = Math.abs(Number(payload.amount || 0));

  if (!category) return { success: false, message: "ခေါင်းစဉ် ရွေးချယ်ရန် လိုအပ်ပါသည်။" };
  if (!description) return { success: false, message: "အကြောင်းအရာ ဖြည့်သွင်းရန် လိုအပ်ပါသည်။" };
  if (!leaderName) return { success: false, message: "ဦးဆောင်သူ အမည် ဖြည့်သွင်းရန် လိုအပ်ပါသည်။" };
  if (amount <= 0) return { success: false, message: "ငွေပမာဏ မှန်ကန်စွာ ဖြည့်သွင်းပါရန်။" };

  // 💡 Space စာလုံးကပ်/ခွာ မည်သို့ပင်ဖြစ်စေ ဝင်ငွေ/ထွက်ငွေ တိကျစွာ ခွဲခြားသတ်မှတ်ခြင်း
  const isIncome = INCOME_CATEGORIES.some(c => cleanCat(c) === cleanCat(category));
  const type = isIncome ? "income" : "expense";
  const income = isIncome ? amount : 0;
  const expense = isIncome ? 0 : amount;

  const uniqueId = genId("CB");
  const txDate = payload.txDate || todayStr();
  const now = new Date().toISOString();

  await db.prepare(
    `INSERT INTO cashbook
      (unique_id, tx_date, category, description, type, income, expense, leader_name, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    uniqueId, txDate, category, description, type,
    income, expense, leaderName,
    session ? session.u : "System", now, now
  ).run();

  return { success: true, message: "ငွေစာရင်း အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။", uniqueId };
}

export async function handleUpdateCashbook(db, payload) {
  const id = Number(payload.id);
  if (!id) return { success: false, message: "ID မတွေ့ပါ။" };

  const category = String(payload.category || "").trim();
  const description = String(payload.description || "").trim();
  const leaderName = String(payload.leaderName || "").trim();
  const amount = Math.abs(Number(payload.amount || 0));

  if (!category || !description || !leaderName) {
    return { success: false, message: "အချက်အလက်များ ပြည့်စုံစွာ ဖြည့်သွင်းပါ။" };
  }

  const isIncome = INCOME_CATEGORIES.some(c => cleanCat(c) === cleanCat(category));
  const type = isIncome ? "income" : "expense";
  const income = isIncome ? amount : 0;
  const expense = isIncome ? 0 : amount;
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
      updated_at = ?
     WHERE id = ?`
  ).bind(
    payload.txDate || todayStr(),
    category,
    description,
    type,
    income,
    expense,
    leaderName,
    now,
    id
  ).run();

  return { success: true, message: "ငွေစာရင်း ပြင်ဆင်ပြီးပါပြီ။" };
}

export async function handleDeleteCashbook(db, payload, session) {
  if (session && session.u !== "Admin") {
    return { success: false, message: "Admin သာလျှင် စာရင်း ဖျက်ပစ်ခွင့် ရှိပါသည်။" };
  }

  const id = Number(payload.id);
  if (!id) return { success: false, message: "ID မတွေ့ပါ။" };
  await db.prepare("DELETE FROM cashbook WHERE id=?").bind(id).run();
  return { success: true, message: "ငွေစာရင်း ဖျက်ပြီးပါပြီ။" };
}

/**
 * 💡 Excel Import အစုလိုက် သွင်းနိုင်သော Handler
 */
export async function handleImportCashbook(db, payload, session) {
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  if (!rows.length) return { success: false, message: "Import လုပ်ရန် ဒေတာ မတွေ့ပါ။" };

  const now = new Date().toISOString();
  let inserted = 0;
  const stmts = [];

  for (const r of rows) {
    const description = String(r.description || "").trim();
    const amount = Math.abs(Number(r.amount || 0));
    if (!description || amount <= 0) continue;

    const category = r.category || "အလှူရရှိ";
    const isIncome = INCOME_CATEGORIES.some(c => cleanCat(c) === cleanCat(category));
    const type = isIncome ? "income" : "expense";
    const income = isIncome ? amount : 0;
    const expense = isIncome ? 0 : amount;
    const uniqueId = genId("CB");
    const txDate = r.txDate || todayStr();

    stmts.push(
      db.prepare(
        `INSERT INTO cashbook
          (unique_id, tx_date, category, description, type, income, expense, leader_name, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        uniqueId, txDate, category, description, type,
        income, expense, r.leaderName || "Admin",
        session ? session.u : "System", now, now
      )
    );
    inserted++;
  }

  if (stmts.length) await db.batch(stmts);
  return { success: true, message: `${inserted} ခု Import အောင်မြင်ပါသည်။`, count: inserted };
}
