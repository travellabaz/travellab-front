// AZ colour name -> swatch hex, for the Shop's colour-dot pickers/cards.
// A couple of colours appear in the Sheet with more than one spelling
// (Yaşıl/Yashıl, Cəhrayı/Çəhrayı) — both variants are mapped here so the
// dot still renders the right colour; the Sheet's own spelling is what's
// still shown as the label/title, this file doesn't correct that.
const SWATCH = {
  'Ağ': '#FFFFFF',
  'Bej': '#E8DCC8',
  'Boz': '#9CA3AF',
  'Cəhrayı': '#F472B6',
  'Çəhrayı': '#F472B6',
  'Göy': '#3B82F6',
  'Mavi': '#60A5FA',
  'Narıncı': '#F97316',
  'Qara': '#111827',
  'Qəhvəyi': '#92400E',
  'Rəngli': 'conic-gradient(from 90deg, #F87171, #FBBF24, #34D399, #60A5FA, #A78BFA, #F87171)',
  'Sarı': '#FACC15',
  'Yaşıl': '#16A34A',
  'Yashıl': '#16A34A',
};

function swatchStyle(name) {
  const value = SWATCH[name] || '#D1D5DB';
  return value.startsWith('conic-gradient') ? { backgroundImage: value } : { background: value };
}

// max=0 renders every colour (used on the product page's own selector);
// otherwise caps at `max` dots plus a "+N" overflow badge (product cards).
export default function ColorDots({ colors, max = 3, selected, onSelect }) {
  if (!colors || colors.length === 0) return null;
  const shown = max > 0 ? colors.slice(0, max) : colors;
  const overflow = max > 0 ? colors.length - shown.length : 0;

  return (
    <div className="tl-color-dots">
      {shown.map((c) => (
        <span
          key={c}
          className={'tl-color-dot' + (selected === c ? ' active' : '') + (onSelect ? ' interactive' : '')}
          style={swatchStyle(c)}
          title={c}
          role={onSelect ? 'button' : undefined}
          tabIndex={onSelect ? 0 : undefined}
          onClick={onSelect ? () => onSelect(c) : undefined}
          onKeyDown={onSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(c); } } : undefined}
        />
      ))}
      {overflow > 0 && <span className="tl-color-dot-more">+{overflow}</span>}
    </div>
  );
}
