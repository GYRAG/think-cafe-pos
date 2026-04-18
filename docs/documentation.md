# Think Corner Cafe POS - Full System Documentation

This document provides a comprehensive guide to all user interfaces and functional modules within the Think Corner Cafe POS system.

---

## 📱 Point of Sale (POS) Page

**Route:** `/pos`  
**File:** `src/pages/POSPage.tsx`  
**Layout wrapper:** `src/components/POSLayout.tsx`  
**Access:** All authenticated users (cashier + admin)

### Overview
The POS Page is the primary sales interface used by cashiers during daily operations. It provides a fast, touch-friendly interface to browse menu items by category, build an order, and complete a checkout. It is wrapped in `POSLayout`, which provides the top navigation bar.

### Layout Structure
```
┌──────────────────────────────────────────────────────────────┐
│  POSLayout — Top Header Bar (64px)                           │
│  [Home] | Logo | Username/Role | [Admin Panel] [Logout] [X]  │
├──────────────────────────────────────────────────────────────┤
│  POSPage — Split Layout (100% remaining height)              │
│                                                              │
│  ┌────────────────────────┐  ┌───────────────────────┐      │
│  │  Product Grid (70%)    │  │  Current Order (30%)  │      │
│  │                        │  │                       │      │
│  │  [Category Filter Bar] │  │  Order header + clear │      │
│  │                        │  │                       │      │
│  │  [Product Cards Grid]  │  │  Scrollable cart items│      │
│  │  2-4 columns           │  │                       │      │
│  │  (responsive)          │  │  ─────────────────── │      │
│  │                        │  │  Total + Checkout btn │      │
│  │  └─────────────────────┘  └───────────────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

### Top Header Bar (POSLayout)
- **Home icon (`/`)**: Returns to the LauncherPage.
- **Username badge**: Shows logged-in user name and role (`ადმინი` / `მოლარე`).
- **Admin Panel link**: Visible only for `admin` role.
- **Power button**: Closes the app window with a confirmation modal.

### Product Catalog (Left Panel)
- **Category Filter Bar**: Horizontally scrollable row of Georgian category buttons.
- **Product Cards**: Responsive grid (2-4 columns) with large images and price badges.
- **States**: Includes animated loading spinners, error retry buttons, and empty result filters.

### Current Order (Right Panel)
- **Cart Management**: Real-time quantity adjustments, unit price breakdowns, and "last item" trash icon logic.
- **Two-Step Checkout**: A "Confirm" state prevents accidental clicks. The button background darkens and changes icon upon the first tap.
- **Receipt Reminder**: A floating 3-second overlay appearing after successful checkout to remind staff to provide the bill.

---

## 📦 Stock-In Page — Inventory & Purchases

**Route:** `/stock-in`  
**File:** `src/pages/StockInPage.tsx`  
**Access:** All authenticated users (cashier + admin)

### Overview
The Stock-In page logs all incoming inventory. It features a tablet-optimized entry form with custom numpads and a Georgian on-screen keyboard, eliminating the need for a physical keyboard on tablets. Drafts persist in `localStorage` until saved.

### Dual-Mode Entry Form
-   **Ingredient Mode**: Linked to the ingredients database. Supports multi-selection for bulk invoice distribution.
-   **Manual Mode**: For ad-hoc items (e.g., cleaning supplies). Requires a name (via keyboard modal), quantity, and total price.

### Tablet-Optimized Inputs
-   **Numpad Modal**: Large, touch-friendly grid for numeric entry with 2-place decimal limits.
-   **Georgian Keyboard**: A full Mkhedruli layout with a standard space bar and delete keys.
-   **Distribution Modal**: When 2+ ingredients are selected, this tool allows managers to split a single supplier total across items using range sliders or manual number entry. Features "Balance" buttons to auto-calculate remaining shares.

### Data Persistence
-   Automatic restoration from `localStorage` (`stock-in-draft`) ensures work is not lost if the browser refreshes or the app closes unexpectedly.

---

## 🛠️ Admin Panel

**Base Route:** `/admin`  
**Layout:** `src/components/AdminLayout.tsx`  
**Access:** `admin` role only.

### Sidebar Navigation
- Optimized `w-64` persistent sidebar with localized links:
    - **დაფა (Dashboard)**: Real-time KPIs and Revenue charts.
    - **პროდუქტები (Products)**: Item management with Drag-and-Drop sorting.
    - **ხარჯები (Expenses)**: Categorized overhead tracking with date filters.
    - **რეპორტები (Reports)**: Advanced analytics and multi-tab Excel/CSV export.
    - **ინგრედიენტები (Ingredients)**: Master units and category management.
    - **მომხმარებლები (Users)**: Staff profile management (Demo state).

### Functional Highlights
-   **Dashboard**: Features a 4-column KPI grid and a dynamic Recharts BarChart that adjusts granularity (7-day/Weekly/Monthly) based on the current period.
-   **Product Management**: Uses `@dnd-kit` for optimistic UI reordering. Persistence is handled via a `sort_order` integer in the database.
-   **Expenses Filtering**: A custom horizontal pill filter (Today / This Week / This Month / Custom) implemented to handle years of data without UI lag.
-   **Advanced Reporting**:
    -   Combined Bar Charts for Revenue vs. Expenses.
    -   Blue-gradient Profit Trend Line Charts.
    -   Forensic Data Tables: Product performance, Ingredient distribution, and General expense logs.
    -   **Excel Engine**: Async loading of `xlsx` library to generate multi-sheet financial reports on demand.

### Security
Role enforcement is handled at the routing level (`App.tsx`). Non-admin users attempting to access `/admin/*` are silently redirected to the launcher.
