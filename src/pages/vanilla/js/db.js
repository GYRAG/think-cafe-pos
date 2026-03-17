import { supabase } from './supabase-client.js';

// ── Products ──────────────────────────────────────────────────────────

export async function getProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('category')
        .order('name');
        
    if (error) throw error;
    
    return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        price: Number(row.price),
        cost: Number(row.cost),
        category: row.category,
        image_url: row.image_url || '',
        is_active: row.is_active,
        sort_order: row.sort_order || 0,
        created_at: row.created_at,
    }));
}

export async function upsertProduct(productData) {
    const { error } = await supabase.from('products').upsert(productData);
    if (error) throw error;
}

export async function deleteProduct(id) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
}

export async function updateProductOrder(updates) {
    const { error } = await supabase.from('products').upsert(updates);
    if (error) throw error;
}

// ── Orders ────────────────────────────────────────────────────────────

export async function getOrders() {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(row => ({
        id: row.id,
        timestamp: row.created_at,
        total_revenue: Number(row.total_revenue),
        total_profit: Number(row.total_profit),
    }));
}

export async function getSales() {
    const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(row => ({
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

export async function completeOrder(items) {
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

export async function getExpenses() {
    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(row => ({
        id: row.id,
        title: row.title,
        category: row.category,
        amount: Number(row.amount),
        notes: row.notes || '',
        timestamp: row.created_at,
    }));
}

export async function addExpense(expense) {
    const { error } = await supabase.from('expenses').insert({
        title: expense.title,
        category: expense.category,
        amount: expense.amount,
        notes: expense.notes,
        ...(expense.timestamp ? { created_at: expense.timestamp } : {}),
    });
    if (error) throw error;
}

export async function updateExpense(id, expense) {
    const { error } = await supabase.from('expenses').update({
        title: expense.title,
        category: expense.category,
        amount: expense.amount,
        notes: expense.notes,
        ...(expense.timestamp ? { created_at: expense.timestamp } : {}),
    }).eq('id', id);
    if (error) throw error;
}

export async function deleteExpense(id) {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
}
