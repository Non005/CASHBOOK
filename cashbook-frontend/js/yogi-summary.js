/**
 * YOGI MANAGEMENT SYSTEM — Total Summary Matrix View
 * File: js/yogi-summary.js
 */

// 💡 ထိပ်ဆုံး Box (၄) ခု (Dashboard နှင့် တူညီစွာ ပြသထားသည်)
function statCardsSummaryHtml(total, male, female, leaders = 0) {
  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; width: 100%;">
      <div class="stats-card">
        <div style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);">
          <i class="fa-solid fa-users"></i>
        </div>
        <div style="display: flex; flex-direction: column;">
          <p style="margin: 0; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">TOTAL ACTIVE</p>
          <h3 style="margin: 0; font-size: 1.35rem; font-weight: 900; color: #fbbf24; font-family: monospace;">${total || 0} ဦး</h3>
        </div>
      </div>

      <div class="stats-card">
        <div style="background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3);">
          <i class="fa-solid fa-mars"></i>
        </div>
        <div style="display: flex; flex-direction: column;">
          <p style="margin: 0; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">ACTIVE MALE</p>
          <h3 style="margin: 0; font-size: 1.35rem; font-weight: 900; color: #818cf8; font-family: monospace;">${male || 0} ဦး</h3>
        </div>
      </div>

      <div class="stats-card">
        <div style="background: rgba(236, 72, 153, 0.15); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.3);">
          <i class="fa-solid fa-venus"></i>
        </div>
        <div style="display: flex; flex-direction: column;">
          <p style="margin: 0; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">ACTIVE FEMALE</p>
          <h3 style="margin: 0; font-size: 1.35rem; font-weight: 900; color: #f472b6; font-family: monospace;">${female || 0} ဦး</h3>
        </div>
      </div>

      <div class="stats-card">
        <div style="background: rgba(20, 184, 166, 0.15); color: #2dd4bf; border: 1px solid rgba(20, 184, 166, 0.3);">
          <i class="fa-solid fa-user-tie"></i>
        </div>
        <div style="display: flex; flex-direction: column;">
          <p style="margin: 0; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">ဦးဆောင်ယောဂီ (LEADERS)</p>
          <h3 style="margin: 0; font-size: 1.35rem; font-weight: 900; color: #2dd4bf; font-family: monospace;">${leaders || 0} ဦး</h3>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render Total Summary 7-Column Matrix Table
 */
async function renderTotalSummary(searchVal = "", silentRefresh = false) {
  if (typeof searchVal === "boolean") {
    silentRefresh = searchVal;
    searchVal = window.currentSummarySearch || "";
  } else if (!silentRefresh) {
    searchVal = String(searchVal || "");
    window.currentSummarySearch = searchVal;
  }

  const container = document.getElementById("view-container");
  if (!container) return;

  const searchInputBefore = document.getElementById("summary-search-input");
  const isSearchFocused = document.activeElement === searchInputBefore;
  const cursorPosition = searchInputBefore ? searchInputBefore.selectionStart : null;

  const titleEl = document.getElementById("page-title");
  if (titleEl) titleEl.innerText = "ယောဂီ စုစုပေါင်း စာရင်း";

  // 💡 Auto-Refresh တွင် Loading မှိတ်တုတ်မဖြစ်စေရန် ထိန်းချုပ်ခြင်း
  if (!silentRefresh && typeof window.toggleLoading === "function") {
    window.toggleLoading(true);
  }

  let groups = [];
  let stats = { totalActive: 0, activeMale: 0, activeFemale: 0, leaders: { total: 0 } };

  try {
    const res = await window.callApi("getTotalListData");
    const dashRes = await window.callApi("getDashboardData");
    if (res && res.success && res.data) groups = res.data;
    if (dashRes && dashRes.success && dashRes.data) stats = dashRes.data;
  } catch (e) {
    console.error("renderTotalSummary Error:", e);
  } finally {
    if (!silentRefresh && typeof window.toggleLoading === "function") {
      window.toggleLoading(false);
    }
  }

  // Filter Active stage groups (Level 1 to 7)
  const stageGroups = groups.filter(g => Number(g.level) <= 7);
  const searchLower = String(searchVal || "").trim().toLowerCase();

  const levelCols = stageGroups.map(g => {
    let rows = g.rows || [];
    if (searchLower) {
      rows = rows.filter(r => 
        String(r.name || "").toLowerCase().includes(searchLower) || 
        String(r.phone || "").includes(searchLower)
      );
    }
    return { level: g.level, name: g.name, rows };
  });

  const totalYogisFound = levelCols.reduce((sum, c) => sum + c.rows.length, 0);
  const maxRows = Math.max(1, ...levelCols.map(c => c.rows.length));

  // ကော်လံခေါင်းစဉ် အတိုကောက် အမည်များ
  const shortNames = [
    "၁။ သတိ",
    "၂။ ရုပ်",
    "၃။ နာမ်",
    "၄။ ရုပ်နာမ်",
    "၅။ ခန္ဓာငါးပါး",
    "၆။ ဥပါဒါနက္ခန္ဓာ",
    "၇။ သိပါယ်ဆိုက်ပွား"
  ];

  container.innerHTML = `
    <div class="space-y-5 view-panel">
      <!-- Top 4 KPI Cards -->
      ${statCardsSummaryHtml(stats.totalActive, stats.activeMale, stats.activeFemale, (stats.leaders && stats.leaders.total) || 0)}

      <!-- Control Bar (Live Search ပါဝင်သည်) -->
      <div class="control-bar-wrapper">
        <div style="position: relative; flex: 1; min-width: 240px; max-width: 380px;">
          <input type="text" id="summary-search-input" value="${window.escapeHtml(searchVal)}" 
            oninput="triggerSummarySearchLive()"
            onkeydown="if(event.key==='Enter') triggerSummarySearch()"
            placeholder="ယောဂီ အမည် / ဖုန်း ရိုက်ရှာရန်..." 
            style="width: 100%; padding-left: 2.2rem; background: #070a12; border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 0.75rem; color: #f1f5f9; font-size: 0.8rem; outline: none; height: 38px;">
          <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 0.75rem;"></i>
        </div>

        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
          <button onclick="renderTotalSummary('')" class="btn-control btn-control-refresh" title="မူလအတိုင်း ပြန်လည်ရယူပါ">
            <i class="fa-solid fa-rotate"></i> Refresh
          </button>
          
          <!-- 💡 သီးသန့် 7-Column Excel Export ခလုတ် -->
          <button onclick="exportSummaryToExcel()" class="btn-control btn-control-export" title="Excel ထုတ်ယူမည်">
            <i class="fa-solid fa-file-excel"></i> Export Excel
          </button>
        </div>
      </div>

      <!-- 💡 7-COLUMN MATRIX TABLE (ကော်လံတိုင်းတွင် လက်ရှိလူဦးရေ ပါဝင်သည်) -->
      <div class="table-scroll-container">
        <table style="width: 100%; text-align: center; border-collapse: collapse; font-size: 0.8rem; min-width: 780px;">
          <thead>
            <tr style="background: #080d1a; border-bottom: 2px solid rgba(245, 158, 11, 0.3); color: #fbbf24; font-size: 0.74rem; font-weight: 800;">
              ${levelCols.map((col, idx) => `
                <th style="padding: 11px 8px; border-right: ${idx < 6 ? '1px solid rgba(255,255,255,0.1)' : 'none'}; white-space: nowrap;">
                  <div>${shortNames[idx] || col.name}</div>
                  <span style="font-size: 0.65rem; color: #38bdf8; font-weight: bold; font-family: monospace;">(${col.rows.length} ဦး)</span>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${totalYogisFound > 0 ? Array.from({ length: maxRows }).map((_, rIdx) => `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                ${levelCols.map((col, cIdx) => {
                  const yogi = col.rows[rIdx];
                  const borderRight = cIdx < 6 ? 'border-right: 1px solid rgba(255,255,255,0.08);' : '';
                  return `
                    <td style="padding: 9px 8px; font-size: 0.8rem; white-space: nowrap; ${borderRight}">
                      ${yogi ? `
                        <div style="display: inline-flex; align-items: center; gap: 4px; font-weight: bold; color: #f1f5f9;">
                          <span>${window.escapeHtml(yogi.name)}</span>
                          <span style="font-size: 0.65rem; font-family: monospace; padding: 1px 4px; border-radius: 3px; ${yogi.gender === 'ကျား' ? 'color: #818cf8; background: rgba(99,102,241,0.15);' : 'color: #f472b6; background: rgba(236,72,153,0.15);'}">${yogi.gender || 'ကျား'}</span>
                        </div>
                      ` : ''}
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('') : `
              <tr>
                <td colspan="7" style="text-align: center; padding: 3rem; color: #64748b; font-weight: bold;">
                  ရှာဖွေထားသော ယောဂီ မတွေ့ပါ သို့မဟုတ် စာရင်း မရှိသေးပါ။
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Focus ထိန်းသိမ်းခြင်း
  if (isSearchFocused) {
    const searchInputAfter = document.getElementById("summary-search-input");
    if (searchInputAfter) {
      searchInputAfter.focus();
      if (cursorPosition !== null) {
        searchInputAfter.setSelectionRange(cursorPosition, cursorPosition);
      }
    }
  }
}

let summarySearchTimer = null;
function triggerSummarySearchLive() {
  clearTimeout(summarySearchTimer);
  summarySearchTimer = setTimeout(() => {
    triggerSummarySearch();
  }, 300);
}

function triggerSummarySearch() {
  const input = document.getElementById("summary-search-input");
  if (input) {
    const value = input.value.trim();
    window.currentSummarySearch = value;
    renderTotalSummary(value, true);
  }
}

/**
 * 💡 ၇ ကော်လံ မက်ထရစ်ဇယား အား Excel ထုတ်ယူခြင်း
 */
function exportSummaryToExcel() {
  const table = document.querySelector(".table-scroll-container table");
  if (!table) return;
  try {
    const wb = XLSX.utils.table_to_book(table, { sheet: "Summary_Matrix" });
    XLSX.writeFile(wb, "Yogi_7Stages_Summary_Matrix.xlsx");
    if (typeof window.showToast === "function") {
      window.showToast("SUCCESS", "၇ ကော်လံ ဇယား Excel ဒေါင်းလုဒ်ရယူပြီးပါပြီ။");
    }
  } catch (e) {
    if (typeof window.showToast === "function") {
      window.showToast("ERROR", "Excel ထုတ်ယူရာတွင် အမှားဖြစ်ပေါ်ခဲ့ပါသည်။");
    }
  }
}

// Global Window Exports
window.renderTotalSummary = renderTotalSummary;
window.triggerSummarySearch = triggerSummarySearch;
window.triggerSummarySearchLive = triggerSummarySearchLive;
window.exportSummaryToExcel = exportSummaryToExcel;
