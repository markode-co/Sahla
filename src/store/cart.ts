import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types";

interface CartStore {
  items: CartItem[];
  storeId: string | null;
  storeSlug: string | null;

  addItem: (product: Product, storeId: string, storeSlug: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      storeId: null,
      storeSlug: null,

      addItem: (product, storeId, storeSlug) => {
        const { items, storeId: currentStoreId } = get();

        // If adding from different store, clear cart
        if (currentStoreId && currentStoreId !== storeId) {
          set({
            items: [{ product, quantity: 1 }],
            storeId,
            storeSlug,
          });
          return;
        }

        const existing = items.find((i) => i.product.id === product.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({
            items: [...items, { product, quantity: 1 }],
            storeId,
            storeSlug,
          });
        }
      },

      removeItem: (productId) => {
        const items = get().items.filter((i) => i.product.id !== productId);
        set({
          items,
          storeId: items.length === 0 ? null : get().storeId,
          storeSlug: items.length === 0 ? null : get().storeSlug,
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [], storeId: null, storeSlug: null }),

      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    }),
    {
      name: "sahla-cart",
    }
  )
);
