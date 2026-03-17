import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react';
import { getIngredients, addIngredient, updateIngredient, deleteIngredient } from '../../lib/db';
import { Ingredient } from '../../types';

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Forms
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('კგ');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUnit, setEditUnit] = useState('');

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const data = await getIngredients();
      setIngredients(data);
    } catch (err: any) {
      alert(`ვერ ჩაიტვირთა อินგრედიენტები: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim() || !newUnit.trim()) return;
    try {
      await addIngredient({ name: newName.trim(), unit: newUnit.trim() });
      await fetchIngredients();
      setIsAdding(false);
      setNewName('');
      setNewUnit('კგ');
    } catch (err: any) {
      alert(`შეცდომა დამატებისას: ${err?.message}`);
    }
  };

  const startEdit = (ing: Ingredient) => {
    setEditingId(ing.id);
    setEditName(ing.name);
    setEditUnit(ing.unit);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim() || !editUnit.trim()) return;
    try {
      await updateIngredient(id, { name: editName.trim(), unit: editUnit.trim() });
      await fetchIngredients();
      setEditingId(null);
    } catch (err: any) {
      alert(`შეცდომა განახლებისას: ${err?.message}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`ნამდვილად გსურთ წაშალოთ "${name}"?`)) return;
    try {
      await deleteIngredient(id);
      await fetchIngredients();
    } catch (err: any) {
      alert(`შეცდომა წაშლისას: ${err?.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-stone-800 tracking-tight">ინგრედიენტების მართვა</h2>
          <p className="text-stone-500 mt-1">მართეთ რა ინგრედიენტების არჩევა შეუძლია მოლარეს შეკვეთისას</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-4 py-2 ${isAdding ? 'bg-stone-200 text-stone-700 hover:bg-stone-300' : 'bg-green-600 text-white hover:bg-green-700'} rounded-xl font-bold transition-colors shadow-sm`}
        >
          {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {isAdding ? 'გაუქმება' : 'დამატება'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-stone-700 mb-2">დასახელება</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="მაგ. შაქარი"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-green-500 outline-none font-medium text-stone-800"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-stone-700 mb-2">საზომი ერთეული</label>
            <input
              type="text"
              value={newUnit}
              onChange={e => setNewUnit(e.target.value)}
              placeholder="კგ / ლ / ცალი"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-green-500 outline-none font-medium text-stone-800"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!newName.trim() || !newUnit.trim()}
            className="w-full md:w-auto px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 h-[50px]"
          >
            <Check className="w-5 h-5" /> შენახვა
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 bg-white rounded-3xl shadow-sm border border-stone-100">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-stone-50 text-stone-500 text-sm uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4 w-12 border-b border-stone-100">#</th>
                <th className="p-4 border-b border-stone-100">დასახელება</th>
                <th className="p-4 border-b border-stone-100 w-48">ერთეული</th>
                <th className="p-4 border-b border-stone-100 w-32 text-right">ქმედება</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {ingredients.map((ing, i) => (
                <tr key={ing.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="p-4 font-bold text-stone-400">{i + 1}</td>
                  
                  {editingId === ing.id ? (
                    <>
                      <td className="p-4">
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-green-500 outline-none font-medium"
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="text"
                          value={editUnit}
                          onChange={e => setEditUnit(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-green-500 outline-none font-medium"
                        />
                      </td>
                      <td className="p-4 text-right flex items-center justify-end gap-2">
                        <button onClick={() => setEditingId(null)} className="p-2 text-stone-400 hover:bg-stone-200 rounded-lg">
                          <X className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleSaveEdit(ing.id)} className="p-2 text-green-600 hover:bg-green-100 rounded-lg">
                          <Check className="w-5 h-5" />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4 font-bold text-stone-800">{ing.name}</td>
                      <td className="p-4 font-medium text-stone-600">{ing.unit}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => startEdit(ing)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(ing.id, ing.name)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {ingredients.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-stone-500 font-medium">
                    ინგრედიენტები ვერ მოიძებნა
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
