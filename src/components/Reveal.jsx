import { useEffect, useRef } from 'react';

// Fade-up-on-scroll wrapper, matching the original's global
// `.tl-reveal` + IntersectionObserver(threshold: 0.08) pair.
export default function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`tl-reveal ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
