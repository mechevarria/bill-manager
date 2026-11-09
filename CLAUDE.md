# Bill Manager — Claude Context

## Project Overview

A household bill-splitting app. Two owners split monthly expenses and the app calculates who owes whom. Stack: Spring Boot API + MySQL backend, PrimeVue/Vue 3 frontend.

## Repo Structure

```
bill-manager/
├── primevue-ui/        # Vue 3 + PrimeVue frontend (active development)
├── springboot-api/     # Spring Boot REST API
├── mysql/              # DB backup / restore / migration scripts
├── docker-compose.yaml # Full stack (local + QNAP NAS deployment)
├── .env.example        # PRIMEUI_LICENSE for Docker builds (.env is git-ignored)
├── docker-up.sh / docker-down.sh
```

## Docker / Deployment

Target host: QNAP TS-462A (Celeron N5095, 4 GB RAM). Keep the stack lean.
- **API** (`springboot-api/Dockerfile`): multi-stage, `eclipse-temurin:25-jre-alpine`, non-root `app` user, flags `-Xmx512m -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -XX:+UseCompactObjectHeaders`. `.dockerignore` excludes `target/`.
- **API has no host port** — QNAP QTS owns 8080. nginx (`primevue-ui/default.conf`) proxies `/api/` → `springboot:8080` on `app-net`. Local dev runs the API via `mvnw` (needs JDK 25), not Docker.
- **MySQL**: `mysql:8.4` with `--performance-schema=OFF --innodb-buffer-pool-size=128M`; port 3306 is still published (kept for local dev).
- **Logging**: shared `x-logging: &default-logging` anchor (json-file, 2 × 10 MB), referenced with `logging: *default-logging`.
- **QNAP Container Station** copies the compose file to its own folder, so `./mysql-data` and `.env` resolve elsewhere (empty DB, no license). Start via `./docker-up.sh` from the repo folder, or use absolute paths.

## Versioning & Releases

Single project-wide semver, managed by release-please (`.github/workflows/release-please.yml`).
- Commits **must** use Conventional Commits: `fix:` → patch, `feat:` → minor, `feat!:` / `BREAKING CHANGE:` footer → major. `chore:`, `docs:`, `refactor:` don't bump.
- release-please maintains a Release PR on `master`; merging it tags `vX.Y.Z`, creates the GitHub Release, and updates `CHANGELOG.md`.
- Never hand-edit versions. Files bumped automatically: `.release-please-manifest.json`, `springboot-api/pom.xml` (line marked `x-release-please-version`), `primevue-ui/package.json`, `primevue-ui/package-lock.json`.

## Frontend (`primevue-ui/`)

### Stack
- **Vue 3** with `<script setup lang="ts">`
- **PrimeVue 5.x** styled mode with `@primeuix/themes` 3.x Lara preset (structure follows primefaces/primevue-examples `vite-quickstart`)
- **TypeScript stays on 6.x** — TS 7 breaks `vue-tsc`. `@types/node` pinned to 24 (local Node 24; Docker builds on `node:22-alpine`). `engines.node`: `^22.22.2 || >=24.15.0`.
- **Sakai theme conventions** — follow patterns from sakai.primevue.org
- **No Tailwind** — utility classes are hand-rolled in `src/assets/main.css` to mirror Tailwind names

### PrimeVue Config (`src/main.ts`)
- `definePreset(Lara, { semantic: { primary: palette('{cyan}') } })` — nothing else overridden; tables, toolbars, spacing are **Lara defaults** (don't re-theme DataTable headers etc.)
- **License**: PrimeVue 5 is commercial (free Community License). `license: import.meta.env.VITE_PRIMEUI_LICENSE` (typed in `env.d.ts`). Local: `primevue-ui/.env.local`; Docker: root `.env` `PRIMEUI_LICENSE` → compose build arg → `ARG VITE_PRIMEUI_LICENSE` in the UI Dockerfile. Missing key ⇒ "invalid license" banner. Never strip/patch the license check.
- **No hardcoded colors anywhere** (no hex/rgb literals in `.vue`, `.ts`, `.css`). Use `--p-*` theme tokens (`--p-text-color`, `--p-content-background`, `--p-content-border-color`, `--p-highlight-*`, `--p-<palette>-<shade>`, …)
- Owner colors: `src/utils/ownerColors.ts` maps severity names (`active`/`success`/`info`/`warning`/`danger`) to palettes (slate/green/sky/orange/red) and mirrors Lara's per-scheme rules via `light-dark()`:
  - `ownerColor(c)` — solid, like `primary.color`: 500 light / 400 dark (bars, swatches)
  - `ownerHighlight(c)` — background, like `highlight.background`: solid 50 light / 400 @ 16% dark (rows, summary columns)
  - `ownerRowStyle(c)` — DataTable `:row-style` helper. `ownerColorOptions` feeds the owner color Select.
- Chart.js can't parse `light-dark()` token values — `ChartView` resolves tokens to concrete colors via a probe element
- Icons: PrimeIcons (`pi pi-*`) only
- `darkModeSelector: '.app-dark'`
- No global `inputSize` — per-component `size="small"` on all form elements

### Sizing Convention
All form elements use `size="small"`: `InputText`, `InputNumber`, `Select`, `Button`, `DataTable`, `DatePicker`.
Every `DataTable` also has `striped-rows` (no `show-gridlines`). Owner-tinted rows override the stripe by design. The hand-built `.summary-grid` tables in `BillEditView` mirror a small striped DataTable using `--p-datatable-*` tokens.

### App Shell (`App.vue`)
- Full-height desktop sidebar (`aside.layout-sidebar`): brand + caret collapse `Button` (`pi-angle-left`/`right`), then `<AppMenu />`. Collapsed = icons only (`.layout-collapsed`); hover expands it as an overlay.
- Topbar sits right of the sidebar: mobile hamburger (`< 992px`) + dark-mode toggle (`text rounded severity="secondary"` Buttons).
- Mobile nav is a PrimeVue `Drawer` with the same `<AppMenu />`.
- Sidebar, topbar and cards use `--p-content-background` + `--p-content-border-color`; page background is `--p-surface-50` / `--p-surface-950`.
- Layout dimensions are CSS variables on `.layout-wrapper` (`--layout-sidebar-width`, `--layout-sidebar-collapsed-width`, `--layout-topbar-height`, `--layout-content-padding`); `--layout-sidebar-current` drives sidebar width, topbar `left` and content offset.
- `AppMenu.vue`: PrimeVue `Menu` with the router `#item` slot. `Menu` renders a fragment root, so it's styled via a wrapper `<nav class="app-menu">` + `:deep()`. Active route uses `--p-highlight-*` and `aria-current="page"`.

### DatePicker Notes
- `size="small"` works via the `BaseInput` mixin forwarding to the inner `InputText` (adds `p-inputtext-sm` class)
- Always use `icon-display="input"` with `show-icon` — the default `iconDisplay="button"` renders a separate `<button>` whose height doesn't match the small input
- For month/year-only pickers: `view="month"` + `date-format="MM yy"`

### CSS Utilities (`src/assets/main.css`)
Defined utilities (Tailwind-named):
`flex`, `flex-col`, `items-center`, `gap-2`, `gap-4`, `pt-2`,
`mb-2`, `mb-4`, `mb-6`, `mt-2`, `mt-4`,
`font-medium`, `font-semibold`,
`text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-muted-color`

Also defined: `.p-select-label { line-height: normal; }` — fixes Select height inflation caused by body line-height inheritance.
`body` typography comes from `--p-typography-font-size` / `-font-weight` / `-line-height` (font family: Lato, loaded in `index.html`).

Before using a Tailwind class in a template, verify it is in `main.css`. If it isn't, add it.

### Page Header Pattern (Card + Toolbar)
Every page is built from PrimeVue `Card`s. The page title is the first Card's `#title`; its Toolbar sits in `#content`:
```vue
<Card class="mb-4">
  <template #title>Page Title</template>
  <template #content>
    <Toolbar>
      <template #start><!-- outlined action buttons (Add X, Add Y, etc.) --></template>
      <template #end><!-- primary/save/back actions --></template>
    </Toolbar>
  </template>
</Card>
```
- Action buttons on the left use `outlined` prop
- Primary actions (Save, Back) go on the right
- Danger actions (Erase All, Delete) go on the right

### Component Patterns
- Page layout: stacked `<Card class="mb-4">` components — **no tabs** on any page, no hand-rolled `.card` divs
- Titles: always the Card `#title` slot (theme typography); extra header content (icons, spinners) goes inside that slot, secondary text in `#subtitle`. Never hand-size headings with `font-semibold text-*`.
- Typography/spacing: inherit Lara (`--p-typography-*`, component tokens like `--p-list-option-padding`); no literal font sizes or paddings in components
- Section cards: title only in header (no per-card add buttons — those live in the page Toolbar)
- DataTable row counts go in `#footer` slot: `<template #footer><span class="text-muted-color text-sm">{{ items.length }} total</span></template>`
- Paginator counts (Bills page) go in `#paginatorstart` with a hidden mirror in `#paginatorend` to keep pagination centered
- Empty states: `.empty-state` with `.pi` icon, `.empty-state-title`, and description text referencing the toolbar
- Badges/labels: PrimeVue `Tag` (e.g. the settlement "X owes Y" line), not custom badge CSS
- Dialogs: `modal`, `:draggable="false"`, `style="width: 22rem"` (or wider as needed), all inner form elements `size="small"`
- Row hover + click-to-edit on DataTables: `row-hover`, `style="cursor: pointer"`, `@row-click="handler($event.data)"`. Delete button uses `@click.stop` to prevent row-click firing.

### New Bill Pre-population
When creating a new bill (`BillsView`), `useDefaultsStore().load()` is called and the returned `defaults.incomes` / `defaults.expenses` are mapped into the bill's `incomes` / `expenses` arrays before `createBill()` is POSTed. Field mapping: `DefaultIncome → Income` (id=0, owner, description, amount, incomeDate=billDate, month, year, lastUpdated=billDate); `DefaultExpense → Expense` (id=0, name, amount, paid, hasDetails=false, expenseDate=billDate, month, year, lastUpdated=billDate, details=[]).

### Bill Edit Calculation
Calculation in `BillEditView` is **imperative, not reactive**. `computeSummary()` runs on load (for existing bills) and when Calculate is clicked; `calculate()` pushes totals into `bill.value` and fills the inline **Summary** and **Calculations** cards (`summaryResult`). Editing the bill afterwards sets `calcStale`, which shows a warning `pi-refresh` icon in those card titles until Calculate runs again. There is no reactive `computed(summary)`.

## Routes & Navigation (`src/router/index.ts`)
| Path | Name | View |
|---|---|---|
| `/` | `bills` | BillsView |
| `/bills/:id` | `bill-edit` | BillEditView |
| `/chart` | `chart` | ChartView |
| `/search` | `search` | SearchView |
| `/defaults` | `defaults` | SystemView |
| `/data` | `data` | DataView |

Sidebar nav items are defined in `src/components/AppMenu.vue` (`items` array, `route` per item); `isActive()` treats `/bills/:id` as part of Bills.

## Work Completed

### 2026-05-20 (session 1)
- **BillsView — New Bill modal**: DatePicker (`view="month"`, `icon-display="input"`, `size="small"`) replaces auto-create.
- **SystemView — Tab → Cards**: Removed Tabs. Each section is its own `.card`.
- **`main.css` utilities**: Added `flex-col`, `pt-2`, `.p-select-label` line-height fix.
- **DatePicker `iconDisplay`**: Standardized `icon-display="input"` for all in-form date pickers.
- **SearchView**: Renamed facets → filters in UI and view-layer code (backend `api.ts` field names unchanged).
- **ChartView**: Side-by-side chart cards via CSS grid (`1fr 1fr`), responsive breakpoint at 768px.
- **DataView**: Extracted Data Management (export/import/erase) from SystemView into its own page/route.
- **Route rename**: `/system` → `/defaults`, sidebar label "System" → "Defaults".

### 2026-05-20 (session 2)
- **Charts year filter**: Added "Last 4 years" as default top option (sentinel value `'last4'`); filters bills where `parseInt(year) >= currentYear - 3`. Removed "All" option.
- **New bill pre-population**: `confirmAddBill` now calls `store.load()` and maps defaults into the new bill's incomes/expenses before POST.
- **BillEditView — Tab → Cards**: Removed Tabs. Summary, Income, Expense are now stacked cards. Then Summary card removed and moved to a Dialog triggered by Calculate button.
- **BillEditView — Toolbar header**: Title above Toolbar; left: Add Income, Add Expense, Calculate (outlined); right: Back, Save.
- **BillEditView — Imperative calculate**: Removed reactive `computed(summary)` + `watch`. `computeSummary()` runs on Calculate click, pushes totals into bill, opens Summary Dialog.
- **BillEditView — DataTable footers**: Income and Expense counts moved from card headers to `#footer` slot of each DataTable.
- **SystemView — Toolbar header**: Title above Toolbar; left: Add Owner, Add Income, Add Expense (outlined); right: Save. Per-card add buttons removed.
- **DataView — Toolbar**: Title above Toolbar; left: Export, Import (outlined); right: Erase All (danger).
- **SearchView — Toolbar**: Title above Toolbar; left: operator Select + InputText; right: Search button. Placeholder changed to "Search terms…".
- **BillsView — Toolbar**: Title above Toolbar; right: New button. Row hover + click-to-edit. Delete column header removed. Paginator count in `#paginatorstart`/`#paginatorend`.
- **ChartView — Toolbar**: Title above Toolbar; left: year Select.

### 2026-11-09
- **Docker for QNAP NAS**: API image non-root + `.dockerignore`; MySQL → `mysql:8.4` with low-memory flags; shared log-rotation anchor; removed API host port 8080 (QTS conflict).
- **Dependency upgrade**: PrimeVue 4.5 → 5, `@primeuix/themes` 2 → 3, PrimeIcons 7 → 8, Pinia 4, Vitest 5, jsdom 31, etc. TypeScript held at 6.x (TS 7 incompatible with `vue-tsc`).
- **PrimeUI license** wiring for dev (`.env.local`) and Docker (`.env` → build arg).
- **Theme**: Aura + hex cyan preset → Lara + `palette('{cyan}')`. Removed every hex/rgb literal and `base.css`; colors, typography and spacing come from `--p-*` tokens.
- **Owner colors**: centralized in `utils/ownerColors.ts`, following Lara's light/dark `primary.color` / `highlight.background` patterns (fixes faint rows in dark mode).
- **Chart colors**: `ChartView` resolves `light-dark()` tokens via a probe element for Chart.js.
- **App shell**: sidebar holds brand + caret collapse (icons-only mode, hover to peek); topbar right of sidebar; `AppMenu` (PrimeVue `Menu`), `Drawer` on mobile, PrimeVue `Button`s instead of custom controls.
- **Pages**: all `.card` divs → PrimeVue `Card` with `#title`; Bills title moved out of its Toolbar; Search results total in `#subtitle`; settlement badge → `Tag`; Search filter list uses `--p-list-option-*` tokens.
- **Tables**: Lara default headers, `striped-rows` on every DataTable, no gridlines.
