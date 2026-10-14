import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { readStoredPackages, writeStoredPackage, generateRequestCode, packageItems } from '../utils/tourPackage';

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
  // Tour packages (see utils/tourPackage.js) — keyed by tour id, each
  // persisted under its own tl_tour_pkg_<tourId> key rather than inside
  // STORAGE_KEY, per the task spec.
  const [packages, setPackages] = useState(readStoredPackages);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Refs so the package callbacks below can stay stable (no deps on the
  // state they read) — same reasoning as addItem's functional setState.
  const packagesRef = useRef(packages);
  packagesRef.current = packages;
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // location.key, not pathname: tapping a link to the page you're already
  // on (logo / "Ana səhifə" while on the home page) keeps the pathname but
  // is still a new navigation, and the drawer has to close for it too.
  const { key: locationKey } = useLocation();

  // Closing the drawer was only ever wired to its own X/overlay/"Davam
  // et" controls — navigating away via a NavLink (tab bar, hamburger
  // menu, desktop nav) left drawerOpen untouched, so the drawer stayed
  // open and visible, painted over whatever page you'd just navigated
  // to. Tying it to the route itself covers every navigation path at
  // once instead of patching each link's onClick individually.
  useEffect(() => {
    setDrawerOpen(false);
  }, [locationKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage full/blocked — cart just won't persist across reloads, fine
    }
  }, [items]);

  // A package only exists while it has products in it or its tour is in
  // the cart as a line — otherwise it's dropped (code and all).
  const persistPackage = useCallback((tourId, pkg) => {
    writeStoredPackage(tourId, pkg);
    // Ref updated right away too, so several calls in one tick (e.g.
    // moving every Shop item into a package at once) build on each other.
    const nextRef = { ...packagesRef.current };
    if (pkg) nextRef[tourId] = pkg;
    else delete nextRef[tourId];
    packagesRef.current = nextRef;
    setPackages((cur) => {
      const next = { ...cur };
      if (pkg) next[tourId] = pkg;
      else delete next[tourId];
      return next;
    });
  }, []);

  // Adding to a package deliberately does NOT open the drawer (unlike
  // addItem) — the tour page shows it in its own strip/sheet instead.
  // tourSnapshot is only needed when the package doesn't exist yet.
  const setPackageItem = useCallback((tourId, tourSnapshot, item) => {
    const id = String(tourId);
    const cur = packagesRef.current[id];
    const pkg = cur || { tourId: id, code: generateRequestCode(), createdAt: new Date().toISOString(), tour: tourSnapshot, items: {} };
    const items = { ...pkg.items };
    if (item.qty > 0) items[item.sku] = item;
    else delete items[item.sku];
    const next = { ...pkg, items };
    const keep = packageItems(next).length > 0 || !!itemsRef.current[lineKey('tour', id)];
    persistPackage(id, keep ? next : null);
  }, [persistPackage]);

  // Keeps the package's tour snapshot (hotel, price, dates) in sync with
  // what's currently selected on the tour page.
  const syncPackageTour = useCallback((tourId, tourSnapshot) => {
    const id = String(tourId);
    const cur = packagesRef.current[id];
    if (!cur || JSON.stringify(cur.tour) === JSON.stringify(tourSnapshot)) return;
    persistPackage(id, { ...cur, tour: tourSnapshot });
  }, [persistPackage]);

  // "Səbətə əlavə et" on a tour page — the tour line plus an (empty)
  // package, so the cart group already has its request code.
  const ensurePackage = useCallback((tourId, tourSnapshot) => {
    const id = String(tourId);
    if (packagesRef.current[id]) return;
    persistPackage(id, { tourId: id, code: generateRequestCode(), createdAt: new Date().toISOString(), tour: tourSnapshot, items: {} });
  }, [persistPackage]);

  const removePackage = useCallback((tourId) => persistPackage(String(tourId), null), [persistPackage]);

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

  // (l.qty || 0), not l.qty — a stored line from an older cart schema
  // missing qty entirely (undefined) would otherwise poison the whole
  // sum to NaN (number + undefined = NaN propagates through every later
  // addition too), silently breaking both the header badge and anything
  // gating on count/total being a real number.
  // Package products count too, plus a package's tour itself when it
  // isn't already counted as a cart line.
  const count = useMemo(() => {
    let n = lines.reduce((sum, l) => sum + (l.qty || 0), 0);
    Object.values(packages).forEach((pkg) => {
      const pkgItems = packageItems(pkg);
      n += pkgItems.reduce((sum, it) => sum + it.qty, 0);
      if (pkgItems.length > 0 && !items[lineKey('tour', pkg.tourId)]) n += 1;
    });
    return n;
  }, [lines, packages, items]);
  const total = useMemo(() => lines.reduce((sum, l) => sum + (l.qty || 0) * (l.price || 0), 0), [lines]);

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
      packages,
      setPackageItem,
      syncPackageTour,
      ensurePackage,
      removePackage,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [lines, productLines, tourLines, count, total, addItem, removeItem, setQty, packages, setPackageItem, syncPackageTour, ensurePackage, removePackage, drawerOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
