import { parseTourCaption } from './parseTourCaption';
import { extractMinPrice, formatPrice } from './price';

// Shared by TourDetailPage (the original source of this logic) and
// StoryViewer's Endirimlər "WhatsApp yaz" button — extracted so both
// produce the exact same message for the exact same tour instead of two
// independently-maintained (and, in the story's case, actually broken —
// see the story caller) copies. `tour` needs .title/.description/
// .permalink (the shape ToursContext's tours already have); selectedHotel
// is only ever set on the tour detail page itself (hotel picker), so it's
// optional and simply omitted for the story's call. code (TL-xxxxx) is the
// same one sent to the backend (buildPlainTourRequest), so the tour manager
// can find this request in the Telegram group.
export function buildTourWaText(tour, t, { selectedHotel, code } = {}) {
  const parsed = parseTourCaption(tour.description);
  const fallbackPrice = extractMinPrice(tour.description);
  const currentPrice = selectedHotel ? selectedHotel.price : parsed?.total || fallbackPrice || null;

  return [
    t('common.tourInterestMessage', { title: tour.title }),
    selectedHotel
      ? t('tourDetail.waHotel', { name: selectedHotel.name, price: formatPrice(selectedHotel.price.amount, selectedHotel.price.currency) })
      : currentPrice
        ? t('tourDetail.waPrice', { price: formatPrice(currentPrice.amount, currentPrice.currency) })
        : '',
    tour.permalink || '',
    code ? t('tourPackage.waCode', { code }) : '',
  ]
    .filter(Boolean)
    .join('\n');
}
