/**
 * YOGI MANAGEMENT SYSTEM — Total Summary Matrix View
 * File: js/yogi-summary.js
 */

function statCardsSummaryHtml(total, male, female) {
  return `
    <div class="kpi-grid-container">
      <div class="stats-card">
        <div style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);">
          <i class="fa-solid fa-users"></i>
        </div>
        <div>
          <p>TOTAL ACTIVE</p>
          <h3 style="color: #fbbf24;">${total || 0} ဦး</h3>
        </div>
      </div>

      <div class="stats-card">
        <div style="background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3);">
          <i class="fa-solid fa-mars"></i>
        </div>
        <div>
          <p>ACTIVE MALE</p>
          <h3 style="color: #818cf8;">${male || 0} ဦး</h3>
        </div>
      </div>

      <div class="stats-card">
        <div style="background: rgba(236, 72, 153, 0.15); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.3);">
          <i class="fa-solid fa-venus"></i>
        </div>
        <div>
          <p>ACTIVE FEMALE</p>
          <h3 style="color: #f472b6;">${female || 0} ဦး</h3>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render Total Summary 7-Column Matrix Table (Matching User's Hand-Drawn Image 3)
 */
async function renderTotalSummary(searchVal = "", silentRefresh = false) {
  // Auto-sync previously passed `true` as the first argument, which turned into the search text "true".
  // Treat boolean calls as silent refreshes and preserve the current summary search instead.
  if (typeof searchVal === "boolean") {
    silentRefresh = searchVal;
    searchVal = window.currentSummarySearch || "";
  } else if (!silentRefresh) {
    searchVal = String(searchVal || "");
    window.currentSummarySearch = searchVal;
  }

  const container = document.getElementById("view-container");
  if (!container) return;

  const titleEl = document.getElementById("page-title");
  if (titleEl) titleEl.innerText = "ယောဂီ စုစုပေါင်း စာရင်း";

  window.toggleLoading(true);
  let groups = [];
  let stats = { totalActive: 0, activeMale: 0, activeFemale: 0 };

  try {
    const res = await window.callApi("getTotalListData");
    const dashRes = await window.callApi("getDashboardData");
    if (res.success && res.data) groups = res.data;
    if (dashRes.success && dashRes.data) stats = dashRes.data;
  } catch (e) {
    console.error(e);
  } finally {
    window.toggleLoading(false);
  }

  // Filter Active stage groups (Level 1 to 7)
  const stageGroups = groups.filter(g => g.level <= 7);
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

  const maxRows = Math.max(1, ...levelCols.map(c => c.rows.length));

  container.innerHTML = `
    <div class="space-y-5 view-panel">
      <!-- Top 3 KPI Cards -->
      ${statCardsSummaryHtml(stats.totalActive, stats.activeMale, stats.activeFemale)}

      <!-- Restored Control Bar -->
      <div class="control-bar-wrapper">
        <div style="position: relative; flex: 1; min-width: 240px; max-width: 360px;">
          <input type="text" id="summary-search-input" value="${window.escapeHtml(searchVal)}" 
            onkeydown="if(event.key==='Enter') triggerSummarySearch()"
            placeholder="ယောဂီ အမည် / ဖုန်း ရှာဖွေရန်..." 
            style="width: 100%; padding-left: 2.2rem; background: #070a12; border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 0.75rem; color: #f1f5f9; font-size: 0.8rem; outline: none;">
          <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 0.75rem;"></i>
        </div>

        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
          <button onclick="renderTotalSummary('')" class="btn-control btn-control-refresh" title="ပြန်လည်ရယူပါ">
            <i class="fa-solid fa-rotate"></i> Refresh
          </button>
          <button onclick="window.exportYogiToExcel ? window.exportYogiToExcel('Total_Summary') : null" class="btn-control btn-control-export" title="Excel ထုတ်ယူမည်">
            <i class="fa-solid fa-file-excel"></i> Export Excel
          </button>
        </div>
      </div>

      <!-- 💡 7-COLUMN MATRIX TABLE MATCHING USER'S HAND-DRAWN IMAGE 3 -->
      <div class="table-scroll-container">
        <table style="width: 100%; text-align: center; border-collapse: collapse; font-size: 0.8rem;">
          <thead>
            <tr style="background: #080d1a; border-bottom: 2px solid rgba(245, 158, 11, 0.3); color: #fbbf24; font-size: 0.75rem; font-weight: 800;">
              <th style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.1); white-space: nowrap;">သတိ</th>
              <th style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.1); white-space: nowrap;">ရုပ်</th>
              <th style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.1); white-space: nowrap;">နာမ်</th>
              <th style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.1); white-space: nowrap;">ရုပ်နာမ်</th>
              <th style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.1); white-space: nowrap;">ခန္ဓာငါးပါး</th>
              <th style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.1); white-space: nowrap;">ဥပါဒါနက္ခန္ဓာငါးပါး</th>
              <th style="padding: 12px; white-space: nowrap;">သိပါယ်ဆိုက်ပွား</th>
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: maxRows }).map((_, rIdx) => `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                ${levelCols.map((col, cIdx) => {
                  const yogi = col.rows[rIdx];
                  const borderRight = cIdx < 6 ? 'border-right: 1px solid rgba(255,255,255,0.08);' : '';
                  return `
                    <td style="padding: 10px 8px; font-size: 0.8rem; white-space: nowrap; ${borderRight}">
                      ${yogi ? `
                        <div style="display: inline-flex; align-items: center; gap: 4px; font-weight: bold; color: #f1f5f9;">
                          <span>${window.escapeHtml(yogi.name)}</span>
                          <span style="font-size: 0.65rem; font-family: monospace; padding: 1px 4px; border-radius: 3px; ${yogi.gender === 'ကျား' ? 'color: #818cf8; background: rgba(99,102,241,0.15);' : 'color: #f472b6; background: rgba(236,72,153,0.15);'}">${yogi.gender}</span>
                        </div>
                      ` : ''}
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function triggerSummarySearch() {
  const input = document.getElementById("summary-search-input");
  if (input) {
    const value = input.value.trim();
    window.currentSummarySearch = value;
    renderTotalSummary(value);
  }
}

// Global Window Exports
window.renderTotalSummary = renderTotalSummary;
window.triggerSummarySearch = triggerSummarySearch;
