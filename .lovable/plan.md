
# FIFA World Cup 2026 — Totalizator

Aplicație web de tip "pool" pentru colegii din companie: fiecare user prezice 3 scoruri per meci și primește 1 punct pentru fiecare predicție care nimerește scorul exact (3 predicții identice corecte = 3 puncte).

## Stack
- TanStack Start + React + Tailwind (deja în proiect)
- Lovable Cloud (Supabase) — DB, Auth, Realtime
- Auth: Email/parolă + Google OAuth

## Reguli de joc
- Fiecare user trimite **exact 3 scoruri** per meci (pot fi identice sau diferite).
- **1 punct** pentru fiecare predicție al cărei scor exact coincide cu rezultatul final (la finalul timpului regulamentar pentru grupe; la grupe se scorează rezultatul după 90'; la knockout, scorul după prelungiri/penalty va fi cel introdus de admin — clarificăm la introducerea rezultatului).
- **Lock**: predicțiile pot fi create/editate până la **1 oră înainte de kickoff**.
- **Bonus predicții** (setate o singură dată, lock înainte de începerea turneului):
  - Câștigătoarea turneului — **5 puncte**
  - Golgheter — **5 puncte**

## Acces
- Înregistrare deschisă **doar cu cod de invitație** (configurabil de admin).
- Login: Email/parolă sau Google.
- **Admin** = listă de email-uri hardcodate (îmi spui adresele înainte de implementare sau le setez prin variabilă de config în DB).

## Schema DB (Supabase)

```text
profiles            (id PK→auth.users, display_name, email, created_at)
admins              (email PK)                          -- hardcoded la seed
invite_codes        (code PK, active bool, created_at)
teams               (id, name, group_letter, flag_url)
matches             (id, stage, group_letter, home_team_id, away_team_id,
                     kickoff_at timestamptz, venue,
                     home_score int?, away_score int?, status enum)
predictions         (id, user_id, match_id, score1_home, score1_away,
                     score2_home, score2_away, score3_home, score3_away,
                     updated_at)  UNIQUE(user_id, match_id)
bonus_predictions   (user_id PK, champion_team_id, top_scorer_name, locked_at)
tournament_settings (id=1, bonus_lock_at, champion_team_id, top_scorer_name)
```

### RLS
- `predictions`: user citește/scrie doar propriile rânduri; orice user autentificat poate citi `display_name + total_points` (clasament) printr-un view agregat.
- `matches`, `teams`: read pentru `authenticated`.
- `admins` + roluri prin `has_role()` (pattern user_roles) pentru introducere rezultate, fixtures, coduri invitație.
- Lock la 1h înainte de kickoff: enforced atât client (UI disabled) cât și server (server function refuză upsert dacă `now() > kickoff_at - 1h`).

### Scoring (server-side)
- Server function `recalculate_match(match_id)` apelat de admin la introducerea/editarea rezultatului — recalculează punctele pentru toți userii pe acel meci.
- View `leaderboard` = `SUM(points)` per user din `predictions` + bonus rezolvat.

## Date meciuri
- **Inițial**: import din Excel (îmi dai fișierul cu fixtures FIFA 2026 sau folosesc draft-ul oficial dacă e disponibil); script Python care populează `teams` + `matches`.
- **Live**: admin introduce manual rezultatele dintr-un panou dedicat. Dacă găsim un API gratuit la momentul implementării (ex: TheSportsDB, football-data.org free tier), îl wire-uim ca sursă opțională de sync — altfel rămâne manual.
- **Real-time UI**: Supabase Realtime pe `matches` + `predictions` → leaderboard și scorurile se actualizează fără refresh.

## Pagini

| Rută | Acces | Conținut |
|---|---|---|
| `/auth` | public | Login / signup (cu cod invitație) + Google |
| `/_authenticated/` (Dashboard) | user | Meciurile zilei + următoarele, status predicții, locul tău |
| `/_authenticated/matches` | user | Toate meciurile pe etape (grupe A-L, 16-imi, sferturi, semis, finală) cu filtre |
| `/_authenticated/match/$id` | user | Detalii meci + formular cu 3 scoruri (dezactivat după lock) |
| `/_authenticated/groups` | user | Cele 12 grupe + clasament intermediar |
| `/_authenticated/leaderboard` | user | Clasament general + pe etape, live |
| `/_authenticated/bonus` | user | Predicție campion + golgheter (până la bonus_lock_at) |
| `/_authenticated/profile` | user | Istoricul propriilor predicții |
| `/_authenticated/admin` | admin | Introducere rezultate, generare coduri invitație, setare lock bonus, rezolvare campion/golgheter |

## Design
- Temă sportivă, energică, dark mode default cu accente FIFA (verde teren + auriu trofeu).
- Carduri meci compacte cu steaguri, ora locală, countdown la lock.
- Tabel leaderboard cu animații pe schimbare poziție.

## Pași de implementare
1. Enable Lovable Cloud.
2. Migrare DB: tabele + RLS + view leaderboard + funcția `has_role`.
3. Seed: teams + matches din Excel (îmi atașezi fișierul sau confirmi să folosesc fixtures-ul oficial cunoscut), admins, primul cod de invitație.
4. Auth pages + Google OAuth (`supabase--configure_social_auth`).
5. Server functions: `submitPrediction`, `recalculateMatch`, `submitBonus`, `generateInviteCode`.
6. UI pages (dashboard, matches, match detail, groups, leaderboard, bonus, profile, admin).
7. Realtime subscriptions pe `matches` + `predictions`.
8. QA flow complet: signup cu cod → predicție → admin intră rezultat → leaderboard se actualizează live.

## De confirmat înainte de build
1. **Email-urile admin** (1-3 adrese).
2. **Fișierul Excel cu fixtures** — îl atașezi, sau să generez schema cu placeholder pentru fixtures-ul oficial?
3. **Punctaj bonus** campion/golgheter: 5p fiecare e ok, sau alte valori?
