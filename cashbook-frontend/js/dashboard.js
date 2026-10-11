/**
 * YOGI MANAGEMENT SYSTEM — Home Dashboard
 * File: js/dashboard.js 
 */

window._dashTab = window._dashTab || "yogi"; // "yogi" သို့မဟုတ် "cash"
window._dashDataCache = null;

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString("en-US");
}

/**
 * စာအုပ်မျက်နှာဖုံး + Mindfulness Reminder ပေါင်းစပ် Card (ဘယ်ဘက်ခြမ်း)
 */
function getMindfulnessWithBookHtml() {
  return `
    <div class="mindfulness-card" style="background: linear-gradient(145deg, #0e172a 0%, #090f1e 100%); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 1.25rem; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
      
      <!-- စာအုပ်မျက်နှာဖုံး Showcase Card -->
      <div style="display: flex; gap: 1rem; align-items: center; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 1rem; padding: 0.85rem; margin-bottom: 1rem;">
        <div style="position: relative; flex-shrink: 0; cursor: pointer;" onclick="openBookModal()" title="စာအုပ်ပုံ အကြီးချဲ့ကြည့်ရန် နှိပ်ပါ">
          <img src="images/book-cover.jpg" alt="ပဋ္ဌာန်းအခြေခံ၍ သံသရာပြတ် ဝိပဿနာအားထုတ်နည်း" 
            onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&q=80'"
            style="width: 82px; height: 114px; object-fit: cover; border-radius: 0.5rem; border: 2px solid #f59e0b; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.35); transition: transform 0.2s;"
            onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          <span style="position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,0.75); color: #fbbf24; font-size: 9px; padding: 2px 4px; border-radius: 3px;">
            <i class="fa-solid fa-magnifying-glass-plus"></i>
          </span>
        </div>
        <div style="display: flex; flex-direction: column; justify-content: center; gap: 0.25rem;">
          <h4 style="margin: 0; color: #fef08a; font-size: 0.88rem; font-weight: 900; line-height: 1.4;">
            ပဋ္ဌာန်းအခြေခံ၍ သံသရာပြတ် ဝိပဿနာအားထုတ်နည်း
          </h4>
          <p style="margin: 0; color: #94a3b8; font-size: 0.72rem; font-weight: 600;">
            ပဋ္ဌာန်းစာတမ်းရှင် အင်ဂျင်နီယာ ဦးအုန်းကျော် (ပြင်ဦးလွင်)
          </p>
          <span style="margin-top: 0.2rem; display: inline-block; color: #38bdf8; font-size: 0.68rem; font-weight: bold;">
            (ပဋ္ဌာန်းမိသားစု ယောဂီလက်စွဲ)
          </span>
        </div>
      </div>

      <!-- Mindfulness Reminder Quotes -->
      <div style="display: flex; flex-direction: column; gap: 0.65rem; font-family: Georgia, serif; font-size: 0.88rem; line-height: 1.6;">
        <div style="border-bottom: 1px solid rgba(245, 158, 11, 0.15); padding-bottom: 0.45rem;">
          <p style="margin: 0; font-style: italic;"><span style="color: #fef08a; font-weight: 800;">In every sight,</span> <span style="color: #cbd5e1; font-style: normal; font-family: sans-serif; font-size: 0.8rem; font-weight: 600;">-- မင်း ဘာပဲမြင်မြင် ...</span></p>
        </div>

        <div style="border-bottom: 1px solid rgba(245, 158, 11, 0.15); padding-bottom: 0.45rem;">
          <p style="margin: 0; font-style: italic;"><span style="color: #7dd3fc; font-weight: 800;">In every sound,</span> <span style="color: #cbd5e1; font-style: normal; font-family: sans-serif; font-size: 0.8rem; font-weight: 600;">-- မင်း ဘာပဲကြားကြား ...</span></p>
        </div>

        <div style="border-bottom: 1px solid rgba(245, 158, 11, 0.15); padding-bottom: 0.45rem;">
          <p style="margin: 0; font-style: italic;"><span style="color: #6ee7b7; font-weight: 800;">In every smell,</span> <span style="color: #cbd5e1; font-style: normal; font-family: sans-serif; font-size: 0.8rem; font-weight: 600;">-- မင်း ဘယ်လို အနံ့ပဲရရ ...</span></p>
        </div>

        <div style="border-bottom: 1px solid rgba(245, 158, 11, 0.15); padding-bottom: 0.45rem;">
          <p style="margin: 0; font-style: italic;"><span style="color: #fda4af; font-weight: 800;">In every taste,</span> <span style="color: #cbd5e1; font-style: normal; font-family: sans-serif; font-size: 0.8rem; font-weight: 600;">-- မင်း ဘာပဲစားစား ...</span></p>
        </div>

        <div style="border-bottom: 1px solid rgba(245, 158, 11, 0.15); padding-bottom: 0.45rem;">
          <p style="margin: 0; font-style: italic;"><span style="color: #5eead4; font-weight: 800;">In every touch,</span> <span style="color: #cbd5e1; font-style: normal; font-family: sans-serif; font-size: 0.8rem; font-weight: 600;">-- မင်း ဘာနဲ့ပဲ ထိတွေ့ရပါစေ ...</span></p>
        </div>

        <div style="padding-top: 0.2rem;">
          <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); padding: 0.75rem 1rem; border-radius: 0.85rem;">
            <p style="margin: 0; color: #fde047; font-weight: 900; font-style: normal; font-size: 0.92rem;">
              <i class="fa-solid fa-quote-left" style="color: rgba(245, 158, 11, 0.6); margin-right: 0.4rem;"></i>
              In every thought -- မင်း ဘာပဲ တွေးတွေး ...
            </p>
            <p style="margin: 0.3rem 0 0 1.25rem; color: #fef08a; font-weight: 800; font-size: 0.85rem;">
              — stay mindful. -- အမြဲသတိ ထားပါလေ ...
            </p>
          </div>
        </div>
      </div>

      <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid rgba(245, 158, 11, 0.2); display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem;">
        <div style="display: flex; align-items: center; gap: 0.4rem; font-weight: 800; color: #fbbf24;">
          <i class="fa-solid fa-dharmachakra"></i>
          <span>Appamadena sampadetha</span>
          <span style="font-weight: normal; font-style: italic; color: #94a3b8; font-size: 0.68rem;">— The Buddha</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * 💡 ထိပ်ဆုံး Box (၄) ခု Render ပြုလုပ်ခြင်း
 */
function renderTopKpiCards(type, d) {
  if (type === "cash") {
    const c = d.cashSummary || { totalIncome: 0, totalExpense: 0, balance: 0, categories: {} };
    const incDonation = (c.categories && c.categories["အလှူရရှိ"] && c.categories["အလှူရရှိ"].income) || 0;

    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; width: 100%;">
        <div class="stats-card">
          <div style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">
            <i class="fa-solid fa-arrow-down-long"></i>
          </div>
          <div style="display: flex; flex-direction: column;">
            <p style="margin: 0; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">ဝင်ငွေ (INCOME)</p>
            <h3 style="margin: 0; font-size: 1.35rem; font-weight: 900; color: #34d399; font-family: monospace;">+${formatMoney(c.totalIncome)}</h3>
          </div>
        </div>

        <div class="stats-card">
          <div style="background: rgba(244, 63, 94, 0.15); color: #f87171; border: 1px solid rgba(244, 63, 94, 0.3);">
            <i class="fa-solid fa-arrow-up-long"></i>
          </div>
          <div style="display: flex; flex-direction: column;">
            <p style="margin: 0; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">ထွက်ငွေ (EXPENSE)</p>
            <h3 style="margin: 0; font-size: 1.35rem; font-weight: 900; color: #f87171; font-family: monospace;">-${formatMoney(c.totalExpense)}</h3>
          </div>
        </div>

        <div class="stats-card">
          <div style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);">
            <i class="fa-solid fa-wallet"></i>
          </div>
          <div style="display: flex; flex-direction: column;">
            <p style="margin: 0; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">လက်ကျန် (BALANCE)</p>
            <h3 style="margin: 0; font-size: 1.35rem; font-weight: 900; color: #fbbf24; font-family: monospace;">${formatMoney(c.balance)}</h3>
          </div>
        </div>

        <!-- 💡 ငွေစာရင်း အတွက် ၄ ခုမြောက် Box (အလှူရရှိငွေ) -->
        <div class="stats-card">
          <div style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">
            <i class="fa-solid fa-hand-holding-heart"></i>
          </div>
          <div style="display: flex; flex-direction: column;">
            <p style="margin: 0; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">အလှူရရှိ (DONATION)</p>
            <h3 style="margin: 0; font-size: 1.35rem; font-weight: 900; color: #38bdf8; font-family: monospace;">+${formatMoney(incDonation)}</h3>
          </div>
        </div>
      </div>
    `;
  }

  // 💡 ယောဂီ စာရင်း အတွက် ထိပ်ဆုံး Box (၄) ခု
  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; width: 100%;">
      <div class="stats-card">
        <div style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);">
          <i class="fa-solid fa-users"></i>
        </div>
        <div style="display: flex; flex-direction: column;">
          <p style="margin: 0; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">TOTAL ACTIVE</p>
          <h3 style="margin: 0; font-size: 1.35rem; font-weight: 900; color: #fbbf24; font-family: monospace;">${d.totalActive || 0} ဦး</h3>
        </div>
      </div>

      <div class="stats-card">
        <div style="background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3);">
          <i class="fa-solid fa-mars"></i>
        </div>
        <div style="display: flex; flex-direction: column;">
          <p style="margin: 0; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">ACTIVE MALE</p>
          <h3 style="margin: 0; font-size: 1.35rem; font-weight: 900; color: #818cf8; font-family: monospace;">${d.activeMale || 0} ဦး</h3>
        </div>
      </div>

      <div class="stats-card">
        <div style="background: rgba(236, 72, 153, 0.15); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.3);">
          <i class="fa-solid fa-venus"></i>
        </div>
        <div style="display: flex; flex-direction: column;">
          <p style="margin: 0; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">ACTIVE FEMALE</p>
          <h3 style="margin: 0; font-size: 1.35rem; font-weight: 900; color: #f472b6; font-family: monospace;">${d.activeFemale || 0} ဦး</h3>
        </div>
      </div>

      <!-- 💡 ယောဂီ အတွက် ၄ ခုမြောက် Box (ဦးဆောင်ဆွေးနွေး ယောဂီ) -->
      <div class="stats-card">
        <div style="background: rgba(20, 184, 166, 0.15); color: #2dd4bf; border: 1px solid rgba(20, 184, 166, 0.3);">
          <i class="fa-solid fa-user-tie"></i>
        </div>
        <div style="display: flex; flex-direction: column;">
          <p style="margin: 0; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">ဦးဆောင်ယောဂီ (LEADERS)</p>
          <h3 style="margin: 0; font-size: 1.35rem; font-weight: 900; color: #2dd4bf; font-family: monospace;">${(d.leaders && d.leaders.total) || 0} ဦး</h3>
        </div>
      </div>
    </div>
  `;
}

/**
 * ညာဘက် ဇယား (ငွေစာရင်း ချုပ်ဇယား vs ယောဂီ အဆင့်လိုက် စာရင်း)
 */
function renderRightTable(type, d) {
  if (type === "cash") {
    const cats = (d.cashSummary && d.cashSummary.categories) || {};
    
    const incDonation = (cats["အလှူရရှိ"] && cats["အလှူရရှိ"].income) || 0;
    const incInterest = (cats["ဘဏ်တိုး"] && cats["ဘဏ်တိုး"].income) || 0;
    const subTotalIncome = incDonation + incInterest;

    const expPrinting = (cats["ပုံနှိပ်တိုက်ပေးငွေ"] && cats["ပုံနှိပ်တိုက်ပေးငွေ"].expense) || 0;
    const expRetreat = (cats["တရားစခန်း အလှူငွေ"] && cats["တရားစခန်း အလှူငွေ"].expense) || 0;
    const expGeneral = (cats["အထွေထွေ အသုံးစရိတ်"] && cats["အထွေထွေ အသုံးစရိတ်"].expense) || 0;
    const subTotalExpense = expPrinting + expRetreat + expGeneral;

    const netBalance = subTotalIncome - subTotalExpense;

    return `
      <div style="display: flex; flex-direction: column; gap: 0.5rem; height: 100%;">
        <h3 style="margin: 0; font-size: 0.75rem; font-weight: 900; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.4rem;">
          <i class="fa-solid fa-scale-balanced" style="color: #fbbf24;"></i>
          <span>ငွေစာရင်း အကျဉ်းချုပ် (FINANCIAL SUMMARY)</span>
        </h3>

        <div style="background-color: #0e172a; border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 1.25rem; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); flex: 1;">
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
              <thead>
                <tr style="background-color: #080d1a; border-bottom: 2px solid rgba(245, 158, 11, 0.3); color: #fbbf24; font-size: 0.72rem; font-weight: 800;">
                  <th style="padding: 10px 14px; text-align: left; width: 60px;">စဉ်</th>
                  <th style="padding: 10px 14px; text-align: left;">အကြောင်းအရာ / ခေါင်းစဉ်</th>
                  <th style="padding: 10px 14px; text-align: right;">ဝင်ငွေ</th>
                  <th style="padding: 10px 14px; text-align: right;">ထွက်ငွေ</th>
                  <th style="padding: 10px 14px; text-align: right;">လက်ကျန်</th>
                </tr>
              </thead>
              <tbody>
                <tr style="background-color: rgba(16, 185, 129, 0.1); border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
                  <td colspan="5" style="padding: 8px 14px; font-weight: 900; color: #34d399; font-size: 0.78rem;">
                    <i class="fa-solid fa-circle-down"></i> ဝင်ငွေ
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid rgba(30, 41, 59, 0.5);">
                  <td style="padding: 9px 14px; color: #94a3b8;">၁</td>
                  <td style="padding: 9px 14px; font-weight: bold; color: #f8fafc;">အလှူငွေ (အလှူရရှိ)</td>
                  <td style="padding: 9px 14px; text-align: right; color: #34d399; font-weight: bold; font-family: monospace;">+${formatMoney(incDonation)}</td>
                  <td style="padding: 9px 14px; text-align: right; color: #64748b;">-</td>
                  <td style="padding: 9px 14px; text-align: right; color: #fbbf24; font-family: monospace;">${formatMoney(incDonation)}</td>
                </tr>
                <tr style="border-bottom: 1px solid rgba(30, 41, 59, 0.5);">
                  <td style="padding: 9px 14px; color: #94a3b8;">၂</td>
                  <td style="padding: 9px 14px; font-weight: bold; color: #f8fafc;">ဘဏ်တိုး</td>
                  <td style="padding: 9px 14px; text-align: right; color: #34d399; font-weight: bold; font-family: monospace;">+${formatMoney(incInterest)}</td>
                  <td style="padding: 9px 14px; text-align: right; color: #64748b;">-</td>
                  <td style="padding: 9px 14px; text-align: right; color: #fbbf24; font-family: monospace;">${formatMoney(subTotalIncome)}</td>
                </tr>
                <tr style="background-color: rgba(16, 185, 129, 0.15); border-bottom: 2px solid rgba(16, 185, 129, 0.3);">
                  <td colspan="2" style="padding: 9px 14px; font-weight: 900; color: #34d399;">ဝင်ငွေပေါင်း</td>
                  <td style="padding: 9px 14px; text-align: right; font-weight: 900; color: #34d399; font-family: monospace;">+${formatMoney(subTotalIncome)}</td>
                  <td style="padding: 9px 14px; text-align: right; color: #64748b;">-</td>
                  <td style="padding: 9px 14px; text-align: right; font-weight: 900; color: #fbbf24; font-family: monospace;">${formatMoney(subTotalIncome)}</td>
                </tr>

                <tr style="background-color: rgba(244, 63, 94, 0.1); border-bottom: 1px solid rgba(244, 63, 94, 0.2);">
                  <td colspan="5" style="padding: 8px 14px; font-weight: 900; color: #f87171; font-size: 0.78rem;">
                    <i class="fa-solid fa-circle-up"></i> ထွက်ငွေ
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid rgba(30, 41, 59, 0.5);">
                  <td style="padding: 9px 14px; color: #94a3b8;">၁</td>
                  <td style="padding: 9px 14px; font-weight: bold; color: #f8fafc;">ပုံနှိပ်တိုက် ထုတ်ပေးငွေ</td>
                  <td style="padding: 9px 14px; text-align: right; color: #64748b;">-</td>
                  <td style="padding: 9px 14px; text-align: right; color: #f87171; font-weight: bold; font-family: monospace;">-${formatMoney(expPrinting)}</td>
                  <td style="padding: 9px 14px; text-align: right; color: #fbbf24; font-family: monospace;">${formatMoney(subTotalIncome - expPrinting)}</td>
                </tr>
                <tr style="border-bottom: 1px solid rgba(30, 41, 59, 0.5);">
                  <td style="padding: 9px 14px; color: #94a3b8;">၂</td>
                  <td style="padding: 9px 14px; font-weight: bold; color: #f8fafc;">တရားစခန်း အလှူငွေ</td>
                  <td style="padding: 9px 14px; text-align: right; color: #64748b;">-</td>
                  <td style="padding: 9px 14px; text-align: right; color: #f87171; font-weight: bold; font-family: monospace;">-${formatMoney(expRetreat)}</td>
                  <td style="padding: 9px 14px; text-align: right; color: #fbbf24; font-family: monospace;">${formatMoney(subTotalIncome - (expPrinting + expRetreat))}</td>
                </tr>
                <tr style="border-bottom: 1px solid rgba(30, 41, 59, 0.5);">
                  <td style="padding: 9px 14px; color: #94a3b8;">၃</td>
                  <td style="padding: 9px 14px; font-weight: bold; color: #f8fafc;">အထွေထွေ အသုံးစရိတ်</td>
                  <td style="padding: 9px 14px; text-align: right; color: #64748b;">-</td>
                  <td style="padding: 9px 14px; text-align: right; color: #f87171; font-weight: bold; font-family: monospace;">-${formatMoney(expGeneral)}</td>
                  <td style="padding: 9px 14px; text-align: right; color: #fbbf24; font-family: monospace;">${formatMoney(netBalance)}</td>
                </tr>
                <tr style="background-color: rgba(244, 63, 94, 0.15); border-bottom: 2px solid rgba(244, 63, 94, 0.3);">
                  <td colspan="2" style="padding: 9px 14px; font-weight: 900; color: #f87171;">ထွက်ငွေပေါင်း</td>
                  <td style="padding: 9px 14px; text-align: right; color: #64748b;">-</td>
                  <td style="padding: 9px 14px; text-align: right; font-weight: 900; color: #f87171; font-family: monospace;">-${formatMoney(subTotalExpense)}</td>
                  <td style="padding: 9px 14px; text-align: right; font-weight: 900; color: #fbbf24; font-family: monospace;">${formatMoney(netBalance)}</td>
                </tr>

                <tr style="background-color: rgba(245, 158, 11, 0.2); border-top: 2px solid #f59e0b;">
                  <td colspan="4" style="padding: 12px 14px; font-weight: 900; color: #fbbf24; font-size: 0.9rem;">
                    <i class="fa-solid fa-wallet"></i> လက်ကျန်ငွေ (NET BALANCE)
                  </td>
                  <td style="padding: 12px 14px; text-align: right; font-weight: 900; color: #fbbf24; font-size: 1.05rem; font-family: monospace;">
                    ${formatMoney(netBalance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // ယောဂီ စာရင်း Table (Default)
  const breakdownRows = (d.perLevel || []).map(l => `
    <tr style="border-bottom: 1px solid rgba(30, 41, 59, 0.5);">
      <td style="padding: 10px 14px; font-weight: 800; color: #e2e8f0;">${window.escapeHtml(l.name)}</td>
      <td style="padding: 10px 14px; color: #38bdf8; font-weight: bold; font-family: monospace; text-align: center;">${l.male || 0}</td>
      <td style="padding: 10px 14px; color: #fb7185; font-weight: bold; font-family: monospace; text-align: center;">${l.female || 0}</td>
      <td style="padding: 10px 14px; color: #fbbf24; font-weight: 900; font-family: monospace; text-align: center;">${l.total || 0}</td>
    </tr>
  `).join("");

  const totalMale = (d.perLevel || []).reduce((acc, curr) => acc + (curr.male || 0), 0) + (d.leaders ? d.leaders.male : 0);
  const totalFemale = (d.perLevel || []).reduce((acc, curr) => acc + (curr.female || 0), 0) + (d.leaders ? d.leaders.female : 0);
  const grandTotal = (d.perLevel || []).reduce((acc, curr) => acc + (curr.total || 0), 0) + (d.leaders ? d.leaders.total : 0);

  return `
    <div style="display: flex; flex-direction: column; gap: 0.5rem; height: 100%;">
      <h3 style="margin: 0; font-size: 0.75rem; font-weight: 900; color: #e2e8f0; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.4rem;">
        <i class="fa-solid fa-chart-pie" style="color: #818cf8;"></i>
        <span>ကမ္မဋ္ဌာန်း အဆင့်အလိုက် စာရင်း (ACTIVE)</span>
      </h3>

      <div style="background-color: #0e172a; border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 1.25rem; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
            <thead>
              <tr style="background-color: #080d1a; border-bottom: 2px solid rgba(245, 158, 11, 0.3); color: #fbbf24; font-size: 0.72rem; font-weight: 800;">
                <th style="padding: 12px 14px; text-align: left;">ကမ္မဋ္ဌာန်း အဆင့်</th>
                <th style="padding: 12px 14px; text-align: center;">ကျား (MALE)</th>
                <th style="padding: 12px 14px; text-align: center;">မ (FEMALE)</th>
                <th style="padding: 12px 14px; text-align: center;">ACTIVE စုစုပေါင်း</th>
              </tr>
            </thead>
            <tbody>
              ${breakdownRows}
              <tr style="background-color: #080d1a; border-top: 1px solid rgba(245, 158, 11, 0.15);">
                <td style="padding: 12px 14px; font-weight: 800; color: #cbd5e1; display: flex; align-items: center; gap: 0.5rem;">
                  <i class="fa-solid fa-user-tie" style="color: #818cf8;"></i>
                  <span>ဦးဆောင်ဆွေးနွေး ယောဂီ</span>
                </td>
                <td style="padding: 12px 14px; color: #38bdf8; font-weight: bold; font-family: monospace; text-align: center;">${d.leaders ? d.leaders.male : 0}</td>
                <td style="padding: 12px 14px; color: #fb7185; font-weight: bold; font-family: monospace; text-align: center;">${d.leaders ? d.leaders.female : 0}</td>
                <td style="padding: 12px 14px; color: #34d399; font-weight: bold; font-family: monospace; text-align: center;">${d.leaders ? d.leaders.total : 0}</td>
              </tr>

              <tr style="background-color: rgba(245, 158, 11, 0.15); border-top: 2px solid #f59e0b;">
                <td style="padding: 12px 14px; font-weight: 900; color: #fbbf24; font-size: 0.85rem;">စုစုပေါင်း</td>
                <td style="padding: 12px 14px; color: #38bdf8; font-weight: 900; font-family: monospace; text-align: center; font-size: 0.9rem;">${totalMale}</td>
                <td style="padding: 12px 14px; color: #fb7185; font-weight: 900; font-family: monospace; text-align: center; font-size: 0.9rem;">${totalFemale}</td>
                <td style="padding: 12px 14px; color: #34d399; font-weight: 900; font-family: monospace; text-align: center; font-size: 0.95rem;">${grandTotal}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/**
 * Main Render Dashboard Function
 */
window.renderDashboard = async function (silent = false) {
  const container = document.getElementById("view-container");
  if (!container) return;

  const titleEl = document.getElementById("page-title");
  if (titleEl) titleEl.innerText = "ပင်မစာမျက်နှာ";

  if (!silent) window.toggleLoading(true);
  let res;
  try {
    res = await window.callApi("getDashboardData", {});
    
    if (res && res.success && res.data && !res.data.cashSummary) {
      try {
        const cashRes = await window.callApi("getCashbookData", { limit: 500 });
        if (cashRes && cashRes.success && cashRes.data) {
          const rows = cashRes.data.rows || [];
          const catMap = {};
          rows.forEach(r => {
            if (!catMap[r.category]) catMap[r.category] = { income: 0, expense: 0 };
            catMap[r.category].income += Number(r.income || 0);
            catMap[r.category].expense += Number(r.expense || 0);
          });
          res.data.cashSummary = {
            totalIncome: cashRes.data.totalIncome || 0,
            totalExpense: cashRes.data.totalExpense || 0,
            balance: cashRes.data.balance || 0,
            categories: catMap
          };
        }
      } catch (err2) { /* ignore fallback */ }
    }
  } catch (err) {
    console.error("getDashboardData Error:", err);
  } finally {
    if (!silent) window.toggleLoading(false);
  }

  if (!res || !res.success) {
    container.innerHTML = `<div style="color: #f87171; font-size: 0.8rem; padding: 1rem; background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.2); border-radius: 0.75rem; text-align: center;">${window.escapeHtml(res ? res.message : "ဒေတာရယူ၍ မရပါ။")}</div>`;
    return;
  }

  window._dashDataCache = res.data;
  const currentTab = window._dashTab || "yogi";

  container.innerHTML = `
    <div class="space-y-6 view-panel">
      
      <!-- 💡 ၁။ ထိပ်ဆုံးမှာ Box (၄) ခု ထားရှိခြင်း -->
      <div id="dash-kpi-container">
        ${renderTopKpiCards(currentTab, res.data)}
      </div>

      <!-- 💡 ၂။ Tab (၂) ခုကို Box (၄) ခု၏ အောက်တည့်တည့်သို့ ရွှေ့ပြောင်းထားခြင်း -->
      <div style="display: flex; gap: 0.5rem; background: #0c1220; padding: 0.4rem; border-radius: 1rem; border: 1px solid rgba(245, 158, 11, 0.25); width: fit-content;">
        <button onclick="switchDashboardTab('yogi')" 
          style="padding: 0.55rem 1.25rem; font-size: 0.8rem; font-weight: 900; border-radius: 0.75rem; cursor: pointer; transition: all 0.2s; border: none; display: flex; align-items: center; gap: 0.5rem; ${currentTab === 'yogi' ? 'background: linear-gradient(90deg, #f59e0b, #d97706); color: #090d16; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.35);' : 'background: transparent; color: #94a3b8;'}">
          <i class="fa-solid fa-users"></i>
          <span>ယောဂီ စာရင်း</span>
        </button>

        <button onclick="switchDashboardTab('cash')" 
          style="padding: 0.55rem 1.25rem; font-size: 0.8rem; font-weight: 900; border-radius: 0.75rem; cursor: pointer; transition: all 0.2s; border: none; display: flex; align-items: center; gap: 0.5rem; ${currentTab === 'cash' ? 'background: linear-gradient(90deg, #f59e0b, #d97706); color: #090d16; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.35);' : 'background: transparent; color: #94a3b8;'}">
          <i class="fa-solid fa-wallet"></i>
          <span>ငွေစာရင်း</span>
        </button>
      </div>

      <!-- ၃။ အောက်ဘက် 2-Column Grid: ဘယ်ဘက် (စာအုပ်ပုံ + Mindfulness) | ညာဘက် (ဇယား) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem; width: 100%; align-items: stretch;">
        
        <!-- ဘယ်ဘက်: Mindfulness Reminder with Book Cover -->
        <div style="display: flex; flex-direction: column; gap: 0.5rem; height: 100%;">
          <h3 style="margin: 0; font-size: 0.75rem; font-weight: 900; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.4rem;">
            <i class="fa-solid fa-dharmachakra"></i>
            <span>MINDFULNESS & DHAMMA BOOK</span>
          </h3>
          <div style="flex: 1;">
            ${getMindfulnessWithBookHtml()}
          </div>
        </div>

        <!-- ညာဘက်: Table (Yogi Breakdown vs Cash Statement) -->
        <div id="dash-table-container" style="flex: 1;">
          ${renderRightTable(currentTab, res.data)}
        </div>

      </div>
    </div>
  `;
};

/**
 * Tab ပြောင်းသည့် Function
 */
window.switchDashboardTab = function (tabName) {
  window._dashTab = tabName;
  if (!window._dashDataCache) {
    window.renderDashboard();
    return;
  }

  const kpiContainer = document.getElementById("dash-kpi-container");
  const tableContainer = document.getElementById("dash-table-container");

  if (kpiContainer) kpiContainer.innerHTML = renderTopKpiCards(tabName, window._dashDataCache);
  if (tableContainer) tableContainer.innerHTML = renderRightTable(tabName, window._dashDataCache);

  window.renderDashboard(true);
};

/**
 * စာအုပ်မျက်နှာဖုံးပုံ အကြီးချဲ့ကြည့်ရှုသည့် Modal Lightbox
 */
window.openBookModal = function () {
  const modalHtml = `
    <div id="book-modal-overlay" class="modal-overlay-bg" onclick="closeBookModal()" style="cursor: zoom-out;">
      <div style="position: relative; max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; align-items: center;" onclick="event.stopPropagation()">
        <button onclick="closeBookModal()" style="position: absolute; top: -40px; right: 0; background: none; border: none; color: #ffffff; font-size: 1.5rem; cursor: pointer;">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <img src="images/book-cover.jpg" 
          onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'"
          style="max-width: 100%; max-height: 80vh; border-radius: 1rem; border: 3px solid #f59e0b; box-shadow: 0 10px 40px rgba(0,0,0,0.9);">
        <p style="margin: 0.85rem 0 0 0; color: #fef08a; font-weight: 800; font-size: 0.9rem; text-align: center;">
          ပဋ္ဌာန်းအခြေခံ၍ သံသရာပြတ် ဝိပဿနာအားထုတ်နည်း
        </p>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHtml);
};

window.closeBookModal = function () {
  const m = document.getElementById("book-modal-overlay");
  if (m) m.remove();
};
