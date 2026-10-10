/**
 * YOGI MANAGEMENT SYSTEM — Leaders Logic
 * File: js/leaders.js  
 */

function detectGenderByName(name) {
  const str = String(name || "").trim();
  if (/^(ဒေါ်|မ|နော်|မိ|ဆရာမ|Ma|Daw|Nan|Naw|Mi)\b/i.test(str) ||
      str.startsWith("ဒေါ်") || str.startsWith("မ") || str.startsWith("နော်") || str.startsWith("မိ")) {
    return "မ";
  }
  if (/^(ဦး|ကို|မောင်|စော|ဆရာ|U|Mg|Ko|Saw)\b/i.test(str) ||
      str.startsWith("ဦး") || str.startsWith("ကို") || str.startsWith("မောင်") || str.startsWith("စော")) {
    return "ကျား";
  }
  return "ကျား";
}

function getFormattedToday() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function statCardsLeadersHtml(total, male, female) {
  return `
    <div class="kpi-grid-container">
      <div class="stats-card">
        <div style="background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3);">
          <i class="fa-solid fa-user-tie"></i>
        </div>
        <div style="display: flex; flex-direction: column;">
          <p style="margin: 0; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">TOTAL LEADERS</p>
          <h3 style="margin: 0; font-size: 1.35rem; font-weight: 900; color: #818cf8; font-family: monospace;">${total || 0} ဦး</h3>
        </div>
      </div>

      <div class="stats-card">
        <div style="background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3);">
          <i class="fa-solid fa-mars"></i>
        </div>
        <div style="display: flex; flex-direction: column;">
          <p style="margin: 0; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">MALE LEADERS</p>
          <h3 style="margin: 0; font-size: 1.35rem; font-weight: 900; color: #818cf8; font-family: monospace;">${male || 0} ဦး</h3>
        </div>
      </div>

      <div class="stats-card">
        <div style="background: rgba(236, 72, 153, 0.15); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.3);">
          <i class="fa-solid fa-venus"></i>
        </div>
        <div style="display: flex; flex-direction: column;">
          <p style="margin: 0; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">FEMALE LEADERS</p>
          <h3 style="margin: 0; font-size: 1.35rem; font-weight: 900; color: #f472b6; font-family: monospace;">${female || 0} ဦး</h3>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render Leader Yogi List
 * Limit: 30 items per page with Pagination
 */
async function renderLeaders(page = 1, searchVal = "") {
  const container = document.getElementById("view-container");
  if (!container) return;

  // 💡 Admin ခွင့်ပြုချက် စစ်ဆေးခြင်း
  const currentUser = window.AppState ? window.AppState.currentUser : localStorage.getItem("yogi_user_name");
  const isAdmin = currentUser === "Admin";

  const titleEl = document.getElementById("page-title");
  if (titleEl) titleEl.innerText = "ဦးဆောင်ဆွေးနွေး ယောဂီများ";

  window.toggleLoading(true);
  let data = { rows: [], total: 0, activeTotal: 0, activeMale: 0, activeFemale: 0 };
  const limit = 30;

  try {
    const res = await window.callApi("getLeaderData", { page, searchVal, limit });
    if (res.success && res.data) data = res.data;
  } catch (e) {
    console.error("getLeaderData Error:", e);
  } finally {
    window.toggleLoading(false);
  }

  const rawRows = data.rows || [];
  const totalCount = data.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const sortedRows = [...rawRows].sort((a, b) => {
    if (a.status === 'Active' && b.status === 'Inactive') return -1;
    if (a.status === 'Inactive' && b.status === 'Active') return 1;
    return 0;
  });

  window._currentLeaderRows = sortedRows;

  container.innerHTML = `
    <div class="space-y-5 view-panel">
      <!-- Top 3 KPI Cards Grid -->
      ${statCardsLeadersHtml(data.activeTotal, data.activeMale, data.activeFemale)}

      <!-- Control Bar Wrapper -->
      <div class="control-bar-wrapper">
        <div style="position: relative; flex: 1; min-width: 240px; max-width: 360px;">
          <input type="text" id="leader-search-input" value="${window.escapeHtml(searchVal)}" 
            onkeydown="if(event.key==='Enter') triggerLeaderSearch()"
            placeholder="အမည် / ဖုန်း ရှာဖွေရန်..." 
            style="width: 100%; padding-left: 2.2rem; background: #070a12; border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 0.75rem; color: #f1f5f9; font-size: 0.8rem; outline: none;">
          <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 0.75rem;"></i>
        </div>

        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
          <button onclick="renderLeaders(1, '')" class="btn-control btn-control-refresh" title="ပြန်လည်ရယူပါ">
            <i class="fa-solid fa-rotate"></i> Refresh
          </button>
          <button onclick="exportLeaderToExcel()" class="btn-control btn-control-export" title="Excel ထုတ်ယူမည်">
            <i class="fa-solid fa-file-excel"></i> Export Excel
          </button>
          <button onclick="openLeaderModal()" class="btn-control" style="background: linear-gradient(90deg, #6366f1, #4f46e5); color: #ffffff; font-weight: 900; padding: 0.5rem 1rem;">
            <i class="fa-solid fa-plus"></i> + ဦးဆောင်ယောဂီ အသစ်ထည့်မည်
          </button>
        </div>
      </div>

      <!-- Leader Table (1 Single Line Cells, Plain Index 1, 2, 3) -->
      <div class="table-scroll-container">
        <table>
          <thead>
            <tr style="background-color: #080d1a; border-bottom: 2px solid rgba(99, 102, 241, 0.3); color: #818cf8; font-size: 0.72rem; font-weight: 800;">
              <th style="padding: 12px 14px; white-space: nowrap;">စဉ်</th>
              <th style="padding: 12px 14px; white-space: nowrap;">ရက်စွဲ</th>
              <th style="padding: 12px 14px; white-space: nowrap;">အမည်</th>
              <th style="padding: 12px 14px; white-space: nowrap; text-align: center;">အသက်</th>
              <th style="padding: 12px 14px; white-space: nowrap; text-align: center;">GENDER</th>
              <th style="padding: 12px 14px; white-space: nowrap;">ဖုန်းနံပါတ်</th>
              <th style="padding: 12px 14px; white-space: nowrap;">နေရပ်လိပ်စာ</th>
              <th style="padding: 12px 14px; white-space: nowrap;">EMAIL</th>
              <th style="padding: 12px 14px; white-space: nowrap; text-align: center;">STATUS</th>
              <th class="sticky-action" style="padding: 12px 14px; white-space: nowrap; text-align: center;">ACTION</th>
            </tr>
          </thead>
          <tbody>
            ${sortedRows.length > 0 ? sortedRows.map((l, idx) => `
              <tr class="${l.status === 'Inactive' ? 'row-inactive' : ''}" style="border-bottom: 1px solid rgba(30, 41, 59, 0.5);">
                <td style="padding: 11px 14px; font-weight: bold; color: #818cf8; white-space: nowrap;">${(page - 1) * limit + idx + 1}</td>
                <td style="white-space: nowrap;">${l.regDate || '-'}</td>
                <td style="font-weight: 800; color: #f8fafc; white-space: nowrap;">${window.escapeHtml(l.name)}</td>
                <td style="text-align: center; white-space: nowrap;">${l.age || '-'}</td>
                <td style="text-align: center; white-space: nowrap;">
                  <span style="padding: 2px 8px; border-radius: 4px; font-weight: bold; ${l.gender === 'ကျား' ? 'background: rgba(99,102,241,0.2); color: #818cf8;' : 'background: rgba(236,72,153,0.2); color: #f472b6;'}">
                    ${l.gender || 'ကျား'}
                  </span>
                </td>
                <td style="white-space: nowrap;">${l.phone || '-'}</td>
                <td style="white-space: nowrap;">${window.escapeHtml(l.address) || '-'}</td>
                <td style="white-space: nowrap;">${l.email || '-'}</td>
                <td style="text-align: center; white-space: nowrap;">
                  <span style="padding: 3px 8px; border-radius: 6px; font-weight: bold; ${l.status === 'Active' ? 'background: rgba(16,185,129,0.2); color: #34d399;' : 'background: rgba(244,63,94,0.2); color: #f87171;'}">
                    ${l.status || 'Active'}
                  </span>
                </td>
                <td class="sticky-action" style="text-align: center; white-space: nowrap; background-color: #0e172a;">
                  <div style="display: flex; gap: 6px; justify-content: center;">
                    <button onclick="openLeaderModal(${l.id})" class="btn-action-icon btn-action-edit" title="ပြင်ဆင်မည်"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button onclick="toggleLeaderStatus(${l.id}, '${l.status}')" class="btn-action-icon ${l.status === 'Active' ? 'btn-action-inactive' : 'btn-action-active'}" title="${l.status === 'Active' ? 'Inactive ပြုလုပ်မည်' : 'Active ပြုလုပ်မည်'}"><i class="fa-solid ${l.status === 'Active' ? 'fa-user-xmark' : 'fa-user-check'}"></i></button>
                    
                    <!-- 💡 Admin ဝင်မှသာ Delete Icon ခလုတ် ပေါ်မည် -->
                    ${isAdmin ? `
                      <button onclick="deleteLeader(${l.id})" class="btn-action-icon btn-action-delete" title="ဖျက်ပါ"><i class="fa-solid fa-trash"></i></button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `).join('') : `
              <tr><td colspan="10" style="text-align: center; padding: 3rem; color: #64748b;">ဦးဆောင်ယောဂီ စာရင်း မရှိသေးပါ။</td></tr>
            `}
          </tbody>
        </table>
      </div>

      <!-- Pagination Bar -->
      <div class="pagination-container">
        <button onclick="renderLeaders(${page - 1}, '${window.escapeHtml(searchVal)}')" ${page <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} class="btn-control btn-control-refresh" style="padding: 0.4rem 0.85rem;">
          <i class="fa-solid fa-chevron-left"></i> Previous
        </button>

        <span style="font-size: 0.75rem; font-weight: 800; color: #818cf8;">
          Page <b style="color: #ffffff;">${page}</b> of <b>${totalPages}</b> (Total: ${totalCount} ဦး)
        </span>

        <button onclick="renderLeaders(${page + 1}, '${window.escapeHtml(searchVal)}')" ${page >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} class="btn-control btn-control-refresh" style="padding: 0.4rem 0.85rem;">
          Next <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </div>
  `;
}

/**
 * Centered Modal for Leaders (Includes EMAIL field)
 */
function openLeaderModal(leaderId = null) {
  let existingData = null;
  if (leaderId) {
    existingData = (window._currentLeaderRows || []).find(r => String(r.id) === String(leaderId));
  }

  const isEdit = !!existingData;
  const today = getFormattedToday();

  const modalHtml = `
    <div id="leader-modal-overlay" class="modal-overlay-bg">
      <div class="modal-dialog-box">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(99, 102, 241, 0.2); padding-bottom: 0.75rem; margin-bottom: 1rem;">
          <h3 style="margin: 0; color: #818cf8; font-size: 0.95rem; font-weight: 800;">
            <i class="fa-solid ${isEdit ? 'fa-pen-to-square' : 'fa-user-tie'}"></i>
            ${isEdit ? 'ဦးဆောင်ယောဂီ အချက်အလက် ပြင်ဆင်ရန်' : 'ဦးဆောင်ယောဂီ အသစ် ထည့်သွင်းရန်'}
          </h3>
          <button onclick="closeLeaderModal()" style="background: none; border: none; color: #94a3b8; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form id="leader-form" onsubmit="saveLeaderForm(event, ${isEdit ? existingData.id : 'null'})" style="display: flex; flex-direction: column; gap: 0.85rem;">
          <input type="hidden" id="leader-modal-reg-date" value="${isEdit ? (existingData.regDate || today) : today}">

          <div>
            <label style="display: block; font-weight: bold; color: #c7d2fe; margin-bottom: 0.3rem; font-size: 0.75rem;">ဦးဆောင်ယောဂီ အမည် *</label>
            <input type="text" id="leader-modal-name" required value="${isEdit ? window.escapeHtml(existingData.name) : ''}" onkeyup="${!isEdit ? 'autoDetectLeaderGenderModal()' : ''}" placeholder="ဥပမာ - ဦးမောင်မောင် / ဒေါ်မြမြ...">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div>
              <label style="display: block; font-weight: bold; color: #c7d2fe; margin-bottom: 0.3rem; font-size: 0.75rem;">ကျား/မ (GENDER) *</label>
              <select id="leader-modal-gender" required>
                <option value="ကျား" ${isEdit && existingData.gender === 'ကျား' ? 'selected' : ''}>ကျား</option>
                <option value="မ" ${isEdit && existingData.gender === 'မ' ? 'selected' : ''}>မ</option>
              </select>
            </div>
            <div>
              <label style="display: block; font-weight: bold; color: #c7d2fe; margin-bottom: 0.3rem; font-size: 0.75rem;">အသက်</label>
              <input type="number" id="leader-modal-age" value="${isEdit ? (existingData.age || '') : ''}" placeholder="ဥပမာ - 50">
            </div>
          </div>

          <div>
            <label style="display: block; font-weight: bold; color: #c7d2fe; margin-bottom: 0.3rem; font-size: 0.75rem;">ဖုန်းနံပါတ်</label>
            <input type="text" id="leader-modal-phone" value="${isEdit ? window.escapeHtml(existingData.phone || '') : ''}" placeholder="09-123456789">
          </div>

          <div>
            <label style="display: block; font-weight: bold; color: #c7d2fe; margin-bottom: 0.3rem; font-size: 0.75rem;">နေရပ်လိပ်စာ</label>
            <input type="text" id="leader-modal-address" value="${isEdit ? window.escapeHtml(existingData.address || '') : ''}" placeholder="မြို့နယ် / မြို့...">
          </div>

          <div>
            <label style="display: block; font-weight: bold; color: #c7d2fe; margin-bottom: 0.3rem; font-size: 0.75rem;">EMAIL (အီးမေးလ်)</label>
            <input type="email" id="leader-modal-email" value="${isEdit ? window.escapeHtml(existingData.email || '') : ''}" placeholder="example@mail.com">
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #94a3b8; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.5rem;">
            <span>ရက်စွဲ: <b style="color: #818cf8;">${isEdit ? (existingData.regDate || today) : today}</b></span>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem;">
            <button type="button" onclick="closeLeaderModal()" class="btn-control btn-control-refresh" style="padding: 0.5rem 1rem;">မလုပ်တော့ပါ</button>
            <button type="submit" class="btn-control" style="background: linear-gradient(90deg, #6366f1, #4f46e5); color: #ffffff; font-weight: 900; padding: 0.5rem 1.25rem;">သိမ်းဆည်းမည်</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const existingModal = document.getElementById("leader-modal-overlay");
  if (existingModal) existingModal.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  if (!isEdit) autoDetectLeaderGenderModal();
}

function autoDetectLeaderGenderModal() {
  const nameEl = document.getElementById("leader-modal-name");
  const genderEl = document.getElementById("leader-modal-gender");
  if (nameEl && genderEl) genderEl.value = detectGenderByName(nameEl.value);
}

function closeLeaderModal() {
  const modal = document.getElementById("leader-modal-overlay");
  if (modal) modal.remove();
}

async function saveLeaderForm(event, editId = null) {
  event.preventDefault();
  const name = document.getElementById("leader-modal-name").value.trim();
  const gender = document.getElementById("leader-modal-gender").value;
  const age = document.getElementById("leader-modal-age").value.trim();
  const phone = document.getElementById("leader-modal-phone").value.trim();
  const address = document.getElementById("leader-modal-address").value.trim();
  const email = document.getElementById("leader-modal-email").value.trim();

  if (!name) {
    window.showToast("ERROR", "ဦးဆောင်ယောဂီ အမည် ရိုက်ထည့်ပါ");
    return;
  }

  window.toggleLoading(true);
  try {
    const payload = {
      id: editId || undefined,
      name,
      gender,
      age,
      phone,
      address,
      email,
      regDate: getFormattedToday(),
      status: "Active"
    };

    const action = editId ? "updateLeader" : "saveLeader";
    const res = await window.callApi(action, payload);

    if (res.success) {
      window.showToast("SUCCESS", editId ? "ပြင်ဆင်ချက် သိမ်းဆည်းပြီးပါပြီ။" : "ဦးဆောင်ယောဂီ အသစ် သိမ်းဆည်းပြီးပါပြီ။");
      closeLeaderModal();
      renderLeaders();
    }
  } catch (e) { console.error(e); } finally { window.toggleLoading(false); }
}

async function toggleLeaderStatus(id, currentStatus) {
  window.toggleLoading(true);
  const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
  const newDate = getFormattedToday();

  try {
    const res = await window.callApi("toggleLeaderStatus", { 
      id, 
      status: nextStatus,
      regDate: nextStatus === 'Active' ? newDate : undefined
    });

    if (res.success) {
      window.showToast("SUCCESS", nextStatus === 'Active' ? `Active ပြုလုပ်ပြီး ဒီနေ့ရက်စွဲ (${newDate}) ဖြင့် အပေါ်သို့ ပို့လိုက်ပါပြီ။` : "Inactive ပြုလုပ်ပြီး အောက်သို့ ရွှေ့လိုက်ပါပြီ။");
      renderLeaders();
    }
  } catch (e) { console.error(e); } finally { window.toggleLoading(false); }
}

async function deleteLeader(id) {
  if (!confirm("ဤဦးဆောင်ယောဂီ စာရင်းကို ဖျက်ရန် သေချာပါသလား။")) return;
  window.toggleLoading(true);
  try {
    const res = await window.callApi("deleteLeader", { id });
    if (res.success) {
      window.showToast("SUCCESS", "ဖျက်ပြီးပါပြီ။");
      renderLeaders();
    }
  } catch (e) { console.error(e); } finally { window.toggleLoading(false); }
}

function exportLeaderToExcel() {
  const table = document.querySelector("table");
  if (!table) return;

  try {
    const wb = XLSX.utils.table_to_book(table, { sheet: "Leaders" });
    XLSX.writeFile(wb, `Leader_Yogi_List.xlsx`);
    window.showToast("SUCCESS", "Excel ဒေါင်းလုဒ်ရယူပြီးပါပြီ။");
  } catch (e) {
    window.showToast("ERROR", "Excel ထုတ်ယူရာတွင် အမှားဖြစ်ပေါ်ခဲ့ပါသည်။");
  }
}

function triggerLeaderSearch() {
  const input = document.getElementById("leader-search-input");
  if (input) renderLeaders(1, input.value.trim());
}

// Global Window Exports
window.renderLeaders = renderLeaders;
window.toggleLeaderStatus = toggleLeaderStatus;
window.deleteLeader = deleteLeader;
window.openLeaderModal = openLeaderModal;
window.closeLeaderModal = closeLeaderModal;
window.saveLeaderForm = saveLeaderForm;
window.exportLeaderToExcel = exportLeaderToExcel;
