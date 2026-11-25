import React from 'react';

/**
 * IsometricBarChart
 *
 * Renders high-quality 3D isometric extruded bars with front, side, and top faces
 * using exact VERITY solid color variations without gradients or neon glow.
 * Supports horizontal scrolling and responsive slot spacing so labels never collide.
 *
 * @param {Object} props
 * @param {Array<{ label: string, fullLabel?: string, value: number, sublabel?: string, color?: string }>} props.data
 * @param {number} [props.height=260]
 * @param {string} [props.valueSuffix='']
 * @param {string} [props.defaultColor='#FFA116']
 * @param {number} [props.minSlotWidth]
 */
export function IsometricBarChart({
  data = [],
  height = 260,
  valueSuffix = '',
  defaultColor = '#FFA116',
  minSlotWidth,
}) {
  if (!data || data.length === 0) {
    return null;
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = height - 60; // Room for value top labels and category bottom labels

  // Color shading helper for 3D extrusion faces (top is lighter, side is darker)
  const getShades = (hex) => {
    switch (hex.toLowerCase()) {
      case '#ffa116':
      case 'var(--color-primary)':
        return {
          front: '#FFA116',
          top: '#FFB84D',
          side: '#D98205',
        };
      case '#2cbb5d':
        return {
          front: '#2CBB5D',
          top: '#43D172',
          side: '#219648',
        };
      case '#00b8a3':
        return {
          front: '#00B8A3',
          top: '#1AD6C0',
          side: '#008F7F',
        };
      case '#ffc01e':
        return {
          front: '#FFC01E',
          top: '#FFCF4D',
          side: '#D99B05',
        };
      case '#ef4743':
      case '#ef4444':
        return {
          front: '#EF4743',
          top: '#F36E6A',
          side: '#C92B27',
        };
      default:
        return {
          front: hex,
          top: hex,
          side: hex,
        };
    }
  };

  const totalSlots = data.length;
  const barWidth = totalSlots > 6 ? 28 : 34;
  const extrusionX = 8;
  const extrusionY = 6;
  const effectiveSlotWidth = minSlotWidth || (totalSlots > 6 ? 74 : Math.max(Math.floor(480 / totalSlots), 60));
  const svgWidth = Math.max(totalSlots * effectiveSlotWidth, 480);
  const slotWidth = svgWidth / totalSlots;

  return (
    <div
      className="isometric-chart-scroll-wrapper"
      style={{
        width: '100%',
        overflowX: totalSlots > 6 ? 'auto' : 'hidden',
        overflowY: 'hidden',
        scrollbarWidth: 'thin',
        paddingBottom: totalSlots > 6 ? '4px' : '0',
      }}
    >
      <div style={{ minWidth: totalSlots > 6 ? `${svgWidth}px` : '100%', height: `${height}px` }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${height}`}
          preserveAspectRatio={totalSlots > 6 ? 'none' : 'xMidYMid meet'}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          {/* Subtle grid reference lines */}
          {[0.25, 0.5, 0.75, 1].map((pct) => {
            const y = height - 34 - chartHeight * pct;
            return (
              <line
                key={pct}
                x1="15"
                y1={y}
                x2={svgWidth - 15}
                y2={y}
                stroke="var(--color-border-subtle)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            );
          })}

          {/* Base floor baseline */}
          <line
            x1="10"
            y1={height - 34}
            x2={svgWidth - 10}
            y2={height - 34}
            stroke="var(--color-border)"
            strokeWidth="1"
          />

          {data.map((item, idx) => {
            const isZero = item.value === 0;
            const barH = isZero ? 4 : Math.max(Math.round((item.value / maxValue) * chartHeight), 6);
            const shades = getShades(item.color || defaultColor);
            const centerX = idx * slotWidth + slotWidth / 2;
            const x0 = centerX - barWidth / 2;
            const y0 = height - 34 - barH; // Front face top-left Y
            const x1 = x0 + barWidth;
            const yBase = height - 34;

            // Points for 3D extrusion faces
            const topFacePoints = `${x0},${y0} ${x0 + extrusionX},${y0 - extrusionY} ${x1 + extrusionX},${y0 - extrusionY} ${x1},${y0}`;
            const sideFacePoints = `${x1},${y0} ${x1 + extrusionX},${y0 - extrusionY} ${x1 + extrusionX},${yBase - extrusionY} ${x1},${yBase}`;

            // Clean shortened label to guarantee no collisions
            const maxLabelLen = totalSlots > 6 ? 10 : 16;
            const displayLabel = item.label.length > maxLabelLen
              ? item.label.substring(0, maxLabelLen - 1) + '…'
              : item.label;

            return (
              <g key={item.label || idx} className="isometric-bar-group" style={{ cursor: 'pointer' }}>
                <title>{`${item.fullLabel || item.label}: ${item.value} ${valueSuffix}`.trim()}</title>

                {/* Numeric Value Label above 3D Top */}
                <text
                  x={centerX + extrusionX / 2}
                  y={y0 - extrusionY - 6}
                  textAnchor="middle"
                  fill={isZero ? 'var(--color-text-muted)' : 'var(--color-text-primary)'}
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="var(--font-mono)"
                >
                  {item.value}
                  {valueSuffix}
                </text>

                {/* Side Face (Right) */}
                <polygon points={sideFacePoints} fill={isZero ? 'rgba(255,255,255,0.04)' : shades.side} />

                {/* Top Face */}
                <polygon points={topFacePoints} fill={isZero ? 'rgba(255,255,255,0.08)' : shades.top} />

                {/* Front Face */}
                <rect
                  x={x0}
                  y={y0}
                  width={barWidth}
                  height={barH}
                  fill={isZero ? 'rgba(255,255,255,0.05)' : shades.front}
                  rx="1"
                />

                {/* Bottom Category Label */}
                <text
                  x={centerX}
                  y={height - 14}
                  textAnchor="middle"
                  fill="var(--color-text-secondary)"
                  fontSize="10.5"
                  fontWeight="500"
                  fontFamily="var(--font-family)"
                >
                  {displayLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default IsometricBarChart;
