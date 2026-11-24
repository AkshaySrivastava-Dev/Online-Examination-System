import React from 'react';

/**
 * Reusable Minimal Metric StatCard
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string|number} props.value
 * @param {string} [props.subtitle]
 * @param {React.ReactNode} [props.icon]
 * @param {React.ReactNode} [props.badge]
 * @param {string} [props.className='']
 */
export function StatCard({
  title,
  value,
  subtitle,
  icon,
  badge,
  className = '',
}) {
  return (
    <div className={`stat-card ${className}`}>
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        {icon && <div className="stat-icon">{icon}</div>}
      </div>

      <div className="stat-value">{value}</div>

      {(subtitle || badge) && (
        <div className="stat-meta">
          {badge}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
}

export default StatCard;

