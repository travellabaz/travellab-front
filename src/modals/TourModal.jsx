import { useEffect, useState } from 'react';
import { useModals } from '../context/ModalContext';
import { useTours } from '../context/ToursContext';
import { useAuth } from '../context/AuthContext';
import { isMobile, managerLabel, managerLink, pickManager, formatManagerNumber } from '../utils/managers';
import { extractMinPrice, formatPrice, calcReward, formatPoints, calcBalanceDiscount } from '../utils/price';

export default function TourModal() {
  const { tourIndex, closeTour } = useModals();
  const { tours } = useTours();
  const { isAuthenticated, profile } = useAuth();
  const tour = tourIndex != null ? tours[tourIndex] : null;
  const [manager, setManager] = useState(pickManager);

  useEffect(() => {
    if (!tour) return undefined;
    setManager(pickManager());
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') closeTour();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourIndex]);

  if (!tour) return null;

  const link = managerLink(tour, manager);
  const price = extractMinPrice(tour.description);
  const reward = price ? calcReward(price) : null;
  const balanceDiscount = price && isAuthenticated ? calcBalanceDiscount(price, Number(profile.azn) || 0) : null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) closeTour();
      }}
      style={{
        display: 'flex',
        position: 'fixed',
        inset: 0,
        zIndex: 1500,
        background: 'rgba(13,21,32,0.88)',
        backdropFilter: 'blur(8px)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 24,
          width: '100%',
          maxWidth: 560,
          maxHeight: '88vh',
          overflowY: 'auto',
          position: 'relative',
          margin: 16,
          animation: 'authPop 0.3s cubic-bezier(0.175,0.885,0.32,1.275) both',
        }}
      >
        <button
          onClick={closeTour}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'rgba(10,42,34,0.55)',
            border: 'none',
            borderRadius: 8,
            width: 32,
            height: 32,
            color: '#fff',
            fontSize: 18,
            cursor: 'pointer',
            lineHeight: 1,
            zIndex: 2,
          }}
        >
          ×
        </button>
        <div
          style={{
            height: 320,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundColor: 'var(--tl-gray-50)',
            borderRadius: '24px 24px 0 0',
            backgroundImage: tour.imageUrl ? `url('${tour.imageUrl}')` : 'none',
          }}
        />
        <div style={{ padding: '24px 28px 28px' }}>
          <div style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--tl-navy)', marginBottom: 14, lineHeight: 1.3 }}>
            {tour.title}
          </div>
          <div style={{ fontSize: 14, color: 'var(--tl-gray-600)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 20 }}>
            {tour.description}
          </div>
          {price && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--tl-navy)' }}>
                  {formatPrice(price.amount, price.currency)}-dan
                </span>
                <span className="tl-badge tl-badge-lp">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 1L7.35 4.15L10.8 4.5L8.2 6.77L8.95 10.15L6 8.35L3.05 10.15L3.8 6.77L1.2 4.5L4.65 4.15L6 1Z" fill="currentColor" />
                  </svg>
                  +{formatPoints(reward.points)} Lab Point
                </span>
              </div>
              {balanceDiscount && balanceDiscount.discountAzn > 0 && (
                <div className="tl-price-inst">
                  <span>Lab Point ilə: -{formatPrice(balanceDiscount.discountAzn, 'AZN')} → {formatPrice(balanceDiscount.finalAzn, 'AZN')}</span>
                  <svg className="tl-price-inst-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.5 10.5L8 6L4.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          )}
          <a
            href={link}
            target={isMobile() ? '_blank' : '_self'}
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: 'var(--tl-green)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              padding: '12px 22px',
              borderRadius: 12,
              textDecoration: 'none',
            }}
          >
            {managerLabel()} →
          </a>
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--tl-gray-400)' }}>
            Menecer: {manager.name} — {formatManagerNumber(manager.number)}
          </div>
        </div>
      </div>
    </div>
  );
}
