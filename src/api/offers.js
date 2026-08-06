const API_BASE = 'https://backend.travellab-point.az/site-backend/v1';

export async function getDestinations() {
  const res = await fetch(API_BASE + '/tours/offers/destinations');
  if (!res.ok) throw new Error('destinations request failed: ' + res.status);
  return res.json();
}

export async function searchOffers({ state, checkinFrom, checkinTo, nights, adults, children, stars, meal, currency }) {
  const query = new URLSearchParams();
  query.set('state', state);
  query.set('checkinFrom', checkinFrom);
  query.set('checkinTo', checkinTo);
  query.set('nights', nights);
  query.set('adults', adults);
  query.set('children', children);
  if (stars && stars.length) query.set('stars', stars.join(','));
  if (meal) query.set('meal', meal);
  if (currency) query.set('currency', currency);

  const res = await fetch(API_BASE + '/tours/offers/results?' + query.toString());
  if (!res.ok) throw new Error('offers search failed: ' + res.status);
  return res.json();
}
