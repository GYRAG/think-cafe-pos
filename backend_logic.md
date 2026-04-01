# Café POS — Backend Logic & Calculations

All data lives in **Supabase (PostgreSQL)**. The frontend reads/writes via the Supabase JS client in [`db.ts`](file:///c:/Users/kinkl/OneDrive/Desktop/web-projects/cafe-pos-system/src/lib/db.ts).

---

## Database Tables

| Table | Purpose |
|---|---|
| `products` | Menu items with `price` (sale price) and `cost` (ingredient cost) |
| `orders` | One row per completed sale session |
| `order_items` | Individual line items belonging to an order |
| `expenses` | Manual one-off expenses (rent, utilities, etc.) |
| `purchases` | Stock-in records (ingredient / manual / quick) |
| `ingredients` | Reference list of tracked ingredients |

---

## 1. Completing a Sale (POS Page)

```mermaid
flowchart TD
    A[Cashier taps products] --> B[Cart built in memory\nvia Zustand store]
    B --> C[Tap 'შეკვეთის დასრულება']
    C --> D[Confirm tap]
    D --> E{completeOrder called}
    E --> F["total_revenue = Σ(price × qty)"]
    E --> G["total_profit = Σ((price − cost) × qty)"]
    F & G --> H[INSERT into orders\ntotal_revenue, total_profit]
    H --> I[INSERT into order_items\none row per cart item\nprice_at_sale, cost_at_sale snapshotted]
    I --> J[Cart cleared\nReceipt reminder shown]
```

### Formulas

```
total_revenue  = Σ ( product.price × quantity )
total_profit   = Σ ( (product.price − product.cost) × quantity )
```

> `price_at_sale` and `cost_at_sale` are **snapshotted at the moment of sale** so historical reports remain accurate even if product prices change later.

---

## 2. Stock In / Purchases

Three purchase types all write to the `purchases` table:

```mermaid
flowchart TD
    A[Stock In Screen] --> B{Mode?}
    B -->|ინგრედიენტი| C[Select ingredient from list\nEnter quantity + price/unit]
    B -->|სხვა პროდუქტი| D[Enter name + quantity + total]
    B -->|სწრაფი შეძენა| E[Enter name + total only]

    C --> F["total = quantity × price_per_unit\ntype = 'ingredient'"]
    D --> G["type = 'manual'\nquantity stored"]
    E --> H["type = 'quick'\nquantity = 0\ntotal entered directly"]

    F & G & H --> I[Batch INSERT into purchases\nvia addPurchases]
    I --> J[Draft cleared from localStorage]
```

### Data stored per type

| Field | ingredient | manual | quick |
|---|---|---|---|
| `type` | `'ingredient'` | `'manual'` | `'quick'` |
| `name` | ingredient name | free text | free text |
| `quantity` | entered | entered | `0` |
| `unit` | from ingredient | — | — |
| `price_per_unit` | entered | — | — |
| `total` | qty × ppu | entered | entered |

---

## 3. Expenses

Direct expenses (rent, repairs, etc.) are separate from purchases:

```mermaid
flowchart LR
    A[Admin enters expense\ntitle + amount + category] --> B[INSERT into expenses]
    B --> C[Counted in Reports\nas directExpenses]
```

---

## 4. Reports — How Everything Is Calculated

```mermaid
flowchart TD
    A[ReportsPage loads] --> B[Fetch all:\norders, order_items, expenses, purchases]
    B --> C[Apply date filter\ntoday / this week / this month / all time / custom]

    C --> D[filteredOrders]
    C --> E[filteredExpenses]
    C --> F[filteredPurchases]

    D --> G["salesTotal = Σ(total_revenue)"]

    F --> H["ingredientsCost\n= Σ total WHERE type = 'ingredient'"]
    F --> I["manualCost\n= Σ total WHERE type = 'manual'"]
    F --> J["quickCost\n= Σ total WHERE type = 'quick'"]
    E --> K["directExpenses = Σ(amount)"]

    H & I & J & K --> L["otherCost\n= manualCost + quickCost + directExpenses"]
    H & L --> M["totalCosts\n= ingredientsCost + otherCost"]

    G & M --> N["profit = salesTotal − totalCosts"]
```

### Summary Card formulas

```
salesTotal       = Σ orders.total_revenue           (what customers paid)

ingredientsCost  = Σ purchases.total  [type='ingredient']
manualCost       = Σ purchases.total  [type='manual']
quickCost        = Σ purchases.total  [type='quick']
directExpenses   = Σ expenses.amount

otherCost        = manualCost + quickCost + directExpenses
totalCosts       = ingredientsCost + otherCost

profit           = salesTotal − totalCosts
```

### UI display in the Expenses card

| Label | Value |
|---|---|
| ინგრედიენტები | `ingredientsCost` |
| სხვა ხარჯები | `otherCost` (manual + quick + direct expenses) |
| **სულ** | `totalCosts` |

---

## 5. Chart Data (შემოსავალი და ხარჯი)

Each date bucket is built by combining all three data sources:

```mermaid
flowchart LR
    A[orders] -->|"+= total_revenue"| D[date bucket]
    B[expenses] -->|"+= amount"| D
    C[purchases] -->|"+= total\nall types"| D
    D --> E["წმინდა მოგება\n= შემოსავალი − ხარჯი"]
```

> Note: the chart's `ხარჯი` bar includes **all** purchases (ingredient + manual + quick) plus direct expenses.

---

## 6. Draft Persistence (Stock In)

```mermaid
flowchart LR
    A[Item added to list] --> B[Saved to\nlocalStorage 'stock-in-draft']
    C[Page reload] --> D[Draft restored from localStorage]
    E[Save to DB] --> F[localStorage cleared]
    G[Cancel] --> F
```

Quick purchase recent names are also persisted separately under `'quick-recent-names'`.
