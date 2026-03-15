import React, { useState, useEffect } from 'react';
import { Expense } from '../../types';
import { getExpenses, addExpense, updateExpense, deleteExpense } from '../../lib/db';
import { Plus, Edit2, Trash2, X, Loader2, RotateCcw } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Utilities',
    amount: '',
    notes: ''
  });

  const categories = ['Utilities', 'Ingredients', 'Maintenance', 'Supplies', 'Other'];

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
        notes: expense.notes
      });
    } else {
      setEditingExpense(null);
      setFormData({
        title: '',
        category: 'Utilities',
        amount: '',
        notes: ''
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
      notes: formData.notes
    };

    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseData);
      } else {
        await addExpense(expenseData);
      }
      await fetchExpenses(); // Reload
      setIsModalOpen(false);
    } catch (err) {
      alert('შენახვა ვერ მოხერხდა');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('ნამდვილად გსურთ წაშლა?')) return;
    try {
      await deleteExpense(id);
      await fetchExpenses();
    } catch (err) {
      alert('წაშლა ვერ მოხერხდა');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
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
        <h1 className="text-3xl font-bold text-stone-800">ხარჯები</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-colors shadow-lg shadow-red-600/20"
        >
          <Plus className="w-5 h-5" />
          ხარჯის დამატება
        </button>
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
              {expenses.map(expense => (
                <tr key={expense.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="p-4 text-stone-600">
                    {format(parseISO(expense.timestamp), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="p-4 font-bold text-stone-800">{expense.title}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-bold">
                      {expense.category}
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
              {expenses.length === 0 && (
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
