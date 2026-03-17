export type Role = 'cashier' | 'admin';

export interface User {
  id: string;
  username: string;
  role: Role;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  category: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  timestamp: string;
  total_revenue: number;
  total_profit: number;
}

export interface Sale {
  id: string;
  order_id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  price_at_sale: number;
  cost_at_sale: number;
  timestamp: string;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  notes: string;
  timestamp: string;
}

export interface Purchase {
  id: string;
  type: 'ingredient' | 'manual';
  ingredient_id?: string;
  name: string;
  quantity: number;
  unit?: string;
  price_per_unit?: number;
  total: number;
  created_at: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
}
