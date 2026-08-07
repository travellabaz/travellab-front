// Shared by every paginated list (blog, tours, tour search). Rendering
// every single page number breaks down once there are more than a
// handful of pages — wraps into several rows or overflows on mobile.
// Truncate to first/last + a window around the current page instead,
// the common "1 … 11 12 13 … 25" pattern.
export function paginationItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const result = [];
  let prev = 0;
  for (const n of sorted) {
    if (n - prev > 1) result.push('…');
    result.push(n);
    prev = n;
  }
  return result;
}
