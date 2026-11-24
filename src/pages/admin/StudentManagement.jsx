import React, { useState, useEffect, useMemo } from 'react';
import {
  getStudents,
  getStudentById,
  updateStudent,
  setStudentStatus,
  deleteStudent,
} from '../../services/studentService.js';
import { getResults } from '../../services/resultService.js';
import { useToast } from '../../hooks/useToast.js';
import {
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  Button,
  Input,
  Badge,
  Modal,
} from '../../components/common';
import {
  Users,
  Search,
  Eye,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters.js';

export function StudentManagement() {
  const { success, error, warning } = useToast();

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Modals state
  const [viewStudent, setViewStudent] = useState(null);
  const [studentStats, setStudentStats] = useState(null);

  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '' });
  const [editErrors, setEditErrors] = useState({});

  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState(null);

  // Load students
  const refreshStudents = () => {
    const list = getStudents({ search, status: statusFilter, includeDeleted: false });
    setStudents(list);
  };

  useEffect(() => {
    refreshStudents();
    setCurrentPage(1);
  }, [search, statusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(students.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return students.slice(start, start + pageSize);
  }, [students, currentPage]);

  // View Details
  const handleOpenView = (student) => {
    setViewStudent(student);
    const results = getResults({ studentId: student.id });
    const attemptsCount = results.length;
    const avgScore =
      attemptsCount > 0
        ? (
            results.reduce((acc, c) => acc + (Number(c.percentage) || 0), 0) /
            attemptsCount
          ).toFixed(1)
        : '0.0';
    const passedCount = results.filter((r) => r.isPassed).length;

    setStudentStats({
      attemptsCount,
      avgScore,
      passedCount,
    });
  };

  // Edit Student
  const handleOpenEdit = (student) => {
    setEditStudent(student);
    setEditForm({ fullName: student.fullName, phone: student.phone || '' });
    setEditErrors({});
  };

  const handleSaveEdit = () => {
    if (!editForm.fullName || editForm.fullName.trim().length < 2) {
      setEditErrors({ fullName: 'Full name must be at least 2 characters.' });
      return;
    }

    const res = updateStudent(editStudent.id, {
      fullName: editForm.fullName,
      phone: editForm.phone,
    });

    if (res.success) {
      success('Student details updated successfully.');
      setEditStudent(null);
      refreshStudents();
    } else {
      error(res.error || 'Failed to update student.');
    }
  };

  // Toggle Suspend / Activate
  const handleToggleStatus = (student) => {
    const newStatus = student.status === 'active' ? 'suspended' : 'active';
    const res = setStudentStatus(student.id, newStatus);
    if (res.success) {
      success(
        `Account for ${student.fullName} has been ${newStatus === 'active' ? 'activated' : 'suspended'}.`
      );
      refreshStudents();
    } else {
      error(res.error || 'Failed to update student status.');
    }
  };

  // Delete Student
  const handleDeleteStudent = () => {
    if (!deleteConfirmStudent) return;
    const res = deleteStudent(deleteConfirmStudent.id);
    if (res.success) {
      warning(`Student account for ${deleteConfirmStudent.fullName} soft-deleted. Historical results remain preserved.`);
      setDeleteConfirmStudent(null);
      refreshStudents();
    } else {
      error(res.error || 'Failed to delete student.');
    }
  };

  return (
    <div>
      {/* Module Header */}
      <div className="module-header">
        <div className="module-title-group">
          <div className="eyebrow" style={{ marginBottom: '0.375rem' }}>CANDIDATE ROSTER</div>
          <h1>Student Directory</h1>
          <p>Search, inspect profiles, manage account states, and view historical participation.</p>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
            <div className="search-input-wrapper" style={{ width: '100%', maxWidth: '360px' }}>
              <Input
                placeholder="Search by name, email, or student ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                iconLeft={<Search size={16} />}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Status:</span>
              <select
                className="form-input"
                style={{ width: '130px', height: '38px', padding: '0 0.5rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>
            </div>
          </div>

          <Badge variant="neutral" size="md">
            {students.length} Student{students.length === 1 ? '' : 's'} Total
          </Badge>
        </div>

        {/* Students Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name & ID</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Status</TableHead>
              <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedStudents.length === 0 ? (
              <TableEmpty colSpan={6} message="No student accounts match the specified criteria." />
            ) : (
              paginatedStudents.map((std) => (
                <TableRow key={std.id}>
                  <TableCell>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {std.fullName}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                      ID: <code>{std.studentId || 'N/A'}</code>
                    </div>
                  </TableCell>
                  <TableCell>{std.email}</TableCell>
                  <TableCell>{std.phone || '—'}</TableCell>
                  <TableCell>{formatDate(std.createdAt)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={std.status === 'active' ? 'success' : 'danger'}
                      size="sm"
                      dot
                    >
                      {std.status === 'active' ? 'Active' : 'Suspended'}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleOpenView(std)}
                        title="View details"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleOpenEdit(std)}
                        title="Edit profile"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleToggleStatus(std)}
                        title={std.status === 'active' ? 'Suspend account' : 'Activate account'}
                      >
                        {std.status === 'active' ? <UserX size={15} color="var(--color-warning)" /> : <UserCheck size={15} color="var(--color-success)" />}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setDeleteConfirmStudent(std)}
                        title="Soft delete student"
                      >
                        <Trash2 size={15} color="var(--color-danger)" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        <div className="pagination-bar">
          <span>
            Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              iconLeft={<ChevronLeft size={14} />}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              iconRight={<ChevronRight size={14} />}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* View Student Details Modal */}
      <Modal
        isOpen={!!viewStudent}
        onClose={() => setViewStudent(null)}
        title="Student Profile & Academic Record"
        description="Detailed enrollment overview and examination participation"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setViewStudent(null)}>
            Close
          </Button>
        }
      >
        {viewStudent && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-primary-subtle)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.125rem',
                }}
              >
                {viewStudent.fullName.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{viewStudent.fullName}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Student ID: <code>{viewStudent.studentId || 'N/A'}</code>
                </span>
              </div>
              <Badge
                variant={viewStudent.status === 'active' ? 'success' : 'danger'}
                size="sm"
                dot
                style={{ marginLeft: 'auto' }}
              >
                {viewStudent.status === 'active' ? 'Active' : 'Suspended'}
              </Badge>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
                padding: '1rem',
                backgroundColor: 'var(--color-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Email Address</span>
                <strong>{viewStudent.email}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Phone Number</span>
                <strong>{viewStudent.phone || 'Not provided'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Enrolled On</span>
                <strong>{formatDate(viewStudent.createdAt)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Role</span>
                <span style={{ textTransform: 'capitalize' }}>{viewStudent.role}</span>
              </div>
            </div>

            {studentStats && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem',
                  padding: '1rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {studentStats.attemptsCount}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                    Tests Attempted
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-success)' }}>
                    {studentStats.avgScore}%
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                    Average Score
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {studentStats.passedCount}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                    Tests Passed
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={!!editStudent}
        onClose={() => setEditStudent(null)}
        title="Edit Student Information"
        description="Update profile details. Role and student ID cannot be altered."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setEditStudent(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Full Name"
            value={editForm.fullName}
            onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
            error={editErrors.fullName}
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            value={editForm.phone}
            onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="e.g. +1 (555) 019-2834"
          />

          <Input
            label="Email Address"
            value={editStudent?.email || ''}
            disabled
            helperText="Student email addresses cannot be modified to maintain result record integrity."
          />
        </div>
      </Modal>

      {/* Soft-Delete Confirmation Dialog */}
      <Modal
        isOpen={!!deleteConfirmStudent}
        onClose={() => setDeleteConfirmStudent(null)}
        title="Confirm Student Account Deletion"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteConfirmStudent(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteStudent}>
              Delete Student Account
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-danger-subtle)',
              color: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: '4px' }}>
              Are you sure you want to delete {deleteConfirmStudent?.fullName}?
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
              This account will be soft-deleted. The student will no longer be able to sign in or attempt tests. All past examination attempts, marks, and historical scorecards will remain completely preserved in the Results directory.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default StudentManagement;

