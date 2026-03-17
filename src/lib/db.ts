import { supabase } from './supabase';
import { Product, Order, Sale, Expense, OrderItem, Purchase } from '../types';

// ── Products ──────────────────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('category')
    .order('name');
  if (error) throw error;
  return (data ?? []).map(row => ({
    id: row.id,
    name: row.name,
    price: Number(row.price),
    cost: Number(row.cost),
    category: row.category,
    image_url: row.image_url ?? '',
    is_active: row.is_active,
    sort_order: row.sort_order ?? 0,
    created_at: row.created_at,
  }));
}

export async function upsertProduct(product: Omit<Product, 'id' | 'created_at'> & { id?: string }): Promise<void> {
  const { error } = await supabase.from('products').upsert({
    ...(product.id ? { id: product.id } : {}),
    name: product.name,
    price: product.price,
    cost: product.cost,
    category: product.category,
    image_url: product.image_url,
    is_active: product.is_active,
    sort_order: product.sort_order ?? 0,
  });
  if (error) throw error;
}

export async function updateProductOrder(updates: { id: string; sort_order: number }[]): Promise<void> {
  // Supabase upsert requires all NOT NULL columns if the row doesn't have a default.
  // Using update per row is safer.
  await Promise.all(
    updates.map(u => 
      supabase.from('products').update({ sort_order: u.sort_order }).eq('id', u.id)
    )
  );
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// ── Orders ────────────────────────────────────────────────────────────

export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(row => ({
    id: row.id,
    timestamp: row.created_at,
    total_revenue: Number(row.total_revenue),
    total_profit: Number(row.total_profit),
  }));
}

export async function getSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(row => ({
    id: row.id,
    order_id: row.order_id,
    product_id: row.product_id,
    product_name: row.product_name,
    quantity: row.quantity,
    price_at_sale: Number(row.price_at_sale),
    cost_at_sale: Number(row.cost_at_sale),
    timestamp: row.created_at,
  }));
}

export async function completeOrder(items: OrderItem[]): Promise<void> {
  const totalRevenue = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const totalProfit = items.reduce((s, i) => s + (i.product.price - i.product.cost) * i.quantity, 0);

  // Insert order
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({ total_revenue: totalRevenue, total_profit: totalProfit })
    .select('id')
    .single();
  if (orderError) throw orderError;

  // Insert order items
  const orderItems = items.map(item => ({
    order_id: orderData.id,
    product_id: item.product.id,
    product_name: item.product.name,
    quantity: item.quantity,
    price_at_sale: item.product.price,
    cost_at_sale: item.product.cost,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) throw itemsError;
}

// ── Expenses ──────────────────────────────────────────────────────────

export async function getExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(row => ({
    id: row.id,
    title: row.title,
    category: row.category,
    amount: Number(row.amount),
    notes: row.notes ?? '',
    timestamp: row.created_at,
  }));
}

export async function addExpense(expense: Omit<Expense, 'id' | 'timestamp'> & { timestamp?: string }): Promise<void> {
  const { error } = await supabase.from('expenses').insert({
    title: expense.title,
    category: expense.category,
    amount: expense.amount,
    notes: expense.notes,
    ...(expense.timestamp ? { created_at: expense.timestamp } : {}),
  });
  if (error) throw error;
}

export async function updateExpense(id: string, expense: Partial<Omit<Expense, 'id'>> & { timestamp?: string }): Promise<void> {
  const { error } = await supabase.from('expenses').update({
    title: expense.title,
    category: expense.category,
    amount: expense.amount,
    notes: expense.notes,
    ...(expense.timestamp ? { created_at: expense.timestamp } : {}),
  }).eq('id', id);
  if (error) throw error;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

// ── Purchases ─────────────────────────────────────────────────────────

export async function getPurchases(): Promise<Purchase[]> {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(row => ({
    id: row.id,
    type: row.type,
    ingredient_id: row.ingredient_id,
    name: row.name,
    quantity: Number(row.quantity),
    unit: row.unit,
    price_per_unit: row.price_per_unit ? Number(row.price_per_unit) : undefined,
    total: Number(row.total),
    created_at: row.created_at,
  }));
}

export async function addPurchases(purchases: Omit<Purchase, 'id' | 'created_at'>[]): Promise<void> {
  if (purchases.length === 0) return;
  const { error } = await supabase.from('purchases').insert(purchases);
  if (error) throw error;
}

