import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'tl-shop-wishlist';

// Shared by Shop products and tours — same snapshot-at-save-time shape as
// CartContext, for the same reason (a saved tour needs to still be
// displayable even if it's since gone inactive and dropped out of
// ToursContext's live list).
function itemKey(kind, id) {
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

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(readStored);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage full/blocked — wishlist just won't persist across reloads
    }
  }, [items]);

  const has = useCallback((kind, id) => !!items[itemKey(kind, id)], [items]);

  // item: { kind, id, title, price, currency, image, url }
  const toggle = useCallback((item) => {
    const key = itemKey(item.kind, item.id);
    setItems((cur) => {
      if (cur[key]) {
        const next = { ...cur };
        delete next[key];
        return next;
      }
      return { ...cur, [key]: item };
    });
  }, []);

  const remove = useCallback((kind, id) => {
    setItems((cur) => {
      const next = { ...cur };
      delete next[itemKey(kind, id)];
      return next;
    });
  }, []);

  const products = useMemo(() => Object.values(items), [items]);
  const productItems = useMemo(() => products.filter((p) => p.kind === 'product'), [products]);
  const tourItems = useMemo(() => products.filter((p) => p.kind === 'tour'), [products]);

  const value = useMemo(
    () => ({
      products,
      productItems,
      tourItems,
      count: products.length,
      has,
      toggle,
      remove,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [products, productItems, tourItems, has, toggle, remove, drawerOpen]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
