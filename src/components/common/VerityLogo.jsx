import React from 'react';

/**
 * Original VERITY Geometric Symbol
 * Represents verification, precision assessment, and institutional clarity.
 * Interlocking angular faceted planes in VERITY brand orange (#FFA116 / #FF8A00 / #FFC01E).
 *
 * @param {Object} props
 * @param {number|string} [props.size=28]
 * @param {string} [props.className='']
 * @param {React.CSSProperties} [props.style={}]
 */
export function VeritySymbol({ size = 28, className = '', style = {} }) {
  const pixelSize = typeof size === 'number' ? size : parseInt(size, 10) || 28;

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`verity-symbol ${className}`}
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
      aria-label="VERITY Assessment Symbol"
    >
      {/* Background soft geometric bevel glow container */}
      <rect width="32" height="32" rx="6" fill="#1A1A1A" fillOpacity="0.08" />

      {/* Left precision facet: Descending dynamic anchor plane */}
      <path
        d="M5 6.5H11.8L16.2 21.5L12.5 26.5L5 6.5Z"
        fill="#FFA116"
      />

      {/* Right precision facet: Ascending verification plane forming the V vertex */}
      <path
        d="M12.5 26.5L16.2 21.5L23.8 6.5H27L16 26.5H12.5Z"
        fill="#FF8A00"
      />

      {/* Central Keystone Prism: Interlocking verification node ("Beyond the Score") */}
      <polygon
        points="12.5,21.5 16,13.2 19.5,21.5 16,26.5"
        fill="#FFC01E"
      />

      {/* Micro-alignment precision diamond at apex */}
      <polygon
        points="16,13.2 17.5,17 16,19 14.5,17"
        fill="#FFF2D6"
        fillOpacity="0.85"
      />
    </svg>
  );
}

/**
 * Reusable VERITY Brand Logo (Symbol + Wordmark)
 * Supports full, compact, and symbol variants across dark and light themes.
 *
 * @param {Object} props
 * @param {'full'|'compact'|'symbol'} [props.variant='full']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {string} [props.subtitle]
 * @param {boolean} [props.showTagline=true]
 * @param {string} [props.className='']
 * @param {React.CSSProperties} [props.style={}]
 */
export function VerityLogo({
  variant = 'full',
  size = 'md',
  subtitle,
  showTagline = true,
  className = '',
  style = {},
}) {
  const sizeMap = {
    sm: { symbol: 22, titleSize: '0.875rem', subtitleSize: '0.5625rem', gap: '0.5rem' },
    md: { symbol: 28, titleSize: '1.0625rem', subtitleSize: '0.625rem', gap: '0.625rem' },
    lg: { symbol: 36, titleSize: '1.375rem', subtitleSize: '0.6875rem', gap: '0.75rem' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  if (variant === 'symbol') {
    return <VeritySymbol size={currentSize.symbol} className={className} style={style} />;
  }

  const activeTagline = subtitle || (showTagline ? 'BEYOND THE SCORE' : null);

  return (
    <div
      className={`verity-logo-brand ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: currentSize.gap,
        userSelect: 'none',
        lineHeight: 1.15,
        ...style,
      }}
    >
      <VeritySymbol size={currentSize.symbol} />

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          className="verity-wordmark"
          style={{
            fontSize: currentSize.titleSize,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-family), system-ui, -apple-system, sans-serif',
          }}
        >
          VERITY
        </span>
        {variant === 'full' && activeTagline && (
          <span
            className="verity-tagline"
            style={{
              fontSize: currentSize.subtitleSize,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-primary)',
              fontFamily: 'var(--font-family), system-ui, sans-serif',
              marginTop: '1px',
            }}
          >
            {activeTagline}
          </span>
        )}
      </div>
    </div>
  );
}

export default VerityLogo;
