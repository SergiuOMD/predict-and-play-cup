# ORBICO MOLDOVA World Cup 2026 — Totalizator

## Instalare (obligatoriu după `git pull`)

```bash
npm install --legacy-peer-deps
```

> **Dacă build-ul dă eroare `Cannot find package 'vite-plugin-pwa'`** — rulează comanda de mai sus. Pachetul e în `devDependencies`; fără `npm install` nu există în `node_modules`.

## Development

```bash
npm run dev
```

App-ul rulează pe http://localhost:5173

### Acces din rețeaua locală (telefon, alt laptop)

Pe același Wi‑Fi, ca colegii să deschidă app-ul de pe PC-ul tău:

```bash
npm run dev:lan
```

În terminal apare adresa **Network**, de ex. `http://192.168.1.42:5173` — deschide-o de pe telefon.

- PC-ul și telefonul trebuie să fie în **aceeași rețea**
- Dacă nu merge, permite portul **5173** în firewall (Windows Defender)
- Pentru build de producție local: `npm run build` apoi `npm run preview:lan`

## Build

```bash
npm run build
npm run preview
```

## Env

Copiază `.env.example` → `.env` și completează valorile Supabase.

Setup Supabase: `docs/supabase-setup.md`  
PWA & mobile: `docs/pwa-mobile.md`
