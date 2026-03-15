import { useState, useMemo, useEffect, useRef } from 'react';
import { Product } from '../types';
import { getProducts, completeOrder } from '../lib/db';
import { useStore } from '../store';
import { Plus, Minus, Trash2, ShoppingBag, CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cart = useStore(state => state.posCart);
  const addToCart = useStore(state => state.addToCart);
  const updateCartQuantity = useStore(state => state.updateCartQuantity);
  const clearCart = useStore(state => state.clearCart);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      setProducts(data.filter(p => p.is_active));
    } catch (err: any) {
      setError(err.message || 'ვერ მოხერხდა პროდუქტების ჩატვირთვა');
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))), [products]);
  
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const totalAmount = useMemo(() => cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0), [cart]);

  const handleCheckoutClick = async () => {
    if (cart.length === 0 || checkingOut) return;
    
    if (!confirming) {
      setConfirming(true);
    } else {
      setCheckingOut(true);
      try {
        await completeOrder(cart);
        clearCart();
        setConfirming(false);
      } catch (err) {
        alert('შეკვეთის დასრულება ვერ მოხერხდა');
      } finally {
        setCheckingOut(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-stone-500">
        <p>{error}</p>
        <button onClick={fetchProducts} className="flex items-center gap-2 px-4 py-2 bg-stone-200 rounded-xl hover:bg-stone-300 transition-colors text-stone-700">
          <RotateCcw className="w-4 h-4" /> თავიდან ცდა
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full font-sans">
      {/* Left Side: Product Grid (70%) */}
      <div className="w-[70%] flex flex-col h-full border-r border-stone-200 bg-stone-50">
        {/* Categories */}
        <div className="p-4 border-b border-stone-200 bg-white overflow-x-auto whitespace-nowrap hide-scrollbar shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={clsx(
                "px-6 py-3 rounded-2xl font-bold text-sm transition-all",
                selectedCategory === null 
                  ? "bg-stone-800 text-white shadow-md" 
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              )}
            >
              ყველა
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={clsx(
                  "px-6 py-3 rounded-2xl font-bold text-sm transition-all",
                  selectedCategory === cat 
                    ? "bg-stone-800 text-white shadow-md" 
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-stone-100 flex flex-col text-left group active:scale-95"
              >
                <div className="h-40 w-full bg-stone-100 relative overflow-hidden">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <ShoppingBag className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full font-bold text-stone-900 shadow-sm">
                    {product.price}₾
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-stone-800 text-lg leading-tight line-clamp-2">{product.name}</h3>
                  <p className="text-stone-500 text-sm mt-1">{product.category}</p>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-stone-400">
                პროდუქტები არ მოიძებნა
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side: Current Order (30%) */}
      <div className="w-[30%] flex flex-col h-full bg-white">
        <div className="p-6 border-b border-stone-200 shrink-0 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-stone-800">მიმდინარე შეკვეთა</h2>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-stone-400 hover:text-red-500 transition-colors" title="გასუფთავება">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Order Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4">
              <ShoppingBag className="w-16 h-16 opacity-20" />
              <p className="text-lg font-medium">შეკვეთა ცარიელია</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex flex-col p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-stone-800 pr-4">{item.product.name}</h4>
                  <span className="font-bold text-stone-900">{item.product.price * item.quantity}₾</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 text-sm">{item.product.price}₾ / ცალი</span>
                  
                  <div className="flex items-center gap-3 bg-white rounded-xl border border-stone-200 p-1 shadow-sm">
                    <button
                      onClick={() => updateCartQuantity(item.product.id, -1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-600 transition-colors"
                    >
                      {item.quantity === 1 ? <Trash2 className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4" />}
                    </button>
                    <span className="w-6 text-center font-bold text-stone-800">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.product.id, 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Section */}
        <div className="p-6 border-t border-stone-200 bg-stone-50 shrink-0">
          <div className="flex justify-between items-end mb-6">
            <span className="text-stone-500 font-medium text-lg">სულ გადასახდელი:</span>
            <span className="text-4xl font-black text-stone-900">{totalAmount}₾</span>
          </div>
          
          <button
            onClick={handleCheckoutClick}
            disabled={cart.length === 0 || checkingOut}
            className={clsx(
              "w-full py-5 rounded-2xl font-bold text-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2",
              confirming
                ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
                : "bg-green-600 hover:bg-green-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white shadow-lg shadow-green-600/20"
            )}
          >
            {checkingOut ? (
              <><Loader2 className="w-6 h-6 animate-spin" /> სრულდება...</>
            ) : confirming ? (
              <><CheckCircle2 className="w-6 h-6" /> დაადასტურეთ შეკვეთა</>
            ) : 'შეკვეთის დასრულება'}
          </button>
          {confirming && !checkingOut && (
            <button
              onClick={() => setConfirming(false)}
              className="w-full mt-2 py-2 text-stone-500 hover:text-stone-700 text-sm font-medium transition-colors"
            >
              გაუქმება
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
