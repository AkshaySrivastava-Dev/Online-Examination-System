import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BookOpen, ShieldCheck, CheckCircle2, Clock, Award } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function AuthLayout() {
  const { isAuthenticated, currentUser, isLoading } = useAuth();

  // If already authenticated, redirect to role dashboard
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)' }}>
        <LoadingSpinner message="Authenticating session..." />
      </div>
    );
  }

  if (isAuthenticated && currentUser) {
    const destination = currentUser.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
    return <Navigate to={destination} replace />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      {/* Editorial Left Branding Hero (Visible on Desktop >= 1024px) */}
      <div
        className="auth-hero-pane"
        style={{
          flex: '1.15',
          backgroundColor: '#090C0E',
          borderRight: '1px solid var(--color-border)',
          padding: 'var(--space-12) var(--space-10)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Architectural Grid Lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(255, 121, 0, 0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        />

        {/* Top Branding */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-primary)',
                color: '#090C0E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(255, 121, 0, 0.35)',
              }}
            >
              <BookOpen size={22} strokeWidth={2.5} />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#FFFFFF', display: 'block' }}>
                ExamPro
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700 }}>
                Enterprise Assessment
              </span>
            </div>
          </div>

          <div style={{ maxWidth: '540px' }}>
            <div className="eyebrow" style={{ marginBottom: '1rem' }}>
              Academic Integrity • Next-Gen Evaluation
            </div>
            <h1
              style={{
                fontSize: 'clamp(2rem, 3.5vw, 3.25rem)',
                fontWeight: 900,
                letterSpacing: '-0.04em',
                lineHeight: 1.05,
                color: '#FFFFFF',
                marginBottom: '1.5rem',
              }}
            >
              Precision in evaluation. <br />
              <span style={{ color: 'var(--color-primary)' }}>Integrity at scale.</span>
            </h1>
            <p style={{ fontSize: '1.0625rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
              An institutional online assessment engine engineered with strict timer synchronisation, multi-tab resilience, and instant immutable grading.
            </p>
          </div>

          {/* Value Props with Thin Architectural Borders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '480px' }}>
            <div
              style={{
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div style={{ color: 'var(--color-primary)' }}>
                <Clock size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '0.875rem', color: '#FFFFFF', display: 'block' }}>
                  Absolute Hardware-Synchronized Countdown
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Immune to tab backgrounding, clock tampering, or browser reloads.
                </span>
              </div>
            </div>

            <div
              style={{
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div style={{ color: 'var(--color-success-text)' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '0.875rem', color: '#FFFFFF', display: 'block' }}>
                  Stale-Lease Concurrency & Lock Recovery
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Prevents duplicate concurrent submissions across browser windows.
                </span>
              </div>
            </div>

            <div
              style={{
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div style={{ color: 'var(--color-primary)' }}>
                <Award size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '0.875rem', color: '#FFFFFF', display: 'block' }}>
                  Immutable Archival Snapshots
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Graded answer sheets are preserved forever against curriculum modifications.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Ticker */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            paddingTop: '2rem',
            borderTop: '1px solid var(--color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span>BUILD 2026.11 // CORE-V1</span>
          <span style={{ color: 'var(--color-primary)' }}>● ENGINES NOMINAL</span>
        </div>
      </div>

      {/* Form Pane (Right on Desktop, Full Width on Mobile) */}
      <div
        style={{
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 'var(--space-8) var(--space-6)',
          backgroundColor: 'var(--color-bg)',
          minHeight: '100vh',
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="auth-mobile-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-primary)',
                color: '#090C0E',
                marginBottom: '0.75rem',
                boxShadow: '0 0 15px rgba(255, 121, 0, 0.35)',
              }}
            >
              <BookOpen size={22} strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#FFFFFF' }}>
              ExamPro
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Online Examination & Assessment Management
            </p>
          </div>

          {/* Form Card */}
          <Outlet />

          {/* Academic Footer */}
          <div
            style={{
              marginTop: '1.5rem',
              textAlign: 'center',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <ShieldCheck size={14} color="var(--color-primary)" />
            <span>Academic Project Simulation • Client-Side LocalStorage Engine</span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .auth-hero-pane {
            display: none !important;
          }
          .auth-mobile-header {
            display: block !important;
          }
        }
        @media (min-width: 1024px) {
          .auth-mobile-header {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default AuthLayout;
