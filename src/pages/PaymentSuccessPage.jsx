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

// FULFILLED is not actually the end of the story — TicketNetworkVaultClient
// (backend) re-queries Vault live on every GET /tickets/orders/{orderId}
// call, but the seller attaches the e-ticket/transfer URL to Vault
// asynchronously after the order confirms (per TicketNetwork support: often
// instant, but tied to the ticket group's own OnHandDate, so not
// guaranteed). Stopping polling the instant FULFILLED is first seen meant a
// visitor who landed on this page before Vault had the file would see
// "Sifariş uğurlu oldu!" with no ticket and never find out it showed up
// later — the backend WOULD have returned it on a later call, this page
// just never made one. Keep polling (slower, longer) specifically for that
// case; stop for real once delivery data arrives or this longer window
// elapses.
const DELIVERY_POLL_INTERVAL_MS = 5000;
const DELIVERY_POLL_TIMEOUT_MS = 120000;

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (!orderId) return undefined;
    let cancelled = false;
    // Set the moment FULFILLED is first seen — starts the separate, longer
    // delivery-polling window, independent of the payment-confirmation
    // timeout above.
    let fulfilledAt = null;

    const hasDelivery = (data) => !!(data?.eticketPdfBase64 || data?.mobileTransferUrls?.length > 0);

    const poll = () => {
      fetch(API_BASE + `/tickets/orders/${orderId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (cancelled) return;
          if (data) setOrder(data);

          if (data?.status === 'FULFILLED') {
            if (hasDelivery(data)) return; // the real end: ticket is here
            if (fulfilledAt == null) fulfilledAt = Date.now();
            if (Date.now() - fulfilledAt > DELIVERY_POLL_TIMEOUT_MS) return; // gave it a fair window
            setTimeout(poll, DELIVERY_POLL_INTERVAL_MS);
            return;
          }

          const terminal = data && ['FULFILLMENT_FAILED', 'PAYMENT_FAILED'].includes(data.status);
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

  const awaitingDelivery = order?.status === 'FULFILLED' && !order.eticketPdfBase64 && !(order.mobileTransferUrls?.length > 0);

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
            {awaitingDelivery && (
              <p style={{ marginTop: 8 }}>Bilet(lər)iniz hazırlanır — bu adətən tez baş verir. Zəhmət olmasa bir neçə dəqiqədən sonra bu səhifəni yeniləyin.</p>
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
