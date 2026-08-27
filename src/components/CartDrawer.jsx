import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Link from './LocalizedLink';
import { useCart } from '../context/CartContext';
import { SHOP_WHATSAPP_NUMBER } from '../utils/shopWhatsapp';
import { pickManager } from '../utils/managers';
import { getLocaleFromPathname, buildLocalizedPath } from '../utils/locale';
import { BASE_URL } from '../data/pageMeta';

// No real checkout exists (see the Shop task — WhatsApp is the actual
// order path, and tours already work the same way), so "checkout" here is
// just building one message per destination and handing off to WhatsApp.
// Shop products and tours go to two different numbers — a dedicated Shop
// line vs. the round-robin tour-manager pool — so a mixed cart sends two
// separate messages, one per section, instead of one combined one.
// Tour prices are mined out of Instagram captions in whatever currency
// that tour listed (USD/EUR/AZN — see utils/price.js), so a cart section
// can't assume one shared currency the way Shop (always AZN) could.
// Summing raw amounts across different currencies would be meaningless,
// so the subtotal only displays when every line in the section actually
// shares one currency — otherwise each line's own price (already shown
// per-line) is the only total a customer can trust; the section still
// works fine without a subtotal shown.
function CartSection({ title, lines, removeItem, setQty, waHref, waLabel }) {
  const { t } = useTranslation();
  const currencies = new Set(lines.map((l) => l.currency));
  const singleCurrency = currencies.size === 1 ? lines[0]?.currency : null;
  const total = lines.reduce((sum, l) => sum + l.qty * (l.price || 0), 0);

  return (
    <div className="tl-cart-section">
      <div className="tl-cart-section-title">{title}</div>
      <div className="tl-cart-lines">
        {lines.map((line) => (
          <div className="tl-cart-line" key={`${line.kind}:${line.id}`}>
            {line.image && <img src={line.image} alt={line.title} />}
            <div className="tl-cart-line-info">
              <strong>{line.title}</strong>
              {line.price != null && <span>{line.price} {line.currency}</span>}
              <div className="tl-qty-stepper tl-qty-stepper-sm">
                <button type="button" onClick={() => setQty(line.kind, line.id, line.qty - 1)}>−</button>
                <span>{line.qty}</span>
                <button type="button" onClick={() => setQty(line.kind, line.id, line.qty + 1)}>+</button>
              </div>
            </div>
            <button type="button" className="tl-cart-line-remove" onClick={() => removeItem(line.kind, line.id)} aria-label={t('shop.cartRemove')}>✕</button>
          </div>
        ))}
      </div>
      {total > 0 && singleCurrency && (
        <div className="tl-cart-total">
          <span>{title}</span>
          <strong>{total.toFixed(2)} {singleCurrency}</strong>
        </div>
      )}
      <a href={waHref} target="_blank" rel="noopener noreferrer" className="tl-cart-checkout">
        {waLabel}
      </a>
    </div>
  );
}

export default function CartDrawer() {
  const { t } = useTranslation();
  const lang = getLocaleFromPathname(useLocation().pathname);
  const { productLines, tourLines, count, removeItem, setQty, drawerOpen, closeDrawer } = useCart();
  const [tourManager] = useState(pickManager);

  if (!drawerOpen) return null;

  const productWaText = productLines
    .map((l) => `${l.title} (${l.id}) x${l.qty}\n${BASE_URL}${buildLocalizedPath(l.url, lang)}`)
    .join('\n\n');
  const productWaUrl = 'https://wa.me/' + SHOP_WHATSAPP_NUMBER + '?text=' + encodeURIComponent(t('shop.waCartMessage', { list: productWaText }));

  const tourWaText = tourLines
    .map((l) => `${l.title} x${l.qty}\n${BASE_URL}${buildLocalizedPath(l.url, lang)}`)
    .join('\n\n');
  const tourWaUrl = 'https://wa.me/' + tourManager.number + '?text=' + encodeURIComponent(t('shop.waTourCartMessage', { list: tourWaText }));

  const isEmpty = productLines.length === 0 && tourLines.length === 0;

  return createPortal(
    <div className="tl-cart-overlay" onClick={closeDrawer}>
      <div className="tl-cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="tl-cart-drawer-head">
          <h3>{t('shop.cartTitle')} {count > 0 && `(${count})`}</h3>
          <button type="button" onClick={closeDrawer} aria-label={t('shop.cartClose')}>✕</button>
        </div>

        {isEmpty ? (
          <p className="tl-cart-empty">{t('shop.cartEmpty')}</p>
        ) : (
          <>
            {productLines.length > 0 && (
              <CartSection
                title={t('shop.cartSectionShop')}
                lines={productLines}
                removeItem={removeItem}
                setQty={setQty}
                waHref={productWaUrl}
                waLabel={t('shop.whatsappOrder')}
              />
            )}
            {tourLines.length > 0 && (
              <CartSection
                title={t('shop.cartSectionTours')}
                lines={tourLines}
                removeItem={removeItem}
                setQty={setQty}
                waHref={tourWaUrl}
                waLabel={t('shop.whatsappOrderTo', { name: tourManager.name })}
              />
            )}
          </>
        )}

        <Link to="/shop" className="tl-cart-continue" onClick={closeDrawer}>{t('shop.cartContinue')}</Link>
      </div>
    </div>,
    document.body
  );
}
