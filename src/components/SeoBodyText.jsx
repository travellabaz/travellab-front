import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Every page-end SEO text block follows the same shape (SEO Paketi v2,
// "Section 0"): no heading, left-aligned, collapsed to ~2-3 lines by
// default with an "Ətraflı oxu" toggle. Unlike FaqSection's accordion
// (whose answers are only mounted when open, safe there because the full
// text is duplicated into FAQPage JSON-LD), this block has no schema
// fallback — the full text must stay physically in the DOM at load so a
// non-JS crawler still sees it, just visually clipped via CSS max-height
// until expanded. Never conditionally unmount `children`.
export default function SeoBodyText({ children }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  // Defaults to true (matches every server/first-paint render, before this
  // can measure anything) so the toggle never flashes in; corrected
  // synchronously pre-paint via useLayoutEffect. Short blocks whose text
  // already fits inside the collapsed height end up with no button at all
  // — clicking a button that has nothing left to reveal looked like it
  // "did nothing", which is exactly the bug this fixes.
  const [overflows, setOverflows] = useState(true);
  const textRef = useRef(null);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, []);

  return (
    <div className="tl-seo-body">
      <div ref={textRef} className={`tl-seo-body-text${expanded ? ' expanded' : ''}`}>
        {children}
      </div>
      {!expanded && overflows && (
        <button type="button" className="tl-seo-body-toggle" onClick={() => setExpanded(true)}>
          {t('common.readMore')}
        </button>
      )}
    </div>
  );
}
