import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'tl-shop-cart';

// Shared by Shop products and tours — no real checkout/payment exists (the
// WhatsApp CTA is the actual order path for both), so this only needs to
// track what's "in the bag" for the nav badge and the drawer's own
// WhatsApp hand-off. Each line snapshots what it needs to display and
// order (title/price/image/url) at add time rather than storing a bare id
// and re-resolving later — required for tours, which are fetched live and
// aren't guaranteed to still be in that list by the time the drawer opens
// (an inactive tour disappears from ToursContext entirely), and kept the
// same for products for one consistent shape. `kind` ('product' | 'tour')
// is what lets the drawer split the WhatsApp hand-off by destination
// number — see utils/shopWhatsapp.js (dedicated Shop line) vs
// utils/managers.js (tour manager pool).
function lineKey(kind, id) {
  return `${kind}:${id}`;
}

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

  // item: { kind, id, title, price, currency, image, url }, url/id bare
  // (unlocalized) paths — LocalizedLink/productUrl prefix them at render.
  const addItem = useCallback((item, qty = 1) => {
    const key = lineKey(item.kind, item.id);
    setItems((cur) => ({ ...cur, [key]: { ...item, qty: (cur[key]?.qty || 0) + qty } }));
    setDrawerOpen(true);
  }, []);

  const removeItem = useCallback((kind, id) => {
    setItems((cur) => {
      const next = { ...cur };
      delete next[lineKey(kind, id)];
      return next;
    });
  }, []);

  const setQty = useCallback((kind, id, qty) => {
    const key = lineKey(kind, id);
    setItems((cur) => (qty <= 0 ? (({ [key]: _drop, ...rest }) => rest)(cur) : { ...cur, [key]: { ...cur[key], qty } }));
  }, []);

  const lines = useMemo(() => Object.values(items), [items]);
  const productLines = useMemo(() => lines.filter((l) => l.kind === 'product'), [lines]);
  const tourLines = useMemo(() => lines.filter((l) => l.kind === 'tour'), [lines]);

  const count = useMemo(() => lines.reduce((sum, l) => sum + l.qty, 0), [lines]);
  const total = useMemo(() => lines.reduce((sum, l) => sum + l.qty * (l.price || 0), 0), [lines]);

  const value = useMemo(
    () => ({
      lines,
      productLines,
      tourLines,
      count,
      total,
      addItem,
      removeItem,
      setQty,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [lines, productLines, tourLines, count, total, addItem, removeItem, setQty, drawerOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
