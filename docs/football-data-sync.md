# Sincronizare football-data.org

Aplicația poate importa echipe și meciuri pentru CM 2026 din [football-data.org](https://www.football-data.org/).

## Configurare

1. Creează un cont gratuit și obține un API token.
2. Adaugă în `.env` (doar server-side):

```env
FOOTBALL_DATA_API_TOKEN=your-token-here
```

3. Aplică migrarea `20260605140000_football_data_external_ids.sql` pe proiectul Supabase (adaugă `external_id` pe `teams` și `matches`).

## Utilizare

În **Admin → Meciuri**, apasă **Sync din football-data.org**. Doar utilizatorii din tabelul `admins` pot rula sync-ul.

## Limitări plan gratuit

- Scoruri cu întârziere față de meciurile live
- 10 cereri/minut
- Meciurile din fazele eliminatorii pot avea echipe TBD (fără ID) până se stabilesc calificatele
