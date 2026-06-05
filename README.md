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

## Build

```bash
npm run build
npm run preview
```

## Env

Copiază `.env.example` → `.env` și completează valorile Supabase.

Setup Supabase: `docs/supabase-setup.md`  
PWA & mobile: `docs/pwa-mobile.md`
