import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Standard Page Transition with subtle upward slide & fade
 */
export function PageTransition({ children, className = '', style = {} }) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    initial: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 8,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.22,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : -6,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.15,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/**
 * Subtle Floating Background Accent Elements for Page Headers / Hero sections
 * Decorative, low-amplitude, pointer-events: none, placed behind content.
 */
export function FloatingBackgroundElements({ count = 3, opacity = 0.4 }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Element 1: Glowing soft dot */}
      <motion.div
        animate={{
          x: [0, 8, -6, 0],
          y: [0, -10, 6, 0],
          opacity: [opacity * 0.7, opacity, opacity * 0.7],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          top: '15%',
          right: '8%',
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--color-primary-subtle) 0%, transparent 70%)',
          filter: 'blur(10px)',
        }}
      />

      {/* Element 2: Delicate abstract ring */}
      <motion.div
        animate={{
          x: [0, -10, 8, 0],
          y: [0, 12, -8, 0],
          rotate: [0, 90, 180, 360],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          position: 'absolute',
          top: '30%',
          right: '22%',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '1px dashed var(--color-border)',
          opacity: opacity * 0.6,
        }}
      />

      {/* Element 3: Tiny accent square */}
      <motion.div
        animate={{
          x: [0, 6, -4, 0],
          y: [0, -8, 8, 0],
          rotate: [0, 45, 90, 0],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '35%',
          width: '12px',
          height: '12px',
          borderRadius: '2px',
          border: '1px solid var(--color-primary-border)',
          opacity: opacity * 0.5,
        }}
      />
    </div>
  );
}

/**
 * Animated Number Counter for numerical KPIs on initial mount
 */
export function AnimatedCounter({ value, duration = 0.8, formatter }) {
  const shouldReduceMotion = useReducedMotion();
  const strVal = String(value ?? '');
  const hasPercent = strVal.includes('%');
  const numericValue = typeof value === 'number' ? value : parseFloat(strVal.replace(/[^0-9.-]/g, ''));

  const defaultFormatter = (v) => (hasPercent ? `${v}%` : v);
  const activeFormatter = formatter || defaultFormatter;

  const [displayValue, setDisplayValue] = useState(() => (shouldReduceMotion || isNaN(numericValue) ? value : 0));

  useEffect(() => {
    if (shouldReduceMotion || isNaN(numericValue)) {
      setDisplayValue(value);
      return;
    }

    let startTime = null;
    let animationFrame = null;
    const startVal = 0;
    const endVal = numericValue;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * ease;

      const formatted = Number.isInteger(endVal) ? Math.round(current) : parseFloat(current.toFixed(1));
      setDisplayValue(formatted);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
      }
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration, shouldReduceMotion, numericValue]);

  if (isNaN(numericValue) || typeof value === 'object') {
    return <span>{value}</span>;
  }

  return <span>{activeFormatter(displayValue)}</span>;
}

/**
 * Premium Skeleton Loader for table rows and cards
 */
export function SkeletonLoader({ width = '100%', height = '20px', borderRadius = 'var(--radius-sm)', style = {} }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--color-surface-hover)',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <motion.div
        animate={{ x: ['-100%', '100%'] }}
        transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
        }}
      />
    </div>
  );
}
