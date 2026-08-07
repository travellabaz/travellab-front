import { useState } from 'react';

// Every page-end SEO text block follows the same shape (SEO Paketi v2,
// "Section 0"): no heading, left-aligned, collapsed to ~2-3 lines by
// default with an "Ətraflı oxu" toggle. Unlike FaqSection's accordion
// (whose answers are only mounted when open, safe there because the full
// text is duplicated into FAQPage JSON-LD), this block has no schema
// fallback — the full text must stay physically in the DOM at load so a
// non-JS crawler still sees it, just visually clipped via CSS max-height
// until expanded. Never conditionally unmount `children`.
export default function SeoBodyText({ children }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="tl-seo-body">
      <div className={`tl-seo-body-text${expanded ? ' expanded' : ''}`}>
        {children}
      </div>
      {!expanded && (
        <button type="button" className="tl-seo-body-toggle" onClick={() => setExpanded(true)}>
          Ətraflı oxu
        </button>
      )}
    </div>
  );
}
