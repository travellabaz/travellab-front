import Link from './LocalizedLink';

// Visible breadcrumb trail — separate from (but rendered alongside) the
// BreadcrumbList JSON-LD that usePageMeta.js/prerender.mjs already build
// for the same routes. `items` is [{ name, to }, ...]; the last item is
// rendered as plain text (it's the current page, not a link).
export default function Breadcrumb({ items }) {
  if (!items || items.length < 2) return null;

  return (
    <nav className="tl-breadcrumb" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item.to || item.name} className="tl-breadcrumb-item">
            {isLast ? (
              <span className="tl-breadcrumb-current" aria-current="page">{item.name}</span>
            ) : (
              <Link to={item.to}>{item.name}</Link>
            )}
            {!isLast && <span className="tl-breadcrumb-sep" aria-hidden="true">›</span>}
          </span>
        );
      })}
    </nav>
  );
}
