import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../context/ToastContext.jsx';
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
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  Save,
  CheckCircle,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters.js';

export function StudentProfile() {
  const { currentUser, updateProfile } = useAuth();
  const { success, error: toastError } = useToast();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || currentUser?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSave = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      newErrors.fullName = 'Full Name must be at least 2 characters long.';
    }

    if (phoneNumber && !/^[0-9+()-\s]{7,20}$/.test(phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid contact phone number format.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await updateProfile({
        fullName: fullName.trim(),
        phone: phoneNumber.trim(),
        phoneNumber: phoneNumber.trim(),
      });

      if (res.success) {
        success('Candidate profile updated successfully.');
      } else {
        toastError(res.error || 'Failed to update candidate profile.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      toastError('An unexpected error occurred while saving profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="module-header">
        <div className="module-title-group">
          <div className="eyebrow" style={{ marginBottom: '0.375rem' }}>CANDIDATE IDENTITY</div>
          <h1>Student Profile</h1>
          <p>Manage candidate personal details and institutional registration records.</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSave}>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary-subtle)',
                    color: 'var(--color-primary-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                  }}
                >
                  {currentUser?.fullName?.charAt(0) || 'S'}
                </div>
                <div>
                  <CardTitle style={{ fontSize: '1.25rem' }}>{currentUser?.fullName}</CardTitle>
                  <CardDescription>Candidate Registration Record</CardDescription>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Badge variant="primary" size="sm">Candidate</Badge>
                <Badge variant="success" size="sm" dot>Active</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Student ID & Email (Read-Only) */}
              <div className="grid grid-cols-2 md-grid-cols-1 gap-4">
                <div>
                  <label className="form-label">Student ID (Immutable)</label>
                  <Input
                    value={currentUser?.studentId || 'N/A'}
                    disabled
                    readOnly
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Assigned institutional student identifier.
                  </span>
                </div>

                <div>
                  <label className="form-label">Email Address (Login ID)</label>
                  <Input
                    value={currentUser?.email || ''}
                    disabled
                    readOnly
                    iconLeft={<Mail size={15} />}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Used for platform authentication.
                  </span>
                </div>
              </div>

              {/* Editable Full Name & Phone */}
              <div>
                <label className="form-label" htmlFor="input_student_fullname">Full Name *</label>
                <Input
                  id="input_student_fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  error={errors.fullName}
                  placeholder="e.g. John Doe"
                  iconLeft={<User size={15} />}
                  required
                />
              </div>

              <div>
                <label className="form-label" htmlFor="input_student_phone">Contact Phone Number</label>
                <Input
                  id="input_student_phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  error={errors.phoneNumber}
                  placeholder="e.g. +1 555-0199"
                  iconLeft={<Phone size={15} />}
                />
              </div>

              {/* Account Meta Strip */}
              <div
                style={{
                  padding: '0.875rem 1rem',
                  backgroundColor: 'var(--color-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} />
                  <span>Enrolled: <strong>{formatDate(currentUser?.createdAt)}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} />
                  <span>Security: Frontend LocalStorage Session</span>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                iconLeft={<Save size={15} />}
              >
                Save Profile Changes
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default StudentProfile;
