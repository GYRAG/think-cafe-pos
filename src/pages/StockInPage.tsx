import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Save, X, Loader2, Delete } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { addPurchases, getIngredients, getPurchases } from '../lib/db';
import { Purchase, Ingredient } from '../types';
import { useStore } from '../store';

export default function StockInPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'ingredient' | 'manual'>('ingredient');
  const [items, setItems] = useState<Partial<Purchase>[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const showNotification = useStore(state => state.showNotification);

  // Dynamic Ingredients List
  const [ingredientsList, setIngredientsList] = useState<Ingredient[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<{ category: string; ingredients: Ingredient[] }[]>([]);
  const [isLoadingIngs, setIsLoadingIngs] = useState(true);

  // Form State - Ingredient
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [ingQuantity, setIngQuantity] = useState('');
  const [ingPricePerUnit, setIngPricePerUnit] = useState('');
  const [ingTotalPrice, setIngTotalPrice] = useState('');

  const [allPastPurchases, setAllPastPurchases] = useState<Purchase[]>([]);
  const [isDistributing, setIsDistributing] = useState(false);
  const [distTotalValue, setDistTotalValue] = useState('');
  const [distributionItems, setDistributionItems] = useState<{
    id: string;
    ingredient_id: string;
    name: string;
    unit: string;
    quantity: string;
    share: string;
  }[]>([]);

  // Form State - Manual
  const [manName, setManName] = useState('');
  const [manQuantity, setManQuantity] = useState('');
  const [manTotal, setManTotal] = useState('');

  // Numpad State
  const [numpadTarget, setNumpadTarget] = useState<'ingPrice' | 'ingTotal' | 'manQuantity' | 'manTotal' | null>(null);
  const [numpadValue, setNumpadValue] = useState('');

  const handleNumpadInput = (val: string) => {
    if (val === 'backspace') {
      setNumpadValue(prev => prev.slice(0, -1));
    } else if (val === '.') {
      if (!numpadValue.includes('.')) setNumpadValue(prev => prev + '.');
    } else {
      // Limit to 2 decimal places if there's a decimal
      if (numpadValue.includes('.')) {
        const parts = numpadValue.split('.');
        if (parts[1].length >= 2) return;
      }
      setNumpadValue(prev => prev + val);
    }
  };

  const handleNumpadConfirm = () => {
    if (numpadTarget === 'ingPrice') {
      setIngPricePerUnit(numpadValue);
    } else if (numpadTarget === 'ingTotal') {
      setIngTotalPrice(numpadValue);
    } else if (numpadTarget === 'manQuantity') {
      setManQuantity(numpadValue);
    } else if (numpadTarget === 'manTotal') {
      setManTotal(numpadValue);
    } else if (numpadTarget === 'quickTotal') {
      // Removed
    }
    setNumpadTarget(null);
  };

  // Keyboard State
  const [keyboardTarget, setKeyboardTarget] = useState<'manName' | null>(null);
  const [keyboardValue, setKeyboardValue] = useState('');

  const handleKeyboardInput = (val: string) => {
    if (val === 'backspace') {
      setKeyboardValue(prev => prev.slice(0, -1));
    } else if (val === 'space') {
      setKeyboardValue(prev => prev + ' ');
    } else {
      setKeyboardValue(prev => prev + val);
    }
  };

  const handleKeyboardConfirm = () => {
    if (keyboardTarget === 'manName') {
      setManName(keyboardValue);
    } else if (keyboardTarget === 'quickName') {
      // Removed
    }
    setKeyboardTarget(null);
  };

  // Layout for Georgian Keyboard
  const GEO_KEYBOARD = [
    ['ქ', 'წ', 'ე', 'რ', 'ტ', 'ყ', 'უ', 'ი', 'ო', 'პ'],
    ['ა', 'ს', 'დ', 'ფ', 'გ', 'ჰ', 'ჯ', 'კ', 'ლ', 'ჭ'],
    ['ზ', 'ხ', 'ც', 'ვ', 'ბ', 'ნ', 'მ', 'ღ', 'თ', 'ჟ'],
    ['შ', 'ძ', 'ჩ', 'space', 'backspace']
  ];

  // Draft persistence using standard localStorage
  useEffect(() => {
    const fetchIngs = async () => {
      try {
        const [data, purchasesData] = await Promise.all([
          getIngredients(),
          getPurchases()
        ]);
        setAllPastPurchases(purchasesData);
        
        // Process Recent and Most Used
        const ingredientPurchases = purchasesData.filter(p => p.type === 'ingredient' && p.ingredient_id);
        
        // 1. Most Used
        const freqMap = new Map<string, number>();
        ingredientPurchases.forEach(p => {
          freqMap.set(p.ingredient_id!, (freqMap.get(p.ingredient_id!) || 0) + 1);
        });
        const mostUsedIds = Array.from(freqMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(e => e[0]);

        // 2. Recently Used
        const recentIds: string[] = [];
        for (const p of ingredientPurchases) {
          if (!recentIds.includes(p.ingredient_id!) && recentIds.length < 5) {
            recentIds.push(p.ingredient_id!);
          }
        }

        // Build groups
        const groups: { category: string; ingredients: Ingredient[] }[] = [];
        
        if (mostUsedIds.length > 0) {
          groups.push({
            category: '⭐ ხშირად გამოყენებული',
            ingredients: mostUsedIds.map(id => data.find(i => i.id === id)!).filter(Boolean)
          });
        }
        
        if (recentIds.length > 0) {
          groups.push({
            category: '🕒 ბოლოს გამოყენებული',
            ingredients: recentIds.map(id => data.find(i => i.id === id)!).filter(Boolean)
          });
        }

        // Standard categories
        const catMap = new Map<string, Ingredient[]>();
        data.forEach(ing => {
          const cat = ing.category || 'ზოგადი';
          if (!catMap.has(cat)) catMap.set(cat, []);
          catMap.get(cat)!.push(ing);
        });

        Array.from(catMap.keys()).sort().forEach(cat => {
          groups.push({
            category: cat,
            ingredients: catMap.get(cat)!
          });
        });

        setIngredientsList(data);
        setCategoryGroups(groups);

        if (groups.length > 0 && groups[0].ingredients.length > 0) {
          setSelectedIngredients([]);
        } else if (data.length > 0) {
          setSelectedIngredients([]);
        }
      } catch (err) {
        console.error("Failed to fetch ingredients", err);
      } finally {
        setIsLoadingIngs(false);
      }
    };
    fetchIngs();

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
    if (selectedIngredients.length === 0) return;

    if (selectedIngredients.length === 1) {
      const qty = parseFloat(ingQuantity);
      if (!qty || qty <= 0) return;
      
      const ppu = parseFloat(ingPricePerUnit);
      if (!ppu || ppu <= 0) return;

      const ing = ingredientsList.find(i => i.id === selectedIngredients[0])!;
      setItems(prev => [...prev, {
        id: uuidv4(),
        type: 'ingredient' as const,
        ingredient_id: ing.id,
        name: ing.name,
        quantity: qty,
        unit: ing.unit,
        price_per_unit: ppu,
        total: qty * ppu
      }]);
      
      setSelectedIngredients([]);
      setIngQuantity('');
      setIngPricePerUnit('');
      setIngTotalPrice('');
    } else {
      const total = parseFloat(ingTotalPrice);
      if (!total || total <= 0) return;

      setDistTotalValue(ingTotalPrice);
      
      const newDistItems = selectedIngredients.map(ingId => {
        const ing = ingredientsList.find(i => i.id === ingId)!;
        return {
          id: uuidv4(),
          ingredient_id: ing.id,
          name: ing.name,
          unit: ing.unit,
          quantity: ingQuantity || '1',
          share: (total / selectedIngredients.length).toFixed(2)
        };
      });
      
      setDistributionItems(newDistItems);
      setIsDistributing(true);
    }
  };

  const getPriceMemory = (ingredientId: string) => {
    const history = allPastPurchases
      .filter(p => p.ingredient_id === ingredientId)
      .map(p => p.price_per_unit)
      .filter((v, i, a) => a.indexOf(v) === i) // unique
      .slice(0, 3);
    return history;
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

  const updateDistItem = (id: string, updates: Partial<typeof distributionItems[0]>) => {
    setDistributionItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const newValues = { ...item, ...updates };
      // Ensure share is never negative
      if (updates.share !== undefined) {
        newValues.share = Math.max(0, parseFloat(updates.share) || 0).toString();
      }
      return newValues;
    }));
  };

  const distAllocated = distributionItems.reduce((sum, item) => sum + (parseFloat(item.share) || 0), 0);
  const distRemain = parseFloat(distTotalValue || '0') - distAllocated;

  const handleDistributionComplete = () => {
    const itemsToAdd = distributionItems.map(item => {
      const qty = parseFloat(item.quantity) || 1;
      const share = parseFloat(item.share) || 0;
      return {
        id: item.id,
        type: 'ingredient' as const,
        ingredient_id: item.ingredient_id,
        name: item.name,
        quantity: qty,
        unit: item.unit,
        price_per_unit: share / qty,
        total: share
      };
    });

    setItems(prev => [...prev, ...itemsToAdd]);
    setIsDistributing(false);
    setSelectedIngredients([]);
    setIngQuantity('');
    setIngPricePerUnit('');
    setIngTotalPrice('');
  };

  const autoBalanceDist = () => {
    if (distRemain === 0) return;
    const balancePerItem = distRemain / distributionItems.length;
    setDistributionItems(prev => prev.map(item => ({
      ...item,
      share: Math.max(0, parseFloat(item.share || '0') + balancePerItem).toFixed(2)
    })));
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
      showNotification('წარმატებით შეინახა!', 'success');
      setTimeout(() => navigate('/'), 1500);
    } catch (err: any) {
      showNotification(`შენახვა ვერ მოხერხდა: ${err?.message || 'უცნობი შეცდომა'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    showNotification('ნამდვილად გსურთ გაუქმება? მონაცემები წაიშლება.', 'error', true, () => {
      setItems([]);
      localStorage.removeItem('stock-in-draft');
      navigate('/');
    });
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
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 flex p-1">
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
              სხვა
            </button>
          </div>

          {/* Form container */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 flex-1 flex flex-col">
            {mode === 'ingredient' ? (
              <div className="space-y-5 flex-1">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">ინგრედიენტი</label>
                  {isLoadingIngs ? (
                    <div className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-500 font-medium flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> იტვირთება...
                    </div>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                      {categoryGroups.map(group => (
                        <div key={group.category}>
                          <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            {group.category}
                            <div className="h-px bg-stone-100 flex-1"></div>
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {group.ingredients.map(ing => (
                              <button
                                key={`${group.category}-${ing.id}`}
                                onClick={() => setSelectedIngredients(prev => prev.includes(ing.id) ? prev.filter(id => id !== ing.id) : [...prev, ing.id])}
                                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                  selectedIngredients.includes(ing.id)
                                    ? 'bg-green-600 text-white shadow-md border border-green-600'
                                    : 'bg-white text-stone-600 border border-stone-200 hover:border-green-300 hover:bg-green-50/50 hover:text-green-700 shadow-sm'
                                }`}
                              >
                                {ing.name} <span className={selectedIngredients.includes(ing.id) ? 'text-green-100' : 'text-stone-400'}>({ing.unit})</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      {categoryGroups.length === 0 && (
                        <div className="flex flex-wrap gap-2">
                          {ingredientsList.map(ing => (
                            <button
                              key={ing.id}
                              onClick={() => setSelectedIngredients(prev => prev.includes(ing.id) ? prev.filter(id => id !== ing.id) : [...prev, ing.id])}
                              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                selectedIngredients.includes(ing.id)
                                  ? 'bg-green-600 text-white shadow-md border border-green-600'
                                  : 'bg-white text-stone-600 border border-stone-200 hover:border-green-300 hover:bg-green-50/50 hover:text-green-700 shadow-sm'
                              }`}
                            >
                              {ing.name} <span className={selectedIngredients.includes(ing.id) ? 'text-green-100' : 'text-stone-400'}>({ing.unit})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {selectedIngredients.length <= 1 && (
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">რაოდენობა</label>
                    <div className="flex flex-col gap-2 mb-2">
                      <div className="flex gap-2">
                        {[-10, -5, -1].map(n => (
                          <button
                            key={n}
                            onClick={() => setIngQuantity(Math.max(0, (parseFloat(ingQuantity || '0') + n)).toString())}
                            className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition-colors border border-red-100"
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        {[1, 5, 10].map(n => (
                          <button
                            key={n}
                            onClick={() => setIngQuantity((parseFloat(ingQuantity || '0') + n).toString())}
                            className="flex-1 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg transition-colors border border-stone-200"
                          >
                            +{n}
                          </button>
                        ))}
                      </div>
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
                )}
                {selectedIngredients.length <= 1 ? (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-2">ერთეულის ფასი (₾)</label>
                      <div 
                        onClick={() => { setNumpadValue(ingPricePerUnit); setNumpadTarget('ingPrice'); }}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 cursor-pointer font-medium flex items-center transition-colors mb-3"
                      >
                        <span className={ingPricePerUnit ? 'text-stone-900' : 'text-stone-400'}>
                          {ingPricePerUnit || '0.00'}
                        </span>
                      </div>
                      
                      {/* Price Memory Chips */}
                      {selectedIngredients.length === 1 && getPriceMemory(selectedIngredients[0]).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {getPriceMemory(selectedIngredients[0]).map(price => (
                            <button
                              key={price}
                              onClick={() => setIngPricePerUnit(price.toString())}
                              className="px-3 py-1 bg-stone-100 hover:bg-green-100 text-stone-600 hover:text-green-700 rounded-lg text-xs font-bold border border-stone-200 transition-colors"
                            >
                              {price}₾
                            </button>
                          ))}
                        </div>
                      )}
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
                        disabled={!ingQuantity || !ingPricePerUnit || selectedIngredients.length === 0}
                        className="w-full py-4 bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Plus className="w-5 h-5" /> დამატება სიაში
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-2">მთლიანი ფასი (₾)</label>
                      <div 
                        onClick={() => { setNumpadValue(ingTotalPrice); setNumpadTarget('ingTotal'); }}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 cursor-pointer font-medium flex items-center transition-colors"
                      >
                        <span className={ingTotalPrice ? 'text-stone-900' : 'text-stone-400'}>
                          {ingTotalPrice || '0.00'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-stone-100 mt-auto">
                      <button
                        onClick={handleAddIngredient}
                        disabled={!ingTotalPrice || selectedIngredients.length === 0}
                        className="w-full py-4 bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Plus className="w-5 h-5" /> დამატება სიაში
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-5 flex-1">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">პროდუქტის სახელი</label>
                  <div 
                    onClick={() => { setKeyboardValue(manName); setKeyboardTarget('manName'); }}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 cursor-pointer font-medium flex items-center transition-colors min-h-[50px]"
                  >
                    <span className={manName ? 'text-stone-900' : 'text-stone-400'}>
                      {manName || 'მაგ. საწმენდი საშუალებები'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">რაოდენობა (ცალი / შეკვრა)</label>
                  <div 
                    onClick={() => { setNumpadValue(manQuantity); setNumpadTarget('manQuantity'); }}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 cursor-pointer font-medium flex items-center transition-colors"
                  >
                    <span className={manQuantity ? 'text-stone-900' : 'text-stone-400'}>
                      {manQuantity || '0'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">მთლიანი ფასი (₾)</label>
                  <div 
                    onClick={() => { setNumpadValue(manTotal); setNumpadTarget('manTotal'); }}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 cursor-pointer font-medium flex items-center transition-colors"
                  >
                    <span className={manTotal ? 'text-stone-900' : 'text-stone-400'}>
                      {manTotal || '0.00'}
                    </span>
                  </div>
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
                        {item.type === 'ingredient' ? 'ინგრედიენტი' : item.type === 'quick' ? 'სწრაფი' : 'სხვა'}
                      </div>
                    </td>
                    <td className="p-4 text-right font-medium text-stone-700">
                      {item.type === 'quick' ? <span className="text-stone-400">—</span> : `${item.quantity} ${item.unit || 'ცალი'}`}
                    </td>
                    <td className="p-4 text-right font-black text-stone-800">
                      {item.type === 'quick' ? (
                        <span className="font-black text-stone-800">{item.total?.toFixed(2)}₾</span>
                      ) : (
                        <>
                          {item.total?.toFixed(2)}₾
                          {item.type === 'ingredient' && (
                            <div className="text-xs text-stone-400 font-medium mt-0.5">
                              ({item.price_per_unit?.toFixed(2)}₾ / {item.unit})
                            </div>
                          )}
                        </>
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

      {/* Numpad Modal */}
      {numpadTarget && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-6 flex flex-col transform transition-all duration-200 scale-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-stone-800">
                {numpadTarget === 'ingPrice' ? 'ერთეულის ფასი' : 
                 numpadTarget === 'ingTotal' ? 'მთლიანი ფასი' : 
                 numpadTarget === 'manQuantity' ? 'რაოდენობა' : 'მთლიანი ფასი'}
              </h3>
              <button onClick={() => setNumpadTarget(null)} className="p-2 text-stone-400 hover:bg-stone-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6 bg-stone-100/50 border border-stone-200/50 rounded-2xl p-5 text-right flex items-center justify-end overflow-hidden">
              <span className="text-5xl font-black text-stone-800 tracking-tight select-none flex items-baseline">
                {numpadValue || '0'}
                <span className="text-2xl text-stone-400 ml-1 font-bold">
                  {numpadTarget === 'manQuantity' ? '' : '₾'}
                </span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <button
                  key={n}
                  onClick={() => handleNumpadInput(n.toString())}
                  className="h-16 text-2xl font-black text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-2xl transition-all active:scale-95 active:bg-stone-300 shadow-sm"
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => handleNumpadInput('.')}
                className="h-16 text-3xl font-black text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-2xl transition-all active:scale-95 active:bg-stone-300 shadow-sm"
              >
                .
              </button>
              <button
                onClick={() => handleNumpadInput('0')}
                className="h-16 text-2xl font-black text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-2xl transition-all active:scale-95 active:bg-stone-300 shadow-sm"
              >
                0
              </button>
              <button
                onClick={() => handleNumpadInput('backspace')}
                className="h-16 text-2xl font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-2xl transition-all active:scale-95 active:bg-red-200 shadow-sm flex items-center justify-center"
              >
                <Delete className="w-7 h-7" />
              </button>
            </div>
            
            <button
              onClick={handleNumpadConfirm}
              className="mt-6 w-full py-5 text-xl font-black text-white bg-green-600 hover:bg-green-700 rounded-2xl transition-all shadow-lg shadow-green-600/20 active:scale-95"
            >
              დადასტურება
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Modal */}
      {keyboardTarget && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl w-full max-w-4xl p-6 flex flex-col transform transition-all duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-stone-800">
                შეიყვანეთ პროდუქტის სახელი
              </h3>
              <button onClick={() => setKeyboardTarget(null)} className="p-2 text-stone-400 hover:bg-stone-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6 bg-stone-100/50 border border-stone-200/50 rounded-2xl p-5 text-left flex items-center justify-start overflow-hidden overflow-x-auto min-h-[80px]">
              <span className="text-3xl font-black text-stone-800 tracking-tight select-none">
                {keyboardValue}
                {!keyboardValue && <span className="text-stone-400 animate-pulse">|</span>}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {GEO_KEYBOARD.map((row, rIdx) => (
                <div key={rIdx} className="flex justify-center gap-2">
                  {row.map((key, kIdx) => {
                    if (key === 'space') {
                      return (
                        <button
                          key={kIdx}
                          onClick={() => handleKeyboardInput(key)}
                          className="h-14 flex-[3] text-lg font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all active:scale-95 active:bg-stone-300 shadow-sm"
                        >
                          გამოტოვება
                        </button>
                      );
                    }
                    if (key === 'backspace') {
                      return (
                        <button
                          key={kIdx}
                          onClick={() => handleKeyboardInput(key)}
                          className="h-14 flex-1 min-w-[60px] text-lg font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-all active:scale-95 active:bg-red-200 shadow-sm flex items-center justify-center"
                        >
                          <Delete className="w-6 h-6" />
                        </button>
                      );
                    }
                    return (
                      <button
                        key={kIdx}
                        onClick={() => handleKeyboardInput(key)}
                        className="h-14 flex-1 min-w-[40px] max-w-[60px] text-xl font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all active:scale-95 active:bg-stone-300 shadow-sm"
                      >
                        {key}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            
            <button
              onClick={handleKeyboardConfirm}
              className="mt-6 w-full py-5 text-xl font-black text-white bg-green-600 hover:bg-green-700 rounded-2xl transition-all shadow-lg shadow-green-600/20 active:scale-95"
            >
              დადასტურება
            </button>
          </div>
        </div>
      )}

      {/* Notification Modal is now handled globally in App.tsx */}

      {/* Distribution Modal */}
      {isDistributing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <div>
                <h3 className="text-2xl font-black text-stone-800">💰 პრიზების განაწილება</h3>
                <p className="text-stone-500 font-medium mt-1">მთლიანი ჩეკი: <span className="text-stone-900 font-bold">{distTotalValue}₾</span></p>
              </div>
              <button 
                onClick={() => setIsDistributing(false)}
                className="p-3 bg-white hover:bg-stone-100 text-stone-400 rounded-2xl transition-all border border-stone-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {distributionItems.map((item) => (
                <div key={item.id} className="p-6 bg-stone-50 rounded-3xl border border-stone-200 shadow-sm transition-all hover:shadow-md">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-lg font-black text-stone-800">{item.name}</h4>
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{item.unit}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-stone-400 uppercase mb-1">რაოდენობა</div>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateDistItem(item.id, { quantity: e.target.value })}
                        className="w-24 px-3 py-2 bg-white border border-stone-200 rounded-xl text-right font-black text-stone-800 focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end gap-6">
                      <div className="flex-1">
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-stone-600">წილი ჩეკში</label>
                          <span className="text-sm font-black text-green-600">{item.share}₾</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={Math.max(0, parseFloat(item.share) + distRemain)}
                          step="0.01"
                          value={item.share}
                          onChange={(e) => updateDistItem(item.id, { share: e.target.value })}
                          className="w-full accent-green-600 cursor-pointer h-2 bg-stone-200 rounded-lg appearance-none"
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          value={item.share}
                          onChange={(e) => updateDistItem(item.id, { share: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl font-black text-stone-800 text-center focus:ring-2 focus:ring-green-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Price Memory in Modal */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-tighter self-center mr-1">ბოლო:</span>
                      {getPriceMemory(item.ingredient_id).map(price => (
                        <button
                          key={price}
                          onClick={() => updateDistItem(item.id, { share: (parseFloat(item.quantity) * price).toFixed(2) })}
                          className="px-2.5 py-1 bg-white hover:bg-green-50 text-[11px] font-bold text-stone-500 hover:text-green-700 rounded-lg border border-stone-200 hover:border-green-200 transition-all"
                        >
                          {price}₾
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-stone-50 border-t border-stone-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className="text-xs font-bold text-stone-400 uppercase mb-1">
                    {distRemain < -0.01 ? '❌ ზედმეტია განაწილებული' : 'დარჩენილია გასანაწილებელი'}
                  </div>
                  <div className={`text-2xl font-black ${distRemain < -0.01 ? 'text-red-600 animate-pulse' : distRemain > 0.01 ? 'text-blue-600' : 'text-green-600'}`}>
                    {distRemain.toFixed(2)}₾
                  </div>
                </div>
                <button
                  onClick={autoBalanceDist}
                  className="px-6 py-3 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-2xl font-bold transition-all flex items-center gap-2"
                >
                  გათანაბრება
                </button>
              </div>
              <button
                onClick={handleDistributionComplete}
                className="w-full py-5 bg-green-600 hover:bg-green-700 text-white rounded-[2rem] font-black text-xl shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-3"
              >
                <Plus className="w-8 h-8" /> სიაში დამატება
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
