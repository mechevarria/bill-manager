# Bill Manager — Claude Context

## Project Overview

A household bill-splitting app. Two owners split monthly expenses and the app calculates who owes whom. Stack: Spring Boot API + MySQL backend, PrimeVue/Vue 3 frontend.

## Repo Structure

```
bill-manager/
├── primevue-ui/        # Vue 3 + PrimeVue frontend (active development)
├── springboot-api/     # Spring Boot REST API
├── mysql/              # MySQL init scripts
├── client/             # Legacy client (not in active use)
├── docker-compose.yaml # Full stack local dev
├── docker-up.sh / docker-down.sh
```

## Frontend (`primevue-ui/`)

### Stack
- **Vue 3** with `<script setup lang="ts">`
- **PrimeVue 4.5.x** styled mode with `@primeuix/themes` Aura preset
- **Sakai theme conventions** — follow patterns from sakai.primevue.org
- **No Tailwind** — utility classes are hand-rolled in `src/assets/main.css` to mirror Tailwind names

### PrimeVue Config (`src/main.ts`)
- Aura preset with custom cyan primary palette (Sakai's cyan configuration)
- `darkModeSelector: '.app-dark'`
- No global `inputSize` — per-component `size="small"` on all form elements

### Sizing Convention
All form elements use `size="small"`: `InputText`, `InputNumber`, `Select`, `Button`, `DataTable`, `DatePicker`.

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

Also defined: `.p-select-label { line-height: normal; }` — fixes Select height inflation caused by `body { line-height: 1.5 }` inheritance.

Before using a Tailwind class in a template, verify it is in `main.css`. If it isn't, add it.

### Page Header Pattern (Toolbar)
Every page uses a `<Toolbar>` component for its header, with title above it as a separate element:
```vue
<div class="font-semibold text-xl mb-4">Page Title</div>
<Toolbar>
  <template #start>
    <!-- outlined action buttons (Add X, Add Y, etc.) -->
  </template>
  <template #end>
    <!-- primary/save/back actions -->
  </template>
</Toolbar>
```
- Action buttons on the left use `outlined` prop
- Primary actions (Save, Back) go on the right
- Danger actions (Erase All, Delete) go on the right

### Component Patterns
- Page layout: one or more `.card` divs stacked vertically — **no tabs** on any page
- Section cards: title only in header (no per-card add buttons — those live in the page Toolbar)
- DataTable row counts go in `#footer` slot: `<template #footer><span class="text-muted-color text-sm">{{ items.length }} total</span></template>`
- Paginator counts (Bills page) go in `#paginatorstart` with a hidden mirror in `#paginatorend` to keep pagination centered
- Empty states: `.empty-state` with `.pi` icon, `.empty-state-title`, and description text referencing the toolbar
- Dialogs: `modal`, `:draggable="false"`, `style="width: 22rem"` (or wider as needed), all inner form elements `size="small"`
- Row hover + click-to-edit on DataTables: `row-hover`, `style="cursor: pointer"`, `@row-click="handler($event.data)"`. Delete button uses `@click.stop` to prevent row-click firing.

### New Bill Pre-population
When creating a new bill (`BillsView`), `useDefaultsStore().load()` is called and the returned `defaults.incomes` / `defaults.expenses` are mapped into the bill's `incomes` / `expenses` arrays before `createBill()` is POSTed. Field mapping: `DefaultIncome → Income` (id=0, owner, description, amount, incomeDate=billDate, month, year, lastUpdated=billDate); `DefaultExpense → Expense` (id=0, name, amount, paid, hasDetails=false, expenseDate=billDate, month, year, lastUpdated=billDate, details=[]).

### Bill Edit Calculation
Calculation in `BillEditView` is **imperative, not reactive**. The `computeSummary()` function runs only when the Calculate button is clicked. It pushes totals into `bill.value` and opens a Summary Dialog. There is no `watch` on summary — the old reactive pattern was intentionally removed.

## Routes & Navigation (`src/router/index.ts`)
| Path | Name | View |
|---|---|---|
| `/` | `bills` | BillsView |
| `/bills/:id` | `bill-edit` | BillEditView |
| `/chart` | `chart` | ChartView |
| `/search` | `search` | SearchView |
| `/defaults` | `defaults` | SystemView |
| `/data` | `data` | DataView |

Sidebar nav items defined in `App.vue` `navItems` array.

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
