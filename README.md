# 📷 Unseen — Wedding Camera App

> *Real moments. Unposed. Revealed after the celebration.*

Unseen brings the disposable camera experience to weddings. Guests scan a QR code, get a limited number of shots with vintage filters — and after the wedding all photos are revealed at once.

---

## ✨ Features

**For Guests**
- No app download needed — runs in the browser
- Access via QR code + wedding password
- 16–36 shots per guest with real-time filters
- Personal album viewable immediately
- Vote for the best photo after the wedding

**For Admins**
- Manage multiple weddings from one dashboard
- Customize filters, color scheme, shot limit & time windows
- Auto-generated QR code & direct link per wedding
- Guest & photo statistics

---

## 🛠️ Tech Stack

| | |
|---|---|
| Frontend | Vue 3, Vite, Pinia, Vue Router |
| Backend | Supabase (PostgreSQL, RLS, Storage) |
| Filters | Canvas API (client-side) |
| Hosting | Netlify |

---

## 🚀 Getting Started

```bash
git clone https://github.com/Simsekm01/Unseen.git
cd Unseen
npm install
```

Create a `.env` file:
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

```bash
npm run dev      # development
npm run build    # production
```

Deploy by dropping the `dist/` folder on [Netlify](https://netlify.com).

---

## 🎞️ Filters

| Filter | Description |
|---|---|
| Vintage | Warm tones, film grain, light leak, date stamp |
| Black & White | High contrast, luminance-based, heavy grain |
| Fade | Lifted blacks, desaturated, flat film look |

---

## 🔒 Security

Passwords are hashed with **bcrypt** via pgcrypto and never leave the database. Gallery and voting are locked until the reveal date via Supabase RLS.

---

*Unseen — Your wedding. Real moments. Revealed after the celebration.*
