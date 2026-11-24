import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

export function Signup() {
  const { signup } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (formError) setFormError('');
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    } else if (!/[A-Za-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must include at least one letter and one number.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validate()) return;

    setIsSubmitting(true);
    // Student registration automatically assigns role='student' internally
    const result = await signup(formData);
    setIsSubmitting(false);

    if (result.success) {
      success(
        `Account created successfully! Student ID: ${result.user?.studentId || 'Assigned'}. Please sign in.`,
        'Registration Complete'
      );
      navigate('/login', { replace: true });
    } else {
      setFormError(result.error || 'Failed to complete registration. Please check your information.');
    }
  };

  return (
    <Card className="auth-card" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      <CardHeader style={{ paddingBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div className="eyebrow">CANDIDATE ONBOARDING</div>
          <Badge variant="primary" size="sm">Student Account</Badge>
        </div>
        <CardTitle style={{ fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#FFFFFF' }}>
          Register Student Profile
        </CardTitle>
        <CardDescription style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
          Create an institutional student profile to enroll and attempt exams.
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

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Full Name"
            placeholder="e.g. Eleanor Vance"
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            error={errors.fullName}
            required
            autoComplete="name"
          />

          <Input
            label="Institutional Email"
            type="email"
            placeholder="e.g. eleanor.vance@university.edu"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            helperText="Must be unique; used to sign in and record scorecards."
            required
            autoComplete="email"
          />

          <Input
            label="Phone Number (Optional)"
            type="tel"
            placeholder="e.g. +1 (555) 012-3456"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            autoComplete="tel"
          />

          <div className="grid grid-cols-2 md-grid-cols-1 gap-3">
            <Input
              label="Password"
              type="password"
              placeholder="Min. 6 chars"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              error={errors.password}
              helperText="Letters & numbers"
              required
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
            />
          </div>

          <div
            style={{
              padding: '0.625rem 0.75rem',
              backgroundColor: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            A unique Student Identification Number (e.g. <code>STD-2026-XXX</code>) will be generated automatically upon account creation.
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            style={{ width: '100%', marginTop: '0.5rem' }}
            iconLeft={<UserPlus size={16} />}
          >
            Create Student Account
          </Button>
        </form>
      </CardContent>

      <CardFooter style={{ justifyContent: 'center' }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
            Sign In here
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default Signup;

