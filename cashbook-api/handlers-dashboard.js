/**
 * ========================================================================
 * handlers-dashboard.js DASHBOARD & TOTAL LIST HANDLERS
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
    gender: r.gender,
    status: r.status,
    statusDate: r.status_date,
    posted: r.posted,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

export async function handleGetDashboardData(db) {
  // Only count Active Yogis in Stage 1 to 7 (Exclude Alumni/Level 8)
  const overall = await db.prepare(
    `SELECT
       SUM(CASE WHEN status='Active' AND level <= 7 THEN 1 ELSE 0 END) as totalActive,
       SUM(CASE WHEN status='Active' AND level <= 7 AND gender='ကျား' THEN 1 ELSE 0 END) as activeMale,
       SUM(CASE WHEN status='Active' AND level <= 7 AND gender='မ' THEN 1 ELSE 0 END) as activeFemale
     FROM yogis`
  ).first();

  const perLevelRes = await db.prepare(
    `SELECT level,
        SUM(CASE WHEN status='Active' AND gender='ကျား' THEN 1 ELSE 0 END) as male,
        SUM(CASE WHEN status='Active' AND gender='မ' THEN 1 ELSE 0 END) as female,
        SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) as total
     FROM yogis WHERE level <= 7 GROUP BY level`
  ).all();

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
  ).first();

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

export async function handleGetTotalListData(db) {
  const out = [];
  const activeLevels = LEVELS.filter(l => l.id <= 7);

  for (const l of activeLevels) {
    const res = await db.prepare(
      `SELECT id, unique_id, name, age, gender, phone, reg_date, status
       FROM yogis WHERE level=? AND status='Active' ORDER BY id DESC`
    ).bind(l.id).all();

    out.push({ 
      level: l.id, 
      name: l.name, 
      rows: (res.results || []).map(mapYogiRow) 
    });
  }

  const leadersRes = await db.prepare(
    `SELECT id, unique_id, name, age, gender, phone, reg_date, status
     FROM leaders WHERE status='Active' ORDER BY id DESC`
  ).all();

  out.push({ 
    level: 8, 
    name: "ဦးဆောင်ဆွေးနွေး ယောဂီ", 
    rows: (leadersRes.results || []).map(mapYogiRow) 
  });

  return { success: true, data: out };
}