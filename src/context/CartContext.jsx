import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getProductBySku } from '../data/shop';

const CartContext = createContext(null);
const STORAGE_KEY = 'tl-shop-cart';

// { [sku]: qty } — no real checkout/payment exists yet (see the Shop task:
// the WhatsApp CTA is the actual order path), so this only needs to track
// what's "in the bag" for the nav badge and the cart drawer's own WhatsApp
// hand-off message. localStorage, not a server cart — per-device only.
function readStored() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStored);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage full/blocked — cart just won't persist across reloads, fine
    }
  }, [items]);

  const addItem = useCallback((sku, qty = 1) => {
    setItems((cur) => ({ ...cur, [sku]: (cur[sku] || 0) + qty }));
    setDrawerOpen(true);
  }, []);

  const removeItem = useCallback((sku) => {
    setItems((cur) => {
      const next = { ...cur };
      delete next[sku];
      return next;
    });
  }, []);

  const setQty = useCallback((sku, qty) => {
    setItems((cur) => (qty <= 0 ? (({ [sku]: _drop, ...rest }) => rest)(cur) : { ...cur, [sku]: qty }));
  }, []);

  const lines = useMemo(
    () =>
      Object.entries(items)
        .map(([sku, qty]) => ({ product: getProductBySku(sku), qty }))
        .filter((l) => l.product),
    [items]
  );

  const count = useMemo(() => lines.reduce((sum, l) => sum + l.qty, 0), [lines]);
  const total = useMemo(() => lines.reduce((sum, l) => sum + l.qty * l.product.price, 0), [lines]);

  const value = useMemo(
    () => ({ lines, count, total, addItem, removeItem, setQty, drawerOpen, openDrawer: () => setDrawerOpen(true), closeDrawer: () => setDrawerOpen(false) }),
    [lines, count, total, addItem, removeItem, setQty, drawerOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
