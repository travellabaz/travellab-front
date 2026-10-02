// Single source of truth for Travellab's own social profile links — used
// by the footer and the account menu (NavProfile.jsx / MobileTabBar.jsx),
// which both need the exact same 4 links and previously risked drifting
// out of sync as two separate hardcoded copies.
export const SOCIAL_LINKS = [
  { key: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/travellab.az/' },
  { key: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/company/travellab-azerbaijan/' },
  { key: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/travellab.az/' },
  { key: 'tiktok', label: 'TikTok', url: 'https://www.tiktok.com/@travellab.az' },
];
