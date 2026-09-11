import { useTranslation } from 'react-i18next';

// Shared across the Tour, Hotel and Shop product pages. "İmkanlar":
// two icon rows (installment term / accepted cards) plus the card
// chips — mirrors the reference design's layout. The card-icon row
// wiggles on a loop to draw the eye; the calendar-icon row joins in
// (both wiggling together) after a couple of cycles instead of staying
// static forever — see .tl-instl-wiggle in global.css.
const CARDS = [
  { id: 'birkart', label: 'BirKart', icon: '/images/cards/birkart.jpg' },
  { id: 'tamkart', label: 'TamKart', wordmark: '/images/cards/tamkart.svg' },
  { id: 'bolkart', label: 'BolKart', icon: '/images/cards/bolkart.jpg' },
];

const CALENDAR_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const CARD_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /><path d="M6 15h4" />
  </svg>
);

export default function InstallmentCalculator({ basePrice }) {
  const { t } = useTranslation();

  if (!basePrice || basePrice <= 0) return null;

  return (
    <div className="tl-instl">
      <h3 className="tl-instl-title">{t('installment.title')}</h3>

      <div className="tl-instl-row">
        <span className="tl-instl-row-ico tl-instl-row-ico-delay">{CALENDAR_ICON}</span>
        <span>{t('installment.term')}</span>
      </div>
      <div className="tl-instl-row">
        <span className="tl-instl-row-ico">{CARD_ICON}</span>
        <span>{t('installment.cardsLine')}</span>
      </div>

      <div className="tl-instl-cards">
        {CARDS.map((c) => (
          <span key={c.id} className="tl-instl-card">
            {c.wordmark ? (
              <img src={c.wordmark} alt={c.label} className="tl-instl-card-wordmark" />
            ) : (
              <>
                <img src={c.icon} alt="" className="tl-instl-card-icon" />
                {c.label}
              </>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
