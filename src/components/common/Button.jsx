import React from 'react';

/**
 * Reusable Button Component
 *
 * @param {Object} props
 * @param {'primary'|'secondary'|'outline'|'danger'|'ghost'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.isLoading=false]
 * @param {boolean} [props.disabled=false]
 * @param {React.ReactNode} [props.iconLeft]
 * @param {React.ReactNode} [props.iconRight]
 * @param {string} [props.className='']
 * @param {React.ReactNode} props.children
 */
export const Button = React.forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    iconLeft,
    iconRight,
    className = '',
    children,
    ...rest
  },
  ref
) {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    isLoading || disabled ? 'btn-disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <span className="btn-spinner" aria-hidden="true" />
      ) : (
        iconLeft && <span className="btn-icon-left">{iconLeft}</span>
      )}
      {children}
      {!isLoading && iconRight && <span className="btn-icon-right">{iconRight}</span>}
    </button>
  );
});

export default Button;

