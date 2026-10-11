/**
 * YOGI MANAGEMENT SYSTEM — Cashbook Logic
 * File: js/cashbook.js  
 */

const CASH_CATEGORIES = {
  INCOME: ["အလှူရရှိ","စာအုပ်ရောင်းရငွေ", "ဘဏ်တိုး"],
  EXPENSE: ["ပုံနှိပ်တိုက်ပေးငွေ", "တရားစခန်း အလှူငွေ", "အထွေထွေ အသုံးစရိတ်"]
};

let isCashSubmitting = false;

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString("en-US");
}

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

// ရက်စွဲ format (DD-MM-YYYY သို့မဟုတ် YYYY-MM-DD) ကို Input Type Date နှင့် ကိုက်ညီအောင် ပြောင်းခြင်း
function toIsoDate(dateStr) {
  if (!dateStr) return getTodayIso();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 2) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

// 💡 ၁။ ထိပ်ဆုံးက Box ၃ ခုတွင် "ကျပ်" ဖယ်ရှားထားသော KPI Cards
function statCardsCashHtml(income, expense, balance) {
  return `
    <div class="kpi-grid-container">
      <div class="stats-card">
        <div style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">
          <i class="fa-solid fa-arrow-down-long"></i>
        </div>
        <div style="display: flex; flex-direction: column;">
          <p style="margin: 0; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">ဝင်ငွေ (INCOME)</p>
          <h3 style="margin: 0; font-size: 1.35rem; font-weight: 900; color: #34d399; font-family: monospace;">+${formatMoney(income)}</h3>
        </div>
      </div>

      <div class="stats-card">
        <div style="background: rgba(244, 63, 94, 0.15); color: #f87171; border: 1px solid rgba(244, 63, 94, 0.3);">
          <i class="fa-solid fa-arrow-up-long"></i>
        </div>
        <div style="display: flex; flex-direction: column;">
          <p style="margin: 0; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">ထွက်ငွေ (EXPENSE)</p>
          <h3 style="margin: 0; font-size: 1.35rem; font-weight: 900; color: #f87171; font-family: monospace;">-${formatMoney(expense)}</h3>
        </div>
      </div>

      <div class="stats-card">
        <div style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);">
          <i class="fa-solid fa-wallet"></i>
        </div>
        <div style="display: flex; flex-direction: column;">
          <p style="margin: 0; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">လက်ကျန် (BALANCE)</p>
          <h3 style="margin: 0; font-size: 1.35rem; font-weight: 900; color: #fbbf24; font-family: monospace;">${formatMoney(balance)}</h3>
        </div>
      </div>
    </div>
  `;
}

/**
 * Main Render Function
 */
async function renderCashbook(page = 1, searchVal = "", fromDate = "", toDate = "", silentRefresh = false) {
  const container = document.getElementById("view-container");
  if (!container) return;

  const currentUser = window.AppState ? window.AppState.currentUser : localStorage.getItem("yogi_user_name");
  const isAdmin = currentUser === "Admin";

  const titleEl = document.getElementById("page-title");
  if (titleEl) titleEl.innerText = "ငွေစာရင်း (Cashbook)";

  if (!silentRefresh) window.toggleLoading(true);

  let data = { rows: [], total: 0, totalIncome: 0, totalExpense: 0, balance: 0 };
  const limit = 30;

  try {
    const res = await window.callApi("getCashbookData", { page, searchVal, fromDate, toDate, limit });
    if (res.success && res.data) data = res.data;
  } catch (e) {
    console.error("getCashbookData Error:", e);
  } finally {
    if (!silentRefresh) window.toggleLoading(false);
  }

  const rawRows = data.rows || [];
  const totalCount = data.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  window._currentCashRows = rawRows;

  container.innerHTML = `
    <div class="space-y-5 view-panel">
      <!-- Top 3 KPI Cards -->
      ${statCardsCashHtml(data.totalIncome, data.totalExpense, data.balance)}

      <!-- Control Bar ("ရှာမည်" ခလုတ်ဖြုတ်ထားပြီး Live Search ပြုလုပ်ထားသည်) -->
      <div class="control-bar-wrapper">
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; flex: 1;">
          <div style="position: relative; min-width: 200px; flex: 1;">
            <input type="text" id="cash-search-input" value="${window.escapeHtml(searchVal)}" 
              oninput="triggerCashSearch()"
              placeholder="အကြောင်းအရာ / ဦးဆောင်သူ / ခေါင်းစဉ် ရိုက်ရှာရန်..." 
              style="width: 100%; padding-left: 2.2rem; background: #070a12; border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 0.75rem; color: #f1f5f9; font-size: 0.8rem; outline: none; height: 38px;">
            <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 0.75rem;"></i>
          </div>

          <div style="display: flex; align-items: center; gap: 0.3rem;">
            <span style="font-size: 0.72rem; color: #94a3b8; font-weight: bold;">From:</span>
            <input type="date" id="cash-from-date" value="${fromDate}" onchange="triggerCashSearch()" style="background: #070a12; border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 0.6rem; color: #cbd5e1; font-size: 0.75rem; padding: 0.35rem 0.5rem; outline: none; height: 38px;">
          </div>

          <div style="display: flex; align-items: center; gap: 0.3rem;">
            <span style="font-size: 0.72rem; color: #94a3b8; font-weight: bold;">To:</span>
            <input type="date" id="cash-to-date" value="${toDate}" onchange="triggerCashSearch()" style="background: #070a12; border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 0.6rem; color: #cbd5e1; font-size: 0.75rem; padding: 0.35rem 0.5rem; outline: none; height: 38px;">
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
          <button onclick="resetCashSearch()" class="btn-control btn-control-refresh" title="မူလအတိုင်း ပြန်လည်ရယူပါ">
            <i class="fa-solid fa-rotate"></i> Refresh
          </button>
          <button onclick="exportCashbookToExcel()" class="btn-control btn-control-export" title="Excel ထုတ်ယူမည်">
            <i class="fa-solid fa-file-excel"></i> Export
          </button>
          <button onclick="openCashModal()" class="btn-control btn-control-add" style="height: 38px;">
            <i class="fa-solid fa-plus"></i> + New Add
          </button>
        </div>
      </div>

      <!-- Table View: စဉ် | ရက်စွဲ | ခေါင်းစဉ် | အကြောင်းအရာ | ဝင်ငွေ | ထွက်ငွေ | လက်ကျန် | ဦးဆောင်သူ | ACTION -->
      <div class="table-scroll-container">
        <table>
          <thead>
            <tr style="background-color: #080d1a; border-bottom: 2px solid rgba(245, 158, 11, 0.3); color: #fbbf24; font-size: 0.72rem; font-weight: 800;">
              <th style="padding: 12px 14px; white-space: nowrap;">စဉ်</th>
              <th style="padding: 12px 14px; white-space: nowrap;">ရက်စွဲ</th>
              <th style="padding: 12px 14px; white-space: nowrap;">ခေါင်းစဉ်</th>
              <th style="padding: 12px 14px; white-space: nowrap;">အကြောင်းအရာ</th>
              <th style="padding: 12px 14px; white-space: nowrap; text-align: right;">ဝင်ငွေ</th>
              <th style="padding: 12px 14px; white-space: nowrap; text-align: right;">ထွက်ငွေ</th>
              <th style="padding: 12px 14px; white-space: nowrap; text-align: right;">လက်ကျန်</th>
              <th style="padding: 12px 14px; white-space: nowrap;">ဦးဆောင်သူ</th>
              <th class="sticky-action" style="padding: 12px 14px; white-space: nowrap; text-align: center;">ACTION</th>
            </tr>
          </thead>
          <tbody>
            ${rawRows.length > 0 ? rawRows.map((r, idx) => {
              const isInc = CASH_CATEGORIES.INCOME.includes(r.category);
              return `
              <tr style="border-bottom: 1px solid rgba(30, 41, 59, 0.5);">
                <td style="padding: 11px 14px; font-weight: bold; color: #fbbf24; white-space: nowrap;">${(page - 1) * limit + idx + 1}</td>
                <td style="white-space: nowrap; font-family: monospace;">${r.txDate || '-'}</td>
                <td style="white-space: nowrap;">
                  <span style="padding: 3px 8px; border-radius: 6px; font-weight: 800; font-size: 0.72rem; ${isInc ? 'background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3);' : 'background: rgba(244,63,94,0.15); color: #f87171; border: 1px solid rgba(244,63,94,0.3);'}">
                    ${window.escapeHtml(r.category)}
                  </span>
                </td>
                <td style="white-space: normal; min-width: 180px; color: #f8fafc; font-weight: 600; line-height: 1.4;">${window.escapeHtml(r.description)}</td>
                <td style="text-align: right; white-space: nowrap; font-weight: 800; color: #34d399; font-family: monospace;">
                  ${r.income > 0 ? '+' + formatMoney(r.income) : '-'}
                </td>
                <td style="text-align: right; white-space: nowrap; font-weight: 800; color: #f87171; font-family: monospace;">
                  ${r.expense > 0 ? '-' + formatMoney(r.expense) : '-'}
                </td>
                <td style="text-align: right; white-space: nowrap; font-weight: 900; color: #fbbf24; font-family: monospace;">
                  ${formatMoney(r.balance)}
                </td>
                <td style="white-space: nowrap; color: #cbd5e1; font-weight: bold;">${window.escapeHtml(r.leaderName)}</td>
                <td class="sticky-action" style="text-align: center; white-space: nowrap; background-color: #0e172a;">
                  <div style="display: flex; gap: 6px; justify-content: center;">
                    <button onclick="openCashModal(${r.id})" class="btn-action-icon btn-action-edit" title="ပြင်ဆင်မည်"><i class="fa-solid fa-pen-to-square"></i></button>
                    ${isAdmin ? `
                      <button onclick="deleteCashRecord(${r.id})" class="btn-action-icon btn-action-delete" title="ဖျက်ပါ"><i class="fa-solid fa-trash"></i></button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `;
            }).join('') : `
              <tr><td colspan="9" style="text-align: center; padding: 3rem; color: #64748b;">ငွေစာရင်း မှတ်တမ်း မရှိသေးပါ။</td></tr>
            `}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination-container">
        <button onclick="renderCashbook(${page - 1}, '${window.escapeHtml(searchVal)}', '${fromDate}', '${toDate}')" ${page <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} class="btn-control btn-control-refresh" style="padding: 0.4rem 0.85rem;">
          <i class="fa-solid fa-chevron-left"></i> Previous
        </button>

        <span style="font-size: 0.75rem; font-weight: 800; color: #fbbf24;">
          Page <b style="color: #ffffff;">${page}</b> of <b>${totalPages}</b> (Total: ${totalCount} ခု)
        </span>

        <button onclick="renderCashbook(${page + 1}, '${window.escapeHtml(searchVal)}', '${fromDate}', '${toDate}')" ${page >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} class="btn-control btn-control-refresh" style="padding: 0.4rem 0.85rem;">
          Next <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </div>
  `;
}

let cashSearchTimer = null;
function triggerCashSearch() {
  clearTimeout(cashSearchTimer);
  cashSearchTimer = setTimeout(() => {
    const search = document.getElementById("cash-search-input") ? document.getElementById("cash-search-input").value.trim() : "";
    const fromDate = document.getElementById("cash-from-date") ? document.getElementById("cash-from-date").value : "";
    const toDate = document.getElementById("cash-to-date") ? document.getElementById("cash-to-date").value : "";
    renderCashbook(1, search, fromDate, toDate, true);
  }, 300);
}

function resetCashSearch() {
  renderCashbook(1, '', '', '');
}

/**
 * 💡 Edit လုပ်ရာတွင် မူရင်းဒေတာ အကုန်ပြသခြင်း & 2-Rows ချဲ့နိုင်သော Textarea ထည့်သွင်းထားသော Modal
 */
function openCashModal(cashId = null) {
  let existing = null;
  if (cashId) {
    existing = (window._currentCashRows || []).find(r => Number(r.id) === Number(cashId));
  }

  const isEdit = !!existing;
  const modalDate = isEdit ? toIsoDate(existing.txDate) : getTodayIso();
  const currentCategory = isEdit ? existing.category : "အလှူရရှိ";
  const currentAmount = isEdit ? (Number(existing.income) > 0 ? existing.income : existing.expense) : "";
  const currentDesc = isEdit ? (existing.description || '') : '';
  const currentLeader = isEdit ? (existing.leaderName || '') : '';

  const modalHtml = `
    <div id="cash-modal-overlay" class="modal-overlay-bg">
      <div class="modal-dialog-box" style="max-width: 500px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(245, 158, 11, 0.2); padding-bottom: 0.75rem; margin-bottom: 1rem;">
          <h3 style="margin: 0; color: #fbbf24; font-size: 0.95rem; font-weight: 800;">
            <i class="fa-solid ${isEdit ? 'fa-pen-to-square' : 'fa-wallet'}"></i>
            ${isEdit ? 'ငွေစာရင်း ပြင်ဆင်ရန်' : 'ငွေစာရင်း အသစ် ထည့်သွင်းရန်'}
          </h3>
          <button onclick="closeCashModal()" style="background: none; border: none; color: #94a3b8; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form id="cash-form" onsubmit="saveCashForm(event, ${isEdit ? existing.id : 'null'})" style="display: flex; flex-direction: column; gap: 0.85rem;">
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div>
              <label style="display: block; font-weight: bold; color: #fef08a; margin-bottom: 0.3rem; font-size: 0.75rem;">ရက်စွဲ *</label>
              <input type="date" id="cash-modal-date" required value="${modalDate}">
            </div>
            
            <div>
              <label style="display: block; font-weight: bold; color: #fef08a; margin-bottom: 0.3rem; font-size: 0.75rem;">ခေါင်းစဉ် *</label>
              <select id="cash-modal-category" required onchange="updateCategoryTypeBadge()">
                <optgroup label="ဝင်ငွေ (Income)">
                  <option value="အလှူရရှိ" ${currentCategory === 'အလှူရရှိ' ? 'selected' : ''}>အလှူရရှိ</option>
                  <option value="ဘဏ်တိုး" ${currentCategory === 'ဘဏ်တိုး' ? 'selected' : ''}>ဘဏ်တိုး</option>
                </optgroup>
                <optgroup label="ထွက်ငွေ (Expense)">
                  <option value="ပုံနှိပ်တိုက်ပေးငွေ" ${currentCategory === 'ပုံနှိပ်တိုက်ပေးငွေ' ? 'selected' : ''}>ပုံနှိပ်တိုက်ပေးငွေ</option>
                  <option value="တရားစခန်း အလှူငွေ" ${currentCategory === 'တရားစခန်း အလှူငွေ' ? 'selected' : ''}>တရားစခန်း အလှူငွေ</option>
                  <option value="အထွေထွေ အသုံးစရိတ်" ${currentCategory === 'အထွေထွေ အသုံးစရိတ်' ? 'selected' : ''}>အထွေထွေ အသုံးစရိတ်</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div id="cash-type-hint" style="padding: 0.4rem 0.75rem; border-radius: 0.5rem; font-size: 0.72rem; font-weight: 800; display: inline-flex; align-items: center; gap: 0.4rem;">
          </div>

          <div>
            <label style="display: block; font-weight: bold; color: #fef08a; margin-bottom: 0.3rem; font-size: 0.75rem;">ငွေပမာဏ *</label>
            <input type="number" id="cash-modal-amount" required min="1" value="${currentAmount}" placeholder="ဥပမာ - 100000">
          </div>

          <!-- 💡 ၅။ အောက်သို့ စိတ်ကြိုက်ချဲ့နိုင်သော ၂ တန်း Textarea (Expandable rows="2") -->
          <div>
            <label style="display: block; font-weight: bold; color: #fef08a; margin-bottom: 0.3rem; font-size: 0.75rem;">အကြောင်းအရာ *</label>
            <textarea id="cash-modal-desc" rows="2" required placeholder="ဥပမာ - တရားစာအုပ် ရိုက်နှိပ်စရိတ် / ဆွမ်းအလှူခံရငွေ..."
              style="width: 100%; background: #080d1a; border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 0.75rem; padding: 0.5rem 0.85rem; color: #f8fafc; font-size: 0.82rem; outline: none; resize: vertical; min-height: 56px; font-family: inherit; box-sizing: border-box; display: block;">${window.escapeHtml(currentDesc)}</textarea>
          </div>

          <div>
            <label style="display: block; font-weight: bold; color: #fef08a; margin-bottom: 0.3rem; font-size: 0.75rem;">ဦးဆောင်သူ / တာဝန်ခံ *</label>
            <input type="text" id="cash-modal-leader" required value="${window.escapeHtml(currentLeader)}" placeholder="အမည် ရိုက်ထည့်ပါ...">
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem;">
            <button type="button" onclick="closeCashModal()" class="btn-control btn-control-refresh" style="padding: 0.5rem 1rem;">မလုပ်တော့ပါ</button>
            <button type="submit" id="cash-submit-btn" class="btn-control btn-control-add" style="padding: 0.5rem 1.25rem;">
              သိမ်းဆည်းမည်
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const existingModal = document.getElementById("cash-modal-overlay");
  if (existingModal) existingModal.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  updateCategoryTypeBadge();
}

function updateCategoryTypeBadge() {
  const cat = document.getElementById("cash-modal-category") ? document.getElementById("cash-modal-category").value : "";
  const hint = document.getElementById("cash-type-hint");
  if (!hint) return;

  const isIncome = CASH_CATEGORIES.INCOME.includes(cat);
  if (isIncome) {
    hint.style.background = "rgba(16, 185, 129, 0.15)";
    hint.style.color = "#34d399";
    hint.style.border = "1px solid rgba(16, 185, 129, 0.3)";
    hint.innerHTML = `<i class="fa-solid fa-circle-down"></i> အမျိုးအစား: <b>ဝင်ငွေ (INCOME)</b> အဖြစ် စာရင်းဝင်ပါမည်။`;
  } else {
    hint.style.background = "rgba(244, 63, 94, 0.15)";
    hint.style.color = "#f87171";
    hint.style.border = "1px solid rgba(244, 63, 94, 0.3)";
    hint.innerHTML = `<i class="fa-solid fa-circle-up"></i> အမျိုးအစား: <b>ထွက်ငွေ (EXPENSE)</b> အဖြစ် စာရင်းနှုတ်ပါမည်။`;
  }
}

function closeCashModal() {
  const modal = document.getElementById("cash-modal-overlay");
  if (modal) modal.remove();
}

/**
 * 💡 လိုင်းမကောင်းချိန် ထပ်ခါထပ်ခါ မနှိပ်မိစေရန် (Double-click lock) ထည့်သွင်းထားသော Save Function
 */
async function saveCashForm(event, editId = null) {
  event.preventDefault();

  if (isCashSubmitting) return; // ခလုတ်ထပ်မနှိပ်နိုင်အောင် ပိတ်ခြင်း

  const txDate = document.getElementById("cash-modal-date").value;
  const category = document.getElementById("cash-modal-category").value;
  const amount = document.getElementById("cash-modal-amount").value;
  const description = document.getElementById("cash-modal-desc").value.trim();
  const leaderName = document.getElementById("cash-modal-leader").value.trim();
  const submitBtn = document.getElementById("cash-submit-btn");

  if (!category || !description || !leaderName || !amount) {
    window.showToast("ERROR", "အချက်အလက်များကို ပြည့်စုံစွာ ဖြည့်သွင်းပါ");
    return;
  }

  isCashSubmitting = true;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.5";
    submitBtn.style.cursor = "not-allowed";
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> သိမ်းဆည်းနေပါသည်...`;
  }
  window.toggleLoading(true);

  try {
    const payload = {
      id: editId || undefined,
      txDate,
      category,
      amount: Number(amount),
      description,
      leaderName
    };

    const action = editId ? "updateCashbook" : "saveCashbook";
    const res = await window.callApi(action, payload);

    if (res && res.success) {
      window.showToast("SUCCESS", editId ? "ပြင်ဆင်ချက် သိမ်းဆည်းပြီးပါပြီ။" : "ငွေစာရင်း အသစ် သိမ်းဆည်းပြီးပါပြီ။");
      closeCashModal();
      renderCashbook();
    } else {
      window.showToast("ERROR", (res && res.message) || "ဆာဗာတွင် သိမ်းဆည်း၍ မရပါ");
    }
  } catch (e) {
    console.error("Save Cashbook Error:", e);
    window.showToast("ERROR", "ဆာဗာ အမှား: " + (e.message || String(e)));
  } finally {
    isCashSubmitting = false;
    window.toggleLoading(false);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.style.cursor = "pointer";
      submitBtn.innerHTML = `သိမ်းဆည်းမည်`;
    }
  }
}

async function deleteCashRecord(id) {
  if (!confirm("ဤငွေစာရင်း မှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား။")) return;
  window.toggleLoading(true);
  try {
    const res = await window.callApi("deleteCashbook", { id });
    if (res && res.success) {
      window.showToast("SUCCESS", "ဖျက်ပြီးပါပြီ။");
      renderCashbook();
    } else {
      window.showToast("ERROR", (res && res.message) || "ဖျက်၍မရပါ");
    }
  } catch (e) {
    console.error(e);
  } finally {
    window.toggleLoading(false);
  }
}

function exportCashbookToExcel() {
  const table = document.querySelector("table");
  if (!table) return;

  try {
    const wb = XLSX.utils.table_to_book(table, { sheet: "Cashbook" });
    XLSX.writeFile(wb, `Cashbook_Report.xlsx`);
    window.showToast("SUCCESS", "Excel ဒေါင်းလုဒ်ရယူပြီးပါပြီ။");
  } catch (e) {
    window.showToast("ERROR", "Excel ထုတ်ယူရာတွင် အမှားဖြစ်ပေါ်ခဲ့ပါသည်။");
  }
}

// Global Window Exports
window.renderCashbook = renderCashbook;
window.openCashModal = openCashModal;
window.closeCashModal = closeCashModal;
window.saveCashForm = saveCashForm;
window.deleteCashRecord = deleteCashRecord;
window.exportCashbookToExcel = exportCashbookToExcel;
window.triggerCashSearch = triggerCashSearch;
window.resetCashSearch = resetCashSearch;
window.updateCategoryTypeBadge = updateCategoryTypeBadge;
