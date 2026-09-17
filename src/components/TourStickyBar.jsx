import { useTranslation } from 'react-i18next';
import { formatPrice } from '../utils/price';
import useScrollDirection from '../hooks/useScrollDirection';

const WA_ICON = (
  <svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor">
    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
  </svg>
);

// Takes over from the global MobileTabBar on scroll-down, on the tour
// product page only (see MobileTabBar.jsx's own half of this pair) — one
// row with price, the LP/cashback this purchase earns, and a single
// WhatsApp CTA, updating live as the visitor adds cross-sell products
// (price/cashback are passed in from TourDetailPage's own state, already
// recalculated there). Scroll back up and this hides, the normal tab bar
// slides back into place.
export default function TourStickyBar({ price, cashback, waHref }) {
  const { t } = useTranslation();
  const scrollDirection = useScrollDirection();
  const visible = scrollDirection === 'down';

  if (!price) return null;

  return (
    <div className={'tl-tourp-stickybar' + (visible ? ' visible' : '')}>
      <div className="tl-tourp-stickybar-price">
        <strong>{formatPrice(price.amount, price.currency)}</strong>
        {cashback != null && (
          <span className="tl-tourp-stickybar-cashback">+{cashback} {price.currency} LP</span>
        )}
      </div>
      <a href={waHref} target="_blank" rel="noopener noreferrer" className="tl-tourp-stickybar-wa">
        {WA_ICON}
        {t('common.waWrite')}
      </a>
    </div>
  );
}
