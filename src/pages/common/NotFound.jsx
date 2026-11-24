import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button, Card, CardContent } from '../../components/common';
import { FileQuestion, Home } from 'lucide-react';

export function NotFound() {
  const { isAuthenticated, currentUser } = useAuth();
  const homePath = isAuthenticated
    ? currentUser?.role === 'admin'
      ? '/admin/dashboard'
      : '/student/dashboard'
    : '/login';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <Card style={{ maxWidth: '440px', width: '100%', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-surface-subtle)',
            color: 'var(--color-primary)',
            border: '1px solid var(--color-border)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}
        >
          <FileQuestion size={28} />
        </div>

        <div className="eyebrow" style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
          SYSTEM ERROR 404
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
          Page Not Found (404)
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.75rem', lineHeight: '1.5' }}>
          The requested route does not exist or you may not have authorization to view it.
        </p>

        <Link to={homePath} style={{ textDecoration: 'none' }}>
          <Button variant="primary" size="md" iconLeft={<Home size={16} />}>
            Return to Dashboard
          </Button>
        </Link>
      </Card>
    </div>
  );
}

export default NotFound;

