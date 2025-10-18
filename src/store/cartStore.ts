import { create } from "zustand";

export interface Product {
  id: number;
  name: string;
  price: number;
}

export interface CartExtra {
  id: string;
  name: string;
  price: number;
}

export interface CartItem extends Product {
  quantity: number;
  extras: CartExtra[];
  cartKey: string; // chiave unica della riga carrello
}

interface CartState {
  items: CartItem[];
  addToCart: (product: Product & { extras?: CartExtra[] }) => void;
  addExtraToItem: (cartKey: string, extra: CartExtra) => void;
  removeExtraFromItem: (cartKey: string, extraId: string) => void;
  removeFromCart: (cartKey: string) => void;
  decrementQuantity: (cartKey: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],

  // ✅ Aggiunge un prodotto — raggruppa solo se identico e senza extra
  addToCart: (product) =>
    set((state) => {
      const hasExtras = !!product.extras?.length;

      if (!hasExtras) {
        // Cerca una card identica senza extra
        const existing = state.items.find(
          (i) => i.id === product.id && i.extras.length === 0
        );
        if (existing) {
          return {
            items: state.items.map((i) =>
              i.cartKey === existing.cartKey
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          };
        }
      }

      // Crea una nuova card se ha extra o non esiste ancora
      const newItem: CartItem = {
        ...product,
        quantity: 1,
        extras: product.extras || [],
        cartKey: `${product.id}-${Date.now()}`,
      };
      return { items: [...state.items, newItem] };
    }),

  // ✅ Aggiunge extra alla stessa card (senza creare nuove righe)
  addExtraToItem: (cartKey, extra) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.cartKey === cartKey
          ? { ...item, extras: [...item.extras, extra] }
          : item
      ),
    })),

  // ✅ Rimuove un extra specifico
  removeExtraFromItem: (cartKey, extraId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.cartKey === cartKey
          ? { ...item, extras: item.extras.filter((e) => e.id !== extraId) }
          : item
      ),
    })),

  // ✅ Decrementa quantità o elimina la card se arriva a 0
  decrementQuantity: (cartKey) =>
    set((state) => {
      const existing = state.items.find((i) => i.cartKey === cartKey);
      if (!existing) return state;

      if (existing.quantity <= 1) {
        return { items: state.items.filter((i) => i.cartKey !== cartKey) };
      }

      return {
        items: state.items.map((i) =>
          i.cartKey === cartKey ? { ...i, quantity: i.quantity - 1 } : i
        ),
      };
    }),

  // ✅ Rimuove interamente una card
  removeFromCart: (cartKey) =>
    set((state) => ({
      items: state.items.filter((i) => i.cartKey !== cartKey),
    })),

  clearCart: () => set({ items: [] }),
}));
