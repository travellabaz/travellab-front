import { useTranslation } from 'react-i18next';
import Link from '../components/LocalizedLink';
import ShopBenefitsStrip from '../components/ShopBenefitsStrip';
import { getBestsellers, productSlug } from '../data/shop';

// The outer strip below the card — distinct from the 4 payment/cashback/
// original/delivery benefits already listed in the left column ("əlavə
// üstünlüklər" — additional ones). Kept to generic, non-committal claims
// (no numbers/policies that would need sign-off) except the customer count,
// which is the one figure the task's own homepage mockup already shows.
const EXTRA_BENEFIT_KEYS = ['customers', 'packaging', 'support', 'payment'];

export default function ShopSection() {
  const { t } = useTranslation();
  const bestsellers = getBestsellers(5);

  return (
    <section id="shop" className="tl-page-top">
      <div className="tl-section">
        <div className="tl-section-header">
          <div>
            <div className="tl-tag">{t('shop.tag')}</div>
            <h2 className="tl-title">{t('shop.homeTitle')}</h2>
          </div>
        </div>

        <div className="tl-shop-card">
          <div className="tl-shop-card-left">
            <div className="tl-shop-kicker">{t('shop.homeKicker')}</div>
            <h3 className="tl-shop-headline">{t('shop.homeHeadline')}</h3>
            <p className="tl-shop-desc">{t('shop.homeDesc')}</p>
            <ShopBenefitsStrip variant="card" />
            <Link to="/shop" className="tl-shop-cta">
              {t('shop.goToShop')}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </Link>
          </div>

          <Link to="/shop" className="tl-shop-card-image">
            <img src="/images/shop/lifestyle-couple.jpg" alt={t('shop.homeTitle')} />
          </Link>

          <div className="tl-shop-bestsellers">
            <div className="tl-shop-bestsellers-title">{t('shop.bestsellersTitle')}</div>
            <div className="tl-shop-bestsellers-list">
              {bestsellers.map((p) => (
                <Link to={`/shop/${productSlug(p)}`} className="tl-shop-bestseller-item" key={p.sku}>
                  <span className="tl-shop-bestseller-thumb">
                    {p.images[0] && <img src={p.images[0]} alt={p.name} loading="lazy" />}
                  </span>
                  <span>
                    <strong>{p.name}</strong>
                    <em>{p.price} {p.currency}</em>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="tl-shop-extra-bar">
          {EXTRA_BENEFIT_KEYS.map((key) => (
            <div className="tl-shop-extra-item" key={key}>
              <span className="tl-shop-benefit-ico">{EXTRA_ICONS[key]}</span>
              <p>{t(`shop.extraBenefit${key}`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const EXTRA_ICONS = {
  customers: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  packaging: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8L12 3 3 8l9 5 9-5z" /><path d="M3 8v9l9 5 9-5V8" /><path d="M12 13v9" /></svg>,
  support: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  payment: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /><path d="M6 15h4" /></svg>,
};
