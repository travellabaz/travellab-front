// Inline SVG action icons for the story viewer (mute/unmute, comment,
// like, send, empty-state) — stroke-based, same style family as
// utils/storyIcons.jsx's category icons, just sized for the 44x44
// circular buttons this spec asks for (22px) rather than the 24px
// category glyphs.
export function SoundOnIcon(props) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M4 9.5v5h3.2l4.6 3.8V5.7L7.2 9.5H4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16.3 8.8a4.8 4.8 0 0 1 0 6.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18.7 6.4a8.3 8.3 0 0 1 0 11.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function SoundOffIcon(props) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M4 9.5v5h3.2l4.6 3.8V5.7L7.2 9.5H4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16 9.5l5 5M21 9.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CommentIcon(props) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M4 12c0-4.4 3.8-8 8.5-8S21 7.6 21 12s-3.8 8-8.5 8c-1.1 0-2.2-.2-3.1-.6L5 21l1.2-3.8A7.6 7.6 0 0 1 4 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HeartIcon({ filled, ...props }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 20.3S3.5 15.4 3.5 9.3C3.5 6.4 5.8 4 8.7 4c1.6 0 3 .8 3.3 2.1C12.3 4.8 13.7 4 15.3 4c2.9 0 5.2 2.4 5.2 5.3 0 6.1-8.5 11-8.5 11Z"
        stroke={filled ? '#F04438' : 'currentColor'}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={filled ? '#F04438' : 'none'}
      />
    </svg>
  );
}

export function SendIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M4 12l16-8-6 16-3-6-7-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// Thinner-stroke variant used large (40px) in the comment panel's empty
// state — same silhouette as CommentIcon, lighter weight at that size.
export function CommentEmptyIcon(props) {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M4 12c0-4.4 3.8-8 8.5-8S21 7.6 21 12s-3.8 8-8.5 8c-1.1 0-2.2-.2-3.1-.6L5 21l1.2-3.8A7.6 7.6 0 0 1 4 12Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
