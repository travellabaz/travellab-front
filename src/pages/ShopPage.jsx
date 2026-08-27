import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Breadcrumb from '../components/Breadcrumb';
import Link from '../components/LocalizedLink';
import ProductCard from '../components/ProductCard';
import ShopBenefitsStrip from '../components/ShopBenefitsStrip';
import ColorDots from '../components/ColorDots';
import ImageCarousel from '../components/ImageCarousel';
import ShopVideoGallery from '../components/ShopVideoGallery';
import SeoBodyText from '../components/SeoBodyText';
import { getProductGroups, getCategories, categorySlug, sortProductGroups } from '../data/shop';
import { SHOP_WHATSAPP_NUMBER } from '../utils/shopWhatsapp';

const PAGE_SIZE = 8;
const SORT_OPTIONS = ['newest', 'cheapest', 'expensive'];
// Rotated by category index so the promo card's color varies instead of
// always being the same one (see the "discover another category" card
// mixed into the first page of the grid below).
// Green first would mean the very first category (whatever sorts first,
// e.g. "Elektronika" on the "Hamısı" view) always got the same color as
// the rest of the site's green branding — start on a different one.
const PROMO_COLORS = ['blue', 'orange', 'teal', 'green'];

// Add more paths here as new banner photos are shot — nothing else needs
// to change (see ImageCarousel).
const BANNER_IMAGES = [
  '/images/shop/banner-woman-suitcase.jpg',
  '/images/shop/banner-man-suitcase.jpg',
];

// category: null for the all-products /shop page, or a real category name
// (matching a value in the Sheet's "Kateqoriya" column) for a /shop/:slug
// category landing page — see the dispatcher in ShopProductPage.jsx, which
// mounts this with key={category} so switching categories gets a clean
// remount (filters/pagination reset) instead of carrying over state that
// belonged to the previous category.
export default function ShopPage({ category = null }) {
  const { t } = useTranslation();
  const allGroups = getProductGroups();
  const categories = getCategories();
  const [sort, setSort] = useState('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [colorFilter, setColorFilter] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const allColors = useMemo(() => {
    const set = new Set();
    allGroups.forEach((g) => g.colors.forEach((c) => set.add(c)));
    return Array.from(set);
  }, [allGroups]);

  const filtered = useMemo(() => {
    let list = category ? allGroups.filter((g) => g.categories.includes(category)) : allGroups;
    if (colorFilter) list = list.filter((g) => g.colors.includes(colorFilter));
    return sortProductGroups(list, sort);
  }, [allGroups, category, colorFilter, sort]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // A card promoting one other category, mixed into the grid so a visitor
  // browsing e.g. "Setlər" or "Hamısı" notices there's more to the catalogue
  // without having to look back up at the chips. Only ever shown on the
  // first page (visibleCount still at its initial value) — "Load more"
  // reveals the rest of the real catalogue with no promo mixed in, and the
  // one real product it displaces on that first page just reappears there.
  const promoCategory = useMemo(() => {
    if (categories.length < 2) return null;
    const idx = category ? categories.indexOf(category) : -1;
    return categories[(idx + 1) % categories.length];
  }, [categories, category]);
  const showPromoCard = Boolean(promoCategory) && visibleCount === PAGE_SIZE && visible.length > 0;
  const gridGroups = showPromoCard ? visible.slice(0, PAGE_SIZE - 1) : visible;
  const promoColor = promoCategory ? PROMO_COLORS[categories.indexOf(promoCategory) % PROMO_COLORS.length] : null;

  const selectSort = (value) => {
    setSort(value);
    setSortOpen(false);
    setVisibleCount(PAGE_SIZE);
  };

  const toggleColorFilter = (color) => {
    setColorFilter((c) => (c === color ? null : color));
    setVisibleCount(PAGE_SIZE);
  };

  const waWhatsappUrl = 'https://wa.me/' + SHOP_WHATSAPP_NUMBER + '?text=' + encodeURIComponent(t('shop.waGenericMessage'));

  return (
    <main className="tpwl-main">
      <section className="tl-page-top">
        <div className="tl-section" style={{ paddingBottom: 0 }}>
          <Breadcrumb
            items={
              category
                ? [{ name: t('breadcrumb.home'), to: '/' }, { name: t('shop.breadcrumb'), to: '/shop' }, { name: category }]
                : [{ name: t('breadcrumb.home'), to: '/' }, { name: t('shop.breadcrumb') }]
            }
          />
        </div>
      </section>

      <section>
        <div className="tl-section" style={{ paddingTop: 12 }}>
          <div className="tl-shop-banner">
            <ImageCarousel images={BANNER_IMAGES} alt={t('shop.pageTitle')} />
          </div>

          <div className="tl-shop-page-header">
            <div>
              <h1 className="tl-title">{category || t('shop.pageTitle')}</h1>
              <p className="tl-shop-page-subtitle">
                {category ? t('shop.categoryPageSubtitle', { category }) : t('shop.pageSubtitle')}
              </p>
            </div>
          </div>

          <div className="tl-shop-chips">
            <Link to="/shop" className={'tl-shop-chip' + (!category ? ' active' : '')}>
              {t('shop.allCategories')}
            </Link>
            {categories.map((cat) => (
              <Link key={cat} to={`/shop/${categorySlug(cat)}`} className={'tl-shop-chip' + (category === cat ? ' active' : '')}>
                {cat}
              </Link>
            ))}
          </div>

          <div className="tl-shop-toolbar">
            <div className="tl-shop-toolbar-right">
              <div className="tl-shop-dropdown">
                <button type="button" className="tl-shop-toolbar-btn" onClick={() => { setSortOpen((o) => !o); setFilterOpen(false); }}>
                  {t('shop.sortLabel')}: {t(`shop.sort_${sort}`)}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                </button>
                {sortOpen && (
                  <div className="tl-shop-dropdown-panel">
                    {SORT_OPTIONS.map((opt) => (
                      <button key={opt} type="button" className={'tl-shop-dropdown-item' + (sort === opt ? ' active' : '')} onClick={() => selectSort(opt)}>
                        {t(`shop.sort_${opt}`)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="tl-shop-dropdown">
                <button type="button" className="tl-shop-toolbar-btn" onClick={() => { setFilterOpen((o) => !o); setSortOpen(false); }}>
                  {t('shop.filterLabel')}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
                </button>
                {filterOpen && (
                  <div className="tl-shop-dropdown-panel tl-shop-filter-panel">
                    <div className="tl-shop-filter-title">{t('shop.filterByColor')}</div>
                    <div className="tl-shop-filter-colors">
                      {allColors.map((c) => (
                        <button key={c} type="button" className="tl-shop-filter-color-row" onClick={() => toggleColorFilter(c)}>
                          <ColorDots colors={[c]} max={0} selected={colorFilter} />
                          <span>{c}</span>
                          {colorFilter === c && <span aria-hidden="true">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="tl-product-grid">
            {gridGroups.map((g) => (
              <ProductCard key={g.id} group={g} />
            ))}
            {showPromoCard && (
              <Link to={`/shop/${categorySlug(promoCategory)}`} className={`tl-shop-promo-card tl-shop-promo-${promoColor}`}>
                <span className="tl-shop-promo-kicker">{t('shop.promoDiscover')}</span>
                <span className="tl-shop-promo-category">{promoCategory}</span>
                <span className="tl-shop-promo-arrow" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                </span>
              </Link>
            )}
          </div>

          {filtered.length === 0 && <p className="tl-shop-empty">{t('shop.noResults')}</p>}

          <ShopVideoGallery />

          <SeoBodyText>
            <p>{t(category ? 'shop.categorySeoP1' : 'shop.seoP1', { category })}</p>
            <p>{t(category ? 'shop.categorySeoP2' : 'shop.seoP2', { category })}</p>
          </SeoBodyText>

          <div className="tl-shop-benefits-bar-wrap">
            <ShopBenefitsStrip variant="bar" />
          </div>

          {hasMore && (
            <div className="tl-shop-loadmore-wrap">
              <button type="button" className="tl-shop-loadmore" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" /></svg>
                {t('shop.loadMore')}
              </button>
            </div>
          )}
        </div>
      </section>

      <a href={waWhatsappUrl} target="_blank" rel="noopener noreferrer" className="tl-shop-wa-float">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.5.1-.2 0-.4 0-.5C10 9 9.5 7.8 9.3 7.3c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.6 1.1 2.7c.1.2 2 3 4.7 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.5-.3z" /><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 20.2 12 8.2 8.2 0 0 1 12 20.2z" /></svg>
        <span>{t('shop.whatsappOrder')}</span>
      </a>
    </main>
  );
}
