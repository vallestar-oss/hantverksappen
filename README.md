# Hantverksappen

Offerter, jobb, fakturor och ROT/RUT för svenska hantverkare, i en och samma app. Byggd som en single-page-app med React och Supabase.

Appen låter en hantverkare hålla ordning på kunder, skriva offerter, planera jobb i en kalender, fakturera och exportera underlag till bokföringen. Allt gränssnitt är på svenska.

## Funktioner

- **Kunder** – register med kontaktuppgifter och en samlad historik över offerter, jobb och fakturor.
- **Offerter** – radbaserade offerter med arbete/material, moms (25/12/6 %) och ROT/RUT-avdrag som räknas ut direkt. Statusflöde: utkast → skickad → godkänd/avvisad.
- **Jobb** – planering med datum och tid, statusflöde och kalendervy. Ett godkänt offert blir ett jobb, ett avslutat jobb blir en faktura.
- **Fakturor** – automatisk nummerserie (`ÅÅÅÅ-NNN`), förfallodatum, försenade fakturor markeras, betalningsuppgifter från företagsprofilen.
- **PDF** – offerter och fakturor som PDF med logotyp, svenska tecken och ROT/RUT-information.
- **CSV-export** – fakturor som semikolonseparerad CSV för bokföring.
- **Global sökning** (`Ctrl+K`), toast-notiser, onboarding vid första inloggning och responsiv layout (sidomeny på desktop, bottenmeny på mobil).

## Teknik

| Område | Val |
|---|---|
| UI | React 19, React Router 7, Tailwind CSS 3, Lucide-ikoner |
| Backend | Supabase (Auth, Postgres, Storage) – anropas direkt från klienten |
| PDF | jsPDF + jspdf-autotable, Open Sans inbäddad via `@fontsource` |
| Kalender | react-big-calendar + date-fns |
| Bygg | Vite 8, ESLint 10, Vitest |
| Hosting | Vercel (`vercel.json` med SPA-rewrites och säkerhetsheaders) |

## Komma igång

Kräver Node.js 20 eller senare och ett Supabase-projekt.

```bash
npm install
cp .env.example .env   # fyll i VITE_SUPABASE_URL och VITE_SUPABASE_ANON_KEY
npm run dev
```

| Kommando | Vad det gör |
|---|---|
| `npm run dev` | Utvecklingsserver med HMR |
| `npm run build` | Produktionsbygge till `dist/` |
| `npm run preview` | Servera bygget lokalt |
| `npm run lint` | ESLint |
| `npm test` | Enhetstester (Vitest) |

### Supabase

Appen förväntar sig följande tabeller, alla med en `user_id`-kolumn (utom rad-tabellerna) som pekar på `auth.users`:

- `company_profiles` – företagsnamn, org.nr, F-skatt, adress, kontakt, bankgiro, swish, `logo_url`
- `customers` – namn, telefon, e-post, adress, postnummer, ort, anteckningar
- `quotes` + `quote_items` – offert (`quote_number`, `status`, `valid_until`, `rot_rut_enabled`, `rot_rut_type`) och dess rader
- `jobs` – titel, beskrivning, `scheduled_date`, `scheduled_time`, `status`, `completed_date`, koppling till kund och offert
- `invoices` + `invoice_items` – faktura (`invoice_number`, `status`, `invoice_date`, `due_date`, `paid_date`, ROT/RUT-fält) och dess rader
- Storage-bucket `logos` (publik läsning) för företagslogotyper

Raderna (`*_items`) har `type` (`arbete`/`material`), `description`, `quantity`, `unit`, `unit_price` och `vat_rate`.

**Aktivera Row Level Security** på alla tabeller med policyer som begränsar åtkomst till `user_id = auth.uid()`. Anon-nyckeln är publik i klienten, så det är RLS som skyddar datan – koden filtrerar visserligen på `user_id`, men det är inte ett säkerhetsskydd i sig. Lägg gärna en unik index på `(user_id, quote_number)` respektive `(user_id, invoice_number)`.

För lösenordsåterställning måste `<din-domän>/reset-password` läggas till under *Authentication → URL Configuration → Redirect URLs* i Supabase.

## Projektstruktur

```
src/
  components/   Delade komponenter (layout, formulär, dokumentbyggare, toasts …)
  context/      AuthProvider
  hooks/        useAuth, useToast, useConfirmDialog, useCustomerOptions
  lib/          Supabase-klient, datum/format, dokument- och entitetslogik, logotyp-uppladdning
  pages/        En fil per skärm (lazy-laddade routes)
  utils/        Beräkningar (calc.js), PDF-generering, CSV-export
```

### Designval

- **En enda beräkningskälla.** All moms- och ROT/RUT-logik finns i [`src/utils/calc.js`](src/utils/calc.js) och används av byggare, detaljvyer, listor, PDF och export, så siffrorna kan inte avvika. ROT/RUT beräknas som 30 % av arbetskostnaden **inklusive moms**, och belopp avrundas till hela ören.
- **Tidszonssäkra datum.** Databasens datum är rena `ÅÅÅÅ-MM-DD`-strängar. [`src/lib/date.js`](src/lib/date.js) arbetar i lokal kalender, eftersom `toISOString()` ger fel dag runt midnatt svensk tid.
- **Säker radersättning.** Vid redigering sätts nya rader in *innan* de gamla tas bort, så ett fel aldrig kan tömma ett dokument. Nummerserien bygger på högsta befintliga nummer, inte antal rader, så borttagna dokument ger aldrig dubbletter.
- **Kodsplittring.** Varje sida är en egen chunk och PDF-biblioteket laddas först när en PDF skapas.
- **CSV-injektion.** Exporten neutraliserar celler som börjar med `=`, `+`, `-` eller `@`.

## Tester

`npm test` kör enhetstester för beräkningar, datum, nummerserie, entitetsmappning och CSV-export.
