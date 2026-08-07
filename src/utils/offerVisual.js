// Kompas doesn't provide hotel photos through any of its reference APIs
// (checked SearchTour_HOTELS and the XML Gate's hotelattributes type — no
// image/photo field on either) — a deterministic gradient stands in for a
// photo instead of a fetched image, picked per-hotel so a results grid
// doesn't look monotone.
const GRADIENTS = [
  'linear-gradient(135deg, #0EA5E9, #2563EB)',
  'linear-gradient(135deg, #F59E0B, #EF4444)',
  'linear-gradient(135deg, #10B981, #0D9488)',
  'linear-gradient(135deg, #8B5CF6, #6366F1)',
  'linear-gradient(135deg, #EC4899, #F43F5E)',
  'linear-gradient(135deg, #14B8A6, #0891B2)',
];

export function offerGradient(seed) {
  const s = String(seed || '');
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}
