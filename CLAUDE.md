# CLAUDE.md

Portalen for Kommunelys: https://portal.kommunelys.no/ (ADR-020). Prosjektet,
reglene og databasen er beskrevet i `CLAUDE.md` i `Kommunelys/website`, under
«Portalen». Les den først.

- Vite, React, react-admin og ra-supabase. All tekst på norsk bokmål, i klarspråk.
- Portalen har bare den publiserbare nøkkelen (`src/supabase.ts`) og leser
  skjemaet `portal`. RLS i databasen bestemmer alt. Brukeradministrasjon går
  gjennom edge-funksjonen `brukeradmin`. Skjemaet og funksjonen ligger i
  `supabase/` i website-repoet, og endringer der gjøres med en migrering.
- Prosjektadmin gis bare med SQL, aldri herfra.
- Vanlige adresser, ikke `#`: lenkene i e-postene fra Supabase krever det.
  Publiseringen kopierer `index.html` til `404.html`.
- `public/konto-status.html` svarer kontomenyen på kommunelys.no om
  nettleseren er logget inn. `?tilbake=` sender brukeren tilbake dit.
- Utseendet (`src/tema.ts`) følger `bygg/mal/stil.css` på nettstedet.
- Ikke push før prosjekteier har sett resultatet lokalt og sagt ja.
  `main` publiseres med en gang.

```bash
npm install
npm run dev     # http://localhost:5173 mot den ekte databasen
npm run build
```
