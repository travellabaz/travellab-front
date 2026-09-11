import { useState } from 'react';

// Plain collapsible section — used for the tour page's "İmkanlar" /
// "Şərtlər" blocks so they don't all sit permanently open and stack into
// one long scroll. `defaultOpen` keeps today's "everything visible"
// behavior by default; the header itself is the toggle.
export default function Accordion({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="tl-accordion">
      <button type="button" className="tl-accordion-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <h2 className="tl-tourp-h2">{title}</h2>
        <svg
          className={`tl-accordion-chevron${open ? ' open' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <div className="tl-accordion-body">{children}</div>}
    </div>
  );
}
