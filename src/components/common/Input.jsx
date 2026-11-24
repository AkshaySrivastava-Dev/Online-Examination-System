import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Reusable Form Input Component
 *
 * @param {Object} props
 * @param {string} [props.label]
 * @param {boolean} [props.required=false]
 * @param {string} [props.error]
 * @param {string} [props.helperText]
 * @param {React.ReactNode} [props.iconLeft]
 * @param {React.ReactNode} [props.iconRight]
 * @param {'text'|'email'|'password'|'number'|'date'|'datetime-local'} [props.type='text']
 * @param {'input'|'textarea'} [props.as='input']
 * @param {string} [props.className='']
 */
export const Input = React.forwardRef(function Input(
  {
    label,
    required = false,
    error,
    helperText,
    iconLeft,
    iconRight,
    type = 'text',
    as = 'input',
    className = '',
    id,
    ...rest
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label ? `input_${label.toLowerCase().replace(/\s+/g, '_')}` : undefined);
  const isPasswordField = type === 'password';
  const effectiveType = isPasswordField ? (showPassword ? 'text' : 'password') : type;

  const inputClasses = [
    as === 'textarea' ? 'form-textarea' : 'form-input',
    error ? 'has-error' : '',
    iconLeft ? 'with-icon-left' : '',
    iconRight || isPasswordField ? 'with-icon-right' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          <span>
            {label}
            {required && <span className="form-label-required">*</span>}
          </span>
        </label>
      )}

      <div className="input-container">
        {iconLeft && <span className="input-icon-left">{iconLeft}</span>}

        {as === 'textarea' ? (
          <textarea
            ref={ref}
            id={inputId}
            className={inputClasses}
            required={required}
            aria-invalid={!!error}
            {...rest}
          />
        ) : (
          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            className={inputClasses}
            required={required}
            aria-invalid={!!error}
            {...rest}
          />
        )}

        {isPasswordField ? (
          <button
            type="button"
            className="input-icon-right"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        ) : (
          iconRight && <span className="input-icon-right">{iconRight}</span>
        )}
      </div>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className="form-helper">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;

