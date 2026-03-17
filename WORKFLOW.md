# Cafe POS System — Project Workflow

This document describes **how this project works end-to-end**, including:

- **Developer workflow** (setup → run → build)
- **Runtime workflow** (auth/roles → POS sales → stock-in → admin → reports)
- **Data flow** (Supabase tables and how UI reads/writes them)
- **How to safely change the system** (where to edit, what to test)

---

## Project overview

- **Frontend**: React 19 + TypeScript + React Router, built with **Vite**.
- **Styling**: Tailwind CSS (via `@tailwindcss/vite`).
- **State**: `zustand` for local UI/cart/session state.
- **Backend-as-a-service**: **Supabase** (Auth + Postgres tables).
- **Build output**: `dist/` (static assets).

Key user experiences:

- **Cashier flow**: Login → Launcher → POS selling (`/pos`) → submit order
- **Stock-in flow**: Launcher → Stock-in (`/stock-in`) → record purchases/expenses
- **Admin flow**: Admin pages (`/admin/*`) → manage products/users/expenses → view/export reports

---

## Local development workflow

### Prerequisites

- Node.js installed (recommended: current LTS)

### Install

```bash
npm install
```

### Environment variables

This project uses both **Vite client env** variables and a non-Vite key used by Vite `define`.

- **Supabase (required)**:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

Defined in `.env.example` and read in `src/lib/supabase.ts`.

- **Gemini (optional / used by some builds)**:
  - `GEMINI_API_KEY`

Injected into the client bundle in `vite.config.ts` via:
`process.env.GEMINI_API_KEY`.

Create a local `.env` (or use the existing `.env` if you already have one) based on `.env.example`.

### Run dev server

```bash
npm run dev
```

Notes:

- Dev server runs at **port 3000** and binds to **0.0.0.0** (`package.json`).
- HMR can be disabled by setting `DISABLE_HMR=true` (see `vite.config.ts`).

### Typecheck (lint)

```bash
npm run lint
```

This runs `tsc --noEmit` (TypeScript typecheck only).

### Build and preview

```bash
npm run build
npm run preview
```

Build outputs to `dist/`.

---

## Runtime workflow (what happens when you use the app)

### 1) Authentication and role loading

**Entry point**: `src/main.tsx` renders `src/App.tsx`.

`App.tsx` does:

- Reads the current Supabase session: `supabase.auth.getSession()`
- Subscribes to auth changes: `supabase.auth.onAuthStateChange(...)`
- When a session exists:
  - Fetches user profile from Supabase table `profiles` using `getProfile(session)` (`src/lib/auth.ts`)
  - Determines `role` (`admin` / `cashier`) and display name
  - Stores the user in Zustand with `login(name, role)` (`src/store.ts`)
- When no session:
  - Clears local state via `logout()` and shows `LoginPage`

**Important detail**: Role-based routing is enforced in the UI:

- Admin routes under `/admin/*` are only mounted if `user.role === 'admin'`

### 2) Launcher (home)

After login, the default route (`/`) renders `LauncherPage`.

Launcher provides entry points:

- **POS selling**: `/pos`
- **Stock-in**: `/stock-in`
- **Reports shortcut** (admin only): `/admin/reports`

### 3) POS selling workflow (`/pos`)

**Purpose**: Create an order by selecting products and submitting checkout.

Flow in `src/pages/POSPage.tsx`:

- On mount, fetches products: `getProducts()` (`src/lib/db.ts`)
  - Filters to `is_active === true`
  - Derives categories from product list
- Cart is managed locally in Zustand (`src/store.ts`):
  - `addToCart(product)`
  - `updateCartQuantity(productId, delta)`
  - `clearCart()`
- Checkout is a **two-step confirm**:
  - First click sets `confirming=true`
  - Second click calls `completeOrder(cart)` and clears cart

Write operations in `completeOrder(items)` (`src/lib/db.ts`):

- Computes:
  - `totalRevenue = Σ(price * qty)`
  - `totalProfit = Σ((price - cost) * qty)`
- Inserts into `orders`:
  - `{ total_revenue, total_profit }`
  - Reads back `order.id`
- Inserts rows into `order_items` (one per cart item):
  - `order_id`, `product_id`, `product_name`, `quantity`, `price_at_sale`, `cost_at_sale`

Result:

- Orders and sales become visible in **Reports** (and any admin analytics that read those tables).

### 4) Stock-in workflow (`/stock-in`)

**Purpose**: Record purchases/inputs (ingredients and other items) that contribute to costs.

Flow in `src/pages/StockInPage.tsx`:

- Two modes:
  - `ingredient`: pick from a predefined ingredient list, enter quantity and price/unit
  - `manual`: enter name, quantity, and total cost
- Draft persistence:
  - Uses `localStorage` key `stock-in-draft` to keep the list across refreshes
- On save:
  - Calls `addPurchases(items)` (`src/lib/db.ts`)
  - Clears draft and navigates back to `/`

Write operations:

- Inserts rows into `purchases` table:
  - `type: 'ingredient' | 'manual'`
  - `ingredient_id?`, `name`, `quantity`, `unit?`, `price_per_unit?`, `total`

These purchases are treated as **cost inputs** in Reports.

### 5) Admin workflow (`/admin/*`)

Admin screens are lazy-loaded (downloaded only when needed) in `App.tsx`.

Common admin responsibilities:

- **Products management** (`/admin/products`):
  - Reads products from `products`
  - Allows create/update via `upsertProduct(...)`
  - Allows delete via `deleteProduct(id)`
  - Allows reordering via drag-and-drop:
    - Computes a complete `sort_order` list and writes via `updateProductOrder(updates)`
  - POS category tabs and product ordering depend on these fields.

- **Reports** (`/admin/reports`):
  - Loads in parallel:
    - `orders`, `order_items`, `expenses`, `purchases`
  - Supports time filters (today/week/month/all/custom)
  - Builds:
    - Summary metrics: sales, costs, estimated profit
    - Charts: revenue vs cost, net profit trend
    - Tables: net profit by period, products sold, ingredients bought
  - Exports:
    - CSV
    - Excel (`xlsx` is dynamically imported)

---

## Data model (Supabase tables used by the app)

This app expects these tables (names inferred from queries in `src/lib/db.ts` and `src/lib/auth.ts`):

- **`profiles`**
  - `id` (matches `auth.users.id`)
  - `role` (`admin` or `cashier`)
  - `display_name`

- **`products`**
  - `id`, `name`, `category`
  - `price`, `cost`
  - `image_url`
  - `is_active`
  - `sort_order`
  - `created_at`

- **`orders`**
  - `id`
  - `total_revenue`
  - `total_profit`
  - `created_at`

- **`order_items`**
  - `id`, `order_id`, `product_id`
  - `product_name`
  - `quantity`
  - `price_at_sale`, `cost_at_sale`
  - `created_at`

- **`expenses`**
  - `id`, `title`, `category`
  - `amount`, `notes`
  - `created_at`

- **`purchases`**
  - `id`
  - `type` (`ingredient` | `manual`)
  - `ingredient_id?`, `name`
  - `quantity`, `unit?`
  - `price_per_unit?`, `total`
  - `created_at`

---

## How changes should flow (developer workflow for edits)

### Where to implement changes

- **Routing / access control**: `src/App.tsx`
- **Supabase configuration**: `src/lib/supabase.ts`
- **Role/profile logic**: `src/lib/auth.ts`
- **Database read/write functions**: `src/lib/db.ts`
- **POS behavior**: `src/pages/POSPage.tsx` + `src/store.ts`
- **Stock-in behavior**: `src/pages/StockInPage.tsx`
- **Admin pages**: `src/pages/admin/*`
- **Layouts**: `src/components/*Layout.tsx`

### Recommended workflow for a feature/bugfix

- **Step 1 — Identify the flow**: Which table(s) and which page(s) does it affect?
- **Step 2 — Update the data boundary**: Prefer changing `src/lib/db.ts` first (single source of truth for DB calls).
- **Step 3 — Update UI + state**: Pages call the db layer; Zustand stores local session/cart state only.
- **Step 4 — Typecheck**: run `npm run lint`.
- **Step 5 — Manual smoke test**:
  - Login
  - POS: create an order and ensure it appears in Reports
  - Stock-in: save purchases and ensure they affect Reports cost totals
  - Admin: product reorder persists after refresh

---

## Troubleshooting

### “Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY”

- Confirm `.env` contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart the dev server after changing `.env`

### Login works but admin pages redirect back to `/`

- Your Supabase `profiles.role` is not `admin` for that user
- Ensure a `profiles` row exists with `id = auth.users.id`

### Reports look wrong (profit/cost)

- Orders contribute to revenue and (markup) profit:
  - `orders.total_revenue`
  - `orders.total_profit` (computed at time of sale from product price/cost)
- Purchases + expenses contribute to costs used in net profit:
  - `purchases.total`
  - `expenses.amount`

---

## Appendix: scripts reference

From `package.json`:

- `npm run dev`: start Vite dev server on port 3000
- `npm run build`: create production bundle in `dist/`
- `npm run preview`: serve `dist/` locally
- `npm run lint`: TypeScript typecheck (`tsc --noEmit`)

