import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * Reusable Empty State Component
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.icon]
 * @param {string} props.title
 * @param {string} props.description
 * @param {React.ReactNode} [props.action]
 * @param {string} [props.className='']
 */
export function EmptyState({
  icon = <Inbox size={24} />,
  title = 'No data available',
  description = 'There are currently no items to display in this section.',
  action,
  className = '',
}) {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-icon-wrapper">{icon}</div>
      <h4 className="empty-title">{title}</h4>
      <p className="empty-description">{description}</p>
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}

export default EmptyState;

