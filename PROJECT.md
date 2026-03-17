# Cafe POS System (ფიქრის კუთხე) — Project Description & User Workflows

This document is a **product-style description** of the Cafe POS System, focused on:

- **What the project is** (features, goals, and key concepts)
- **Cashier workflow** (which pages they pass through and what’s on each page)
- **Admin workflow** (dashboard, products, expenses, reports, users)
- **What data is created/updated** when users take actions

---

## What this project is

**Cafe POS System** is a browser-based point-of-sale and operations tool for a café:

- **Sell products fast** using a touch-friendly POS screen
- **Track revenue automatically** via orders and order items
- **Track costs** via purchases (stock-in) and expenses
- **Get admin analytics** (sales vs costs, net profit trends, exports)

It’s built as a single-page web app with:

- **Login + roles**: cashier vs admin
- **POS workflow**: choose items → checkout → save order
- **Operations workflow**: record purchases and expenses
- **Admin workflow**: manage products, view reports and dashboard

---

## Roles & permissions (how access works)

The app has two roles:

- **Cashier (მოლარე)**:
  - Can use **POS selling** and **Stock-in**
  - Cannot open admin routes (`/admin/*`)

- **Admin (ადმინი)**:
  - Can do everything a cashier can
  - Can access **Admin Panel** pages (`/admin/*`)

Role is loaded after login from Supabase table `profiles`:

- `profiles.role` controls whether admin routes are available.

---

## App map (all main routes)

- **`/`**: Launcher (choose POS / Stock-in / Reports)
- **`/pos`**: POS selling (inside `POSLayout`)
- **`/stock-in`**: Stock-in / Purchases entry
- **`/admin/dashboard`**: Admin dashboard (KPIs + charts)
- **`/admin/products`**: Products management (CRUD + reorder + activate/deactivate)
- **`/admin/expenses`**: Expenses management (CRUD + timestamp)
- **`/admin/reports`**: Full reports (filters + charts + tables + export)
- **`/admin/users`**: Users page (currently a demo UI list)

If the user is not logged in, the app shows the **Login page** (no route change).

---

## Flow chart (pages + data writes)

> Tip: this uses **Mermaid**. If your Markdown viewer doesn’t render it, open the file in GitHub or a Mermaid-enabled preview.

```mermaid
flowchart TD
  A([Open app]) --> B{Supabase session exists?}
  B -- No --> L[Login page\n- email\n- password\n- Sign in]
  L -->|signInWithPassword| B

  B -- Yes --> P[Load profile\nfrom profiles table\n(role + display_name)]
  P --> R{Role?}

  %% Cashier / shared path
  R -- cashier --> H[Launcher (/)\n- POS\n- Stock-in\n- Logout]
  R -- admin --> H

  H --> POS[POS (/pos)\n- categories\n- product grid\n- cart\n- 2-step checkout]
  POS -->|checkout confirmed| O[(Insert orders)]
  O --> OI[(Insert order_items)]
  OI --> POS

  H --> SI[Stock-in (/stock-in)\n- ingredient mode\n- manual mode\n- draft localStorage\n- Save]
  SI -->|Save| PU[(Insert purchases)]
  PU --> H

  %% Admin-only area
  R -- admin --> AD[Admin layout (/admin/*)\nSidebar navigation]
  AD --> D[Dashboard (/admin/dashboard)\nKPIs + revenue chart + top products\n(READ: orders, order_items, expenses)]
  AD --> PR[Products (/admin/products)\nCRUD + reorder\n(READ/WRITE: products)]
  PR -->|Create/Update| PROD_UP[(Upsert products)]
  PR -->|Reorder| PROD_SORT[(Update sort_order)]
  PR -->|Delete| PROD_DEL[(Delete product)]

  AD --> EX[Expenses (/admin/expenses)\nCRUD + timestamp\n(READ/WRITE: expenses)]
  EX -->|Create| EX_ADD[(Insert expense)]
  EX -->|Update| EX_UPD[(Update expense)]
  EX -->|Delete| EX_DEL[(Delete expense)]

  AD --> RP[Reports (/admin/reports)\nFilters + charts + export\n(READ: orders, order_items, purchases, expenses)]

  AD --> U[Users (/admin/users)\nDemo UI list (not DB-backed yet)]
```

## Cashier workflow (step-by-step)

### 1) Login screen

- **Shown when**: user is not authenticated in Supabase
- **What’s on the page**:
  - Café logo + title
  - Email field
  - Password field
  - “შესვლა” (Login) button with loading state and error banner
- **What happens on submit**:
  - Calls Supabase auth `signInWithPassword`
  - On success, the app loads the user profile and role automatically

**Success criteria**:
- After login, user is redirected by UI state to the app content (Launcher).

---

### 2) Launcher (`/`)

Think of this as the **home hub** for staff.

- **What’s on the page**:
  - Big “კაფის კონტროლი” title
  - Main actions (large touch-friendly cards):
    - **“გაყიდვების გვერდი”** → opens POS (`/pos`)
    - **“შევსება / ხარჯები”** → opens Stock-in (`/stock-in`)
    - **“ანგარიშები”** → admin-only shortcut to Reports (`/admin/reports`)
  - Logout button (top-right)

**Cashier path from here**:
- Usually: Launcher → POS → complete an order → back to Launcher

---

### 3) POS selling (`/pos`)

This is the core cashier screen: **choose products → build cart → checkout**.

#### Layout / structure

The screen is split into two panels:

- **Left (Products, ~70%)**
  - Category pill buttons (including “ყველა”)
  - Product grid
  - Each product card shows:
    - Image (or placeholder)
    - Name
    - Category
    - Price badge

- **Right (Current order, ~30%)**
  - Order title (“მიმდინარე შეკვეთა”)
  - Cart items list (each item row is memoized for performance)
  - Clear cart (trash icon)
  - Total amount in large text
  - Checkout button (two-step confirm)

#### Actions a cashier performs

- **Add item**: tap a product card → it’s added to the cart
- **Change quantity**:
  - “+” increases quantity
  - “-” decreases quantity
  - when quantity is 1, the “-” becomes a trash icon and removes the item
- **Clear cart**: trash icon in header clears all items
- **Checkout (two-step)**:
  - First tap: switches button into “confirm” state
  - Second tap: saves the order

#### What data is written on checkout

On final confirmation, the app:

- Creates an `orders` row with:
  - total revenue
  - markup profit (based on product price - cost at time of sale)
- Creates `order_items` rows (one row per cart item) including:
  - product id, name
  - quantity
  - price_at_sale, cost_at_sale

#### What cashiers should see after checkout

- Cart clears
- The POS stays ready for the next customer
- Admin pages (Dashboard/Reports) will reflect the new order

---

### 4) Stock-in (`/stock-in`)

Stock-in is the cashier-friendly way to record **purchases** (ingredients or other items).

#### Modes (tabs)

- **ინგრედიენტი (Ingredient)**
  - Choose ingredient from a predefined list
  - Enter quantity
  - Enter price per unit (via numpad modal)
  - App computes total automatically

- **სხვა პროდუქტი (Manual / Other)**
  - Enter item name (via Georgian on-screen keyboard modal)
  - Enter quantity (numpad modal)
  - Enter total cost (numpad modal)

#### What’s on the page

- Header with back button to Launcher
- Date display
- Entry form (left)
- Purchases table (right)
  - rows show name, type, quantity/unit, totals
  - remove row action
- Bottom bar with:
  - total cost sum
  - Cancel (clears)
  - Save (writes to DB)

#### Draft safety

- The list is persisted in `localStorage` as `stock-in-draft`
- Refreshing the page won’t lose the draft

#### What data is written on Save

Saves rows into `purchases` table:

- Ingredient purchases: type `ingredient` + `ingredient_id`, `unit`, `price_per_unit`
- Manual purchases: type `manual` + free text name

These costs appear in **Reports** and reduce net profit.

---

## Admin workflow (step-by-step)

Admins do everything cashiers do, plus they have an **Admin Panel**.

### 1) Entering Admin Panel

Admins can open Admin Panel from:

- POS top bar button **“ადმინ პანელი”**, or
- Launcher shortcut to Reports

Admin pages share a common layout:

- Left sidebar navigation:
  - Dashboard, Products, Expenses, Reports, Users
- Footer actions:
  - Back to POS
  - Logout
  - Close app

---

### 2) Admin Dashboard (`/admin/dashboard`)

The dashboard is the “at a glance” status page.

#### Controls

- Period toggle:
  - **დღეს** (daily)
  - **კვირა** (weekly)
  - **თვე** (monthly)

#### KPIs / cards shown

- **Revenue** for the chosen period
- **Expenses** for the chosen period (from `expenses`)
- **Net profit**:
  - derived from order markup profit minus expenses for the period
- **Order count**

#### Charts & lists

- Bar chart: revenue trend over time (depending on selected period)
- “Top products” list:
  - ranks by quantity sold (from `order_items`)

---

### 3) Products (`/admin/products`)

This is where admins maintain the menu used by the POS.

#### What’s on the page

- Products table with columns:
  - sort handle (drag)
  - image
  - name
  - category
  - price
  - cost
  - active status
  - actions (edit/delete)

#### Key actions

- **Create product**:
  - Opens modal, enter name, price, cost, category, image URL, active toggle
- **Edit product**:
  - Opens modal prefilled with product fields
- **Delete product**
- **Reorder products** (drag-and-drop):
  - Updates `sort_order` for all products to match the new order

#### Why this matters

- POS page loads products ordered by `sort_order`
- POS filters to `is_active = true`

---

### 4) Expenses (`/admin/expenses`)

Expenses are direct costs (utilities, maintenance, supplies, etc.) that affect net profit.

#### What’s on the page

- Expenses table:
  - date/time
  - title
  - category
  - amount
  - notes
  - actions (edit/delete)
- Add expense button opens a modal form

#### Key actions

- Add expense:
  - title, timestamp, amount, category, notes
- Edit expense:
  - same fields, prefilled
- Delete expense

These values are included in Reports cost calculations.

---

### 5) Reports (`/admin/reports`)

Reports are the “finance center”: filter time → review → export.

#### Time filtering

- Today / This week / This month / All time / Custom date range

#### Summary cards

- **Sales** (total revenue)
- **Costs** (purchases + other costs)
- **Estimated net profit** (sales - costs)

#### Charts and tables

- Revenue vs cost chart
- Net profit trend
- Tables:
  - net profit report by period
  - products sold (ranked)
  - ingredients bought (with avg price)

#### Export

- CSV export
- Excel export (includes multiple sheets)

---

### 6) Users (`/admin/users`)

This page is currently a **demo UI** (does not manage real Supabase users yet).

- Shows a small list of sample users
- Buttons for add/edit/delete show demo alerts

If you want this to be real, the next step is designing a user management approach:
- Supabase auth admin APIs (server-side), or
- A `profiles` management UI that updates roles/display names only

---

## “What happens behind the scenes” (in plain language)

- **Login** gives a Supabase session
- The app reads `profiles` to decide **cashier vs admin**
- **POS checkout** writes:
  - `orders` (one per order)
  - `order_items` (one per product per order)
- **Stock-in save** writes:
  - `purchases` (ingredient/manual costs)
- **Expenses** writes:
  - `expenses` (direct costs)
- **Dashboard/Reports** read and aggregate:
  - orders + order_items + purchases + expenses

---

## Suggested “happy path” walkthroughs

### Cashier happy path

- Login
- Launcher → POS
- Add 3–5 items, adjust quantities
- Checkout (confirm)
- Back to Launcher
- Launcher → Stock-in
- Add an ingredient purchase, Save

### Admin happy path

- Login as admin
- Open Admin Panel
- Dashboard: switch day/week/month and verify KPIs
- Products: add a new product + reorder list
- Expenses: add a utility expense
- Reports: set timeframe and export Excel

