[README.md](https://github.com/user-attachments/files/29609670/README.md)
# 📷 Unseen — Hochzeits-Kamera-App

> *Echte Momente. Ungestellt. Entwickelt nach der Feier.*

Unseen ist eine Web-App die das Feeling einer Einwegkamera auf die Hochzeit bringt. Gäste scannen einen QR-Code, bekommen eine begrenzte Anzahl Aufnahmen mit Vintage-Filter — und nach der Hochzeit werden alle Bilder gleichzeitig enthüllt.

---

## ✨ Features

### Für Gäste
- 📱 Kein App-Download nötig — läuft direkt im Browser
- 🔒 Zugang via QR-Code + Hochzeits-Passwort
- 📸 16–36 Aufnahmen pro Gast (wie eine echte Einwegkamera)
- 🎞️ Echtzeit-Filter: Vintage, Schwarz-Weiß, Fade
- 🗂️ Eigenes Album sofort einsehbar
- 🗳️ Voting für das beste Bild (nach der Hochzeit)

### Für Admins
- 🎛️ Multi-Hochzeits-Plattform — unbegrenzte Hochzeiten verwalten
- ⚙️ Vollständiges Setup: Fotozahl, Filter, Farbschema, Zeitfenster
- 🔗 Automatischer QR-Code & direkter Link pro Hochzeit
- 📊 Dashboard mit Gäste- und Foto-Statistiken
- 🎨 5 Farbschemata (Herbst, Elegant, Romantik, Modern, Sommer)

---

## 🛠️ Tech Stack

| Bereich | Technologie |
|---|---|
| Frontend | Vue 3, Vite, Pinia, Vue Router |
| Backend | Supabase (PostgreSQL, RLS, RPCs) |
| Storage | Supabase Storage |
| Deployment | Netlify |
| Filter | Canvas API (clientseitig) |

---

## 🚀 Setup

### 1. Repository klonen

```bash
git clone https://github.com/Simsekm01/Unseen.git
cd Unseen
npm install
```

### 2. Supabase einrichten

1. Neues Projekt auf [supabase.com](https://supabase.com) anlegen
2. `supabase-schema.sql` im **SQL Editor** ausführen
3. Unter **Project Settings → API** die Keys kopieren

### 3. Umgebungsvariablen

`.env` Datei im Root anlegen:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 4. Lokal starten

```bash
npm run dev
```

### 5. Deployen

```bash
npm run build
# dist/ Ordner auf Netlify ziehen
```

---

## 📁 Projektstruktur

```
src/
├── config.js              # Event-Konfiguration
├── lib/
│   ├── storage.js         # Adapter: lokal ↔ Supabase
│   ├── db.js              # IndexedDB (lokaler Modus)
│   ├── supabase.js        # Supabase Client
│   ├── filters.js         # Vintage / S&W / Fade Filter
│   └── colorSchemes.js    # Farbschemata
├── stores/
│   ├── admin.js           # Admin Session
│   └── session.js         # Gast Session
├── composables/
│   └── useCamera.js       # Kamera + Zoom
├── components/            # FilmFrame, ShotCounter, AppNav
└── views/
    ├── admin/             # Login, Dashboard, NewWedding
    ├── GateView.vue       # Gast-Login
    ├── ShootView.vue      # Kamera
    ├── RollView.vue       # Eigenes Album
    ├── GalleryView.vue    # Alle Alben
    └── VotingView.vue     # Abstimmung
```

---

## 🗄️ Supabase Schema

### Wichtig: pgcrypto aktivieren

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;
```

### Passwort zurücksetzen

```sql
-- Admin Passwort
UPDATE public.admins
SET password_hash = extensions.crypt('neuespasswort', extensions.gen_salt('bf'))
WHERE username = 'dein-username';

-- Hochzeits-Passwort
UPDATE public.weddings
SET password_hash = extensions.crypt('neuespasswort', extensions.gen_salt('bf'))
WHERE slug = 'dein-slug';
```

### Policies neu setzen (falls Fehler)

```sql
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname
           FROM pg_policies
           WHERE schemaname IN ('public', 'storage')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                   r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;
```

---

## 🌐 Deployment auf Netlify

`netlify.toml` im Root (für SPA Routing):

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Environment Variables in Netlify setzen:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 🔒 Sicherheit

- Passwörter werden mit **bcrypt** gehasht (pgcrypto)
- Passwörter verlassen nie die Datenbank (serverseitige RPCs)
- RLS auf allen Tabellen
- Galerie & Voting gesperrt bis `reveal_at`
- Fotos nur nach Freischaltung sichtbar

---

## 📸 Filter

| Filter | Beschreibung |
|---|---|
| **Vintage** | Warmgrading, Filmkorn, Light-Leak, Datumsstempel |
| **Schwarz-Weiß** | Luminanz-basiert, hoher Kontrast, starkes Korn |
| **Fade** | Angehobene Schwarzwerte, entsättigt, flacher Look |

---

## 🗳️ Voting

- Öffnet automatisch nach `reveal_at`
- Jeder Gast hat 3 Stimmen
- Ergebnisse nach Abstimmung sichtbar
- Kann pro Hochzeit aktiviert/deaktiviert werden

---

## 👨‍💻 Entwickelt von

**Simsekm01** — [github.com/Simsekm01](https://github.com/Simsekm01)

---

*Unseen — Deine Hochzeit. Echte Momente. Entwickelt nach der Feier.*
