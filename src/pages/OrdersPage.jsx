import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useModals } from '../context/ModalContext';
import { authFetch, API_BASE } from '../api/client';
import { formatDateTimeAz } from '../utils/date';

// Account page's "Sifarişlərim" — see MobileTabBar.jsx / NavProfile.jsx for
// the menu entry that links here.
//
// Scoped to ticket (event) orders only, not "every order type" the way the
// menu label might suggest — tour and Shop "orders" are WhatsApp hand-offs
// with no backend record at all (see CartDrawer.jsx's own comment on
// this), so there's genuinely nothing to list for those; only
// TicketOrderEntity persists a real, queryable order. Said plainly below
// rather than silently only covering part of what was asked.
const STATUS_LABELS = {
  PENDING: 'Gözləmədə',
  PAID: 'Təsdiqləndi',
  FULFILLED: 'Tamamlandı',
  PAYMENT_FAILED: 'Uğursuz',
  FULFILLMENT_FAILED: 'Uğursuz',
};

const STATUS_CLASS = {
  PENDING: 'tl-order-status-pending',
  PAID: 'tl-order-status-pending',
  FULFILLED: 'tl-order-status-ok',
  PAYMENT_FAILED: 'tl-order-status-fail',
  FULFILLMENT_FAILED: 'tl-order-status-fail',
};

function formatAzn(value) {
  if (value == null) return '';
  return `${Number(value).toFixed(2)} ₼`;
}

// One event-name lookup per row via the existing public single-event
// endpoint (TicketNetworkEventsPage.jsx fetches the same way) — the list
// endpoint itself stays light (see TicketOrderSummaryDto) and doesn't
// couple the order service to event data.
function OrderRow({ order }) {
  const [eventName, setEventName] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loadingDelivery, setLoadingDelivery] = useState(false);

  useEffect(() => {
    if (!order.eventId) return undefined;
    let cancelled = false;
    fetch(API_BASE + `/tickets/events/${order.eventId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setEventName(data.name);
      })
      .catch((err) => console.error('ActionLog.ordersPage.eventLookupFailed', err));
    return () => {
      cancelled = true;
    };
  }, [order.eventId]);

  // The e-ticket PDF / mobile-transfer links are only fetched once the
  // visitor actually asks for them (see TicketOrderSummaryDto's own
  // comment) — GET /tickets/orders/{orderId} is the same public endpoint
  // PaymentSuccessPage.jsx already polls.
  const loadDelivery = () => {
    if (delivery || loadingDelivery) return;
    setLoadingDelivery(true);
    fetch(API_BASE + `/tickets/orders/${order.orderId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setDelivery(data))
      .catch((err) => console.error('ActionLog.ordersPage.deliveryFetchFailed', err))
      .finally(() => setLoadingDelivery(false));
  };

  const hasDelivery = delivery && (delivery.eticketPdfBase64 || delivery.mobileTransferUrls?.length > 0);

  return (
    <div className="tl-order-row">
      <div className="tl-order-row-top">
        <span className="tl-order-row-name">{eventName || `Tədbir #${order.eventId}`}</span>
        <span className={`tl-order-status ${STATUS_CLASS[order.status] || ''}`}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>
      <div className="tl-order-row-meta">
        {formatDateTimeAz(order.createdAt)}
        {order.quantity ? ` · ${order.quantity} bilet` : ''}
        {order.chargedAmount != null ? ` · ${formatAzn(order.chargedAmount)}` : ''}
      </div>
      {(order.status === 'PAYMENT_FAILED' || order.status === 'FULFILLMENT_FAILED') && order.failureReason && (
        <div className="tl-order-row-reason">{order.failureReason}</div>
      )}
      {order.status === 'FULFILLED' && (
        hasDelivery ? (
          <div className="tl-order-row-ticket">
            {delivery.eticketPdfBase64 && (
              <a
                className="tl-evt-inline-link"
                href={`data:application/pdf;base64,${delivery.eticketPdfBase64}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Bileti aç / yüklə
              </a>
            )}
            {delivery.mobileTransferUrls?.map((url, i) => (
              <a key={i} className="tl-evt-inline-link" href={url} target="_blank" rel="noopener noreferrer">
                Mobil transfer linki
              </a>
            ))}
          </div>
        ) : (
          <button type="button" className="tl-evt-inline-link" onClick={loadDelivery} disabled={loadingDelivery}>
            {loadingDelivery ? 'Yüklənir...' : 'Bileti göstər'}
          </button>
        )
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { openAuth } = useModals();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    authFetch('/tickets/orders')
      .then((res) => (res && res.ok ? res.json() : []))
      .then((data) => setOrders(data || []))
      .catch((err) => console.error('ActionLog.ordersPage.fetchFailed', err))
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated]);

  return (
    <section className="tl-page-top">
      <div className="tl-section" style={{ maxWidth: 680 }}>
        <h1 className="tl-title">Sifarişlərim</h1>
        <p style={{ color: 'var(--tl-gray-500)', fontSize: 13, marginTop: 8, marginBottom: 20 }}>
          Tədbir bileti sifarişləriniz burada görünür. Tur və Shop sorğuları WhatsApp üzərindən aparıldığı üçün ayrıca izlənilmir.
        </p>

        {!authLoading && !isAuthenticated && (
          <div>
            <p style={{ color: 'var(--tl-gray-500)', fontSize: 14, marginBottom: 16 }}>Sifarişlərinizi görmək üçün hesabınıza daxil olun.</p>
            <button type="button" className="tl-btn-book" onClick={() => openAuth('login')}>Daxil ol</button>
          </div>
        )}

        {isAuthenticated && loading && (
          <p style={{ color: 'var(--tl-gray-500)', fontSize: 14 }}>Yüklənir...</p>
        )}

        {isAuthenticated && !loading && orders.length === 0 && (
          <p style={{ color: 'var(--tl-gray-500)', fontSize: 14 }}>Hələ bilet sifarişiniz yoxdur.</p>
        )}

        {isAuthenticated && !loading && orders.length > 0 && (
          <div className="tl-order-list">
            {orders.map((order) => <OrderRow key={order.orderId} order={order} />)}
          </div>
        )}
      </div>
    </section>
  );
}
