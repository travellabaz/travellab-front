import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE } from '../api/client';
import LocalizedLink from '../components/LocalizedLink';

// Landed here straight from Epoint's hosted payment page after a
// declined/cancelled charge (see EpointProperties.errorRedirectUrl). No
// money moved and the Mercury hold gets released by the backend once the
// webhook confirms the failure — this page is purely informational.
export default function PaymentErrorPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    fetch(API_BASE + `/tickets/orders/${orderId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setOrder(data))
      .catch((err) => console.error('ActionLog.paymentError.fetchFailed', err));
  }, [orderId]);

  const eventLink = order?.eventId ? `/events/${order.eventId}` : '/events';

  return (
    <section className="tl-page-top">
      <div className="tl-section" style={{ maxWidth: 480 }}>
        <h1 className="tl-title">Ödəniş</h1>

        <div className="tl-evt-result tl-evt-result-fail" style={{ marginTop: 16 }}>
          <strong>Ödəniş uğursuz oldu.</strong>
          <p style={{ marginTop: 8 }}>Kartınızdan pul tutulmayıb. Yenidən cəhd edə bilərsiniz.</p>
        </div>

        <LocalizedLink to={eventLink} style={{ display: 'inline-block', marginTop: 24 }} className="tl-btn-book">
          Tədbirə qayıt
        </LocalizedLink>
      </div>
    </section>
  );
}
