import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { getProducts, upsertProduct, deleteProduct, updateProductOrder } from '../../lib/db';
import { Plus, Edit2, Trash2, X, Loader2, RotateCcw, GripVertical } from 'lucide-react';
import { useStore } from '../../store';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sortable Table Row Component ---
function SortableTableRow({ 
  product, 
  isSelected,
  onToggleSelect,
  onEdit, 
  onDelete 
}: { 
  key?: React.Key | null;
  product: Product; 
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (p?: Product) => void;
  onDelete: (id: string) => void | Promise<void>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative' as const, zIndex: 10, backgroundColor: '#f5f5f4', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' } : {}),
  };

  return (
    <tr ref={setNodeRef} style={style} className={`group transition-colors ${isDragging ? '' : isSelected ? 'bg-orange-50/50' : 'hover:bg-stone-50/50'}`}>
      <td className="p-4 w-12 text-center">
        <input 
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(product.id)}
          className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-stone-300 cursor-pointer"
        />
      </td>
      <td className="p-4 w-12 text-center">
        <button 
          className="text-stone-300 hover:text-stone-600 cursor-grab active:cursor-grabbing p-1 rounded transition-colors"
          {...attributes} 
          {...listeners}
          title="გადაიტანეთ რიგის შესაცვლელად"
        >
          <GripVertical className="w-5 h-5" />
        </button>
      </td>
      <td className="p-4">
        <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden">
          {product.image_url && (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          )}
        </div>
      </td>
      <td className="p-4 font-bold text-stone-800">{product.name}</td>
      <td className="p-4 text-stone-600">
        <span className="px-3 py-1 bg-stone-100 rounded-full text-xs font-bold text-stone-600">{product.category}</span>
      </td>
      <td className="p-4 font-bold text-stone-900">{product.price}₾</td>
      <td className="p-4 text-stone-500">{product.cost}₾</td>
      <td className="p-4">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {product.is_active ? 'აქტიური' : 'გათიშული'}
        </span>
      </td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(product)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer relative z-20"
            title="რედაქტირება"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer relative z-20"
            title="წაშლა"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// --- Main Page Component ---
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const showNotification = useStore(state => state.showNotification);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    cost: '',
    category: '',
    image_url: '',
    is_active: true,
    sort_order: 0
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'ვერ მოხერხდა პროდუქტების ჩატვირთვა');
      showNotification(`შეცდომა ჩატვირთვისას: ${err?.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        cost: product.cost.toString(),
        category: product.category,
        image_url: product.image_url,
        is_active: product.is_active,
        sort_order: product.sort_order ?? 0
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: '',
        cost: '',
        category: '',
        image_url: '',
        is_active: true,
        sort_order: products.length
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const productData = {
      ...(editingProduct ? { id: editingProduct.id } : {}),
      name: formData.name,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost),
      category: formData.category,
      image_url: formData.image_url,
      is_active: formData.is_active,
      sort_order: formData.sort_order
    };

    try {
      await upsertProduct(productData);
      await fetchProducts();
      setIsModalOpen(false);
      showNotification('პროდუქტი წარმატებით შეინახა!', 'success');
    } catch (err) {
      showNotification('შენახვა ვერ მოხერხდა', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    showNotification('ნამდვილად გსურთ წაშლა?', 'error', true, async () => {
      try {
        await deleteProduct(id);
        await fetchProducts();
        showNotification('წაშლა წარმატებით დასრულდა!', 'success');
      } catch (err) {
        showNotification('წაშლა ვერ მოხერხდა', 'error');
      }
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = products.findIndex((p) => p.id === active.id);
      const newIndex = products.findIndex((p) => p.id === over.id);
      
      const newOrderedProducts: Product[] = arrayMove(products, oldIndex, newIndex);
      setProducts(newOrderedProducts); // Optimistic UI update

      // Compute updates for all products whose index changed to guarantee sort_order matches array index
      const updates = newOrderedProducts.map((p, index) => ({
        id: p.id,
        sort_order: index
      }));

      try {
        await updateProductOrder(updates);
      } catch (err) {
        showNotification('თანმიმდევრობის შენახვა ვერ მოხერხდა', 'error');
        await fetchProducts(); // Revert on failure
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkStatusUpdate = async (is_active: boolean) => {
    if (selectedIds.size === 0) return;
    setIsBulkLoading(true);
    try {
      await import('../../lib/db').then(m => m.bulkUpdateProductStatus(Array.from(selectedIds), is_active));
      await fetchProducts();
      setSelectedIds(new Set());
      showNotification(`${selectedIds.size} პროდუქტი განახლდა!`, 'success');
    } catch (err) {
      showNotification('ჯგუფური განახლება ვერ მოხერხდა', 'error');
    } finally {
      setIsBulkLoading(false);
    }
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
        <button onClick={fetchProducts} className="flex items-center gap-2 px-4 py-2 bg-stone-200 rounded-xl hover:bg-stone-300 transition-colors text-stone-700">
          <RotateCcw className="w-4 h-4" /> თავიდან ცდა
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-stone-800">პროდუქტები</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-orange-700 text-white rounded-2xl font-bold transition-colors shadow-lg shadow-green-600/20"
        >
          <Plus className="w-5 h-5" />
          პროდუქტის დამატება
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100 text-stone-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium w-12 text-center">
                    <input 
                      type="checkbox"
                      checked={products.length > 0 && selectedIds.size === products.length}
                      onChange={toggleSelectAll}
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-stone-300 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 font-medium w-12 text-center">რიგი</th>
                  <th className="p-4 font-medium">სურათი</th>
                  <th className="p-4 font-medium">სახელი</th>
                  <th className="p-4 font-medium">კატეგორია</th>
                  <th className="p-4 font-medium">ფასი</th>
                  <th className="p-4 font-medium">თვითღირებულება</th>
                  <th className="p-4 font-medium">სტატუსი</th>
                  <th className="p-4 font-medium text-right">ქმედებები</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                <SortableContext
                  items={products.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {products.map(product => (
                    <SortableTableRow 
                      key={product.id} 
                      product={product} 
                      isSelected={selectedIds.has(product.id)}
                      onToggleSelect={toggleSelectItem}
                      onEdit={handleOpenModal}
                      onDelete={handleDelete}
                    />
                  ))}
                </SortableContext>
                {products.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-stone-500">
                      პროდუქტები არ მოიძებნა
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </DndContext>
        </div>
      </div>
      
      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-stone-900 border border-white/10 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-10 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center font-black text-lg">
              {selectedIds.size}
            </span>
            <span className="font-bold text-lg text-stone-300">არჩეულია</span>
          </div>
          
          <div className="h-8 w-px bg-white/20"></div>
          
          <div className="flex gap-4">
            <button
              onClick={() => handleBulkStatusUpdate(true)}
              disabled={isBulkLoading}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-stone-700 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              {isBulkLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'გააქტიურება'}
            </button>
            <button
              onClick={() => handleBulkStatusUpdate(false)}
              disabled={isBulkLoading}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-stone-700 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              {isBulkLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'გათიშვა'}
            </button>
          </div>
          
          <button 
            onClick={() => setSelectedIds(new Set())}
            className="p-3 hover:bg-white/10 rounded-full transition-colors text-stone-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Modal View ... unchanged */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-stone-100">
              <h2 className="text-2xl font-bold text-stone-800">
                {editingProduct ? 'პროდუქტის რედაქტირება' : 'ახალი პროდუქტი'}
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
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">ფასი (₾)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">თვითღირებულება (₾)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.cost}
                    onChange={e => setFormData({...formData, cost: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">კატეგორია</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">სურათის URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={e => setFormData({...formData, image_url: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-stone-300"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-stone-700 cursor-pointer">
                  პროდუქტი აქტიურია
                </label>
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
                  className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-xl font-bold transition-colors shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2"
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
