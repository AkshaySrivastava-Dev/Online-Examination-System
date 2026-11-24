import React from 'react';

/**
 * Reusable Badge Component
 *
 * @param {Object} props
 * @param {'neutral'|'primary'|'success'|'warning'|'danger'} [props.variant='neutral']
 * @param {'sm'|'md'} [props.size='md']
 * @param {boolean} [props.dot=false]
 * @param {string} [props.className='']
 * @param {React.ReactNode} props.children
 */
export function Badge({
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'badge',
    `badge-${variant}`,
    `badge-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...rest}>
      {dot && <span className="badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

export default Badge;

