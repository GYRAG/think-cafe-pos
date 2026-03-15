import { create } from 'zustand';
import { User, Product, OrderItem } from './types';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  user: User | null;
  posCart: OrderItem[];
  
  // Actions
  login: (username: string, role: 'cashier' | 'admin') => void;
  logout: () => void;
  
  // Local cart state
  addToCart: (product: Product) => void;
  updateCartQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
}

export const useStore = create<AppState>()((set) => ({
  user: null,
  posCart: [],

  login: (username, role) => set({ user: { id: uuidv4(), username, role } }),
  logout: () => set({ user: null, posCart: [] }),

  addToCart: (product) => set((state) => {
    const existing = state.posCart.find(item => item.product.id === product.id);
    if (existing) {
      return {
        posCart: state.posCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      };
    }
    return { posCart: [...state.posCart, { product, quantity: 1 }] };
  }),

  updateCartQuantity: (productId, delta) => set((state) => ({
    posCart: state.posCart.map(item => {
      if (item.product.id === productId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => {
      // remove if quantity goes below 1
      if (item.product.id === productId && item.quantity + delta <= 0) return false;
      return true;
    })
  })),

  clearCart: () => set({ posCart: [] })
}));
