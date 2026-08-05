import { useState } from 'react';

// Generic FAQ accordion + its FAQPage JSON-LD, built from the same `items`
// array so the visible copy and the structured data can never drift apart.
export default function FaqSection({ tag = 'Suallar', title = 'Tez-tez verilən suallar', items }) {
  const [openIndex, setOpenIndex] = useState(null);

  if (!items || items.length === 0) return null;

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <section className="tl-section">
      <div className="tl-section-header">
        <div>
          <div className="tl-tag">{tag}</div>
          <h2 className="tl-title">{title}</h2>
        </div>
      </div>

      <div className="tl-faq-list">
        {items.map((item, i) => {
          const open = openIndex === i;
          return (
            <div className={`tl-faq-item${open ? ' open' : ''}`} key={item.q}>
              <button
                type="button"
                className="tl-faq-question"
                onClick={() => setOpenIndex(open ? null : i)}
                aria-expanded={open}
              >
                <span>{item.q}</span>
                <span className="tl-faq-icon" aria-hidden="true">{open ? '−' : '+'}</span>
              </button>
              {open && <div className="tl-faq-answer">{item.a}</div>}
            </div>
          );
        })}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </section>
  );
}
