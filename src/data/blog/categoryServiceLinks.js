// The service page each blog category sends its readers to: the 3rd card
// of the post's end-of-article "Əlaqəli məzmun" block (2 same-category
// posts + this). A post written for a keyword carries its own targetUrl
// (see scripts/keywords.csv) and that one wins. The card's label lives in
// the blogServiceLinks translations, keyed the same way.
export const CATEGORY_SERVICE_LINKS = {
  viza: { to: '/viza' },
  istiqametler: { to: '/tours' },
  aviabilet: { to: '/search' },
  balayi: { to: '/tours?category=Balayı' },
  'mualice-turizmi': { to: '/tours' },
  konsertler: { to: '/events' },
  korporativ: { to: '/korporativ' },
  xeberler: { to: '/tours' },
};
