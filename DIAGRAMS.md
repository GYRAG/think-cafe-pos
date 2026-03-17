# Cafe POS System — Diagrams

This file contains architecture and workflow diagrams for the project.

---

## App flow (pages + data writes)

```mermaid
flowchart TD
  A([Open app]) --> B{Supabase session exists?}
  B -- No --> L[Login page<br/>email | password | sign in]
  L -->|signInWithPassword| B

  B -- Yes --> P[Load profile<br/>from profiles table<br/>role, display_name]
  P --> R{Role?}

  %% Cashier / shared path
  R -- cashier --> H[Launcher /<br/>POS | Stock-in | Logout]
  R -- admin --> H

  H --> POS[POS /pos<br/>categories | products | cart | confirm checkout]
  POS -->|checkout confirmed| O[(Insert orders)]
  O --> OI[(Insert order_items)]
  OI --> POS

  H --> SI[Stock-in /stock-in<br/>ingredient | manual | draft | save]
  SI -->|Save| PU[(Insert purchases)]
  PU --> H

  %% Admin-only area
  R -- admin --> AD[Admin layout /admin<br/>Sidebar navigation]
  AD --> D[Dashboard /admin/dashboard<br/>KPIs | revenue chart | top products<br/>READ orders, order_items, expenses]
  AD --> PR[Products /admin/products<br/>CRUD | reorder<br/>READ/WRITE products]
  PR -->|Create/Update| PROD_UP[(Upsert products)]
  PR -->|Reorder| PROD_SORT[(Update sort_order)]
  PR -->|Delete| PROD_DEL[(Delete product)]

  AD --> EX[Expenses /admin/expenses<br/>CRUD | timestamp<br/>READ/WRITE expenses]
  EX -->|Create| EX_ADD[(Insert expense)]
  EX -->|Update| EX_UPD[(Update expense)]
  EX -->|Delete| EX_DEL[(Delete expense)]

  AD --> RP[Reports /admin/reports<br/>filters | charts | export<br/>READ orders, order_items, purchases, expenses]

  AD --> U[Users /admin/users<br/>Demo UI list (not DB-backed yet)]
```

