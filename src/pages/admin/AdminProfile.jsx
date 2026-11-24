import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
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
  Modal,
} from '../../components/common';
import {
  UserCheck,
  Shield,
  Save,
  CheckCircle2,
  Lock,
  Calendar,
  Mail,
  Phone,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters.js';
import { clearExamProStorage, setItem } from '../../services/storageService.js';
import { initializeSeedData, PREDEFINED_ADMIN } from '../../services/seedData.js';
import { sanitizeUser } from '../../services/authService.js';

export function AdminProfile() {
  const { currentUser, updateProfile } = useAuth();
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || '',
    phone: currentUser?.phone || '',
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetDemoData = () => {
    setIsResetting(true);
    try {
      clearExamProStorage();
      initializeSeedData();
      setItem('current_session', sanitizeUser(PREDEFINED_ADMIN));
      success('Database successfully reset to pristine demo seeds! Reloading application...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Reset error:', err);
      error('Failed to reset demo data.');
      setIsResetting(false);
      setShowResetModal(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name is required (minimum 2 characters).';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    const res = await updateProfile({
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
    });
    setIsSaving(false);

    if (res.success) {
      success('Admin profile credentials updated successfully.');
    } else {
      error(res.error || 'Failed to update profile.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Module Header */}
      <div className="module-header">
        <div className="module-title-group">
          <div className="eyebrow" style={{ marginBottom: '0.375rem' }}>GOVERNANCE & CONTROL</div>
          <h1>Administrator Profile</h1>
          <p>Institutional administrator credentials and system orchestration settings.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--color-primary-subtle)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                  }}
                >
                  {currentUser?.fullName?.charAt(0) || 'A'}
                </div>
                <div>
                  <CardTitle>{currentUser?.fullName}</CardTitle>
                  <CardDescription>System Administrator • Institutional Overseer</CardDescription>
                </div>
              </div>

              <Badge variant="primary" size="md" dot>
                {currentUser?.role?.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="grid grid-cols-2 md-grid-cols-1 gap-4">
                <Input
                  label="Administrator Full Name"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, fullName: e.target.value }));
                    if (errors.fullName) setErrors({});
                  }}
                  error={errors.fullName}
                  required
                />

                <Input
                  label="Contact Phone"
                  type="tel"
                  placeholder="+1 (555) 019-2834"
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 md-grid-cols-1 gap-4">
                <Input
                  label="Institutional Email Address"
                  value={currentUser?.email || ''}
                  disabled
                  helperText="Primary administrative identity cannot be changed."
                  iconLeft={<Mail size={15} />}
                />

                <Input
                  label="Assigned System Role"
                  value={currentUser?.role || ''}
                  disabled
                  helperText="Administrative privilege level is protected."
                  iconLeft={<Lock size={15} />}
                />
              </div>

              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--color-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8125rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Provisioned Date</span>
                  <strong>{formatDate(currentUser?.createdAt)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Account Standing</span>
                  <Badge variant="success" size="sm" dot>Active Verified</Badge>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSaving}
                  iconLeft={<Save size={16} />}
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security & System Governance Callout */}
        <Card style={{ backgroundColor: 'var(--color-surface-subtle)' }}>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} color="var(--color-primary)" />
              <CardTitle style={{ fontSize: '0.9375rem' }}>Institutional Governance Policies</CardTitle>
            </div>
            <CardDescription>
              Protected administrative invariants and role separation rules
            </CardDescription>
          </CardHeader>
          <CardContent style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>
                <strong>Predefined Administrator Invariance:</strong> The master admin credential (<code>admin@exampro.com</code>) cannot be deleted, suspended, or demoted to student status.
              </li>
              <li>
                <strong>Public Isolation:</strong> Public student registration endpoints cannot create or elevate accounts to administrative status.
              </li>
              <li>
                <strong>Snapshot Archiving:</strong> Any modification or deletion of questions or tests leaves previously recorded candidate scorecards and submitted answer sheets completely intact.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* System Data & Demo Reset Section */}
        <Card style={{ borderColor: 'var(--color-danger-subtle)' }}>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RotateCcw size={18} color="var(--color-danger)" />
              <CardTitle style={{ fontSize: '0.9375rem', color: 'var(--color-danger)' }}>
                System Data & Demo Database Management
              </CardTitle>
            </div>
            <CardDescription>
              Restore the application to default demonstration state for evaluation and grading.
            </CardDescription>
          </CardHeader>
          <CardContent style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
            <p style={{ marginBottom: '1rem' }}>
              Resetting the database clears all student attempt logs, question revisions, and newly registered candidates, restoring factory demo questions, exams, and verified students.
            </p>
            <Button
              variant="danger"
              size="sm"
              iconLeft={<RotateCcw size={14} />}
              onClick={() => setShowResetModal(true)}
            >
              Reset Demo Database to Initial Seeds
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => !isResetting && setShowResetModal(false)}
        title="Confirm System Data Reset"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', width: '100%' }}>
            <Button
              variant="outline"
              size="sm"
              disabled={isResetting}
              onClick={() => setShowResetModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isResetting}
              iconLeft={<RotateCcw size={14} />}
              onClick={handleResetDemoData}
            >
              Confirm Factory Reset
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div
            style={{
              padding: '0.625rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-danger-subtle)',
              color: 'var(--color-danger)',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9375rem', fontWeight: 600 }}>
              Are you sure you want to reset all data?
            </h4>
            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              This action will permanently purge all test attempt records, submitted answer sheets, candidate updates, and newly created exams, and repopulate the factory demo dataset.
            </p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Your administrator session will be preserved.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AdminProfile;

