const API_BASE = 'https://backend.travellab-point.az/site-backend/v1';

export async function getDestinations() {
  const res = await fetch(API_BASE + '/tours/offers/destinations');
  if (!res.ok) throw new Error('destinations request failed: ' + res.status);
  return res.json();
}

export async function searchOffers({ state, checkinFrom, checkinTo, nights, adults, children, stars, meal, currency, category }) {
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
  if (category) query.set('category', category);

  const res = await fetch(API_BASE + '/tours/offers/results?' + query.toString());
  if (!res.ok) throw new Error('offers search failed: ' + res.status);
  return res.json();
}

export async function getCategories(state) {
  const res = await fetch(API_BASE + '/tours/offers/categories?state=' + encodeURIComponent(state));
  if (!res.ok) throw new Error('categories request failed: ' + res.status);
  return res.json();
}

export async function getCalendar(state, category) {
  const query = new URLSearchParams({ state });
  if (category) query.set('category', category);
  const res = await fetch(API_BASE + '/tours/offers/calendar?' + query.toString());
  if (!res.ok) throw new Error('calendar request failed: ' + res.status);
  return res.json();
}
