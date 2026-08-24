import { useEffect, useRef, useState } from 'react';
import Link from './LocalizedLink';

const AUTO_ADVANCE_MS = 5000;

// Auto-advancing photo rotator with manual prev/next — used for the
// homepage Shop block's lifestyle photo. `images` is a plain array of
// paths; add more there whenever new photos are shot, nothing else here
// needs to change. Pauses on hover so it doesn't fight a visitor
// mid-look, same convention as the Partners logo marquee.
export default function ImageCarousel({ images, alt, linkTo }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (paused || images.length <= 1) return undefined;
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % images.length), AUTO_ADVANCE_MS);
    return () => clearInterval(timerRef.current);
  }, [paused, images.length]);

  if (images.length === 0) return null;

  const go = (delta) => setIndex((i) => (i + delta + images.length) % images.length);

  const frame = <img src={images[index]} alt={alt} />;

  return (
    <div className="tl-image-carousel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {linkTo ? (
        <Link to={linkTo} className="tl-image-carousel-frame">{frame}</Link>
      ) : (
        <div className="tl-image-carousel-frame">{frame}</div>
      )}
      {images.length > 1 && (
        <>
          <button type="button" className="tl-image-carousel-arrow tl-image-carousel-prev" onClick={() => go(-1)} aria-label="Previous">‹</button>
          <button type="button" className="tl-image-carousel-arrow tl-image-carousel-next" onClick={() => go(1)} aria-label="Next">›</button>
          <div className="tl-image-carousel-dots">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                className={'tl-image-carousel-dot' + (i === index ? ' active' : '')}
                onClick={() => setIndex(i)}
                aria-label={`${i + 1}/${images.length}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
