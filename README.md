# Kommunelys-portalen

Innlogget del av Kommunelys på https://portal.kommunelys.no/ (ADR-020 i
`Kommunelys/website`). Bygget med [react-admin](https://marmelab.com/react-admin/)
og [ra-supabase](https://github.com/marmelab/ra-supabase).

- Alle: registrering, innlogging, glemt passord, Min konto (bytte passord og
  e-post, slette kontoen).
- Prosjektadmin: brukere, roller, abonnement, avvik med vurderinger og
  driftssiden.

Portalen har bare den publiserbare nøkkelen og leser skjemaet `portal` i
databasen, der RLS bestemmer alt. Brukeradministrasjonen går gjennom
edge-funksjonen `brukeradmin`. Begge ligger i `supabase/` i website-repoet.

```bash
npm install
npm run dev     # http://localhost:5173 mot den ekte databasen
npm run build
```

Publiseres på GitHub Pages ved push til `main` (`.github/workflows/publiser.yml`).
