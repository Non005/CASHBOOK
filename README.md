# ☸️ Yogi & Cashbook Management System
> **Zoom ပဋ္ဌာန်းမိသားစု — ယောဂီများနှင့် ငွေစာရင်း စီမံခန့်ခွဲမှုစနစ်**

---

## 🌐 တိုက်ရိုက် ဝင်ရောက်နိုင်သော လင့်ခ်များ (Live Links)

| ကဏ္ဍ | လိပ်စာ (URL) | ဖော်ပြချက် |
| :--- | :--- | :--- |
| 📱 **App ပင်မလင့်ခ် (Frontend)** | [zoomfamily.pathana.workers.dev](https://zoomfamily.pathana.workers.dev) | ယောဂီ၊ ဦးဆောင်ယောဂီ၊ ငွေစာရင်း အားလုံးသုံးရန် |
| ⚙️ **Backend API (Worker)** | [yogi-list.pathana.workers.dev](https://yogi-list.pathana.workers.dev) | Cloudflare Worker & D1 Database API |
| 🐙 **Source Code Repo** | [Non005/CASHBOOK](https://github.com/Non005/CASHBOOK) | GitHub Repository |

---

## 📁 ဖိုင်ဖွဲ့စည်းပုံ အပြည့်အစုံ (Project Structure)

```text
CASHBOOK/
├── cashbook-api/                      # Cloudflare Worker API (Backend)
│   ├── handlers-dashboard.js          # Dashboard & စာရင်းချုပ် API
│   ├── handlers-yogi.js               # ကမ္မဋ္ဌာန်း ယောဂီစာရင်း API
│   ├── handlers-ledger.js             # ဦးဆောင်ဆွေးနွေး ယောဂီ API
│   ├── handlers-cashbook.js           # ငွေစာရင်း (ဝင်ငွေ/ထွက်ငွေ/လက်ကျန်) API
│   ├── worker.js                      # Main Worker API Router & Auth Engine
│   └── wrangler.toml                  # Cloudflare D1 Binding Configuration
│
└── cashbook-frontend/                 # PWA Web App (Frontend)
    ├── css/
    │   ├── style.css                  # Custom Dark-Amber Theme CSS
    │   └── fontawesome.min.css        # FontAwesome Icons
    ├── images/
    │   └── book-cover.jpg             # ပဋ္ဌာန်းလမ်းညွှန် တရားစာအုပ် မျက်နှာဖုံးပုံ
    ├── js/
    │   ├── config.js                  # Global Config & API URL Endpoint
    │   ├── api.js                     # API Fetch Bridge & Toast System
    │   ├── auth.js                    # Login & Session Management
    │   ├── dashboard.js               # Dashboard (Box ၄ ခု၊ Tab ၂ ခု၊ စာအုပ်ပုံ Lightbox)
    │   ├── yogi.js                    # ယောဂီစာရင်း & Post (တိုက်ရိုက်အဆင့်ပြောင်းစနစ်)
    │   ├── yogi-summary.js            # ၇ ကော်လံ မက်ထရစ် ယောဂီစာရင်းချုပ်
    │   ├── leaders.js                 # ဦးဆောင်ဆွေးနွေး ယောဂီစာရင်း
    │   ├── cashbook.js                # ငွေစာရင်း (Live Search၊ ရက်စွဲစစ်ထုတ် & Modal)
    │   └── app.js                     # Main Sidebar & Navigation Router
    ├── views/                         # View Templates
    ├── index.html                     # Single Page App Shell & Login Box
    ├── manifest.json                  # PWA Web App Manifest
    └── sw.js                          # Service Worker (PWA Offline Cache)

🔐 Login အချက်အလက်များ
Select Role / User: Admin (သို့မဟုတ်) ဓမ္မဝန်ဆောင်
Password: 123456
Auto-Login: ဖုန်း/ကွန်ပျူတာတွင် တစ်ခါဝင်ထားရုံဖြင့် ၁ နှစ် (၃၆၅ ရက်) တိတိ Auto-Login ဖြစ်နေမည်။
Multi-User Concurrency: အကောင့်တစ်ခုတည်းကို လူအယောက် ၁၀၀ မက တစ်ပြိုင်နက် သုံးနိုင်ပါသည်။
✨ အဓိက လုပ်ဆောင်ချက်များ (Key Features)

၁။ ပင်မ Dashboard
ထိပ်ဆုံးတွင် Box (၄) ခု: ရွေးချယ်ထားသော စာရင်းအလိုက် အလိုအလျောက် ပြောင်းလဲပြသခြင်း။
Tab (၂) ခု: [ ယောဂီ စာရင်း ] နှင့် [ ငွေစာရင်း ] ခလုတ်များဖြင့် စာရင်းအသွင် ချက်ချင်း ပြောင်းလဲကြည့်ရှုနိုင်ခြင်း။
တရားစာအုပ် မိတ်ဆက် & သတိပေးစကား: ပဋ္ဌာန်းတရားစာအုပ် မျက်နှာဖုံးပုံပါရှိပြီး နှိပ်ပါက Full Lightbox ဖြင့် အကြီးချဲ့ကြည့်ရှုနိုင်ခြင်း။
ငွေစာရင်း အကျဉ်းချုပ် ဇယား:
ဝင်ငွေ: အလှူငွေ ၊ စာအုပ်ရောင်းရငွေ ၊ ဘဏ်တိုး
ထွက်ငွေ: ပုံနှိပ်တိုက် ထုတ်ပေးငွေ ၊ တရားစခန်း အလှူငွေ ၊ အထွေထွေ အသုံးစရိတ်
လက်ကျန်ငွေ: စုစုပေါင်း အသားတင် လက်ကျန်ငွေ (Net Balance) အလိုအလျောက် တွက်ချက်ခြင်း။

၂။ ငွေစာရင်း (Cashbook) စနစ်
Sidebar ထိပ်ဆုံးတွင် တည်ရှိခြင်း: ပင်မစာမျက်နှာ အောက်တွင် "ငွေစာရင်း ကဏ္ဍ" သီးသန့် ပါရှိခြင်း။
အလိုအလျောက် ခွဲခြားခြင်း: ခေါင်းစဉ်ရွေးလိုက်သည်နှင့် ဝင်ငွေ (သို့မဟုတ်) ထွက်ငွေ အလိုအလျောက် သတ်မှတ်ပေးခြင်း။
၂ တန်းချဲ့ Textarea: အကြောင်းအရာကို စိတ်ကြိုက် အောက်သို့ ဆွဲချဲ့ ရိုက်နိုင်ခြင်း။
Live Search & Filter: စာရိုက်လိုက်သည်နှင့် တန်းရှာပေးခြင်း၊ ရက်စွဲ (From/To) စစ်ထုတ်ခြင်းနှင့် Excel Export ဒေါင်းလုဒ် ရယူနိုင်ခြင်း။
Double-Click Lock: လိုင်းမကောင်းချိန်တွင် ခလုတ်ကို ထပ်ခါထပ်ခါ မနှိပ်မိစေရန် အလိုအလျောက် ပိတ်ထားပေးခြင်း။

၃။ ကမ္မဋ္ဌာန်း ယောဂီ စီမံခန့်ခွဲမှု (အဆင့် ၁ မှ ၇ + အဆင့် ၈ စာရင်းဟောင်း)
တိုက်ရိုက် အဆင့်ပြောင်း (Post စနစ်): Post (လေယာဉ်ပျံ/ထီး) ခလုတ် နှိပ်ပါက လက်ရှိအဆင့်မှ ချက်ချင်း ပျောက်သွားပြီး နောက်အဆင့်သို့ တိုက်ရိုက် Move ဖြစ်သွားခြင်း။
အချက်အလက် စုံလင်မှု: အမည်၊ ကျား/မ၊ အသက်၊ အလုပ်အကိုင်၊ ဖုန်း ၂ လိုင်း၊ နေရပ်လိပ်စာ၊ မိတ်ဆက်ယောဂီ စသည်တို့ ပါဝင်ခြင်း။
Excel အစုလိုက် သွင်း/ထုတ်ယူခြင်း: Excel Import နှင့် Excel Export စနစ် အပြည့်အစုံ ပါရှိခြင်း။

၄။ ၇ ကော်လံ မက်ထရစ် စာရင်းချုပ် & ဦးဆောင်ယောဂီများ
အဆင့် ၁ မှ ၇ အထိ Active ဖြစ်နေသော ယောဂီများအားလုံးကို Matrix Table ဖြင့် တစ်ပြိုင်နက် ခြုံငုံကြည့်ရှုနိုင်ခြင်း။
ဦးဆောင်ဆွေးနွေး ယောဂီများကို သီးသန့် မှတ်တမ်းတင် စီမံခန့်ခွဲနိုင်ခြင်း။

၅။ PWA Mobile App ပံ့ပိုးမှု
Android / iOS ဖုန်းများတွင် Browser ဖွင့်စရာမလိုဘဲ ဖုန်း Screen ပေါ်တွင် App အစစ်အတိုင်း Install သွင်းယူ အသုံးပြုနိုင်ခြင်း။
