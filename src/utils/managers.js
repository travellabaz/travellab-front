// Round-robin "which human do we hand this lead to" pool, shared by the
// tours "contact manager" buttons and the viza request form.
export const MANAGERS = [
  { name: 'Ülkər', number: '994516263665' },
  { name: 'Şəhriyar', number: '994516103665' },
  { name: 'Xəyalə', number: '994513433665' },
  { name: 'Əfsanə', number: '994516383665' },
  { name: 'Qumral', number: '994516413665' },
];

export function isMobile() {
  const coarse = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const ua = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return !!(coarse || ua);
}

export function pickManager() {
  return MANAGERS[Math.floor(Math.random() * MANAGERS.length)];
}

export function formatManagerNumber(number) {
  return '+' + number.slice(0, 3) + ' ' + number.slice(3, 5) + ' ' + number.slice(5, 8) + ' ' + number.slice(8, 10) + ' ' + number.slice(10, 12);
}

// `t` is the i18next translate function from the calling component's
// useTranslation() — these are plain utils, not hooks, so the already-
// localized message text is built by the caller and passed through.
export function managerLink(tour, manager, t) {
  if (isMobile()) {
    const title = tour?.title || 'tur';
    const link = tour?.permalink || '';
    const text = t('common.tourInterestMessage', { title }) + (link ? ' ' + link : '');
    return 'https://wa.me/' + manager.number + '?text=' + encodeURIComponent(text);
  }
  return 'tel:+' + manager.number;
}

export function managerLabel(t) {
  return isMobile() ? t('common.waWrite') : t('common.call');
}

export function contactManager(tour, t) {
  const manager = pickManager();
  const url = managerLink(tour, manager, t);
  if (url.indexOf('tel:') === 0) {
    window.location.href = url;
  } else {
    window.open(url, '_blank');
  }
}
