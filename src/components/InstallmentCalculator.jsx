import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../utils/price';

// Shared across the Tour, Hotel and Shop product pages — same markup and
// rates everywhere. Rate tables are per the Tour Page brief; YapıKredi is
// intentionally omitted (not active). Month keys map to the surcharge %.
// Only round terms are offered — 2 and 9 month options were dropped.
const CARDS = [
  { id: 'birkart', label: 'BirKart', color: '#E30613', months: { 3: 5, 6: 9, 12: 15, 18: 20 } },
  { id: 'tamkart', label: 'TamKart', color: '#EC1C24', months: { 3: 4, 6: 7, 12: 13, 18: 20, 24: 26 } },
  { id: 'bolkart', label: 'BolKart', color: '#1D2C5B', months: { 3: 4, 6: 7, 12: 12, 18: 17, 24: 21 } },
];

export default function InstallmentCalculator({ basePrice, currency }) {
  const { t } = useTranslation();
  const [cardId, setCardId] = useState(CARDS[0].id);
  const [months, setMonths] = useState(null);

  const card = CARDS.find((c) => c.id === cardId) || CARDS[0];
  const monthOptions = useMemo(
    () => Object.keys(card.months).map(Number).sort((a, b) => a - b),
    [card]
  );

  // Default to a mid-term option (6 mo if the card offers it) rather than
  // the shortest — a 2-month split shows a scary-large monthly figure.
  const defaultMonths = card.months[6] != null ? 6 : monthOptions[Math.floor(monthOptions.length / 2)];
  const activeMonths = months && card.months[months] != null ? months : defaultMonths;
  const pct = card.months[activeMonths];
  const total = Math.round(basePrice * (1 + pct / 100));
  const monthly = total / activeMonths;

  const pickCard = (id) => {
    setCardId(id);
    setMonths(null);
  };

  if (!basePrice || basePrice <= 0) return null;

  return (
    <div className="tl-instl">
      <h3 className="tl-instl-title">{t('installment.title')}</h3>
      <p className="tl-instl-sub">{t('installment.subtitle')}</p>

      <div className="tl-instl-cards">
        {CARDS.map((c) => (
          <button
            type="button"
            key={c.id}
            className={`tl-instl-card${c.id === cardId ? ' active' : ''}`}
            style={c.id === cardId ? { background: c.color, borderColor: c.color, color: '#fff' } : undefined}
            onClick={() => pickCard(c.id)}
            aria-pressed={c.id === cardId}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="tl-instl-months">
        {monthOptions.map((m) => (
          <button
            type="button"
            key={m}
            className={`tl-instl-month${m === activeMonths ? ' active' : ''}`}
            onClick={() => setMonths(m)}
            aria-pressed={m === activeMonths}
          >
            {t('installment.months', { count: m })} <span>+{card.months[m]}%</span>
          </button>
        ))}
      </div>

      <div className="tl-instl-result">
        <div>
          <span className="tl-instl-result-label">{t('installment.monthly')}</span>
          <strong>{formatPrice(Number(monthly.toFixed(2)), currency)}</strong>
        </div>
        <div>
          <span className="tl-instl-result-label">{t('installment.total')}</span>
          <strong>{formatPrice(total, currency)}</strong>
        </div>
      </div>

      <p className="tl-instl-note">{t('installment.commissionNote')}</p>
    </div>
  );
}
