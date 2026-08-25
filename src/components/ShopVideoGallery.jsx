import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Link from './LocalizedLink';
import { SHOP_SPOTLIGHT_VIDEOS } from '../data/shop/spotlightVideos';
import { getGroupBySku, productSlug } from '../data/shop';
import { productUrl } from '../utils/shopWhatsapp';
import { getLocaleFromPathname } from '../utils/locale';

const MuteIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>;
const UnmuteIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>;
const ShareIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v14" /></svg>;
const CheckIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>;
const ExpandIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5" /></svg>;

// "Watch & shop" carousel below the product grid — one focused clip at a
// time (center card, full size, playing) with just the immediate next/
// previous clip half-peeking on either side (clipped by the track's
// overflow:hidden), mirroring a UGC "users sharing" video wall. Only the
// focused card ever has a <video> mounted and playing — everything else
// just shows its poster frame — so switching cards (arrows, or tapping a
// side card) never has more than one clip decoding/autoplaying at once.
export default function ShopVideoGallery() {
  const { t } = useTranslation();
  const location = useLocation();
  const lang = getLocaleFromPathname(location.pathname);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const touchStartRef = useRef(null);

  const items = SHOP_SPOTLIGHT_VIDEOS
    .map((item) => ({ item, group: getGroupBySku(item.sku) }))
    .filter((entry) => entry.group);

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [lightboxOpen]);

  if (items.length === 0) return null;

  const clampedIndex = Math.min(activeIndex, items.length - 1);
  const { item: activeItem, group: activeGroup } = items[clampedIndex];

  const goTo = (i) => {
    if (i < 0 || i >= items.length) return;
    setMuted(true);
    setActiveIndex(i);
  };

  // Swipe-to-advance on mobile — a plain left/right threshold on release,
  // same one-card-at-a-time model as the arrow buttons (not a live-drag
  // like the story viewer's cube; this carousel doesn't need that).
  const onTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    const start = touchStartRef.current;
    if (start == null) return;
    const dx = e.changedTouches[0].clientX - start;
    touchStartRef.current = null;
    if (Math.abs(dx) < 40) return;
    goTo(dx < 0 ? clampedIndex + 1 : clampedIndex - 1);
  };

  const share = () => {
    const url = productUrl(activeGroup.defaultVariant, lang);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ProductCta = ({ className }) => (
    <div className={className}>
      <div className="tl-shop-spotlight-product-row">
        <span className="tl-shop-spotlight-product-thumb">
          {activeGroup.defaultVariant.images[0] && <img src={activeGroup.defaultVariant.images[0]} alt={activeGroup.name} loading="lazy" />}
        </span>
        <span className="tl-shop-spotlight-product-text">
          <strong>{activeGroup.name}</strong>
          <em>
            {activeGroup.variants.length > 1
              ? t('shop.priceFromValue', { price: activeGroup.minPrice, currency: activeGroup.defaultVariant.currency })
              : `${activeGroup.minPrice} ${activeGroup.defaultVariant.currency}`}
          </em>
        </span>
      </div>
      <Link to={`/shop/${productSlug(activeGroup.defaultVariant)}`} className="tl-shop-spotlight-product-cta">
        {t('shop.videosShopNow')}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
      </Link>
    </div>
  );

  return (
    <div className="tl-shop-videos">
      <h2 className="tl-shop-videos-title">{t('shop.videosTitle')}</h2>

      <div className="tl-shop-videos-carousel">
        <button
          type="button"
          className="tl-shop-videos-arrow tl-shop-videos-arrow-prev"
          onClick={() => goTo(clampedIndex - 1)}
          disabled={clampedIndex === 0}
          aria-label="Previous"
        >
          ‹
        </button>

        <div className="tl-shop-spotlight-track" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {clampedIndex > 0 && (
            <div
              key={items[clampedIndex - 1].item.sku}
              className="tl-shop-spotlight-card tl-shop-spotlight-side tl-shop-spotlight-side-prev"
              onClick={() => goTo(clampedIndex - 1)}
            >
              <img src={items[clampedIndex - 1].item.poster} alt="" className="tl-shop-spotlight-clip" loading="lazy" />
            </div>
          )}

          <div className="tl-shop-spotlight-card active">
            <video
              key={activeItem.sku}
              src={activeItem.video}
              poster={activeItem.poster}
              className="tl-shop-spotlight-clip"
              muted={muted}
              autoPlay
              loop
              playsInline
            />
            <div className="tl-shop-spotlight-top">
              <span className="tl-shop-spotlight-label">{activeGroup.name}</span>
              <div className="tl-shop-spotlight-icons">
                <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Unmute' : 'Mute'}>
                  {muted ? MuteIcon : UnmuteIcon}
                </button>
                <button type="button" onClick={share} aria-label={t('shop.videosShare')}>
                  {copied ? CheckIcon : ShareIcon}
                </button>
                <button type="button" onClick={() => setLightboxOpen(true)} aria-label="Fullscreen">
                  {ExpandIcon}
                </button>
              </div>
            </div>
            <ProductCta className="tl-shop-spotlight-product" />
          </div>

          {clampedIndex < items.length - 1 && (
            <div
              key={items[clampedIndex + 1].item.sku}
              className="tl-shop-spotlight-card tl-shop-spotlight-side tl-shop-spotlight-side-next"
              onClick={() => goTo(clampedIndex + 1)}
            >
              <img src={items[clampedIndex + 1].item.poster} alt="" className="tl-shop-spotlight-clip" loading="lazy" />
            </div>
          )}
        </div>

        <button
          type="button"
          className="tl-shop-videos-arrow tl-shop-videos-arrow-next"
          onClick={() => goTo(clampedIndex + 1)}
          disabled={clampedIndex === items.length - 1}
          aria-label="Next"
        >
          ›
        </button>
      </div>

      {lightboxOpen &&
        createPortal(
          <div className="tl-gift-video-overlay" onClick={() => setLightboxOpen(false)}>
            <button
              type="button"
              className="tl-gift-video-close"
              onClick={() => setLightboxOpen(false)}
              aria-label={t('shop.galleryClose')}
            >
              ✕
            </button>
            <div className="tl-shop-video-lightbox" onClick={(e) => e.stopPropagation()}>
              <video
                className="tl-shop-video-lightbox-player"
                src={activeItem.video}
                poster={activeItem.poster}
                controls
                autoPlay
                playsInline
              />
              <ProductCta className="tl-shop-spotlight-product tl-shop-spotlight-product-lightbox" />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
