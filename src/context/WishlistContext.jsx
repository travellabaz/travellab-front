import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getProductBySku } from '../data/shop';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'tl-shop-wishlist';

// Array of SKUs, localStorage-persisted (per-device only, same as
// CartContext) — the heart button on a product card needs somewhere to
// actually save to, not just toggle its own local look.
function readStored() {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const [skus, setSkus] = useState(readStored);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(skus));
    } catch {
      // storage full/blocked — wishlist just won't persist across reloads
    }
  }, [skus]);

  const has = useCallback((sku) => skus.includes(sku), [skus]);

  const toggle = useCallback((sku) => {
    setSkus((cur) => (cur.includes(sku) ? cur.filter((s) => s !== sku) : [...cur, sku]));
  }, []);

  const remove = useCallback((sku) => {
    setSkus((cur) => cur.filter((s) => s !== sku));
  }, []);

  const products = useMemo(() => skus.map(getProductBySku).filter(Boolean), [skus]);

  const value = useMemo(
    () => ({ products, count: products.length, has, toggle, remove, drawerOpen, openDrawer: () => setDrawerOpen(true), closeDrawer: () => setDrawerOpen(false) }),
    [products, has, toggle, remove, drawerOpen]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
