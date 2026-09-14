import EventsSection from '../sections/EventsSection';
import TicketNetworkEventsPage from './TicketNetworkEventsPage';
import { useAuth } from '../context/AuthContext';

// Soft/UI-only gate while the TicketNetwork integration's payment gateway
// is still a mock (see TicketNetworkOrderController on the backend, which
// doesn't enforce auth on its own) — everyone else keeps seeing the
// existing Ticketmaster-based EventsSection at this exact same /events
// (and /events/:eventId) URL, completely unchanged.
const ALLOWED_PHONE = '994555060402';

function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, '');
}

export default function EventsPage() {
  const { profile, isAuthenticated, loading: authLoading } = useAuth();
  const allowed = !authLoading && isAuthenticated && normalizePhone(profile?.phone) === ALLOWED_PHONE;

  return (
    <main className="tpwl-main">
      {allowed ? <TicketNetworkEventsPage /> : <EventsSection asH1 />}
    </main>
  );
}
