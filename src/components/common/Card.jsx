import React from 'react';

export function Card({ interactive = false, className = '', children, ...rest }) {
  const classes = ['card', interactive ? 'card-interactive' : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...rest }) {
  return (
    <div className={`card-header ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...rest }) {
  return (
    <h3 className={`card-title ${className}`} {...rest}>
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children, ...rest }) {
  return (
    <p className={`card-description ${className}`} {...rest}>
      {children}
    </p>
  );
}

export function CardContent({ className = '', children, ...rest }) {
  return (
    <div className={`card-content ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...rest }) {
  return (
    <div className={`card-footer ${className}`} {...rest}>
      {children}
    </div>
  );
}

export default Card;

