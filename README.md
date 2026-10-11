📖 Yogi & Cashbook Management System (စနစ်လမ်းညွှန် အကျဉ်းချုပ်)

🌐 တိုက်ရိုက် ဝင်ရောက်နိုင်သော လင့်ခ်များ (Live Links)
📱 လူသုံးမည့် App ပင်မလင့်ခ် (Frontend Web App):
👉 https://zoomfamily.pathana.workers.dev

(ယောဂီစာရင်း၊ ဦးဆောင်ယောဂီ၊ ပင်မ Dashboard နှင့် ငွေစာရင်း အားလုံးကို တိုက်ရိုက် အသုံးပြုနိုင်သော လင့်ခ်)
⚙️ Backend API Link (Cloudflare Worker):
👉 https://yogi-list.pathana.workers.dev
(Database နှင့် ချိတ်ဆက်ပေးသော REST API စက်ရုပ်လင့်ခ်)
🐙 GitHub Source Code Repository:
👉 https://github.com/Non005/CASHBOOK

📁 ဖိုင်ဖွဲ့စည်းပုံ အပြည့်အစုံ (Project Structure)
code
Text
CASHBOOK/
├── cashbook-api/                      # Cloudflare Worker API (Backend)
│   ├── handlers-dashboard.js          # Dashboard & စာရင်းချုပ် API
│   ├── handlers-yogi.js               # ကမ္မဋ္ဌာန်း အဆင့် ၁ မှ ၈ ယောဂီ API
│   ├── handlers-ledger.js             # ဦးဆောင်ဆွေးနွေး ယောဂီ API
│   ├── handlers-cashbook.js           # 💡 ငွေစာရင်း (ဝင်ငွေ/ထွက်ငွေ/လက်ကျန်) API
│   ├── worker.js                      # Main Worker API Router & Auth Engine
│   └── wrangler.toml                  # Cloudflare D1 Binding Configuration
│
├── cashbook-frontend/                 # PWA Web App (Frontend)
│   ├── css/
│   │   ├── style.css                  # Custom Dark-Amber Theme CSS
│   │   └── fontawesome.min.css        # FontAwesome Icons
│   ├── images/
│   │   └── book-cover.jpg             # 💡 ပဋ္ဌာန်းလမ်းညွှန် တရားစာအုပ် မျက်နှာဖုံးပုံ
│   ├── js/
│   │   ├── config.js                  # Global Config & API URL Endpoint
│   │   ├── api.js                     # API Fetch Bridge & Toast System
│   │   ├── auth.js                    # Login & Session Management
│   │   ├── dashboard.js               # ပင်မ Dashboard (Box ၄ ခု၊ Tab ၂ ခု၊ စာအုပ်ပုံ Lightbox)
│   │   ├── yogi.js                    # အဆင့်အလိုက် ယောဂီစာရင်း & Post (တိုက်ရိုက်ရွှေ့ပြောင်းစနစ်)
│   │   ├── yogi-summary.js            # ၇ ကော်လံ မက်ထရစ် ယောဂီစာရင်းချုပ်
│   │   ├── leaders.js                 # ဦးဆောင်ဆွေးနွေး ယောဂီစာရင်း
│   │   ├── cashbook.js                # 💡 ငွေစာရင်း ဇယား၊ Live Search၊ ရက်စွဲစစ်ထုတ် & Modal Form
│   │   └── app.js                     # Main Sidebar & Navigation Router
│   ├── views/
│   │   ├── dashboard.html             # Dashboard View Template
│   │   ├── yogi.html                  # Yogi View Template
│   │   ├── leaders.html               # Leaders View Template
│   │   └── cashbook.html              # 💡 Cashbook View Template
│   ├── index.html                     # Single Page App Shell & Login Box
│   ├── manifest.json                  # PWA Web App Manifest
│   └── sw.js                          # Service Worker (PWA Offline Cache)
│
└── README.md

🚀 Deploy ပြုလုပ်နည်း (၃ အဆင့်)
Backend (D1 Database & Worker):
Cloudflare D1 တွင် yogi database တည်ဆောက်ပြီး Tables များ Run ပါ:
users (အကောင့်များ)
yogis (ယောဂီစာရင်းများ)
leaders (ဦးဆောင်ယောဂီများ)
cashbook (ငွေစာရင်းများ)
Worker Settings > Bindings တွင် Variable Name ကို DB ဖြင့် Database yogi အား ချိတ်ဆက်ပါ။
npx wrangler deploy (သို့မဟုတ် GitHub CI/CD Auto-Deploy) ဖြင့် တင်ပါ။
API URL ချိတ်ဆက်ခြင်း (js/config.js):
js/config.js ထဲရှိ getApiUrl() တွင် Worker Endpoint အသစ်ကို ချိန်ညှိပါ:
code
JavaScript
return "https://yogi-list.pathana.workers.dev";
Frontend တင်ခြင်း:
GitHub Pages သို့မဟုတ် Cloudflare Pages တွင် cashbook-frontend folder ကို တင်လိုက်သည်နှင့် အသင့် အသုံးပြုနိုင်ပါသည်။

✨ အဓိက လုပ်ဆောင်ချက်များ (Key Features)
🔐 Auto-Login & Multi-User စနစ်:
အကောင့် (၂) ခုတည်းသာ ကန့်သတ်ထားရှိခြင်း: Admin နှင့် ဓမ္မဝန်ဆောင်
Password အားလုံး: 123456
တစ်ခါဝင်ထားရုံဖြင့် ဖုန်း/ကွန်ပျူတာတွင် ၁ နှစ် (၃၆၅ ရက်) တိတိ Auto-Login ဖြစ်နေခြင်း။
အကောင့်တစ်ခုတည်းကို လူအယောက် ၁၀၀ မက တစ်ပြိုင်နက် ဝင်ရောက်သုံးစွဲနိုင်ပြီး လုံးဝ Session မထပ်/Error မဖြစ်ခြင်း။

📊 ပင်မစာမျက်နှာ Dashboard အဆင့်မြှင့်တင်မှု:
ထိပ်ဆုံးတွင် Box (၄) ခု: စာရင်းအလိုက် ချက်ချင်း ပြောင်းလဲပြသခြင်း။
Tab (၂) ခု: [ ယောဂီ စာရင်း ] နှင့် [ ငွေစာရင်း ] ခလုတ်များဖြင့် တစ်ချက်နှိပ်ရုံဖြင့် အသွင်ပြောင်းကြည့်ရှုနိုင်ခြင်း။
တရားစာအုပ် မျက်နှာဖုံး & သတိပေးနှိုးဆော်ချက်: ပဋ္ဌာန်းတရားစာအုပ်မျက်နှာဖုံးပုံပါရှိပြီး နှိပ်ပါက မျက်နှာပြင်အပြည့် (Lightbox) အဖြစ် ချဲ့ကြည့်နိုင်ခြင်း။
ငွေစာရင်း အကျဉ်းချုပ် ဇယား: ဝင်ငွေ (အလှူငွေ၊ စာအုပ်ရောင်းရငွေ၊ ဘဏ်တိုး)၊ ထွက်ငွေ (ပုံနှိပ်တိုက်၊ တရားစခန်း၊ အထွေထွေ) နှင့် အောက်ဆုံးတွင် လက်ကျန်ငွေ (Net Balance) ကို စနစ်တကျ အလိုအလျောက် တွက်ချက်ပြသခြင်း။

💰 ငွေစာရင်း (Cashbook) စနစ်:
Left Sidebar ထိပ်ဆုံးတွင် "ငွေစာရင်း ကဏ္ဍ" သီးသန့် ခေါင်းစဉ်ဖြင့် တပ်ဆင်ထားခြင်း။
ဇယားကော်လံများ: စဉ် | ရက်စွဲ | ခေါင်းစဉ် | အကြောင်းအရာ | ဝင်ငွေ | ထွက်ငွေ | လက်ကျန် | ဦးဆောင်သူ | ACTION
အသစ်သွင်းရာတွင် ခေါင်းစဉ်ရွေးလိုက်သည်နှင့် ဝင်ငွေ သို့မဟုတ် ထွက်ငွေ အလိုအလျောက် ခွဲခြားသတ်မှတ်ပေးခြင်း။
အကြောင်းအရာ (Description) ကို ၂ တန်းရိုက်နိုင်ပြီး အောက်သို့ စိတ်ကြိုက်ဆွဲချဲ့နိုင်သည့် Expandable Textarea ပါရှိခြင်း။
လိုင်းမကောင်းချိန် ထပ်ခါထပ်ခါ မနှိပ်မိစေရန် Double-click Lock စနစ် ပါရှိခြင်း။

Live Search (ရိုက်လိုက်သည်နှင့် တန်းရှာပေးခြင်း)၊ ရက်စွဲ (From / To) စစ်ထုတ်ခြင်းနှင့် Excel Export ဒေါင်းလုဒ် ရယူနိုင်ခြင်း။
🧘‍♂️ ကမ္မဋ္ဌာန်း အဆင့် ၁ မှ ၇ + စာရင်းဟောင်း (အဆင့် ၈):
Post (တိုက်ရိုက် အဆင့်ပြောင်းစနစ်): လေယာဉ်ပျံ/ထီးခလုတ်ကို နှိပ်ပါက လက်ရှိအဆင့်မှ ချက်ချင်းပျောက်သွားပြီး နောက်အဆင့် (အဆင့် ၇ ပြီးပါက အဆင့် ၈ စာရင်းဟောင်း) သို့ တိုက်ရိုက် Move ဖြစ်သွားခြင်း။
ယောဂီ စာရင်းသွင်း/ပြင်ဆင်/ဖျက်ပစ်ခြင်း၊ အသက်၊ အလုပ်အကိုင်၊ ဖုန်း ၂ လိုင်း၊ မိတ်ဆက်ယောဂီ၊ Active/Inactive Toggle ပြုလုပ်နိုင်ခြင်း။

Excel Import (အစုလိုက် စာရင်းသွင်းခြင်း) နှင့် Excel Export ထုတ်ယူနိုင်ခြင်း။
📑 ၇ ကော်လံ စာရင်းချုပ် & ဦးဆောင်ယောဂီများ:
အဆင့် ၁ မှ ၇ အထိ Active ဖြစ်နေသော ယောဂီများအားလုံးကို Matrix Table ဖြင့် တစ်ပြိုင်နက် ခြုံငုံကြည့်ရှုနိုင်ခြင်း။
ဦးဆောင်ဆွေးနွေး ယောဂီများ သီးသန့် စာရင်းစီမံခန့်ခွဲနိုင်ခြင်း။

📲 PWA Mobile App Support:
Android / iOS ဖုန်းများတွင် Browser မလိုဘဲ ဖုန်း Screen ပေါ်တွင် App အစစ်အတိုင်း Icon သွင်းယူအသုံးပြုနိုင်ခြင်း။
