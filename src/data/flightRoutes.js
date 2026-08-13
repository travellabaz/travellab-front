import { slugify } from '../utils/slugify.js';

// Single source of truth for the /ucuslar/:route landing pages
// (FlightRoutePage.jsx) AND their static generation (prerender.mjs) —
// same "plain JS/ESM, importable straight from Node" shape as
// vizaCountries.js/tourSearchCountries.js.
//
// cityKey is the lookup key into the flightCities.* translation
// namespace (AZ display name, same convention as countries.* for
// vizaCountries.js) — NOT hardcoded per-language text here.
//
// searchTerm is what actually gets typed into the Travelpayouts widget's
// destination field (see utils/flightWidgetFill.js) — plain Latin-script
// city name, whatever its own autocomplete understands; iata is used to
// pick the right suggestion once the dropdown appears (falls back to the
// widget's own top suggestion if this code doesn't match what it calls
// the city, so an imprecise/ambiguous code here degrades gracefully
// rather than breaking the fill).
//
// status:
//  - 'direct'    — regular scheduled service; distanceKm/durationMin/
//                   weeklyFrequency/airlines apply.
//  - 'indirect'  — no direct service from Baku (confirmed researched,
//                   2026-08): connectingCityKeys/connectingAirlines/
//                   durationMin (door-to-door via the best connection)
//                   apply instead. Covers Amsterdam and Munich (no
//                   nonstop exists at all, any carrier) alongside
//                   Maldives/Zanzibar/Bali (never had one) and Hurghada
//                   (no confirmed current direct/charter service found —
//                   price range here is an editorial estimate based on
//                   the comparable Sharm El Sheikh route, not a sourced
//                   figure, since research found no published fares).
//  - 'seasonal'  — Cairo only: AZAL runs a direct winter charter
//                   (confirmed Jan-Feb) but nothing outside that window;
//                   durationMin/weeklyFrequency/priceFromAzn describe the
//                   charter itself, connectingCityKeys/connectingAirlines
//                   describe the off-season fallback.
//  - 'suspended' — Kyiv only: Ukrainian airspace has been closed to
//                   civil aviation since Feb 2022, still in force — no
//                   schedule or price exists to publish.
//
// Figures sourced 2026-08 from airline sites (azal.az), aggregators
// (flightconnections.com, flightsfrom.com, tickets.az) and great-circle
// distance from official airport coordinates — cross-checked where
// possible, several explicitly approximate (frequencies especially,
// since they combine multiple carriers). Buta Airways merged into AZAL
// in Oct 2023 and is deliberately absent from every airlines list.
const ROUTES = [
  { cityKey: 'İstanbul', iata: 'IST', searchTerm: 'Istanbul', status: 'direct', distanceKm: 1788, durationMin: 175, weeklyFrequency: 80, priceFromAzn: 160, priceToAzn: 400, airlines: ['AZAL', 'Turkish Airlines', 'Pegasus'] },
  { cityKey: 'Antalya', iata: 'AYT', searchTerm: 'Antalya', status: 'direct', distanceKm: 1713, durationMin: 180, weeklyFrequency: 9, priceFromAzn: 180, priceToAzn: 350, airlines: ['AZAL'] },
  { cityKey: 'Dubay', iata: 'DXB', searchTerm: 'Dubai', status: 'direct', distanceKm: 1762, durationMin: 185, weeklyFrequency: 30, priceFromAzn: 260, priceToAzn: 550, airlines: ['AZAL', 'FlyDubai', 'Emirates'] },
  { cityKey: 'Moskva', iata: 'MOW', searchTerm: 'Moscow', status: 'direct', distanceKm: 1920, durationMin: 200, weeklyFrequency: 32, priceFromAzn: 220, priceToAzn: 500, airlines: ['AZAL', 'Aeroflot', 'S7 Airlines'] },
  { cityKey: 'Tbilisi', iata: 'TBS', searchTerm: 'Tbilisi', status: 'direct', distanceKm: 447, durationMin: 70, weeklyFrequency: 30, priceFromAzn: 90, priceToAzn: 250, airlines: ['AZAL', 'Georgian Airways'] },
  { cityKey: 'Trabzon', iata: 'TZX', searchTerm: 'Trabzon', status: 'direct', distanceKm: 866, durationMin: 90, weeklyFrequency: 7, priceFromAzn: 95, priceToAzn: 195, airlines: ['AZAL'] },
  { cityKey: 'Doha', iata: 'DOH', searchTerm: 'Doha', status: 'direct', distanceKm: 1696, durationMin: 180, weeklyFrequency: 7, priceFromAzn: 450, priceToAzn: 800, airlines: ['Qatar Airways'] },
  { cityKey: 'Şərcə', iata: 'SHJ', searchTerm: 'Sharjah', status: 'direct', distanceKm: 1758, durationMin: 255, weeklyFrequency: 7, priceFromAzn: 250, priceToAzn: 500, airlines: ['Air Arabia'] },
  { cityKey: 'Milan', iata: 'MXP', searchTerm: 'Milan', status: 'direct', distanceKm: 3368, durationMin: 315, weeklyFrequency: 7, priceFromAzn: 270, priceToAzn: 450, airlines: ['AZAL'] },
  { cityKey: 'Roma', iata: 'FCO', searchTerm: 'Rome', status: 'direct', distanceKm: 3144, durationMin: 295, weeklyFrequency: 3, priceFromAzn: 150, priceToAzn: 450, airlines: ['Wizz Air'] },
  { cityKey: 'Paris', iata: 'PAR', searchTerm: 'Paris', status: 'direct', distanceKm: 3803, durationMin: 350, weeklyFrequency: 4, priceFromAzn: 460, priceToAzn: 700, airlines: ['AZAL'] },
  { cityKey: 'Amsterdam', iata: 'AMS', searchTerm: 'Amsterdam', status: 'indirect', connectingCityKeys: ['İstanbul'], connectingAirlines: ['Turkish Airlines'], durationMin: 520, priceFromAzn: 290, priceToAzn: 600 },
  { cityKey: 'Budapeşt', iata: 'BUD', searchTerm: 'Budapest', status: 'direct', distanceKm: 2564, durationMin: 231, weeklyFrequency: 4, priceFromAzn: 90, priceToAzn: 250, airlines: ['Wizz Air'] },
  { cityKey: 'Praqa', iata: 'PRG', searchTerm: 'Prague', status: 'direct', distanceKm: 2963, durationMin: 220, weeklyFrequency: 5, priceFromAzn: 290, priceToAzn: 510, airlines: ['AZAL'] },
  { cityKey: 'London', iata: 'LON', searchTerm: 'London', status: 'direct', distanceKm: 3994, durationMin: 360, weeklyFrequency: 16, priceFromAzn: 420, priceToAzn: 750, airlines: ['AZAL'] },
  { cityKey: 'Maldiv adaları', iata: 'MLE', searchTerm: 'Male', status: 'indirect', connectingCityKeys: ['İstanbul', 'Dubay'], connectingAirlines: ['Turkish Airlines', 'Emirates', 'FlyDubai'], durationMin: 570, priceFromAzn: 750, priceToAzn: 1600 },
  { cityKey: 'Zanzibar', iata: 'ZNZ', searchTerm: 'Zanzibar', status: 'indirect', connectingCityKeys: ['İstanbul', 'Doha'], connectingAirlines: ['Turkish Airlines', 'Qatar Airways'], durationMin: 540, priceFromAzn: 780, priceToAzn: 1400 },
  { cityKey: 'Bali', iata: 'DPS', searchTerm: 'Bali', status: 'indirect', connectingCityKeys: ['İstanbul'], connectingAirlines: ['Turkish Airlines'], durationMin: 930, priceFromAzn: 800, priceToAzn: 1500 },
  { cityKey: 'Şərm-əl-Şeyx', iata: 'SSH', searchTerm: 'Sharm El Sheikh', status: 'direct', distanceKm: 1994, durationMin: 230, weeklyFrequency: 3, priceFromAzn: 150, priceToAzn: 350, airlines: ['AZAL'] },
  { cityKey: 'Hurqada', iata: 'HRG', searchTerm: 'Hurghada', status: 'indirect', connectingCityKeys: ['Qahirə', 'İstanbul'], connectingAirlines: ['EgyptAir', 'Turkish Airlines'], durationMin: 360, priceFromAzn: 150, priceToAzn: 350 },
  { cityKey: 'Qahirə', iata: 'CAI', searchTerm: 'Cairo', status: 'seasonal', distanceKm: 2039, durationMin: 240, weeklyFrequency: 1, priceFromAzn: 270, priceToAzn: 590, airlines: ['AZAL'], connectingCityKeys: ['İstanbul', 'Dubay'], connectingAirlines: ['Turkish Airlines', 'FlyDubai'] },
  { cityKey: 'Sankt-Peterburq', iata: 'LED', searchTerm: 'Saint Petersburg', status: 'direct', distanceKm: 2549, durationMin: 240, weeklyFrequency: 3, priceFromAzn: 560, priceToAzn: 840, airlines: ['AZAL'] },
  { cityKey: 'Kiyev', iata: 'KBP', searchTerm: 'Kyiv', status: 'suspended', distanceKm: 1846 },
  { cityKey: 'Almatı', iata: 'ALA', searchTerm: 'Almaty', status: 'direct', distanceKm: 2247, durationMin: 195, weeklyFrequency: 14, priceFromAzn: 220, priceToAzn: 420, airlines: ['AZAL', 'Air Astana'] },
  { cityKey: 'Daşkənd', iata: 'TAS', searchTerm: 'Tashkent', status: 'direct', distanceKm: 1617, durationMin: 175, weeklyFrequency: 12, priceFromAzn: 245, priceToAzn: 540, airlines: ['AZAL', 'Uzbekistan Airways'] },
  { cityKey: 'Vyana', iata: 'VIE', searchTerm: 'Vienna', status: 'direct', distanceKm: 2772, durationMin: 260, weeklyFrequency: 3, priceFromAzn: 180, priceToAzn: 450, airlines: ['AZAL'] },
  { cityKey: 'Barselona', iata: 'BCN', searchTerm: 'Barcelona', status: 'direct', distanceKm: 3981, durationMin: 345, weeklyFrequency: 4, priceFromAzn: 165, priceToAzn: 470, airlines: ['AZAL'] },
  { cityKey: 'Berlin', iata: 'BER', searchTerm: 'Berlin', status: 'direct', distanceKm: 3055, durationMin: 270, weeklyFrequency: 4, priceFromAzn: 198, priceToAzn: 470, airlines: ['AZAL'] },
  { cityKey: 'Münhen', iata: 'MUC', searchTerm: 'Munich', status: 'indirect', connectingCityKeys: ['İstanbul'], connectingAirlines: ['Turkish Airlines'], durationMin: 400, priceFromAzn: 500, priceToAzn: 750 },
  { cityKey: 'Tel-Əviv', iata: 'TLV', searchTerm: 'Tel Aviv', status: 'direct', distanceKm: 1649, durationMin: 195, weeklyFrequency: 18, priceFromAzn: 270, priceToAzn: 450, airlines: ['AZAL', 'Israir', 'Arkia'] },
];

export const FLIGHT_ROUTES = ROUTES.map((r) => ({ ...r, slug: `baki-${slugify(r.cityKey)}` }));

export function getFlightRouteBySlug(slug) {
  return FLIGHT_ROUTES.find((r) => r.slug === slug) || null;
}
