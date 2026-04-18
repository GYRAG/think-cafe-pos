# Stock-In Page — Inventory & Purchases

**Route:** `/stock-in`  
**File:** `src/pages/StockInPage.tsx`  
**Access:** All authenticated users (cashier + admin)

---

## Overview

The Stock-In page is used to log all incoming inventory purchases — both tracked ingredients (linked to the ingredients database) and miscellaneous/manual items (e.g. cleaning supplies). It features a tablet-optimized entry form with a custom numpad and a full Georgian on-screen keyboard, eliminating the need for a physical keyboard or standard browser input.

Draft entries persist in `localStorage` between sessions until explicitly saved or cancelled.

---

## Layout Structure

```
┌────────────────────────────────────────────────────────────────┐
│  Header — [← Back] | 📦 შეძენილი პროდუქტები | Date           │
├───────────────────────┬────────────────────────────────────────┤
│  Entry Form (400px)   │  Purchases Table (flex-1)              │
│                       │                                        │
│  [Mode Toggle]        │  ┌──────────────────────────────────┐ │
│                       │  │  Sticky header: Product / Qty /  │ │
│  [Ingredient Form]    │  │  Price / Actions                 │ │
│       OR              │  ├──────────────────────────────────┤ │
│  [Manual Form]        │  │  Scrollable rows                 │ │
│                       │  └──────────────────────────────────┘ │
│  ─────────────────    │                                        │
│  [+ Add to List btn]  │  ────────────────────────────────────  │
│                       │  Total | [Cancel] [Save]               │
└───────────────────────┴────────────────────────────────────────┘
```

On mobile: stacks vertically (form on top, table below).

---

## Header

| Element | Detail |
|---|---|
| Back button (←) | `ArrowLeft` icon — navigates to `/` (Launcher) |
| Title | "📦 შეძენილი პროდუქტები" (Purchased Products) |
| Date | Today's date formatted as Georgian locale (`ka-GE`) |

---

## Left Panel — Entry Form (400px wide)

### Mode Toggle

A two-button segmented control at the top of the form:

| Mode | Label | Purpose |
|---|---|---|
| `ingredient` | ინგრედიენტი | Log a purchase linked to a tracked ingredient from the DB |
| `manual` | სხვა (Other) | Log a freeform purchase with a custom name |

Active mode: `bg-green-600 text-white shadow-md`  
Inactive mode: `text-stone-600 hover:bg-stone-50`

---

### Ingredient Mode Form

#### 1. Ingredient Selector

A scrollable tag-chip list (max-height 300px) organized into category groups:

| Group | Source |
|---|---|
| ⭐ ხშირად გამოყენებული | Top 5 most frequently purchased ingredients (by purchase count) |
| 🕒 ბოლოს გამოყენებული | Last 5 recently purchased ingredients |
| Standard categories | All ingredients grouped by their `category` field (alphabetically) |

Each ingredient renders as a toggle chip:
- Selected: `bg-green-600 text-white border-green-600`
- Unselected: `bg-white text-stone-600 border-stone-200`
- Shows ingredient name + unit in parentheses: e.g. `შაქარი (კგ)`
- Supports **multi-select** — selecting multiple ingredients triggers the cost distribution flow

#### 2. Quantity Input (single ingredient only)

- Quick-adjust buttons: `−10`, `−5`, `−1` (red) and `+1`, `+5`, `+10` (stone)
- Manual text input field below the buttons (type="number", any step)

#### 3. Price Per Unit (single ingredient only)

- Tappable display field — opens the **Numpad Modal** on click
- **Price Memory Chips:** Shows up to 3 previous prices paid for that ingredient as clickable chips for quick reuse

#### 4. Live Total Preview

When quantity and price per unit are both filled, a computed total is shown:
```
ჯამი: XX.XX₾
```

#### 5. Multi-ingredient Mode (2+ selected)

When 2 or more ingredients are selected, the quantity per unit fields are hidden and replaced with a single **Total Price** field. Pressing "Add to list" opens the **Distribution Modal**.

---

### Manual Mode Form

Three fields, all using modal inputs (no native keyboard):

| Field | Input Type | Modal |
|---|---|---|
| Product name | Text | Georgian Keyboard Modal |
| Quantity | Number | Numpad Modal |
| Total price | Number | Numpad Modal |

Placeholder hint: `მაგ. საწმენდი საშუალებები` (e.g. Cleaning supplies)

---

## Right Panel — Purchases Table

A live-updating table of items staged for the current stock-in session.

### Table Columns

| Column | Detail |
|---|---|
| პროდუქტი | Product name (bold) + type badge (`ინგრედიენტი` / `სხვა`) |
| რაოდენობა | Quantity + unit (e.g. `5 კგ`) |
| ფასი | Total cost (bold) + per-unit breakdown for ingredients |
| Actions | Red trash icon — triggers confirmation modal before removal |

### Empty State

When the list is empty, a centered illustration appears:
- `Plus` icon in a stone circle
- "სია ცარიელია" heading
- "დაამატეთ პროდუქტები მარცხენა პანელიდან" subtext

### Footer Bar

- **Total** label + `text-4xl font-black` total GEL amount
- **Cancel** button (`X` icon) — with confirmation modal warning that data will be lost
- **Save** button (`Save` icon, green) — submits all items to Supabase via `addPurchases()`, then clears draft from localStorage and navigates back to `/`

---

## Numpad Modal

Triggered by tapping any numeric field (price, quantity).

```
┌─────────────────────────────┐
│  Field label        [X]     │
│                             │
│  ┌─────────────────────┐   │
│  │         42.50₾      │   │  ← large display
│  └─────────────────────┘   │
│                             │
│  [ 1 ] [ 2 ] [ 3 ]         │
│  [ 4 ] [ 5 ] [ 6 ]         │
│  [ 7 ] [ 8 ] [ 9 ]         │
│  [ . ] [ 0 ] [DEL]         │
│                             │
│  [     დადასტურება    ]     │  ← confirm
└─────────────────────────────┘
```

- Limits decimal input to 2 places
- `DEL` button: red background, `Delete` icon
- Confirm button: `bg-green-600`, full width
- Backdrop: `bg-stone-900/40 backdrop-blur-sm`

---

## Georgian Keyboard Modal

Triggered when tapping the product name field in manual mode.

```
┌──────────────────────────────────────────────────────┐
│  შეიყვანეთ პროდუქტის სახელი           [X]            │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  [typed text...]|                              │  │  ← blinking cursor
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  [ქ][წ][ე][რ][ტ][ყ][უ][ი][ო][პ]                    │
│  [ა][ს][დ][ფ][გ][ჰ][ჯ][კ][ლ][ჭ]                    │
│  [ზ][ხ][ც][ვ][ბ][ნ][მ][ღ][თ][ჟ]                    │
│  [შ][ძ][ჩ][    გამოტოვება   ][DEL]                  │
│                                                      │
│  [          დადასტურება          ]                   │
└──────────────────────────────────────────────────────┘
```

- Slides up from bottom on mobile, centered on desktop
- Space bar labeled "გამოტოვება" (Skip/Space), wider key (`flex-[3]`)
- Backspace shown as red `Delete` icon
- 4 rows of Georgian Mkhedruli characters (QWERTY-like layout)
- Confirm button: `bg-green-600`, full width

---

## Distribution Modal

Opened when 2+ ingredients are selected and "Add to List" is pressed.

**Purpose:** Split a single supplier invoice total across multiple ingredients with adjustable shares.

```
┌──────────────────────────────────────────────────────┐
│  💰 პრიზების განაწილება              [X]             │
│  მთლიანი ჩეკი: 150.00₾                               │
├──────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐    │
│  │  Ingredient Name          Unit               │    │
│  │  Quantity: [___]                             │    │
│  │                                              │    │
│  │  წილი ჩეკში       ──────────────── 75.00₾   │    │
│  │  [range slider]      [  75.00  ]             │    │
│  │                                              │    │
│  │  ბოლო: [50₾] [55₾] [60₾]                    │    │  ← price memory chips
│  └──────────────────────────────────────────────┘    │
│  (repeated for each selected ingredient)              │
├──────────────────────────────────────────────────────┤
│  დარჩენილია: 0.00₾          [გათანაბრება]            │
│  [        + სიაში დამატება        ]                  │
└──────────────────────────────────────────────────────┘
```

### Controls

| Control | Behavior |
|---|---|
| Quantity input | Numeric input for how much of each ingredient was received |
| Range slider | Drag to allocate portion of total invoice to this ingredient |
| Share number input | Direct numeric entry for the allocated share |
| Price Memory chips | Click to auto-calculate share from last-used unit prices × quantity |
| "Remaining" display | Real-time remaining unallocated amount; turns red if over-allocated |
| "გათანაბრება" (Balance) | Auto-distributes remaining amount equally across all items |
| "სიაში დამატება" (Add to List) | Commits all distribution items to the draft list |

### Validation Colors

| State | Color |
|---|---|
| Remaining > 0 | `text-blue-600` |
| Remaining = 0 | `text-green-600` |
| Over-allocated | `text-red-600 animate-pulse` |

---

## Draft Persistence

- On every change to `items`, the list is written to `localStorage` key `stock-in-draft`
- On page load, any saved draft is restored automatically
- Draft is cleared on successful save or explicit cancellation

---

## Data Flow

```
Page Load
  → getIngredients() — fetch all ingredients for selector
  → getPurchases()   — fetch purchase history for price memory + smart groups

handleAddIngredient() (single)
  → validates qty + price
  → appends Purchase item to local `items` state

handleAddIngredient() (multi)
  → opens Distribution Modal
  → handleDistributionComplete() appends multiple items

handleAddManual()
  → validates name + qty + total
  → appends manual Purchase item

handleSave()
  → addPurchases(items) [lib/db.ts]
  → clears localStorage draft
  → showNotification('success')
  → navigate('/')

handleCancel()
  → confirmation modal
  → clears items + localStorage
  → navigate('/')
```

---

## State Summary

| State | Type | Purpose |
|---|---|---|
| `mode` | `'ingredient' \| 'manual'` | Active entry form tab |
| `items` | `Partial<Purchase>[]` | Staged items list (draft) |
| `selectedIngredients` | `string[]` | Currently selected ingredient IDs |
| `ingQuantity` | `string` | Quantity field value |
| `ingPricePerUnit` | `string` | Unit price field value |
| `ingTotalPrice` | `string` | Total price (multi-select mode) |
| `numpadTarget` | string or null | Which field the numpad is editing |
| `numpadValue` | `string` | Current numpad buffer |
| `keyboardTarget` | string or null | Which field the keyboard is editing |
| `keyboardValue` | `string` | Current keyboard buffer |
| `isDistributing` | `boolean` | Distribution modal open/closed |
| `distributionItems` | array | Per-ingredient cost distribution rows |
| `allPastPurchases` | `Purchase[]` | History used for price memory + smart groups |

---

## Design Language

| Property | Value |
|---|---|
| Background | `bg-stone-100` page, `bg-white` panels |
| Primary action | `bg-green-600` (save, confirm, add) |
| Destructive action | `bg-stone-100` for cancel; `text-red-500` for delete |
| Border radius | `rounded-3xl` panels, `rounded-2xl` modals, `rounded-xl` inputs |
| Modal backdrop | `bg-stone-900/40 backdrop-blur-sm` |
| Typography | `font-black` for totals and modal titles, `font-bold` for labels |
| Input hover | `hover:bg-stone-50 cursor-pointer` (tappable display fields) |
