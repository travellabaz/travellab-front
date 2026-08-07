const API_BASE = 'https://backend.travellab-point.az/site-backend/v1';

export async function getDestinationPhotos(query) {
  const res = await fetch(API_BASE + '/tours/photos/search?query=' + encodeURIComponent(query));
  if (!res.ok) throw new Error('photos request failed: ' + res.status);
  return res.json();
}
