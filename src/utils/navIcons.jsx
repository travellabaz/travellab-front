// Small line icons for the header's mobile menu rows (and the desktop
// Shop/Korporativ pills) — same stroke-based style as storyIcons.jsx and
// the rest of the site's inline SVGs, just a different icon set since
// these map to nav destinations rather than story categories.
const ICONS = {
  plane: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12.5l19-8-6.5 9.5 2 7.5-5-5-5 2 1.5-4.5-6-1.5z" />
    </svg>
  ),
  bed: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18v-6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6" />
      <path d="M2 18v2M22 18v2M2 12V8a2 2 0 0 1 2-2h4" />
      <circle cx="7" cy="9.5" r="1.5" />
    </svg>
  ),
  palm: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V11" />
      <path d="M12 11c-2-3-5.5-3.5-8-1.5 2 1.5 4.5 1.8 6 .5" />
      <path d="M12 11c2-3 5.5-3.5 8-1.5-2 1.5-4.5 1.8-6 .5" />
      <path d="M12 11c-1-2.5.5-5 2.5-6-1 2 .5 4 1.5 5" />
      <path d="M12 11c1-2.5-.5-5-2.5-6 1 2-.5 4-1.5 5" />
    </svg>
  ),
  star: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M12 3.5l2.7 5.5 6 .9-4.4 4.3 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.3 6-.9L12 3.5Z" />
    </svg>
  ),
  calendar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  ),
  passport: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <circle cx="12" cy="10" r="2.6" strokeWidth="1.6" />
      <path d="M8.5 16.5c.7-1.6 2-2.4 3.5-2.4s2.8.8 3.5 2.4" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  bag: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M6 8h12l1 12H5L6 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" strokeLinecap="round" />
    </svg>
  ),
  briefcase: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" />
      <path d="M3 12h18" />
    </svg>
  ),
  chevronRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
  user: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" />
    </svg>
  ),
  userPlus: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="8" r="4" />
      <path d="M2 20c0-3.5 3.5-6 8-6s8 2.5 8 6" />
      <path d="M19 8v6M16 11h6" />
    </svg>
  ),
  cart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6L5 3H2" />
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
    </svg>
  ),
};

export default function NavIcon({ name, ...props }) {
  return <span {...props}>{ICONS[name] || null}</span>;
}
