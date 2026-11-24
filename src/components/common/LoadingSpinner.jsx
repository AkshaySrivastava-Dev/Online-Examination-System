import React from 'react';

/**
 * Centered Minimal Loading Spinner
 *
 * @param {Object} props
 * @param {string} [props.message='Loading...']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 */
export function LoadingSpinner({ message = 'Loading...', size = 'md' }) {
  const spinnerSize = size === 'sm' ? '16px' : size === 'lg' ? '32px' : '24px';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        width: '100%',
        gap: '0.75rem',
      }}
      role="status"
      aria-live="polite"
    >
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: '2px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'btn-spin 0.65s linear infinite',
        }}
      />
      {message && (
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          {message}
        </span>
      )}
    </div>
  );
}

export default LoadingSpinner;

