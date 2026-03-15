import { useMemo, useEffect, useState } from 'react';
import { getOrders, getExpenses } from '../../lib/db';
import { Order, Expense } from '../../types';
import { format, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Loader2, RotateCcw } from 'lucide-react';

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [oData, eData] = await Promise.all([
        getOrders(), getExpenses()
      ]);
      setOrders(oData);
      setExpenses(eData);
    } catch (err: any) {
      setError(err.message || 'მონაცემების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  }

  const monthlyData = useMemo(() => {
    const dataMap = new Map<string, { name: string; შემოსავალი: number; მოგება: number; ხარჯი: number }>();
    
    // Process orders
    orders.forEach(order => {
      const date = parseISO(order.timestamp);
      const monthKey = format(date, 'yyyy-MM');
      const monthName = format(date, 'MMM yyyy');
      
      if (!dataMap.has(monthKey)) {
        dataMap.set(monthKey, { name: monthName, შემოსავალი: 0, მოგება: 0, ხარჯი: 0 });
      }
      
      const entry = dataMap.get(monthKey)!;
      entry.შემოსავალი += order.total_revenue;
      entry.მოგება += order.total_profit;
    });

    // Process expenses
    expenses.forEach(expense => {
      const date = parseISO(expense.timestamp);
      const monthKey = format(date, 'yyyy-MM');
      const monthName = format(date, 'MMM yyyy');
      
      if (!dataMap.has(monthKey)) {
        dataMap.set(monthKey, { name: monthName, შემოსავალი: 0, მოგება: 0, ხარჯი: 0 });
      }
      
      const entry = dataMap.get(monthKey)!;
      entry.ხარჯი += expense.amount;
    });

    // Calculate net profit
    const result = Array.from(dataMap.entries())
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([, value]) => ({
        ...value,
        'წმინდა მოგება': value.მოგება - value.ხარჯი
      }));

    return result;
  }, [orders, expenses]);

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
      <h1 className="text-3xl font-bold text-stone-800">ფინანსური რეპორტები</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue vs Profit Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
          <h2 className="text-xl font-bold text-stone-800 mb-6">შემოსავალი და მოგება (თვეების მიხედვით)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dx={-10} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="შემოსავალი" fill="#ea580c" radius={[4, 4, 0, 0]} />
                <Bar dataKey="მოგება" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Net Profit Trend */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
          <h2 className="text-xl font-bold text-stone-800 mb-6">წმინდა მოგების ტრენდი</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="წმინდა მოგება" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h2 className="text-xl font-bold text-stone-800">დეტალური მონაცემები</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100 text-stone-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">თვე</th>
                <th className="p-4 font-medium">შემოსავალი</th>
                <th className="p-4 font-medium">პროდუქტის მოგება</th>
                <th className="p-4 font-medium">ხარჯები</th>
                <th className="p-4 font-medium">წმინდა მოგება</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {monthlyData.map((row, i) => (
                <tr key={i} className="hover:bg-stone-50/50 transition-colors">
                  <td className="p-4 font-bold text-stone-800">{row.name}</td>
                  <td className="p-4 font-bold text-orange-600">{row.შემოსავალი.toFixed(2)}₾</td>
                  <td className="p-4 text-green-600 font-medium">{row.მოგება.toFixed(2)}₾</td>
                  <td className="p-4 text-red-600 font-medium">{row.ხარჯი.toFixed(2)}₾</td>
                  <td className="p-4 font-black text-blue-600">{row['წმინდა მოგება'].toFixed(2)}₾</td>
                </tr>
              ))}
              {monthlyData.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-stone-500">
                    მონაცემები არ მოიძებნა
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
