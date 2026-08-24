import { extractMinPrice } from './price';

// Cart/wishlist snapshot shape for a tour — mirrors data/shop's
// toCartItem(product), kept separate since tours have no local data module
// (ToursContext fetches them live) and a different price source (parsed
// out of the description, not a column).
export function toTourCartItem(tour) {
  const price = extractMinPrice(tour.description);
  return {
    kind: 'tour',
    id: String(tour.id),
    title: tour.title,
    price: price ? price.amount : null,
    currency: price ? price.currency : 'AZN',
    image: tour.imageUrl || null,
    url: `/tours/${tour.id}`,
  };
}
