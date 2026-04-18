import React, { useState, useEffect } from 'react';
import { Expense } from '../../types';
import { getExpenses, addExpense, updateExpense, deleteExpense } from '../../lib/db';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, isToday, isThisWeek, isThisMonth, subDays } from 'date-fns';
import { Plus, Edit2, Trash2, X, Loader2, RotateCcw, Calendar as CalendarIcon, TrendingDown } from 'lucide-react';
import { useStore } from '../../store';

type Period = 'today' | 'this_week' | 'this_month' | 'all_time' | 'custom';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState<Period>('this_month');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const showNotification = useStore(state => state.showNotification);

  const [formData, setFormData] = useState({
    title: '',
    category: 'კომუნალურები',
    amount: '',
    notes: '',
    timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  });

  const categories = ['კომუნალურები', 'ინგრედიენტები', 'მომსახურება', 'მასალები', 'სხვა'];

  const translateCategory = (cat: string) => {
    const map: Record<string, string> = {
      'Utilities': 'კომუნალურები',
      'Ingredients': 'ინგრედიენტები',
      'Maintenance': 'მომსახურება',
      'Supplies': 'მასალები',
      'Other': 'სხვა'
    };
    return map[cat] || cat;
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    setLoading(true);
    setError(null);
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (err: any) {
      setError(err.message || 'ვერ მოხერხდა ხარჯების ჩატვირთვა');
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        title: expense.title,
        category: expense.category,
        amount: expense.amount.toString(),
        notes: expense.notes,
        timestamp: format(parseISO(expense.timestamp), "yyyy-MM-dd'T'HH:mm")
      });
    } else {
      setEditingExpense(null);
      setFormData({
        title: '',
        category: 'Utilities',
        amount: '',
        notes: '',
        timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm")
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const expenseData = {
      title: formData.title,
      category: formData.category,
      amount: parseFloat(formData.amount),
      notes: formData.notes,
      timestamp: new Date(formData.timestamp).toISOString()
    };

    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseData);
      } else {
        await addExpense(expenseData);
      }
      await fetchExpenses(); // Reload
      setIsModalOpen(false);
      showNotification('ხარჯი წარმატებით შენახულია!', 'success');
    } catch (err) {
      showNotification('შენახვა ვერ მოხერხდა', 'error');
    } finally {
      setIsSaving(false);
    }
  };

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

  const filteredExpenses = expenses.filter(e => isDateInRange(e.timestamp));
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleDelete = async (id: string) => {
    showNotification('ნამდვილად გსურთ წაშლა?', 'error', true, async () => {
      try {
        await deleteExpense(id);
        await fetchExpenses();
        showNotification('ხარჯი წარმატებით წაიშალა!', 'success');
      } catch (err) {
        showNotification('წაშლა ვერ მოხერხდა', 'error');
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-stone-500">
        <p>{error}</p>
        <button onClick={fetchExpenses} className="flex items-center gap-2 px-4 py-2 bg-stone-200 rounded-xl hover:bg-stone-300 transition-colors text-stone-700">
          <RotateCcw className="w-4 h-4" /> თავიდან ცდა
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">ხარჯები</h1>
          <p className="text-stone-500 mt-1">მართეთ და გაფილტრეთ ბიზნესის ხარჯები</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-colors shadow-lg shadow-red-600/20"
        >
          <Plus className="w-5 h-5" />
          ხარჯის დამატება
        </button>
      </div>

      {/* --- TIMEFRAME FILTERS --- */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-stone-100 flex flex-wrap items-center gap-2">
        <button onClick={() => setPeriod('today')} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${period === 'today' ? 'bg-red-600 text-white shadow-md shadow-red-600/20' : 'text-stone-600 hover:bg-stone-50'}`}>დღეს</button>
        <button onClick={() => setPeriod('this_week')} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${period === 'this_week' ? 'bg-red-600 text-white shadow-md shadow-red-600/20' : 'text-stone-600 hover:bg-stone-50'}`}>ეს კვირა</button>
        <button onClick={() => setPeriod('this_month')} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${period === 'this_month' ? 'bg-red-600 text-white shadow-md shadow-red-600/20' : 'text-stone-600 hover:bg-stone-50'}`}>ეს თვე</button>
        <button onClick={() => setPeriod('all_time')} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${period === 'all_time' ? 'bg-red-600 text-white shadow-md shadow-red-600/20' : 'text-stone-600 hover:bg-stone-50'}`}>სრული დრო</button>

        <div className="w-px h-6 bg-stone-200 mx-2"></div>

        <button onClick={() => setPeriod('custom')} className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all ${period === 'custom' ? 'bg-red-600 text-white shadow-md shadow-red-600/20' : 'text-stone-600 hover:bg-stone-50'}`}>
          <CalendarIcon className="w-4 h-4" /> მორგებული
        </button>

        {period === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-1.5 text-sm rounded-lg border border-stone-200 focus:ring-2 focus:ring-red-500 outline-none" />
            <span className="text-stone-400">-</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-1.5 text-sm rounded-lg border border-stone-200 focus:ring-2 focus:ring-red-500 outline-none" />
          </div>
        )}
      </div>

      {/* --- SUMMARY CARD --- */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-stone-500 uppercase tracking-wider text-xs">ჯამური ხარჯი</h3>
          <div className="bg-red-50 p-2 rounded-xl text-red-600"><TrendingDown className="w-5 h-5" /></div>
        </div>
        <div className="text-4xl font-black text-red-600">{totalExpenses.toFixed(2)}₾</div>
        <p className="text-stone-400 text-xs mt-2 font-medium">შერჩეული პერიოდის მიხედვით</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100 text-stone-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">თარიღი</th>
                <th className="p-4 font-medium">სახელი</th>
                <th className="p-4 font-medium">კატეგორია</th>
                <th className="p-4 font-medium">თანხა</th>
                <th className="p-4 font-medium">შენიშვნა</th>
                <th className="p-4 font-medium text-right">ქმედებები</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredExpenses.map(expense => (
                <tr key={expense.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="p-4 text-stone-600">
                    {format(parseISO(expense.timestamp), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="p-4 font-bold text-stone-800">{expense.title}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-bold">
                      {translateCategory(expense.category)}
                    </span>
                  </td>
                  <td className="p-4 font-black text-red-600">{expense.amount}₾</td>
                  <td className="p-4 text-stone-500 text-sm max-w-xs truncate" title={expense.notes}>
                    {expense.notes || '-'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(expense)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="რედაქტირება"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="წაშლა"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-500">
                    ხარჯები არ მოიძებნა
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-stone-100">
              <h2 className="text-2xl font-bold text-stone-800">
                {editingExpense ? 'ხარჯის რედაქტირება' : 'ახალი ხარჯი'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-stone-400 hover:bg-stone-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">სახელი</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  placeholder="მაგ. ელექტროენერგია"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">თარიღი და დრო</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.timestamp}
                  onChange={e => setFormData({...formData, timestamp: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">თანხა (₾)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">კატეგორია</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all bg-white"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">შენიშვნა</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none h-24"
                  placeholder="დამატებითი ინფორმაცია..."
                />
              </div>

              <div className="pt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold transition-colors"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'შენახვა'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
