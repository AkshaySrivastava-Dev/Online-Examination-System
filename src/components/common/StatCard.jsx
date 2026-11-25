import React from 'react';
import { AnimatedCounter } from './Motion';

/**
 * Reusable Minimal Metric StatCard with prominent LeetCode/Linear hierarchy
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string|number} props.value
 * @param {string} [props.subtitle]
 * @param {React.ReactNode} [props.icon]
 * @param {React.ReactNode} [props.badge]
 * @param {string} [props.className='']
 * @param {boolean} [props.featured=false]
 */
export function StatCard({
  title,
  value,
  subtitle,
  icon,
  badge,
  className = '',
  featured = false,
}) {
  return (
    <div className={`stat-card ${featured ? 'stat-card-featured' : ''} ${className}`}>
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {icon && <div className="stat-card-icon">{icon}</div>}
      </div>

      <div className="stat-card-value">
        <AnimatedCounter value={value} />
      </div>

      {(subtitle || badge) && (
        <div className="stat-card-footer">
          {badge}
          {subtitle && <span className="stat-card-subtitle">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}

export default StatCard;
