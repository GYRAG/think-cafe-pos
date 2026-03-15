import { useState, useMemo, useEffect, useCallback, memo } from 'react';
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

  const handleCheckoutClick = useCallback(async () => {
    if (cart.length === 0 || checkingOut) return;
    
    if (!confirming) {
      setConfirming(true);
    } else {
      setCheckingOut(true);
      try {
        await completeOrder(cart);
        clearCart();
        setConfirming(false);
      } catch (err: any) {
        const msg = err?.message ?? JSON.stringify(err);
        console.error('[completeOrder] Failed:', err);
        alert(`შეკვეთის დასრულება ვერ მოხერხდა:\n${msg}`);
      } finally {
        setCheckingOut(false);
      }
    }
  }, [cart, checkingOut, confirming, clearCart]);

  const handleAddToCart = useCallback((product: Product) => addToCart(product), [addToCart]);
  const handleUpdateQty = useCallback((id: string, delta: number) => updateCartQuantity(id, delta), [updateCartQuantity]);
  const handleClearCart = useCallback(() => clearCart(), [clearCart]);

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
                "px-5 py-2.5 rounded-xl font-bold text-sm",
                selectedCategory === null
                  ? "bg-stone-800 text-white"
                  : "bg-stone-100 text-stone-600"
              )}
            >
              ყველა
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={clsx(
                  "px-5 py-2.5 rounded-xl font-bold text-sm",
                  selectedCategory === cat
                    ? "bg-stone-800 text-white"
                    : "bg-stone-100 text-stone-600"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="flex-1 overflow-y-auto p-6 pos-scroll">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => handleAddToCart(product)}
                className="pos-card bg-white rounded-2xl overflow-hidden border border-stone-100 flex flex-col text-left active:opacity-70"
              >
                <div className="h-36 w-full bg-stone-100 relative overflow-hidden">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      loading="lazy"
                      decoding="async"
                      width="200"
                      height="144"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <ShoppingBag className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-white px-2 py-0.5 rounded-full font-bold text-stone-900 text-sm shadow-sm">
                    {product.price}₾
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-stone-800 text-base leading-tight line-clamp-2">{product.name}</h3>
                  <p className="text-stone-500 text-xs mt-0.5">{product.category}</p>
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
            <button onClick={handleClearCart} className="text-stone-400" title="გასუფთავება">
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
              <CartItem key={item.product.id} item={item} onUpdate={handleUpdateQty} />
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
              "w-full py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-2",
              confirming
                ? "bg-green-700 text-white"
                : "bg-green-600 disabled:bg-stone-300 disabled:cursor-not-allowed text-white"
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
              className="w-full mt-2 py-2 text-stone-500 text-sm font-medium"
            >
              გაუქმება
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Memoized cart row — only re-renders when its own quantity changes,
// not when other items are added to the cart.
const CartItem = memo(({ item, onUpdate }: {
  item: { product: Product; quantity: number };
  onUpdate: (id: string, delta: number) => void;
}) => (
  <div className="flex flex-col p-3 bg-stone-50 rounded-xl border border-stone-100">
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-bold text-stone-800 pr-2 text-sm leading-tight">{item.product.name}</h4>
      <span className="font-bold text-stone-900 text-sm whitespace-nowrap">{(item.product.price * item.quantity).toFixed(2)}₾</span>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-stone-500 text-xs">{item.product.price}₾ / ცალი</span>
      <div className="flex items-center gap-2 bg-white rounded-lg border border-stone-200 p-0.5">
        <button
          onClick={() => onUpdate(item.product.id, -1)}
          className="w-7 h-7 flex items-center justify-center rounded-md text-stone-600"
        >
          {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5" />}
        </button>
        <span className="w-5 text-center font-bold text-stone-800 text-sm">{item.quantity}</span>
        <button
          onClick={() => onUpdate(item.product.id, 1)}
          className="w-7 h-7 flex items-center justify-center rounded-md text-stone-600"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
));
