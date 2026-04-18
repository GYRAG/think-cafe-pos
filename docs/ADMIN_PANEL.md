# Admin Panel

**Base Route:** `/admin`  
**Layout:** `src/components/AdminLayout.tsx`  
**Access:** `admin` role only — cashiers are redirected to `/`

---

## Overview

The Admin Panel is a full back-office management system accessible exclusively to users with the `admin` role. It is structured as a sidebar navigation layout with six sub-pages: Dashboard, Products, Expenses, Reports, Ingredients, and Users. All admin pages are **lazy-loaded** — their JavaScript is only downloaded when the user navigates to `/admin`.

---

## Admin Layout

**File:** `src/components/AdminLayout.tsx`

```
┌──────────────────┬──────────────────────────────────────────┐
│  Sidebar (256px) │  Main Content Area (flex-1)              │
│                  │                                          │
│  [Logo + Name]   │  <Outlet /> — active sub-page renders   │
│                  │  here with p-8 padding                   │
│  Navigation:     │                                          │
│  • დაფა          │                                          │
│  • პროდუქტები    │                                          │
│  • ხარჯები       │                                          │
│  • რეპორტები     │                                          │
│  • ინგრედიენტები │                                          │
│  • მომხმარებ.    │                                          │
│                  │                                          │
│  ─────────────── │                                          │
│  [← POS Return]  │                                          │
│  [Logout]        │                                          │
│  [Power/Close]   │                                          │
└──────────────────┴──────────────────────────────────────────┘
```

### Sidebar

- Fixed `w-64` width, full screen height
- **Logo + cafe name** at the top with the brand image
- **Navigation links** — each link highlights green (`bg-green-100 text-green-800`) when its path is active
- **Bottom actions:**
  - "POS-ში დაბრუნება" — returns to Launcher page (`/`)
  - "გასვლა" (Logout) — red text, signs out via Supabase
  - "დახურვა" (Close app) — closes the browser window with a confirmation modal

---

## Page 1: Dashboard

**Route:** `/admin/dashboard`  
**File:** `src/pages/admin/DashboardPage.tsx`

The main overview page showing business performance at a glance.

### Period Selector

Segmented control (top-right of header):

| Option | Label | Filter |
|---|---|---|
| `daily` | დღეს (Today) | `isToday()` |
| `weekly` | კვირა (Week) | `isThisWeek()` (Mon start) |
| `monthly` | თვე (Month) | `isThisMonth()` |

### Summary KPI Cards (4-column grid)

| Card | Icon | Color | Metric |
|---|---|---|---|
| შემოსავალი (Revenue) | DollarSign | green | Sum of `total_revenue` for period orders |
| ხარჯები (Expenses) | Receipt | red | Sum of `amount` for period expenses |
| წმინდა მოგება (Net Profit) | TrendingUp/Down | blue/orange | `total_profit` from orders − expenses |
| შეკვეთები (Orders) | ShoppingBag | purple | Count of orders in period |

- Net profit card icon switches between `TrendingUp` (blue) and `TrendingDown` (orange) based on positive/negative value

### Revenue Chart (2/3 width)

- `Recharts` `BarChart` — green bars (`#16a34a`), rounded tops
- Dynamic time axis based on selected period:
  - **Daily:** Last 7 days, x-axis = day names (Georgian locale)
  - **Weekly:** Each day of current week
  - **Monthly:** Each day of current month, x-axis = day numbers
- Custom tooltip with `borderRadius: 16px`, no border
- Title changes with period: "ბოლო 7 დღის შემოსავალი" / "ამ კვირის..." / "ამ თვის..."

### Top Products (1/3 width)

- Ranked list of up to 5 best-selling products for the selected period
- Ranked badges: circular, orange background, green text
- Shows: rank number, product name, quantity sold in units (`ცალი`)

---

## Page 2: Products

**Route:** `/admin/products`  
**File:** `src/pages/admin/ProductsPage.tsx`

Full CRUD management for menu products with drag-and-drop reordering.

### Product Table

Columns:

| Column | Content |
|---|---|
| რიგი (Order) | `GripVertical` drag handle |
| სურათი (Image) | 48×48px rounded thumbnail |
| სახელი (Name) | Bold product name |
| კატეგორია (Category) | Stone pill badge |
| ფასი (Price) | Selling price in `₾` |
| თვითღირებულება (Cost) | Cost price in `₾` |
| სტატუსი (Status) | Green `აქტიური` or Red `გათიშული` pill badge |
| ქმედებები (Actions) | Edit (blue) + Delete (red) icon buttons |

### Drag-and-Drop Reordering

- Implemented with `@dnd-kit/core` and `@dnd-kit/sortable`
- Sensors: `PointerSensor` (mouse/touch) + `KeyboardSensor` (accessibility)
- Dragging row gets elevated appearance: `z-index: 10`, subtle shadow, stone background
- On `dragEnd`: **optimistic UI update** (reorders state immediately) → `updateProductOrder()` call → reverts on failure
- Sort order persisted to Supabase as `sort_order` integer on each product

### Add / Edit Modal

Triggered by the "პროდუქტის დამატება" button (top-right) or the edit pencil icon.

Fields:

| Field | Input | Validation |
|---|---|---|
| სახელი (Name) | Text | Required |
| ფასი (Price) | Number `step=0.01` | Required, min 0 |
| თვითღირებულება (Cost) | Number `step=0.01` | Required, min 0 |
| კატეგორია (Category) | Text | Required |
| სურათის URL (Image URL) | URL input | Optional |
| პროდუქტი აქტიურია (Is Active) | Checkbox | Default: true |

- Modal header changes between "ახალი პროდუქტი" and "პროდუქტის რედაქტირება"
- Save button: `bg-orange-600` (distinct from other pages)
- Backdrop: `bg-stone-900/50 backdrop-blur-sm`

### Delete Flow

- Clicking trash icon opens a **confirmation modal** via `showNotification()`
- On confirm: `deleteProduct(id)` → refresh list → success notification

---

## Page 3: Expenses

**Route:** `/admin/expenses`  
**File:** `src/pages/admin/ExpensesPage.tsx`

Tracks and manages operational expenses (utilities, maintenance, supplies, etc.).

### Time Period Filter

Horizontal pill-button bar with active state `bg-red-600 text-white`:

| Option | Filter |
|---|---|
| დღეს (Today) | `isToday()` |
| ეს კვირა (This week) | `isThisWeek()` |
| ეს თვე (This month) | `isThisMonth()` |
| სრული დრო (All time) | No filter |
| მორგებული (Custom) | Date range picker appears inline |

Custom date range: two `<input type="date">` fields separated by "−".

### Summary Card

A compact card showing total expenses for the selected period:
- Red `TrendingDown` icon
- Large red `text-4xl font-black` total
- "შერჩეული პერიოდის მიხედვით" caption

### Expenses Table

Columns:

| Column | Content |
|---|---|
| თარიღი (Date) | `dd/MM/yyyy HH:mm` format |
| სახელი (Name) | Bold expense title |
| კატეგორია (Category) | Stone pill badge (translated to Georgian) |
| თანხა (Amount) | Red bold GEL amount |
| შენიშვნა (Notes) | Truncated notes, full text in `title` tooltip |
| ქმედებები (Actions) | Edit (blue) + Delete (red) |

### Categories

| Internal Key | Display (Georgian) |
|---|---|
| კომუნალურები | კომუნალურები (Utilities) |
| ინგრედიენტები | ინგრედიენტები (Ingredients) |
| მომსახურება | მომსახურება (Maintenance) |
| მასალები | მასალები (Supplies) |
| სხვა | სხვა (Other) |

### Add / Edit Modal

Fields:

| Field | Input |
|---|---|
| სახელი (Title) | Text, required |
| თარიღი და დრო (Timestamp) | `datetime-local` input, required |
| თანხა (Amount) | Number `step=0.01`, required |
| კატეგორია (Category) | `<select>` dropdown |
| შენიშვნა (Notes) | Textarea (resizable off, fixed `h-24`) |

- Save button: `bg-red-600` — thematically red for expense context
- Focus ring color: `ring-red-500`

---

## Page 4: Reports

**Route:** `/admin/reports`  
**File:** `src/pages/admin/ReportsPage.tsx`

The most comprehensive page — financial analytics with charts and export capabilities.

### Header Controls

- Page title + subtitle
- **CSV Export** button — generates and downloads a UTF-8 BOM CSV of financial report data
- **Excel Export** button (`bg-green-600`) — async imports `xlsx` library and generates a multi-sheet `.xlsx` file with 4 sheets: ფინანსები, გაყიდვები, შეძენილი ინგრედიენტები, ხარჯები

### Time Period Filter

Same as Expenses page (Today / This week / This month / All time / Custom date range), green active state.

### Summary Cards (3-column)

| Card | Color | Content |
|---|---|---|
| ხარჯები (Expenses) | Red | Total cost: ingredients + other purchases + direct expenses; breakdown below |
| გაყიდვები (Sales) | Green | Total revenue from orders |
| მოგება (Profit) | Blue gradient | `sales − purchases`; labeled "სავარაუდო სუფთა მოგება" (estimated net profit) |

The Expenses card shows a sub-breakdown:
- ინგრედიენტები: `₾XX`
- სხვა ხარჯები: `₾XX`

Profit card uses `linear-gradient(to right bottom, #2563eb, #1d4ed8)` — stands out visually.

### Charts (2-column grid)

#### Revenue vs Expenses Bar Chart

- Side-by-side green (`#16a34a`) and red (`#dc2626`) bars per period
- Period granularity: daily for short ranges, monthly for long ranges (>45 days or all-time)

#### Net Profit Trend Line Chart

- Blue line (`#2563eb`), `strokeWidth: 3`
- Dots at each data point (`r: 4`), larger on hover (`r: 6`)
- Visualizes net profit = revenue − all expenses over time

### Data Tables (2×2 grid, each 500px tall, scrollable)

#### 1. Net Profit Report

| Column | Content |
|---|---|
| პერიოდი | Date label (day or month) |
| შემოსავალი | Revenue (green) |
| ხარჯები | Expenses (red) |
| წმინდა მოგება | Net profit (blue bold) |

#### 2. Products Sold

| Column | Content |
|---|---|
| # | Rank |
| სახელი | Product name |
| რაოდენობა | Units sold |
| ჯამი | Revenue from product (orange) |

Sorted descending by quantity sold.

#### 3. Ingredients Purchased

| Column | Content |
|---|---|
| # | Rank |
| სახელი | Ingredient name |
| რაოდენობა | Total quantity + unit |
| საშ. ფასი | Average price per unit |
| ჯამი | Total spent (red) |

Sorted descending by total money spent.

#### 4. General Expenses List

| Column | Content |
|---|---|
| თარიღი | `dd/MM/yy HH:mm` |
| დასახელება | Title + optional truncated notes |
| კატეგორია | Tiny uppercase badge |
| თანხა | Red amount |

Sorted descending by timestamp.

### Export Files

**CSV:** Single sheet — period, revenue, expenses, net profit  
**Excel (.xlsx):** 4 sheets:
- `ფინანსები` — financial summary
- `გაყიდვები` — products sold
- `შეძენილი ინგრედიენტები` — ingredients bought
- `ხარჯები` — expense log

File named: `full_report_YYYY-MM-DD.xlsx`

---

## Page 5: Ingredients

**Route:** `/admin/ingredients`  
**File:** `src/pages/admin/IngredientsPage.tsx`

Manages the master list of ingredients available for selection in the Stock-In page.

### Ingredients Table

Columns:

| Column | Content |
|---|---|
| # | Row number |
| დასახელება (Name) | Ingredient name |
| კატეგორია (Category) | Category label |
| ერთეული (Unit) | Unit of measure (e.g. კგ, ლ, ცალი) |
| ქმედება (Action) | Edit (blue) + Delete (red) |

### Inline Row Editing

When the edit button is clicked on a row, all three text fields in that row become **inline input fields** — no modal is opened. Two action icons appear:
- `X` — cancel edit
- `Check` — save changes

This avoids a modal interrupt for a simple data edit operation.

### Add Ingredient Form

Toggled by the "დამატება" button (top-right), which transforms into a "გაუქმება" cancel button.

When expanded, an inline form appears above the table:
- Name input (`დასახელება`) — required
- Category input (`კატეგორია`) — default: `ზოგადი`
- Unit input (`საზომი ერთეული`) — default: `კგ`; placeholder: `კგ / ლ / ცალი`
- Save button: disabled until name + unit are filled

---

## Page 6: Users

**Route:** `/admin/users`  
**File:** `src/pages/admin/UsersPage.tsx`

A user management view — currently a **demo/placeholder** implementation.

### What it shows

- Static list of 2 mock users: `admin` (admin role) and `cashier` (cashier role)
- Role badge: purple for admin, blue for cashier
- "თქვენ" (You) tag shown next to the currently logged-in user
- Role icons: `Shield` for admin, `User` for cashier

### Current Limitations

- The "Add User" button shows a notification: "მომხმარებლის დამატება (დემო ვერსია)"
- Edit and Delete buttons show notifications indicating demo mode
- Delete is disabled for the currently logged-in user
- Users are not fetched from Supabase — hardcoded in component state

This page is a UI scaffold for future real user management via Supabase Auth.

---

## Access Control

Role enforcement is implemented in `App.tsx`:

```tsx
{user.role === 'admin' ? (
  <Route path="/admin" element={<AdminLayout />}>
    ...admin routes...
  </Route>
) : (
  <Route path="/admin/*" element={<Navigate to="/" replace />} />
)}
```

- Non-admin users navigating to any `/admin/*` URL are silently redirected to `/`
- The Admin Panel link in POSLayout is also conditionally rendered — only shown for `admin` role

---

## Design Language

| Property | Value |
|---|---|
| Sidebar background | `bg-white`, `border-r border-stone-200` |
| Active nav link | `bg-green-100 text-green-800 font-medium` |
| Main content background | `bg-stone-100` |
| Card style | `bg-white rounded-3xl shadow-sm border border-stone-100` |
| Table header | `bg-stone-50` sticky, `uppercase tracking-wider text-stone-500` |
| Table rows | `hover:bg-stone-50/50 transition-colors divide-y divide-stone-100` |
| Modal backdrop | `bg-stone-900/50 backdrop-blur-sm` |
| Primary CTA per page | Green (Dashboard/Products/Ingredients), Red (Expenses), Green (Reports), Dark stone (Users) |
| Typography | `font-black` for KPI numbers, `font-bold` for headings and table values |
