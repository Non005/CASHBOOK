/**
 * ========================================================================
 * handlers-dashboard.js — DASHBOARD & TOTAL LIST HANDLERS
 * (D1 Quota & Read Optimized — Loop Queries Eliminated)
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

// Helper to map DB snake_case columns to Frontend camelCase
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
    phone: r.phone,
    address: r.address,
    introducer: r.introducer,
    email: r.email,
    gender: r.gender || "ကျား",
    status: r.status,
    statusDate: r.status_date,
    posted: !!r.posted,
    createdBy: r.created_by,
    updatedBy: r.updated_by || r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

/**
 * ၁။ Dashboard အကျဉ်းချုပ် ဒေတာများ ဆွဲထုတ်ခြင်း
 */
export async function handleGetDashboardData(db) {
  // ၁။ အဆင့် ၁ မှ ၇ အထိ Active ဖြစ်သော ယောဂီ စုစုပေါင်း
  const overall = await db.prepare(
    `SELECT
       COALESCE(SUM(CASE WHEN status='Active' AND level <= 7 THEN 1 ELSE 0 END), 0) as totalActive,
       COALESCE(SUM(CASE WHEN status='Active' AND level <= 7 AND gender='ကျား' THEN 1 ELSE 0 END), 0) as activeMale,
       COALESCE(SUM(CASE WHEN status='Active' AND level <= 7 AND gender='မ' THEN 1 ELSE 0 END), 0) as activeFemale
     FROM yogis`
  ).first().catch(() => ({ totalActive: 0, activeMale: 0, activeFemale: 0 }));

  // ၂။ ကမ္မဋ္ဌာန်း အဆင့်အလိုက် ကျား/မ စာရင်းခွဲများ
  const perLevelRes = await db.prepare(
    `SELECT level,
        COALESCE(SUM(CASE WHEN status='Active' AND gender='ကျား' THEN 1 ELSE 0 END), 0) as male,
        COALESCE(SUM(CASE WHEN status='Active' AND gender='မ' THEN 1 ELSE 0 END), 0) as female,
        COALESCE(SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END), 0) as total
     FROM yogis 
     WHERE level <= 7 
     GROUP BY level`
  ).all().catch(() => ({ results: [] }));

  const perLevelMap = {};
  (perLevelRes.results || []).forEach(r => { 
    perLevelMap[r.level] = r; 
  });

  const perLevel = LEVELS.filter(l => l.id <= 7).map(l => ({
    level: l.id,
    name: l.name,
    male: (perLevelMap[l.id] && perLevelMap[l.id].male) || 0,
    female: (perLevelMap[l.id] && perLevelMap[l.id].female) || 0,
    total: (perLevelMap[l.id] && perLevelMap[l.id].total) || 0
  }));

  // ၃။ ဦးဆောင်ဆွေးနွေး ယောဂီ စာရင်းချုပ်
  const leaderAgg = await db.prepare(
    `SELECT
       COALESCE(SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END), 0) as total,
       COALESCE(SUM(CASE WHEN status='Active' AND gender='ကျား' THEN 1 ELSE 0 END), 0) as male,
       COALESCE(SUM(CASE WHEN status='Active' AND gender='မ' THEN 1 ELSE 0 END), 0) as female
     FROM leaders`
  ).first().catch(() => ({ total: 0, male: 0, female: 0 }));

  // ၄။ ငွေစာရင်း (Cashbook) ခေါင်းစဉ်အလိုက် စုစုပေါင်း ဝင်ငွေ၊ ထွက်ငွေ၊ လက်ကျန်
  const cashAgg = await db.prepare(
    `SELECT category,
       COALESCE(SUM(income), 0) as totalIncome,
       COALESCE(SUM(expense), 0) as totalExpense
     FROM cashbook 
     GROUP BY category`
  ).all().catch(() => ({ results: [] }));

  const cashCatMap = {};
  let totalCashIncome = 0;
  let totalCashExpense = 0;

  (cashAgg.results || []).forEach(r => {
    const inc = Number(r.totalIncome || 0);
    const exp = Number(r.totalExpense || 0);
    cashCatMap[r.category] = {
      income: inc,
      expense: exp
    };
    totalCashIncome += inc;
    totalCashExpense += exp;
  });

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
      },
      cashSummary: {
        totalIncome: totalCashIncome,
        totalExpense: totalCashExpense,
        balance: totalCashIncome - totalCashExpense,
        categories: cashCatMap
      }
    }
  };
}

/**
 * ၂။ စုစုပေါင်း စာရင်းထုတ်ခြင်း (Loop မပတ်ဘဲ Single Query ဖြင့် အမြန်ဆုံး ဆွဲယူခြင်း)
 */
export async function handleGetTotalListData(db) {
  // Loop ပတ် Query ခေါ်ယူခြင်း မပြုတော့ဘဲ တစ်ကြိမ်တည်း ဆွဲယူခြင်း
  const yogisRes = await db.prepare(
    `SELECT id, unique_id, group_id, level, seq_no, name, age, gender, phone, address, reg_date, status
     FROM yogis 
     WHERE level <= 7 AND status = 'Active' 
     ORDER BY level ASC, id DESC`
  ).all().catch(() => ({ results: [] }));

  // Level အလိုက် Map ဖွဲ့စည်းခြင်း
  const yogiByLevel = {};
  for (let i = 1; i <= 7; i++) {
    yogiByLevel[i] = [];
  }

  (yogisRes.results || []).forEach(r => {
    if (yogiByLevel[r.level]) {
      yogiByLevel[r.level].push(mapYogiRow(r));
    }
  });

  const out = LEVELS.filter(l => l.id <= 7).map(l => ({
    level: l.id,
    name: l.name,
    rows: yogiByLevel[l.id] || []
  }));

  // ဦးဆောင်ဆွေးနွေး ယောဂီများ ဆွဲယူခြင်း
  const leadersRes = await db.prepare(
    `SELECT id, unique_id, seq_no, name, age, gender, phone, address, reg_date, status
     FROM leaders 
     WHERE status = 'Active' 
     ORDER BY id DESC`
  ).all().catch(() => ({ results: [] }));

  out.push({ 
    level: 8, 
    name: "ဦးဆောင်ဆွေးနွေး ယောဂီ", 
    rows: (leadersRes.results || []).map(mapYogiRow) 
  });

  return { success: true, data: out };
}
