import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE } from '../api/client';
import LocalizedLink from '../components/LocalizedLink';

// Landed here straight from Epoint's hosted payment page after a
// successful charge (see EpointProperties.successRedirectUrl and
// TicketNetworkEventsPage's submitPurchase). The browser redirect alone
// doesn't mean the ticket is actually confirmed — Epoint's result_url
// webhook (EpointWebhookController) lands on our server separately and
// asynchronously, so this page polls GET /tickets/orders/{orderId} until
// it sees a terminal status instead of trusting the redirect itself.
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30000;

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (!orderId) return undefined;
    let cancelled = false;

    const poll = () => {
      fetch(API_BASE + `/tickets/orders/${orderId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (cancelled) return;
          if (data) setOrder(data);
          const terminal = data && ['FULFILLED', 'FULFILLMENT_FAILED', 'PAYMENT_FAILED'].includes(data.status);
          if (terminal) return;
          if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
            setTimedOut(true);
            return;
          }
          setTimeout(poll, POLL_INTERVAL_MS);
        })
        .catch((err) => {
          console.error('ActionLog.paymentSuccess.pollFailed', err);
          if (!cancelled && Date.now() - startedAt.current < POLL_TIMEOUT_MS) {
            setTimeout(poll, POLL_INTERVAL_MS);
          }
        });
    };
    poll();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const eventLink = order?.eventId ? `/events/${order.eventId}` : '/events';

  return (
    <section className="tl-page-top">
      <div className="tl-section" style={{ maxWidth: 480 }}>
        <h1 className="tl-title">Ödəniş</h1>

        {!orderId && (
          <div className="tl-evt-result tl-evt-result-fail" style={{ marginTop: 16 }}>
            <strong>Sifariş nömrəsi tapılmadı.</strong>
          </div>
        )}

        {orderId && !order && !timedOut && (
          <p style={{ color: 'var(--tl-gray-500)', fontSize: 14, marginTop: 12 }}>Ödəniş təsdiqlənir, bir neçə saniyə gözləyin...</p>
        )}

        {orderId && order && (order.status === 'PENDING' || order.status === 'PAID') && (
          <p style={{ color: 'var(--tl-gray-500)', fontSize: 14, marginTop: 12 }}>Ödəniş təsdiqlənir, bir neçə saniyə gözləyin...</p>
        )}

        {order?.status === 'FULFILLED' && (
          <div className="tl-evt-result tl-evt-result-ok" style={{ marginTop: 16 }}>
            <strong>Sifariş uğurlu oldu!</strong>
            {order.mercuryTransactionId && (
              <p style={{ marginTop: 8 }}>Sifariş nömrəsi: {order.mercuryTransactionId}</p>
            )}
            {order.eticketPdfBase64 && (
              <p style={{ marginTop: 8 }}>E-bilet hazırdır ({Math.round(order.eticketPdfBase64.length / 1024)} KB).</p>
            )}
            {order.mobileTransferUrls?.length > 0 && (
              <p style={{ marginTop: 8 }}>Mobil transfer bileti hazırdır.</p>
            )}
          </div>
        )}

        {order?.status === 'FULFILLMENT_FAILED' && (
          <div className="tl-evt-result tl-evt-result-fail" style={{ marginTop: 16 }}>
            <strong>Ödəniş uğurla aparıldı, lakin bilet sifarişi tamamlanmadı.</strong>
            <p style={{ marginTop: 8 }}>Zəhmət olmasa dəstək xidməti ilə əlaqə saxlayın, sifariş nömrəsi: {orderId}</p>
          </div>
        )}

        {order?.status === 'PAYMENT_FAILED' && (
          <div className="tl-evt-result tl-evt-result-fail" style={{ marginTop: 16 }}>
            <strong>Ödəniş uğursuz oldu.</strong>
            {order.failureReason && <p style={{ marginTop: 8 }}>{order.failureReason}</p>}
          </div>
        )}

        {timedOut && !order && (
          <div className="tl-evt-result tl-evt-result-fail" style={{ marginTop: 16 }}>
            <strong>Sifarişin vəziyyətini yoxlamaq çox vaxt aldı.</strong>
            <p style={{ marginTop: 8 }}>Bir azdan səhifəni yeniləyin.</p>
          </div>
        )}

        <LocalizedLink to={eventLink} style={{ display: 'inline-block', marginTop: 24 }} className="tl-btn-book">
          Tədbirə qayıt
        </LocalizedLink>
      </div>
    </section>
  );
}
