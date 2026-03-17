import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Save, X, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { addPurchases } from '../lib/db';
import { Purchase } from '../types';

const INGREDIENTS = [
  { id: 'flour', name: 'ფქვილი', unit: 'კგ' },
  { id: 'cheese', name: 'ყველი', unit: 'კგ' },
  { id: 'onion', name: 'ხახვი', unit: 'კგ' },
  { id: 'tomato', name: 'პომიდორი', unit: 'კგ' },
  { id: 'oil', name: 'ზეთი', unit: 'ლ' },
  { id: 'sugar', name: 'შაქარი', unit: 'კგ' },
  { id: 'salt', name: 'მარილი', unit: 'კგ' },
];

export default function StockInPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'ingredient' | 'manual'>('ingredient');
  const [items, setItems] = useState<Partial<Purchase>[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Form State - Ingredient
  const [selectedIngredient, setSelectedIngredient] = useState(INGREDIENTS[0].id);
  const [ingQuantity, setIngQuantity] = useState('');
  const [ingPricePerUnit, setIngPricePerUnit] = useState('');

  // Form State - Manual
  const [manName, setManName] = useState('');
  const [manQuantity, setManQuantity] = useState('');
  const [manTotal, setManTotal] = useState('');

  // Draft persistence using standard localStorage
  useEffect(() => {
    const draft = localStorage.getItem('stock-in-draft');
    if (draft) {
      try {
        setItems(JSON.parse(draft));
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('stock-in-draft', JSON.stringify(items));
  }, [items]);

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + (item.total || 0), 0), [items]);

  const handleAddIngredient = () => {
    const qty = parseFloat(ingQuantity);
    const ppu = parseFloat(ingPricePerUnit);
    if (!qty || !ppu || qty <= 0 || ppu <= 0) return;

    const ing = INGREDIENTS.find(i => i.id === selectedIngredient)!;
    
    setItems(prev => [...prev, {
      id: uuidv4(),
      type: 'ingredient',
      ingredient_id: ing.id,
      name: ing.name,
      quantity: qty,
      unit: ing.unit,
      price_per_unit: ppu,
      total: qty * ppu
    }]);

    setIngQuantity('');
    setIngPricePerUnit('');
  };

  const handleAddManual = () => {
    const qty = parseFloat(manQuantity);
    const total = parseFloat(manTotal);
    if (!manName.trim() || !qty || !total || qty <= 0 || total <= 0) return;

    setItems(prev => [...prev, {
      id: uuidv4(),
      type: 'manual',
      name: manName.trim(),
      quantity: qty,
      total: total
    }]);

    setManName('');
    setManQuantity('');
    setManTotal('');
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    if (items.length === 0) return;
    setIsSaving(true);
    try {
      await addPurchases(items as Omit<Purchase, 'id' | 'created_at'>[]);
      setItems([]);
      localStorage.removeItem('stock-in-draft');
      alert('წარმატებით შეინახა!');
      navigate('/');
    } catch (err: any) {
      alert(`შენახვა ვერ მოხერხდა: ${err?.message || 'უცნობი შეცდომა'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('ნამდვილად გსურთ გაუქმება? მონაცემები წაიშლება.')) {
      setItems([]);
      localStorage.removeItem('stock-in-draft');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl transition-colors font-bold shadow-sm"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="hidden sm:inline">უკან დაბრუნება</span>
          </button>
          <div className="w-px h-8 bg-stone-200 mx-2 hidden sm:block"></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-stone-800 tracking-tight">📦 შეძენილი პროდუქტები</h1>
            <p className="text-stone-500 font-medium">{new Date().toLocaleDateString('ka-GE')}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row p-6 gap-6 max-w-7xl mx-auto w-full">
        
        {/* Left Side: Entry Form */}
        <div className="w-full md:w-[400px] flex flex-col gap-4">
          
          {/* Mode Toggle */}
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-stone-200 flex p-1">
            <button
              onClick={() => setMode('ingredient')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode === 'ingredient' ? 'bg-green-600 text-white shadow-md' : 'text-stone-600 hover:bg-stone-50'}`}
            >
              ინგრედიენტი
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode === 'manual' ? 'bg-green-600 text-white shadow-md' : 'text-stone-600 hover:bg-stone-50'}`}
            >
              სხვა პროდუქტი
            </button>
          </div>

          {/* Form container */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 flex-1 flex flex-col">
            {mode === 'ingredient' ? (
              <div className="space-y-5 flex-1">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">ინგრედიენტი</label>
                  <select
                    value={selectedIngredient}
                    onChange={e => setSelectedIngredient(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-green-500 outline-none text-stone-800 font-medium"
                  >
                    {INGREDIENTS.map(ing => (
                      <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">რაოდენობა</label>
                  <div className="flex gap-2 mb-2">
                    {[1, 5, 10].map(n => (
                      <button
                        key={n}
                        onClick={() => setIngQuantity((parseFloat(ingQuantity || '0') + n).toString())}
                        className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg transition-colors"
                      >
                        +{n}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={ingQuantity}
                    onChange={e => setIngQuantity(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-green-500 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">ერთეულის ფასი (₾)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={ingPricePerUnit}
                    onChange={e => setIngPricePerUnit(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-green-500 outline-none font-medium"
                  />
                </div>
                
                <div className="pt-4 border-t border-stone-100 mt-auto">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-stone-500 font-medium">ჯამი:</span>
                    <span className="text-xl font-black text-stone-800">
                      {ingQuantity && ingPricePerUnit ? (parseFloat(ingQuantity) * parseFloat(ingPricePerUnit)).toFixed(2) : '0.00'}₾
                    </span>
                  </div>
                  <button
                    onClick={handleAddIngredient}
                    disabled={!ingQuantity || !ingPricePerUnit}
                    className="w-full py-4 bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus className="w-5 h-5" /> დამატება სიაში
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 flex-1">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">პროდუქტის სახელი</label>
                  <input
                    type="text"
                    value={manName}
                    onChange={e => setManName(e.target.value)}
                    placeholder="მაგ. საწმენდი საშუალებები"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-green-500 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">რაოდენობა (ცალი / შეკვრა)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={manQuantity}
                    onChange={e => setManQuantity(e.target.value)}
                    placeholder="1"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-green-500 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">მთლიანი ფასი (₾)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manTotal}
                    onChange={e => setManTotal(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-green-500 outline-none font-medium"
                  />
                </div>

                <div className="pt-4 border-t border-stone-100 mt-auto">
                  <button
                    onClick={handleAddManual}
                    disabled={!manName || !manQuantity || !manTotal}
                    className="w-full py-4 bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus className="w-5 h-5" /> დამატება სიაში
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Purchases Table & Actions */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="flex-1 overflow-auto bg-stone-50/30">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-stone-50 shadow-sm z-10">
                <tr className="border-b border-stone-200 text-stone-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-bold">პროდუქტი</th>
                  <th className="p-4 font-bold text-right">რაოდენობა</th>
                  <th className="p-4 font-bold text-right">ფასი (₾)</th>
                  <th className="p-4 font-bold text-right w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white transition-colors bg-white/50">
                    <td className="p-4">
                      <div className="font-bold text-stone-800">{item.name}</div>
                      <div className="text-xs text-stone-500 font-medium">
                        {item.type === 'ingredient' ? 'ინგრედიენტი' : 'სხვა'}
                      </div>
                    </td>
                    <td className="p-4 text-right font-medium text-stone-700">
                      {item.quantity} {item.unit || 'ცალი'}
                    </td>
                    <td className="p-4 text-right font-black text-stone-800">
                      {item.total?.toFixed(2)}₾
                      {item.type === 'ingredient' && (
                        <div className="text-xs text-stone-400 font-medium mt-0.5">
                          ({item.price_per_unit?.toFixed(2)}₾ / {item.unit})
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleRemoveItem(item.id!)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center">
                      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Plus className="w-8 h-8 text-stone-400" />
                      </div>
                      <p className="text-stone-500 font-medium text-lg">სია ცარიელია</p>
                      <p className="text-stone-400 text-sm mt-1">დაამატეთ პროდუქტები მარცხენა პანელიდან</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-white border-t border-stone-200 shrink-0">
            <div className="flex items-end justify-between mb-6">
              <span className="text-stone-500 font-bold text-lg">სულ ღირებულება:</span>
              <span className="text-4xl font-black text-stone-900">{totalAmount.toFixed(2)}₾</span>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={handleCancel}
                className="px-8 py-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors w-1/3"
              >
                <X className="w-5 h-5" /> გაუქმება
              </button>
              <button
                onClick={handleSave}
                disabled={items.length === 0 || isSaving}
                className="flex-1 py-4 bg-green-600 hover:bg-green-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-600/20 text-lg"
              >
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                {isSaving ? 'ინახება...' : 'შენახვა'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
