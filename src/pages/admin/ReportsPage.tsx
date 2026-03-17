import { useMemo, useEffect, useState } from 'react';
import { getOrders, getExpenses, getSales, getPurchases } from '../../lib/db';
import { Order, Expense, Sale, Purchase } from '../../types';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, isToday, isThisWeek, isThisMonth, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Loader2, RotateCcw, Download, FileSpreadsheet, Calendar as CalendarIcon, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

type Period = 'today' | 'this_week' | 'this_month' | 'all_time' | 'custom';

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState<Period>('this_month');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [oData, eData, sData, pData] = await Promise.all([
        getOrders(), getExpenses(), getSales(), getPurchases()
      ]);
      setOrders(oData);
      setExpenses(eData);
      setSales(sData);
      setPurchases(pData);
    } catch (err: any) {
      setError(err.message || 'მონაცემების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  }

  // --- Date Filtering Helper ---
  const isDateInRange = (dateStr: string) => {
    if (!dateStr) return false;
    const d = parseISO(dateStr);
    
    if (period === 'all_time') return true;
    if (period === 'today') return isToday(d);
    if (period === 'this_week') return isThisWeek(d, { weekStartsOn: 1 });
    if (period === 'this_month') return isThisMonth(d);
    
    if (period === 'custom') {
      const start = startDate ? startOfDay(parseISO(startDate)) : new Date(0);
      const end = endDate ? endOfDay(parseISO(endDate)) : new Date();
      return isWithinInterval(d, { start, end });
    }
    
    return false;
  };

  // --- Summary Cards Data (New Requirement) ---
  const summaryData = useMemo(() => {
    const filteredOrders = orders.filter(o => isDateInRange(o.timestamp));
    const filteredExpenses = expenses.filter(e => isDateInRange(e.timestamp));
    const filteredPurchases = purchases.filter(p => isDateInRange(p.created_at));

    const salesTotal = filteredOrders.reduce((sum, o) => sum + o.total_revenue, 0);
    
    const ingredientsCost = filteredPurchases
      .filter(p => p.type === 'ingredient')
      .reduce((sum, p) => sum + p.total, 0);

    const manualCost = filteredPurchases
      .filter(p => p.type === 'manual')
      .reduce((sum, p) => sum + p.total, 0);

    const directExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const otherCost = manualCost + directExpenses;
    const totalPurchasesAndExpenses = ingredientsCost + otherCost;

    const profit = salesTotal - totalPurchasesAndExpenses;

    return {
      sales: salesTotal,
      purchases: totalPurchasesAndExpenses,
      profit,
      ingredientsCost,
      otherCost
    };
  }, [orders, expenses, purchases, period, startDate, endDate]);

  // --- Financial Data Aggregation ---
  const reportData = useMemo(() => {
    const filteredOrders = orders.filter(o => isDateInRange(o.timestamp));
    const filteredExpenses = expenses.filter(e => isDateInRange(e.timestamp));
    const filteredPurchases = purchases.filter(p => isDateInRange(p.created_at));

    let isDaily = true;
    if (period === 'all_time') {
      isDaily = false;
    } else if (period === 'custom') {
      if (startDate && endDate) {
        const diffTime = Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 45) isDaily = false;
      }
    }

    const dataMap = new Map<string, { label: string; rawSortKey: string; შემოსავალი: number; მოგება: number; ხარჯი: number }>();
    
    const ensureEntry = (dateStr: string) => {
      const d = parseISO(dateStr);
      const key = isDaily ? format(d, 'yyyy-MM-dd') : format(d, 'yyyy-MM');
      const label = isDaily ? format(d, 'd MMM yyyy') : format(d, 'MMM yyyy');
      if (!dataMap.has(key)) dataMap.set(key, { rawSortKey: key, label, შემოსავალი: 0, მოგება: 0, ხარჯი: 0 });
      return dataMap.get(key)!;
    };

    filteredOrders.forEach(order => {
      const entry = ensureEntry(order.timestamp);
      entry.შემოსავალი += order.total_revenue;
      entry.მოგება += order.total_profit; // This is product markup profit
    });

    filteredExpenses.forEach(expense => {
      const entry = ensureEntry(expense.timestamp);
      entry.ხარჯი += expense.amount;
    });

    filteredPurchases.forEach(purchase => {
      const entry = ensureEntry(purchase.created_at);
      entry.ხარჯი += purchase.total;
    });

    return Array.from(dataMap.values())
      .sort((a, b) => a.rawSortKey.localeCompare(b.rawSortKey))
      .map(value => ({
        name: value.label,
        შემოსავალი: value.შემოსავალი,
        მოგება: value.მოგება,
        ხარჯი: value.ხარჯი,
        'წმინდა მოგება': value.შემოსავალი - value.ხარჯი // Actual profit = Revenue - All expenses
      }));
  }, [orders, expenses, purchases, period, startDate, endDate]);

  // --- Products Sold Aggregation ---
  const productsSoldData = useMemo(() => {
    const filteredSales = sales.filter(s => isDateInRange(s.timestamp));
    const prodMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    
    filteredSales.forEach(sale => {
      const existing = prodMap.get(sale.product_id) || { name: sale.product_name || 'უცნობი', quantity: 0, revenue: 0 };
      existing.quantity += sale.quantity;
      existing.revenue += (sale.price_at_sale * sale.quantity);
      prodMap.set(sale.product_id, existing);
    });

    return Array.from(prodMap.values()).sort((a, b) => b.quantity - a.quantity);
  }, [sales, period, startDate, endDate]);

  const handleExportCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['პერიოდი', 'შემოსავალი', 'ხარჯები', 'წმინდა მოგება'];
    const rows = reportData.map(row => [
      row.name,
      row.შემოსავალი.toFixed(2),
      row.ხარჯი.toFixed(2),
      row['წმინდა მოგება'].toFixed(2)
    ]);
    const csvContent = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reports_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const handleExportExcel = async () => {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();

    const finData = reportData.map(row => ({
      'პერიოდი': row.name,
      'შემოსავალი': Number(row.შემოსავალი.toFixed(2)),
      'ხარჯები': Number(row.ხარჯი.toFixed(2)),
      'წმინდა მოგება': Number(row['წმინდა მოგება'].toFixed(2))
    }));
    const wsFin = XLSX.utils.json_to_sheet(finData);
    wsFin['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, wsFin, 'ფინანსები');

    const prodData = productsSoldData.map(p => ({
      'პროდუქტის სახელი': p.name,
      'რაოდენობა': p.quantity,
      'შემოსავალი': Number(p.revenue.toFixed(2))
    }));
    const wsProd = XLSX.utils.json_to_sheet(prodData);
    wsProd['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, wsProd, 'გაყიდვები');

    XLSX.writeFile(workbook, `full_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full pt-20">
        <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
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
      
      {/* --- HEADER & CONTROLS --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">რეპორტები</h1>
          <p className="text-stone-500 mt-1">ფინანსური და გაყიდვების დეტალური ანალიტიკა</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl font-bold transition-colors shadow-sm">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors shadow-sm shadow-green-600/20">
            <FileSpreadsheet className="w-4 h-4" /> Excel ჩამოტვირთვა
          </button>
        </div>
      </div>

      {/* --- TIMEFRAME FILTERS --- */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-stone-100 flex flex-wrap items-center gap-2">
        <button onClick={() => setPeriod('today')} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${period === 'today' ? 'bg-green-600 text-white' : 'text-stone-600 hover:bg-stone-50'}`}>დღეს</button>
        <button onClick={() => setPeriod('this_week')} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${period === 'this_week' ? 'bg-green-600 text-white' : 'text-stone-600 hover:bg-stone-50'}`}>ეს კვირა</button>
        <button onClick={() => setPeriod('this_month')} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${period === 'this_month' ? 'bg-green-600 text-white' : 'text-stone-600 hover:bg-stone-50'}`}>ეს თვე</button>
        <button onClick={() => setPeriod('all_time')} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${period === 'all_time' ? 'bg-green-600 text-white' : 'text-stone-600 hover:bg-stone-50'}`}>სრული დრო</button>
        
        <div className="w-px h-6 bg-stone-200 mx-2"></div>
        
        <button onClick={() => setPeriod('custom')} className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all ${period === 'custom' ? 'bg-green-600 text-white' : 'text-stone-600 hover:bg-stone-50'}`}>
          <CalendarIcon className="w-4 h-4" /> მორგებული
        </button>

        {period === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-1.5 text-sm rounded-lg border border-stone-200 focus:ring-2 focus:ring-green-500 outline-none"/>
            <span className="text-stone-400">-</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-1.5 text-sm rounded-lg border border-stone-200 focus:ring-2 focus:ring-green-500 outline-none"/>
          </div>
        )}
      </div>

      {/* --- SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-stone-500">შეძენები</h3>
              <div className="bg-red-50 p-2 rounded-xl text-red-600"><TrendingDown className="w-5 h-5" /></div>
            </div>
            <div className="text-4xl font-black text-red-600">{summaryData.purchases.toFixed(2)}₾</div>
          </div>
          <div className="mt-6 pt-4 border-t border-stone-100 flex flex-col gap-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-stone-500">ინგრედიენტები:</span>
              <span className="font-bold text-stone-800">{summaryData.ingredientsCost.toFixed(2)}₾</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500">სხვა ხარჯები:</span>
              <span className="font-bold text-stone-800">{summaryData.otherCost.toFixed(2)}₾</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-stone-500">გაყიდვები</h3>
              <div className="bg-green-50 p-2 rounded-xl text-green-600"><TrendingUp className="w-5 h-5" /></div>
            </div>
            <div className="text-4xl font-black text-green-600">{summaryData.sales.toFixed(2)}₾</div>
          </div>
          <div className="mt-6 pt-4 border-t border-stone-100 text-sm text-stone-500">
            ჯამური შემოსავალი გაყიდული პროდუქტებიდან
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col justify-between text-white" style={{ background: 'linear-gradient(to right bottom, #2563eb, #1d4ed8)' }}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-blue-100">მოგება</h3>
              <div className="bg-white/20 p-2 rounded-xl"><Wallet className="w-5 h-5" /></div>
            </div>
            <div className="text-4xl font-black">{summaryData.profit.toFixed(2)}₾</div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/20 text-sm text-blue-100">
            სავარაუდო სუფთა მოგება
          </div>
        </div>
      </div>

      {/* --- CHARTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
          <h2 className="text-xl font-bold text-stone-800 mb-6">შემოსავალი და ხარჯი</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                <Bar dataKey="შემოსავალი" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ხარჯი" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
          <h2 className="text-xl font-bold text-stone-800 mb-6">წმინდა მოგების ტრენდი</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                <Line type="monotone" dataKey="წმინდა მოგება" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- TABLES --- */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden flex flex-col h-[500px]">
          <div className="p-6 border-b border-stone-100 shrink-0">
            <h2 className="text-xl font-bold text-stone-800">წმინდა მოგების რეპორტი</h2>
          </div>
          <div className="overflow-auto flex-1 p-0">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-stone-50 shadow-sm z-10">
                <tr className="border-b border-stone-100 text-stone-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium whitespace-nowrap">პერიოდი</th>
                  <th className="p-4 font-medium whitespace-nowrap">შემოსავალი</th>
                  <th className="p-4 font-medium whitespace-nowrap">ხარჯები</th>
                  <th className="p-4 font-medium whitespace-nowrap">წმინდა მოგება</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {reportData.map((row, i) => (
                  <tr key={i} className="hover:bg-stone-50/50 transition-colors">
                    <td className="p-4 font-bold text-stone-800 whitespace-nowrap">{row.name}</td>
                    <td className="p-4 font-bold text-green-600 whitespace-nowrap">{row.შემოსავალი.toFixed(2)}₾</td>
                    <td className="p-4 text-red-600 font-medium whitespace-nowrap">{row.ხარჯი.toFixed(2)}₾</td>
                    <td className="p-4 font-black text-blue-600 whitespace-nowrap">{row['წმინდა მოგება'].toFixed(2)}₾</td>
                  </tr>
                ))}
                {reportData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-stone-500">მონაცემები არ მოიძებნა</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden flex flex-col h-[500px]">
          <div className="p-6 border-b border-stone-100 shrink-0">
            <h2 className="text-xl font-bold text-stone-800">გაყიდული პროდუქტები</h2>
          </div>
          <div className="overflow-auto flex-1 p-0">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-stone-50 shadow-sm z-10">
                <tr className="border-b border-stone-100 text-stone-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium whitespace-nowrap w-8">#</th>
                  <th className="p-4 font-medium whitespace-nowrap">სახელი</th>
                  <th className="p-4 font-medium whitespace-nowrap text-right">რაოდენობა</th>
                  <th className="p-4 font-medium whitespace-nowrap text-right">ჯამი</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {productsSoldData.map((product, i) => (
                  <tr key={i} className="hover:bg-stone-50/50 transition-colors">
                    <td className="p-4 font-bold text-stone-400">{i + 1}</td>
                    <td className="p-4 font-bold text-stone-800">{product.name}</td>
                    <td className="p-4 text-right font-bold text-stone-900">{product.quantity}</td>
                    <td className="p-4 text-right font-bold text-orange-600">{product.revenue.toFixed(2)}₾</td>
                  </tr>
                ))}
                {productsSoldData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-stone-500">გაყიდვები არ მოიძებნა</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
