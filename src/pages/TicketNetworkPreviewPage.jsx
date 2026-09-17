import TicketNetworkEventsPage from './TicketNetworkEventsPage';

// No login gate at all, unlike EventsPage — a dedicated, unlinked URL
// handed directly to TicketNetwork's own integration support (Yuliya)
// so she can see the MapWidget/checkout flow herself without needing the
// shared test-account credentials. Never linked from anywhere in the
// site's nav/footer and never added to prerender.mjs's PAGE_META, so it
// stays out of the sitemap and off crawlers — findable only by whoever
// has the exact URL.
export default function TicketNetworkPreviewPage() {
  return (
    <main className="tpwl-main">
      <TicketNetworkEventsPage />
    </main>
  );
}
