import { useTranslation } from 'react-i18next';

// Shared across the Tour, Hotel and Shop product pages. Shows which cards
// offer installment payment — the per-month surcharge table / computed
// monthly figure were removed on request, so this is now just the card
// list plus a short line. YapıKredi is intentionally omitted (not active).
const CARDS = [
  { id: 'birkart', label: 'BirKart', color: '#E30613' },
  { id: 'tamkart', label: 'TamKart', color: '#EC1C24', logo: '/images/cards/tamkart.svg' },
  { id: 'bolkart', label: 'BolKart', color: '#1D2C5B' },
];

export default function InstallmentCalculator({ basePrice }) {
  const { t } = useTranslation();

  if (!basePrice || basePrice <= 0) return null;

  return (
    <div className="tl-instl">
      <h3 className="tl-instl-title">{t('installment.title')}</h3>
      <p className="tl-instl-sub">{t('installment.subtitle')}</p>

      <div className="tl-instl-cards">
        {CARDS.map((c) => (
          <span key={c.id} className="tl-instl-card">
            {c.logo ? (
              <img src={c.logo} alt={c.label} className="tl-instl-card-logo" />
            ) : (
              c.label
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
