# Configurare Google OAuth

Aplicația folosește **Supabase Auth** pentru login cu Google (local și după migrare). Pe URL-uri Lovable, rămâne activ și broker-ul Lovable ca fallback.

## 1. Google Cloud Console

1. Creează un proiect în [Google Cloud Console](https://console.cloud.google.com/).
2. **APIs & Services → Credentials → Create OAuth client ID → Web application**
3. **Authorized JavaScript origins:**
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
   - URL-ul de producție (ex. `https://your-app.com`)
4. **Authorized redirect URIs:**
   - `https://<project-ref>.supabase.co/auth/v1/callback`
   - Găsești URL-ul exact în Supabase Dashboard → Authentication → Providers → Google

## 2. Supabase Dashboard

Proiect: `kbbqhdhtefhufnpscodv` (Lovable) sau noul proiect după migrare.

1. **Authentication → Providers → Google** — activează și introdu Client ID + Client Secret
2. **Authentication → URL Configuration:**
   - **Site URL:** `http://localhost:5173` (dev) sau URL producție
   - **Redirect URLs** (adaugă toate):
     ```
     http://localhost:5173/auth/callback
     http://127.0.0.1:5173/auth/callback
     https://your-production-domain/auth/callback
     ```

## 3. Test local

```bash
npm run dev
```

Deschide `/auth` → **Continuă cu Google**. După consimțământ, revii la `/auth/callback` și ești redirectat la `/dashboard`.

## Note

- Signup cu Google **nu necesită cod de invitație** (trigger `handle_new_user` verifică provider-ul OAuth).
- La migrare pe alt Supabase, repetă pașii 2–3 cu noul `project-ref` și actualizează `.env`.
