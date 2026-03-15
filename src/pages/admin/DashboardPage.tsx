import { useEffect, useMemo, useState } from 'react';
import { getOrders, getSales, getExpenses } from '../../lib/db';
import { Order, Sale, Expense } from '../../types';
import {
  parseISO, isToday, isThisWeek, isThisMonth,
  startOfWeek, startOfMonth, eachDayOfInterval, format, subDays
} from 'date-fns';
import { ka } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Receipt, Loader2, RotateCcw } from 'lucide-react';

type Period = 'daily' | 'weekly' | 'monthly';

const PERIOD_LABELS: Record<Period, string> = {
  daily: 'დღეს',
  weekly: 'კვირა',
  monthly: 'თვე',
};

function inPeriod(dateStr: string, period: Period): boolean {
  if (!dateStr) return false;
  const date = parseISO(dateStr);
  if (period === 'daily') return isToday(date);
  if (period === 'weekly') return isThisWeek(date, { weekStartsOn: 1 });
  return isThisMonth(date);
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState<Period>('daily');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [oData, sData, eData] = await Promise.all([
        getOrders(), getSales(), getExpenses()
      ]);
      setOrders(oData);
      setSales(sData);
      setExpenses(eData);
    } catch (err: any) {
      setError(err.message || 'მონაცემების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const periodOrders = orders.filter(o => inPeriod(o.timestamp, period));
    const periodExpenses = expenses.filter(e => inPeriod(e.timestamp, period));

    const revenue = periodOrders.reduce((sum, o) => sum + o.total_revenue, 0);
    const expenseTotal = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const profit = periodOrders.reduce((sum, o) => sum + o.total_profit, 0) - expenseTotal;

    return {
      revenue,
      expenses: expenseTotal,
      profit,
      orderCount: periodOrders.length,
    };
  }, [orders, expenses, period]);

  const topProducts = useMemo(() => {
    const productSales = new Map<string, { quantity: number; name: string }>();

    sales.forEach(sale => {
      if (inPeriod(sale.timestamp, period)) {
        const existing = productSales.get(sale.product_id) || { quantity: 0, name: (sale as any).product_name ?? 'უცნობი' };
        // We get product_name from the new order_items table column directly
        existing.quantity += sale.quantity;
        productSales.set(sale.product_id, existing);
      }
    });

    return Array.from(productSales.entries())
      .map(([id, data]) => ({
        name: data.name,
        quantity: data.quantity,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [sales, period]);

  // Chart data
  const chartData = useMemo(() => {
    if (period === 'daily') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        const dateStr = format(d, 'yyyy-MM-dd');
        const rev = orders
          .filter(o => o.timestamp && o.timestamp.startsWith(dateStr))
          .reduce((s, o) => s + o.total_revenue, 0);
        return { name: format(d, 'EEE', { locale: ka }), შემოსავალი: rev };
      });
    }

    if (period === 'weekly') {
      const start = startOfWeek(new Date(), { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start, end: new Date() });
      return days.map(d => {
        const dateStr = format(d, 'yyyy-MM-dd');
        const rev = orders
          .filter(o => o.timestamp && o.timestamp.startsWith(dateStr))
          .reduce((s, o) => s + o.total_revenue, 0);
        return { name: format(d, 'EEE', { locale: ka }), შემოსავალი: rev };
      });
    }

    const start = startOfMonth(new Date());
    const days = eachDayOfInterval({ start, end: new Date() });
    return days.map(d => {
      const dateStr = format(d, 'yyyy-MM-dd');
      const rev = orders
        .filter(o => o.timestamp && o.timestamp.startsWith(dateStr))
        .reduce((s, o) => s + o.total_revenue, 0);
      return { name: format(d, 'd'), შემოსავალი: rev };
    });
  }, [orders, period]);

  const chartTitle =
    period === 'daily' ? 'ბოლო 7 დღის შემოსავალი' :
    period === 'weekly' ? 'ამ კვირის შემოსავალი (დღეებით)' :
    'ამ თვის შემოსავალი (დღეებით)';

  const statsLabelPrefix =
    period === 'daily' ? 'დღევანდელი' :
    period === 'weekly' ? 'კვირის' :
    'თვის';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full pt-20">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20 gap-4 text-stone-500">
        <p>{error}</p>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-stone-200 rounded-xl hover:bg-stone-300 transition-colors text-stone-700">
          <RotateCcw className="w-4 h-4" /> თავიდან ცდა
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header + Period Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-stone-800">დაფა</h1>

        <div className="flex items-center bg-stone-100 p-1 rounded-2xl gap-1">
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                period === p
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
            <DollarSign className="w-7 h-7" />
          </div>
          <div>
            <p className="text-stone-500 font-medium text-sm">{statsLabelPrefix} შემოსავალი</p>
            <p className="text-2xl font-black text-stone-900 mt-1">{stats.revenue.toFixed(2)}₾</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
            <Receipt className="w-7 h-7" />
          </div>
          <div>
            <p className="text-stone-500 font-medium text-sm">{statsLabelPrefix} ხარჯები</p>
            <p className="text-2xl font-black text-stone-900 mt-1">{stats.expenses.toFixed(2)}₾</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${stats.profit >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
            {stats.profit >= 0 ? <TrendingUp className="w-7 h-7" /> : <TrendingDown className="w-7 h-7" />}
          </div>
          <div>
            <p className="text-stone-500 font-medium text-sm">{statsLabelPrefix} წმინდა მოგება</p>
            <p className="text-2xl font-black text-stone-900 mt-1">{stats.profit.toFixed(2)}₾</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div>
            <p className="text-stone-500 font-medium text-sm">{statsLabelPrefix} შეკვეთები</p>
            <p className="text-2xl font-black text-stone-900 mt-1">{stats.orderCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
          <h2 className="text-xl font-bold text-stone-800 mb-6">{chartTitle}</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} />
                <Tooltip
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value.toFixed(2)}₾`, 'შემოსავალი']}
                />
                <Bar dataKey="შემოსავალი" fill="#ea580c" radius={[6, 6, 0, 0]} barSize={period === 'monthly' ? 14 : 40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
          <h2 className="text-xl font-bold text-stone-800 mb-6">ტოპ პროდუქტები ({PERIOD_LABELS[period]})</h2>
          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <p className="text-stone-500 text-center py-8">მონაცემები არ არის</p>
            ) : (
              topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium text-stone-800">{product.name}</span>
                  </div>
                  <span className="font-bold text-stone-900">{product.quantity} ცალი</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
