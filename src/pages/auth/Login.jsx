import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Badge,
} from '../../components/common';
import { LogIn, KeyRound, Sparkles, AlertCircle } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick-fill credentials for demo / evaluation testing
  const handleQuickFill = (fillEmail, fillPassword) => {
    setEmail(fillEmail);
    setPassword(fillPassword);
    setErrors({});
    setFormError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validate()) return;

    setIsSubmitting(true);
    const result = await login({ email, password });
    setIsSubmitting(false);

    if (result.success && result.user) {
      success(`Welcome back, ${result.user.fullName}!`, 'Signed In');
      // If user came from a protected URL, route them back there; otherwise role dashboard
      const fromPath = location.state?.from?.pathname;
      if (fromPath && !fromPath.startsWith('/login') && !fromPath.startsWith('/signup')) {
        navigate(fromPath, { replace: true });
      } else {
        const target = result.user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
        navigate(target, { replace: true });
      }
    } else {
      setFormError(result.error || 'Invalid credentials. Please verify your email and password.');
    }
  };

  return (
    <Card className="auth-card" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      <CardHeader style={{ paddingBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div className="eyebrow">PORTAL ACCESS</div>
          <Badge variant="primary" size="sm">v1.0 Production</Badge>
        </div>
        <CardTitle style={{ fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#FFFFFF' }}>
          Sign in to ExamPro
        </CardTitle>
        <CardDescription style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
          Enter your institutional credentials to access your examinations.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {formError && (
          <div
            style={{
              backgroundColor: 'var(--color-danger-subtle)',
              border: '1px solid #FECACA',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              marginBottom: '1.25rem',
              color: 'var(--color-danger-text)',
              fontSize: '0.8125rem',
              lineHeight: '1.4',
            }}
            role="alert"
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. admin@exampro.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              if (formError) setFormError('');
            }}
            error={errors.email}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
              if (formError) setFormError('');
            }}
            error={errors.password}
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            style={{ width: '100%', marginTop: '0.25rem' }}
            iconLeft={<LogIn size={16} />}
          >
            Sign In
          </Button>
        </form>

        {/* Demo Credentials Helper Box */}
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-surface-subtle)',
            border: '1px dashed var(--color-border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.625rem',
            }}
          >
            <KeyRound size={13} />
            <span>Demo Evaluation Credentials</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Admin Demo Button */}
            <button
              type="button"
              onClick={() => handleQuickFill('admin@exampro.com', 'Admin@123')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color var(--transition-fast)',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Admin: </span>
                <span style={{ color: 'var(--color-text-secondary)' }}>admin@exampro.com / Admin@123</span>
              </div>
              <Badge variant="primary" size="sm">Auto-Fill</Badge>
            </button>

            {/* Student Demo Button */}
            <button
              type="button"
              onClick={() => handleQuickFill('alex.morgan@university.edu', 'Student@123')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color var(--transition-fast)',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: 'var(--color-success-text)' }}>Student: </span>
                <span style={{ color: 'var(--color-text-secondary)' }}>alex.morgan@... / Student@123</span>
              </div>
              <Badge variant="success" size="sm">Auto-Fill</Badge>
            </button>
          </div>
        </div>
      </CardContent>

      <CardFooter style={{ justifyContent: 'center' }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          Don't have a student account?{' '}
          <Link to="/signup" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
            Register as a Student
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default Login;

