# K & M — Einwegkamera 📷

Einweg-Kamera-App für die Hochzeit von **Kaycee & Mustafa, 02.09.2026**.
Gäste scannen einen QR-Code, geben ein Passwort + Namen ein und haben **36 Aufnahmen**.
Jedes Foto bekommt direkt im Browser einen **Vintage-Filter** + eingebrannten Datumsstempel.
Nach der Hochzeit werden alle Bilder freigeschaltet — sortiert in **Ordner pro Gast**.

Vibe: Scene Disposable, nur selbst gehostet und ohne Account-Zwang.

---

## Stack

Vue 3 (`<script setup>`) · Vite · Pinia · Vue Router · Canvas-Filter (kein Server-Processing) · optional Supabase.

## Sofort starten (Lokaler Modus)

```bash
npm install
npm run dev
```

Läuft ohne Backend. Fotos landen in **IndexedDB** auf deinem Gerät — perfekt zum Ausprobieren des kompletten Flows (Kamera → Filter → Rolle → Galerie).
Standard-Passwort im lokalen Modus: **`liebe2026`** (in `src/config.js`).

> Kamera braucht `localhost` oder `https`. `npm run dev` läuft auf localhost → passt.
> Am Handy testen: `npm run dev -- --host`, dann braucht's https (z.B. via `vite-plugin-mkcert` oder ngrok).

## Routen

| Pfad | Zweck |
|------|-------|
| `/#/` | Gate: Passwort + Name |
| `/#/shoot` | Kamera mit Auslöser + Bildzähler |
| `/#/roll` | Eigene Filmrolle (siehst du sofort) |
| `/#/gallery` | Alben pro Gast — vorher gesperrte Kacheln (Cover verschwommen + Öffnungszeit), ab Reveal volle Ordner |
| `/#/games` | Spiele-Sektion (erweiterbar) |
| `/#/games/vote` | „Bestes Bild" — 3 Stimmen pro Gast, ab Reveal |
| `/#/host` | **QR-Code generieren** für die Tischkarten |

Galerie und Spiele öffnen automatisch um **00:00 am 3.9.** (`EVENT.revealAt`).

## Anpassen

Alles Wichtige in **`src/config.js`**: Brautpaar, Hochzeitsdatum, `revealAt` (wann die Galerie öffnet), `maxShots`, lokales Passwort.

Den Filter tunst du in **`src/lib/vintage.js`** — Warmth, Korn, Vignette, Light-Leak, Stempel sind einzeln einstellbar.

**Hintergrundbild:** aktuell liegt eine gemalte Herbst-Garten-SVG unter `public/background.svg` als Platzhalter. Für das echte Foto vom Grünen Lusthaus einfach `public/background.jpg` ablegen — die App nimmt automatisch das JPG, sonst die SVG. Die Beige-Schicht darüber stellst du in `src/styles/main.css` (`body { background: linear-gradient(...) }`) heller/dunkler.

**Foto-Qualität & Spiele:** Auflösung (`captureWidth`), JPEG-Qualität (`jpegQuality`) und Stimmen pro Gast (`votesPerGuest`) sitzen ebenfalls in `src/config.js`. Neue Spiele hängst du an das `GAMES`-Array an.

---

## Echtes Event: Supabase (zentral)

Im lokalen Modus sieht jedes Handy nur seine eigenen Fotos. Für die echte Hochzeit brauchst du ein Backend, damit alles zusammenläuft.

1. Projekt auf [supabase.com](https://supabase.com) anlegen.
2. `supabase-schema.sql` im **SQL-Editor** ausführen. **Wichtig:** unten im Script das echte Passwort eintragen (die `crypt('liebe2026', …)` Zeile).
3. `.env` anlegen (`cp .env.example .env`) und ausfüllen:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_EVENT_ID=kaycee-mustafa
```

4. `npm run dev` — die App schaltet automatisch in den Supabase-Modus (Anzeige unter `/#/host`).

### Deploy (Vercel)

```bash
npm run build   # -> dist/
```

Auf Vercel pushen, die zwei `VITE_…` Env-Vars setzen, fertig. Die fertige URL gibst du unter `/#/host` ein → QR drucken → auf die Tische.

---

## Threat Model (kurz & ehrlich)

Das ist eine private Wedding-App, kein Bank-Login. Bewusste Tradeoffs:

- **Passwort** wird serverseitig per `pgcrypto crypt()` (bcrypt) geprüft, der Hash verlässt nie die DB. Der `verify_event_password`-RPC gibt nur `true/false` zurück.
- **Anon-Insert** für `guests`/`photos` ist offen — wer den `anon_key` + Passwort hat, kann hochladen. Für ein geteiltes Wedding-Event okay; gegen gezielten Spam müsstest du ein Edge-Function-Token oder Turnstile davorhängen.
- **Reveal-Gate** für die Galerie ist per **RLS** erzwungen (`now() >= reveal_at`), nicht nur im UI — vor dem Stichtag liefert die DB fremde Fotos gar nicht aus.
- Die eigene Rolle vor dem Reveal vertraut der `guest_id` im Client. Wer raten/manipulieren will, käme an einzelne eigene-Ordner-Bilder, aber nicht an die volle Galerie.
- Storage-Bucket ist **public-read** (einfache Bild-URLs). Willst du das dichter, auf private umstellen + signed URLs in `storage.js`.

Härter machen, wenn dir danach ist: Edge Function fürs Join (gibt ein JWT zurück), RLS an `auth.uid()` koppeln, Rate-Limit auf Uploads, Bucket privat + signed URLs.

---

## Struktur

```
src/
  config.js            Event-Settings (eine Datei für alles)
  lib/
    vintage.js         der Filter (Canvas)
    storage.js         Adapter: lokal ODER supabase
    db.js              IndexedDB (lokaler Modus)
    supabase.js        Client
  composables/useCamera.js
  stores/session.js    Gast + verbleibende Shots
  components/          ShotCounter, FilmFrame, AppNav
  views/               Gate, Shoot, Roll, Gallery, Host
```

Viel Spaß auf der Hochzeit. 🥂
