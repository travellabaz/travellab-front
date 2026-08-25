import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from './LocalizedLink';
import { SHOP_SPOTLIGHT_VIDEOS } from '../data/shop/spotlightVideos';
import { getGroupBySku, productSlug } from '../data/shop';

const SCROLL_STEP = 260;

// Autoplays (muted) only while its card is actually on screen — otherwise
// every clip in the strip would be decoding video at once. Loops so a
// visitor lingering on one card just sees it repeat rather than freeze on
// the last frame.
function VideoCard({ item, group }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.6 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="tl-shop-video-card">
      <video
        ref={videoRef}
        src={item.video}
        poster={item.poster}
        className="tl-shop-video-el"
        muted={muted}
        loop
        playsInline
        preload="none"
      />
      <button
        type="button"
        className="tl-shop-video-mute"
        aria-label={muted ? 'Unmute' : 'Mute'}
        onClick={(e) => { e.preventDefault(); setMuted((m) => !m); }}
      >
        {muted ? '🔇' : '🔊'}
      </button>
      <Link to={`/shop/${productSlug(group.defaultVariant)}`} className="tl-shop-video-product">
        <span className="tl-shop-video-product-thumb">
          {group.defaultVariant.images[0] && <img src={group.defaultVariant.images[0]} alt={group.name} loading="lazy" />}
        </span>
        <span className="tl-shop-video-product-info">
          <strong>{group.name}</strong>
          <em>{group.minPrice} {group.defaultVariant.currency}</em>
        </span>
        <span className="tl-shop-video-product-arrow" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </span>
      </Link>
    </div>
  );
}

// "Watch & shop" strip below the product grid — real demo clips (hand-
// curated, see spotlightVideos.js) instead of stock photography, each
// tagged with the exact product it shows so a visitor can jump straight
// from the clip to that product's page.
export default function ShopVideoGallery() {
  const { t } = useTranslation();
  const scrollerRef = useRef(null);

  const items = SHOP_SPOTLIGHT_VIDEOS
    .map((item) => ({ item, group: getGroupBySku(item.sku) }))
    .filter((entry) => entry.group);

  if (items.length === 0) return null;

  const scrollBy = (delta) => scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });

  return (
    <div className="tl-shop-videos">
      <h2 className="tl-shop-videos-title">{t('shop.videosTitle')}</h2>
      <div className="tl-shop-videos-row">
        <button type="button" className="tl-shop-videos-arrow tl-shop-videos-arrow-prev" onClick={() => scrollBy(-SCROLL_STEP)} aria-label="Previous">‹</button>
        <div className="tl-shop-videos-scroller" ref={scrollerRef}>
          {items.map(({ item, group }) => (
            <VideoCard key={item.sku} item={item} group={group} />
          ))}
        </div>
        <button type="button" className="tl-shop-videos-arrow tl-shop-videos-arrow-next" onClick={() => scrollBy(SCROLL_STEP)} aria-label="Next">›</button>
      </div>
    </div>
  );
}
