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

În **Admin**, apasă **Importă acum** (fixtures) sau mergi la tab-ul **Jucători** pentru golgheter. Doar utilizatorii din tabelul `admins` pot rula importurile.

### Jucători (golgheter)

- **API:** `GET /v4/competitions/WC/teams?season=2026` (câmpul `squad` pe fiecare echipă)
- Dacă loturile WC2026 nu sunt publicate încă, se încearcă `GET /v4/teams/{id}` per echipă din DB
- **Fallback:** import manual CSV/JSON din Admin → Jucători

Migrare necesară: `20260605210000_players_table.sql`

## Limitări plan gratuit

- Scoruri cu întârziere față de meciurile live
- 10 cereri/minut
- Meciurile din fazele eliminatorii pot avea echipe TBD (fără ID) până se stabilesc calificatele
