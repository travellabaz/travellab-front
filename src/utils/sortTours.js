import { extractMinPrice } from './price';
import { extractLatestTourDate } from './tourDate';

// Price/date aren't structured fields (see utils/price.js and
// utils/tourDate.js — both mined out of free-form Instagram captions), so
// sorting re-parses the caption per comparison rather than caching a sort
// key — tour counts here are small (dozens, not thousands), so the extra
// regex work per compare is cheap. Tours with no parseable date sink to
// the bottom of a date sort instead of clustering unpredictably.
export function sortTours(tours, sort) {
  if (!sort) return tours;
  const sorted = [...tours];
  if (sort === 'price_asc' || sort === 'price_desc') {
    sorted.sort((a, b) => {
      const pa = extractMinPrice(a.description)?.amount ?? 0;
      const pb = extractMinPrice(b.description)?.amount ?? 0;
      return sort === 'price_asc' ? pa - pb : pb - pa;
    });
  } else if (sort === 'date_asc') {
    sorted.sort((a, b) => {
      const da = extractLatestTourDate(a.description);
      const db = extractLatestTourDate(b.description);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da - db;
    });
  }
  return sorted;
}
