import { useTranslation } from 'react-i18next';

// Same 4 benefits shown both on the homepage Shop block and at the bottom
// of /shop — one component so the two never drift apart.
const BENEFITS = [
  {
    key: 'installments',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>,
  },
  {
    key: 'cashback',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M9 15V9l6 6V9" /></svg>,
  },
  {
    key: 'original',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l7 4v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg>,
  },
  {
    key: 'delivery',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h11v8H3z" /><path d="M14 10h4l3 3v2h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="18" cy="18" r="1.6" /></svg>,
  },
];

export default function ShopBenefitsStrip({ variant = 'card' }) {
  const { t } = useTranslation();
  return (
    <div className={variant === 'bar' ? 'tl-shop-benefits-bar' : 'tl-shop-benefits'}>
      {BENEFITS.map(({ key, icon }) => (
        <div className={variant === 'bar' ? 'tl-shop-benefit-bar-item' : 'tl-shop-benefit'} key={key}>
          <span className="tl-shop-benefit-ico">{icon}</span>
          <p>{t(`shop.benefit${key}`)}</p>
        </div>
      ))}
    </div>
  );
}
