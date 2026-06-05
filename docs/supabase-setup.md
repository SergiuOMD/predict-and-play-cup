# Setup Supabase nou (după migrare de pe Lovable)

Eroarea **500 la signup** apare aproape întotdeauna când lipsește schema DB sau codul de invitație.

## Checklist obligatoriu

### 1. Rulează migrările SQL (în ordine)

În **Supabase Dashboard → SQL Editor**, rulează conținutul fișierelor:

1. `supabase/migrations/20260605125441_ec263f9a-d749-46ce-a25f-8f03d99dbf97.sql`
2. `supabase/migrations/20260605125453_300fb33d-3329-4061-9f75-3717956826be.sql`
3. `supabase/migrations/20260605140000_football_data_external_ids.sql`
4. `supabase/migrations/20260605150000_seed_invite_admin.sql`
5. `supabase/migrations/20260605160000_fix_signup_invite_code.sql`
6. `supabase/migrations/20260605170000_email_only_signup.sql` ← **obligatoriu** (signup doar email + invitație)

**Sau** după migrările 1–3, rulează `supabase/setup_new_project.sql` (seed + fix + verificare).

### 2. Adaugă-te ca admin

```sql
INSERT INTO public.admins (email) VALUES ('emailul-tau@company.com')
ON CONFLICT (email) DO NOTHING;
```

### 3. Verifică codul de invitație

```sql
SELECT * FROM public.invite_codes;
```

Trebuie să existe `OMDworldcup2026` cu `active = true`.

Test rapid:

```sql
SELECT public.validate_invite_code('OMDworldcup2026');
-- trebuie să returneze true
```

### 4. Actualizează `.env` local

```env
VITE_SUPABASE_URL=https://NOUL_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_SUPABASE_PROJECT_ID=NOUL_PROJECT_REF

SUPABASE_URL=https://NOUL_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_PROJECT_ID=NOUL_PROJECT_REF
```

**Repornește** dev server-ul după schimbarea `.env`:

```bash
# oprește serverul (Ctrl+C), apoi:
npm run dev
```

### 5. Auth (doar email + parolă)

**Authentication → Providers:**
- **Email** — enabled
- **Google** — disabled (nu e folosit)

**Authentication → URL Configuration:**
- Site URL: `http://localhost:5173`

## Signup în app

- Tab **Înregistrare**
- Cod invitație: **`OMDworldcup2026`** (exact, case-sensitive)
- După signup → Login sau redirect automat la `/matches`

## Vezi eroarea exactă în Supabase

**Logs → Postgres Logs** (sau **Authentication → Logs**) imediat după un signup eșuat.

Mesaje frecvente:
- `Cod de invitatie invalid` → rulează seed-ul / `setup_new_project.sql`
- `relation "profiles" does not exist` → migrarea 1 nu a rulat
- `function validate_invite_code does not exist` → migrarea 1 nu a rulat

## Depanare 500 la signup

| Cauză | Soluție |
|-------|---------|
| Migrările nu au fost rulate | Rulează pașii 1–4 de mai sus |
| Cod invitație greșit | Folosește `OMDworldcup2026` |
| `.env` vechi / server nerepornit | Verifică URL-ul din Network tab = noul `project-ref` |
| Trigger `handle_new_user` lipsește | Re-rulează migrarea `20260605125441_...` |
