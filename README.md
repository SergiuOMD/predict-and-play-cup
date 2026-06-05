# OMD World Cup 2026 Totalizator

Aplicație web de tip office pool pentru predicții de scoruri la FIFA World Cup 2026. Colegii din companie pronostichează 3 scoruri per meci, acumulează puncte și urmăresc un clasament live.

## Stack

- **Frontend:** TanStack Start, React 19, TanStack Router, Tailwind CSS v4, shadcn/ui
- **Backend:** Supabase (Postgres, Auth, Realtime, RLS)
- **Auth:** Email/parolă (cu cod invitație) + Google OAuth (Lovable Cloud)

## Reguli de joc

- 3 predicții per meci, 1 punct pentru fiecare scor exact
- Predicțiile se blochează cu 1 oră înainte de kickoff
- Bonus: campion + golgheter (5 puncte fiecare), setate o singură dată
- Înregistrare email doar cu cod de invitație valid

## Rute

| URL | Descriere |
|-----|-----------|
| `/` | Landing public |
| `/auth` | Login / înregistrare |
| `/dashboard` | Rezumat utilizator (meciuri azi, loc în clasament) |
| `/matches` | Listă meciuri |
| `/matches/:id` | Detalii meci + formular predicții |
| `/groups` | Grupe turneu |
| `/leaderboard` | Clasament live |
| `/bonus` | Predicții bonus |
| `/profile` | Istoric pronosticuri |
| `/admin` | Panou admin (doar email-uri din `admins`) |

## Setup local

```bash
npm install
cp .env.example .env   # sau configurează .env
npm run dev
```

Variabile de mediu necesare:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

## Migrații Supabase

Migrațiile sunt în `supabase/migrations/`. Seed-ul include 48 echipe (12 grupe), 12 meciuri de probă și codul de invitație `OMDworldcup2026`.

```bash
supabase db push   # cu Supabase CLI configurat
```

## Scripturi

```bash
npm run dev       # server de development
npm run build     # build producție
npm run preview   # preview build
npm run lint      # ESLint
npm run test      # Vitest
npm run format    # Prettier
```

## Structură proiect

```
src/
  routes/           # Pagini TanStack Router
  components/ui/    # Componente shadcn/ui
  integrations/     # Supabase, Lovable auth
  lib/              # Utilitare, server functions
  assets/           # Imagini SVG (hero, trofeu)
supabase/
  migrations/       # Schema DB + seed
```

## Documentație suplimentară

- [`.lovable/plan.md`](.lovable/plan.md) — specificație produs completă
- [`src/routes/README.md`](src/routes/README.md) — convenții routing TanStack Start
