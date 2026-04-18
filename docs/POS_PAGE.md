# POS Page — Point of Sale

**Route:** `/pos`  
**File:** `src/pages/POSPage.tsx`  
**Layout wrapper:** `src/components/POSLayout.tsx`  
**Access:** All authenticated users (cashier + admin)

---

## Overview

The POS Page is the primary sales interface used by cashiers during daily operations. It provides a fast, touch-friendly interface to browse menu items by category, build an order, and complete a checkout. It is wrapped in `POSLayout`, which provides the top navigation bar.

---

## Layout Structure

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
│  └────────────────────────┘  └───────────────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

---

## POSLayout — Top Header Bar

**File:** `src/components/POSLayout.tsx`

The persistent header shown across the POS session.

| Element | Description |
|---|---|
| Home icon (`/`) | Returns to the LauncherPage |
| Cafe logo + name | Branding — "ფიქრის კუთხე" |
| Username badge | Shows logged-in user name and role (`ადმინი` / `მოლარე`) |
| Admin Panel link | Visible only for `admin` role — navigates to `/admin` |
| Logout button | Signs out via Supabase auth |
| Power button | Closes the app window (with confirmation modal) |

---

## Left Panel — Product Catalog (70% width)

### Category Filter Bar

- Horizontally scrollable pill-button row pinned to the top of the product panel
- "All" (`ყველა`) button — shows all active products
- Dynamically generated category buttons — derived from the unique `category` field of loaded products
- Active category: dark stone (`bg-stone-800 text-white`)
- Inactive: light stone (`bg-stone-100 text-stone-600`)
- Scrollbar hidden via `hide-scrollbar` utility for a clean touch experience

### Product Cards Grid

- Responsive grid:
  - 2 columns on small screens
  - 3 columns on `lg`
  - 4 columns on `xl`
- Each card is a `<button>` that adds the product to the cart on tap/click

**Card anatomy:**

```
┌─────────────────────────┐
│  Product Image (144px)  │
│         OR              │   ← image_url or ShoppingBag placeholder
│   [ShoppingBag icon]    │
│                  [₾ XX] │   ← price badge (top-right overlay)
├─────────────────────────┤
│  Product Name (bold)    │
│  Category (muted text)  │
└─────────────────────────┘
```

- Image: `object-cover`, lazy-loaded, `referrerPolicy="no-referrer"`
- Price badge: white pill overlay, top-right corner
- `active:opacity-70` — visual press feedback for touch devices

### Loading & Error States

- **Loading:** Full-height centered green spinning `Loader2` icon
- **Error:** Error message text + "თავიდან ცდა" (Retry) button with `RotateCcw` icon; calls `fetchProducts()` on click
- **Empty filter result:** "პროდუქტები არ მოიძებნა" centered text within the grid

---

## Right Panel — Current Order (30% width)

### Header

- Title: "მიმდინარე შეკვეთა" (Current Order)
- Trash icon button — clears entire cart; only visible when cart is non-empty

### Cart Item List

- Scrollable list; each item rendered by the memoized `CartItem` component
- When cart is empty: large `ShoppingBag` icon with "შეკვეთა ცარიელია" (Order is empty)

#### CartItem Component

Each line item in the cart displays:

| Element | Detail |
|---|---|
| Product name | Bold, truncated if long |
| Line total | `price × quantity` formatted with 2 decimals + `₾` |
| Unit price | Muted subtext: `X.XX₾ / ცალი` |
| Quantity stepper | `-` / count / `+` buttons |
| Remove on last unit | When `quantity === 1`, the `-` button shows a red `Trash2` icon instead of `Minus` |

- `CartItem` is wrapped in `React.memo` — only re-renders when its own quantity changes, preventing unnecessary re-renders when other items are modified.

### Checkout Section (sticky footer)

- Total label + **large total amount** (`text-4xl font-black`)
- **Checkout button** — two-step confirmation UX:
  1. First click → button text changes to "დაადასტურეთ შეკვეთა" (Confirm Order) with a `CheckCircle2` icon, background darkens to `bg-green-700`
  2. Second click → order is submitted to Supabase; button shows spinner + "სრულდება..." (Processing...)
  3. On success → cart is cleared, receipt reminder overlay appears
  4. On failure → global notification modal shows the error
- "გაუქმება" (Cancel) text button appears below during the confirmation step to abort
- Button is disabled when cart is empty or a submission is in progress

---

## Receipt Reminder Overlay

After a successful checkout, a full-screen overlay appears for **3 seconds**:

```
┌───────────────────────────────┐
│                               │
│        [Receipt icon]         │  ← yellow, 96px
│                               │
│    ჩეკი არ დაგავიწყდეს!      │  ← "Don't forget the receipt!"
│                               │
│   (dark semi-opaque backdrop) │
└───────────────────────────────┘
```

- `pointer-events-none` — does not block interaction
- Auto-dismisses after 3000ms via `setTimeout`

---

## Data Flow

```
fetchProducts()
  → getProducts() [lib/db.ts]
  → filters: p.is_active === true
  → stored in local useState

addToCart(product)
  → useStore (Zustand)
  → if product already in cart: increment quantity
  → else: push new OrderItem

completeOrder(cart)
  → [lib/db.ts] — writes order + order_items to Supabase
  → on success: clearCart(), show receipt reminder
  → on failure: showNotification(..., 'error')
```

---

## State Management

| State | Location | Purpose |
|---|---|---|
| `products` | local `useState` | Full list of active products from DB |
| `selectedCategory` | local `useState` | Currently active filter category |
| `confirming` | local `useState` | Controls two-step checkout UX |
| `checkingOut` | local `useState` | Disables UI during async checkout submission |
| `showReceiptReminder` | local `useState` | Controls receipt overlay visibility |
| `posCart` | Zustand store | Shared cart state, persisted across renders |

---

## Performance Considerations

- `useMemo` used for: `categories`, `filteredProducts`, `totalAmount`
- `useCallback` used for: `handleAddToCart`, `handleUpdateQty`, `handleClearCart`, `handleCheckoutClick`
- `React.memo` on `CartItem` — avoids full cart list re-render on single item changes
- Product images use `loading="lazy"` and `decoding="async"`

---

## Design Language

| Property | Value |
|---|---|
| Background | `bg-stone-50` (product grid), `bg-white` (order panel) |
| Primary action color | `bg-green-600` (checkout), `bg-stone-800` (active category) |
| Border radius | `rounded-2xl` on cards, `rounded-xl` on category pills |
| Typography | `font-black` for totals and headings, `font-bold` for product names |
| Spacing | `gap-4` product grid, `p-6` panel padding |
| Dividers | `border-r border-stone-200` vertical split, `border-t border-stone-200` checkout footer |
