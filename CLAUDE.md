# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start Vite dev server (HMR)
npm run build     # production build → dist/
npm run preview   # serve dist/ locally
npm run lint      # ESLint (must stay at zero errors)
npm test          # Vitest unit tests
```

Unit tests cover the pure logic (`utils/calc`, `lib/date`, `lib/documents`, `lib/entities`, `utils/exportFortnox`). UI changes are verified visually via `npm run dev`.

## Environment

Copy `.env.example` → `.env` and fill in:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Without them `App.jsx` shows a setup notice instead of crashing.

## Architecture

**Hantverksappen** is a Swedish-language SPA for tradespeople (craftsmen/contractors). It manages customers, quotes, jobs, invoices, and PDF/CSV exports. Stack: React 19 + Vite, Tailwind CSS, Supabase (auth + database + storage), React Router v7.

### Data flow

All data lives in Supabase. Pages fetch directly via the `supabase` client (`src/lib/supabase.js`) — there is no API layer, no state management library, and no caching. Pages own their local state and load in a `useEffect` (with an `active` flag so results after unmount are ignored). Shared write logic for quotes/invoices lives in `src/lib/documents.js`.

### Auth

`AuthProvider` (`src/context/AuthContext.jsx`) wraps the app; read it with `useAuth()` from `src/hooks/useAuth.js` → `{ user, loading }`. `ProtectedRoute` redirects unauthenticated users to `/login`. Authenticated routes are wrapped with the `Protected` helper in `App.jsx`, and every page is lazy-loaded. `/reset-password` completes the password-reset flow started on the login page.

### Layout

`Layout` renders a dark sidebar (`#111111`) on desktop and a `BottomNav` on mobile. It also owns `ToastProvider` and global search (`Ctrl+K`). Pages render inside `Layout` and should not add their own navigation chrome. `ErrorBoundary` (in `main.jsx`) catches render errors.

### Page structure pattern

Every page uses `Page` (and `Noise` for dark surfaces) from `src/components/Premium.jsx` as the outermost wrapper — it provides the page-fade animation. Loading states use `src/components/Skeleton.jsx`. Reuse `src/components/FormField.jsx` (`Field`, `Card`, `Toggle`, `FormError`, `FormHeader`, `SubmitButton`, …) instead of redefining input styles per page.

### Quotes, invoices and line items

`QuoteNew`/`QuoteEdit` and `InvoiceNew`/`InvoiceEdit` are built from `src/components/DocumentBuilder.jsx` (line items, ROT/RUT section, totals, sticky bar). Line items have type `arbete` (labour) or `material`; VAT rates are 25/12/6 %.

**All arithmetic goes through `src/utils/calc.js` (`calcTotals`, `documentTotal`).** Never re-implement totals in a page or PDF. ROT/RUT is 30 % of labour **including VAT**, rounded to öre.

Numbers come from `createDocument`/`updateDocument` in `src/lib/documents.js`, which also number documents (`YYYY-NNN` from the highest existing number) and replace items insert-first so an error can't lose data.

### Dates and money

Use `src/lib/date.js` (`todayISO`, `addDaysISO`, `formatDate`, `daysBetween`) and `src/lib/format.js` (`formatSEK`, `pluralize`). Do **not** use `new Date().toISOString().slice(0, 10)` for "today" — it returns the UTC day, which is wrong right after midnight in Sweden.

### PDF & export

`src/utils/generateInvoicePDF.js` and `generateQuotePDF.js` use jsPDF + jspdf-autotable and share helpers in `pdfCommon.js`. They are imported dynamically from the detail pages so jsPDF stays out of the main bundle. `pdfFont.js` registers Open Sans (bundled via `@fontsource/open-sans`) for å/ä/ö. `src/utils/exportFortnox.js` builds the invoice CSV.

### Design system

Colors are pinned in `tailwind.config.js` — all gray/slate/blue utility classes resolve to the design-system tokens. Key values:

| Token | Value |
|---|---|
| `primary` / `text-primary` | `#0055FF` |
| Page bg | `#F8F8F8` |
| Sidebar bg | `#111111` |
| Text primary | `#111111` |
| Border | `#E5E5E5` |
| success / warning / danger | `#16A34A` / `#D97706` / `#DC2626` |

Use `cn()` from `src/lib/utils.js` (clsx + tailwind-merge) for conditional class names.

Animations and micro-interactions (`.btn-lift`, `.card-lift`, `.page-fade`, `.row-list`, `.glow-*`, …) are plain CSS in `src/index.css` — use these classes rather than re-implementing them or injecting `<style>` tags.

Toasts: `useToast()` from `src/hooks/useToast.js`. Types: `success | error | warning | info`.

### Path alias

`@/` resolves to `src/` (configured in `vite.config.js`).

### Language

All UI text is in **Swedish**. Keep new strings in Swedish.
