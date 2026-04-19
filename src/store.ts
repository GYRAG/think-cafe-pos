import { create } from 'zustand';
import { User, Product, OrderItem } from './types';
import { v4 as uuidv4 } from 'uuid';

interface Notification {
  isOpen: boolean;
  message: string;
  type: 'success' | 'error';
  isConfirm?: boolean;
  onConfirm?: () => void;
}

interface AppState {
  user: User | null;
  posCart: OrderItem[];
  notification: Notification | null;
  
  // Actions
  login: (username: string, role: 'cashier' | 'admin') => void;
  logout: () => void;
  
  // Notification Actions
  showNotification: (message: string, type?: 'success' | 'error', isConfirm?: boolean, onConfirm?: () => void) => void;
  hideNotification: () => void;
  
  // Local cart state
  addToCart: (product: Product) => void;
  updateCartQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
}

export const useStore = create<AppState>()((set) => ({
  user: null,
  posCart: [],
  notification: null,

  login: (username, role) => set({ user: { id: uuidv4(), username, role } }),
  logout: () => set({ user: null, posCart: [] }),

  showNotification: (message, type = 'success', isConfirm = false, onConfirm) => 
    set({ notification: { isOpen: true, message, type, isConfirm, onConfirm } }),
  
  hideNotification: () => set({ notification: null }),

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
        return { ...item, quantity: item.quantity + delta };
      }
      return item;
    }).filter(item => item.quantity > 0)
  })),

  clearCart: () => set({ posCart: [] })
}));
