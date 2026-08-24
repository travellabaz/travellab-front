import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Breadcrumb from '../components/Breadcrumb';
import ProductCard from '../components/ProductCard';
import ColorDots from '../components/ColorDots';
import NotFoundPage from './NotFoundPage';
import { getProductBySku, getRelatedProducts } from '../data/shop';
import { orderProductWhatsappUrl } from '../utils/shopWhatsapp';
import { useCart } from '../context/CartContext';
import { getLocaleFromPathname } from '../utils/locale';

export default function ShopProductPage() {
  const { sku } = useParams();
  const { t } = useTranslation();
  const lang = getLocaleFromPathname(useLocation().pathname);
  const { addItem } = useCart();
  const product = getProductBySku(sku);

  const [activeImage, setActiveImage] = useState(0);
  const [color, setColor] = useState(product?.colors[0] || null);
  const [qty, setQty] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [lightboxOpen]);

  if (!product) return <NotFoundPage />;

  const related = getRelatedProducts(product, 4);
  const changeQty = (delta) => setQty((q) => Math.max(1, Math.min(20, q + delta)));

  // Photos are entered in the Sheet in the same order as the colours
  // (every product has exactly as many images as colours) — so picking a
  // colour swatch also switches the gallery to that colour's photo, and
  // vice versa when browsing the thumbnails.
  const colorImagesAligned = product.colors.length === product.images.length;
  const selectColor = (c) => {
    setColor(c);
    if (colorImagesAligned) setActiveImage(product.colors.indexOf(c));
  };
  const selectImage = (i) => {
    setActiveImage(i);
    if (colorImagesAligned) setColor(product.colors[i]);
  };

  return (
    <main className="tpwl-main">
      <section className="tl-page-top">
        <div className="tl-section" style={{ paddingBottom: 0 }}>
          <Breadcrumb
            items={[
              { name: t('breadcrumb.home'), to: '/' },
              { name: t('shop.breadcrumb'), to: '/shop' },
              { name: product.categories[0] || t('shop.breadcrumb'), to: `/shop?category=${encodeURIComponent(product.categories[0] || '')}` },
              { name: product.name },
            ]}
          />
        </div>
      </section>

      <section>
        <div className="tl-section" style={{ paddingTop: 12 }}>
          <div className="tl-product-detail">
            <div className="tl-product-gallery">
              {product.images[activeImage] ? (
                <button type="button" className="tl-product-gallery-main tl-product-gallery-zoom" onClick={() => setLightboxOpen(true)} aria-label={t('shop.galleryZoom')}>
                  <img src={product.images[activeImage]} alt={product.name} />
                </button>
              ) : (
                <div className="tl-product-gallery-main">
                  <span className="tl-product-card-noimg" aria-hidden="true" />
                </div>
              )}
              {product.images.length > 1 && (
                <div className="tl-product-gallery-thumbs">
                  {product.images.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      className={'tl-product-gallery-thumb' + (i === activeImage ? ' active' : '')}
                      onClick={() => selectImage(i)}
                    >
                      <img src={src} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="tl-product-info">
              <div className="tl-product-category-tag">{product.categories.join(' · ')}</div>
              <h1 className="tl-product-name">{product.name}</h1>
              <div className="tl-product-price">{product.price} {product.currency}</div>

              {product.colors.length > 0 && (
                <div className="tl-product-field">
                  <label>{t('shop.colorLabel')}</label>
                  <ColorDots colors={product.colors} max={0} selected={color} onSelect={selectColor} />
                </div>
              )}

              {product.description && (
                <p className="tl-product-description">{product.description}</p>
              )}

              <div className="tl-product-field">
                <label>{t('shop.qtyLabel')}</label>
                <div className="tl-qty-stepper">
                  <button type="button" onClick={() => changeQty(-1)} aria-label={t('shop.qtyDecrease')}>−</button>
                  <span>{qty}</span>
                  <button type="button" onClick={() => changeQty(1)} aria-label={t('shop.qtyIncrease')}>+</button>
                </div>
              </div>

              {!product.inStock && <div className="tl-product-oos-notice">{t('shop.outOfStock')}</div>}

              <div className="tl-product-ctas">
                <a
                  href={orderProductWhatsappUrl(product, t, lang)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={'tl-product-cta-wa' + (!product.inStock ? ' disabled' : '')}
                  aria-disabled={!product.inStock}
                  onClick={(e) => { if (!product.inStock) e.preventDefault(); }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.5.1-.2 0-.4 0-.5C10 9 9.5 7.8 9.3 7.3c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.6 1.1 2.7c.1.2 2 3 4.7 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.5-.3z" /><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 20.2 12 8.2 8.2 0 0 1 12 20.2z" /></svg>
                  {t('shop.whatsappOrder')}
                </a>
                <button type="button" className="tl-product-cta-cart" onClick={() => addItem(product.sku, qty)} disabled={!product.inStock}>
                  {t('shop.addToCart')}
                </button>
              </div>

              <div className="tl-product-trust-row">
                <div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l7 4v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg>
                  <span>{t('shop.trustOriginal')}</span>
                </div>
                <div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h11v8H3z" /><path d="M14 10h4l3 3v2h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="18" cy="18" r="1.6" /></svg>
                  <span>{t('shop.trustDelivery')}</span>
                </div>
                <div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" /></svg>
                  <span>{t('shop.trustReturn')}</span>
                </div>
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <div className="tl-product-related">
              <h2 className="tl-title" style={{ marginBottom: 16 }}>{t('shop.relatedTitle')}</h2>
              <div className="tl-product-grid">
                {related.map((p) => (
                  <ProductCard key={p.sku} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {lightboxOpen &&
        product.images[activeImage] &&
        createPortal(
          <div className="tl-product-lightbox-overlay" onClick={() => setLightboxOpen(false)}>
            <button type="button" className="tl-product-lightbox-close" onClick={() => setLightboxOpen(false)} aria-label={t('shop.galleryClose')}>✕</button>
            <img className="tl-product-lightbox-img" src={product.images[activeImage]} alt={product.name} onClick={(e) => e.stopPropagation()} />
          </div>,
          document.body
        )}
    </main>
  );
}
