# 🍵 Think Cafe POS - Smart Management System

[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-1C1C1C?style=for-the-badge&logo=supabase&logoColor=3ECF8E)](https://supabase.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A modern, high-performance Point of Sale system designed specifically for cafe tablets. Built with speed, reliability, and ease of use in mind, featuring a robust catalog system and deep financial reporting.

---

## 🚀 Key Features

### 🛒 Tablet-Optimized POS
- **Seamless Sales**: Quick-tap product catalog for rapid order entry.
- **On-Screen Numpad**: Large, touch-friendly numeric input for quantities and custom prices.
- **Georgian Virtual Keyboard**: Native character input support for manual item names, eliminating the need for physical keyboards.

### 📦 Dynamic Inventory Management (Stock In)
- **Categorized Ingredients**: Group your stock items into logical categories (e.g., Vegetables, Dairy).
- **Smart Sorting**: Automatic **"Recently Used"** and **"Most Used"** sections for ultra-fast access to frequent items.
- **Draft Persistence**: Auto-saves your stock-in progress locally so you never lose data mid-task.
- **Manual Logging**: Log miscellaneous expenses directly into the system.

### 📊 Admin Analytics Dashboard
- **Financial Intelligence**: Real-time sales vs. purchases vs. profit tracking.
- **Ingredient Insights**: Detail breakdown of which ingredients were bought, how much, and at what price.
- **Time-based Filtering**: View reports by Today, Week, Month, or Custom range.
- **User Management**: Simple role-based control for Cashiers and Admins.

---

## 🗺️ User Flow

```mermaid
graph TD
    A[Start: Login] --> B{Role Check}
    
    B -->|Cashier/Admin| C[Launcher Hub]
    B -->|Admin Only| D[Admin Dashboard]
    
    subgraph "Launcher Hub (Daily Operations)"
        C --> C1[POS Page]
        C --> C2[Stock In Page]
        C1 --> C1a[Select Products]
        C1a --> C1b[Record Sale]
        C2 --> C2a[Select Ingredient/Manual]
        C2a --> C2b[Enter Qty/Price]
        C2b --> C2c[Save to DB]
    end
    
    subgraph "Admin Management"
        D --> D1[Analytics/Reports]
        D --> D2[Product Management]
        D --> D3[Ingredient Catalog]
        D --> D4[Expense Tracking]
        D --> D5[User Management]
    end
    
    C1b -.-> D1
    C2c -.-> D1
```

---

## 🛠️ Tech Stack

- **Frontend**: React + Vite (Typescript)
- **State Management**: Zustand
- **Database / Auth**: Supabase (PostgreSQL)
- **Styling**: Vanilla CSS + Utility classes
- **Icons**: Lucide React
- **Charts**: Recharts

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- Supabase Project

### Quick Start
1. **Clone the repository**:
   ```bash
   git clone https://github.com/GYRAG/think-cafe-pos.git
   cd think-cafe-pos
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run Locally**:
   ```bash
   npm run dev
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🌿 Design Language
- **Accent Color**: `#16a34a` (Safe Green)
- **Action Color**: `#dc2626` (Danger Red)
- **Background**: Soft Stone (`#f5f5f4`)
- **Typography**: Heavy Black headers with Medium sans-serif body text.

---

*Built with ❤️ for Cafe Owners.*
