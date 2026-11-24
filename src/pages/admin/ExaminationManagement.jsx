import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getExaminations,
  createExamination,
  updateExamination,
  publishExamination,
  unpublishExamination,
  deleteExamination,
  validateForPublish,
} from '../../services/examService.js';
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
  BookOpen,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Calendar,
  Clock,
} from 'lucide-react';
import { formatDate, formatDateTime, formatDuration } from '../../utils/formatters.js';

export function ExaminationManagement() {
  const navigate = useNavigate();
  const { success, error, warning } = useToast();

  const [exams, setExams] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Computer Science',
    durationMinutes: 30,
    totalMarks: 50,
    passingPercentage: 50,
    startDateTime: new Date().toISOString().slice(0, 16),
    endDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    allowRetake: false,
  });
  const [formErrors, setFormErrors] = useState({});

  const [editExam, setEditExam] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editFormErrors, setEditFormErrors] = useState({});

  const [validationModal, setValidationModal] = useState(null);
  const [deleteConfirmExam, setDeleteConfirmExam] = useState(null);

  // Load examinations
  const refreshExams = () => {
    const list = getExaminations({ includeDeleted: false });
    setExams(list);
  };

  useEffect(() => {
    refreshExams();
  }, []);

  const filteredExams = exams.filter((e) => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = e.title && e.title.toLowerCase().includes(q);
      const matchCat = e.category && e.category.toLowerCase().includes(q);
      return matchTitle || matchCat;
    }
    return true;
  });

  // Handle Create Examination
  const handleCreateExam = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Title is required.';
    if (!formData.durationMinutes || formData.durationMinutes <= 0)
      errs.durationMinutes = 'Duration must be > 0.';
    if (!formData.totalMarks || formData.totalMarks <= 0)
      errs.totalMarks = 'Total marks must be > 0.';

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    const payload = {
      ...formData,
      startDateTime: new Date(formData.startDateTime).toISOString(),
      endDateTime: new Date(formData.endDateTime).toISOString(),
    };

    const res = createExamination(payload);
    if (res.success) {
      success('Examination drafted successfully. You can now add questions.');
      setCreateModalOpen(false);
      refreshExams();
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'Computer Science',
        durationMinutes: 30,
        totalMarks: 50,
        passingPercentage: 50,
        startDateTime: new Date().toISOString().slice(0, 16),
        endDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        allowRetake: false,
      });
    } else {
      error(res.error || 'Failed to create examination.');
    }
  };

  // Handle Edit Examination
  const handleOpenEdit = (exam) => {
    setEditExam(exam);
    setEditFormData({
      title: exam.title,
      description: exam.description || '',
      category: exam.category || 'General',
      durationMinutes: exam.durationMinutes,
      totalMarks: exam.totalMarks,
      passingPercentage: exam.passingPercentage,
      startDateTime: new Date(exam.startDateTime).toISOString().slice(0, 16),
      endDateTime: new Date(exam.endDateTime).toISOString().slice(0, 16),
      allowRetake: !!exam.allowRetake,
    });
    setEditFormErrors({});
  };

  const handleSaveEdit = () => {
    const errs = {};
    if (!editFormData.title.trim()) errs.title = 'Title is required.';
    if (!editFormData.durationMinutes || editFormData.durationMinutes <= 0)
      errs.durationMinutes = 'Duration must be > 0.';
    if (!editFormData.totalMarks || editFormData.totalMarks <= 0)
      errs.totalMarks = 'Total marks must be > 0.';

    if (Object.keys(errs).length > 0) {
      setEditFormErrors(errs);
      return;
    }

    const res = updateExamination(editExam.id, {
      ...editFormData,
      startDateTime: new Date(editFormData.startDateTime).toISOString(),
      endDateTime: new Date(editFormData.endDateTime).toISOString(),
    });

    if (res.success) {
      success('Examination updated successfully.');
      setEditExam(null);
      refreshExams();
    } else {
      error(res.error || 'Failed to update examination.');
    }
  };

  // Handle Publish with Pre-Publish Checklist
  const handlePublish = (examId) => {
    const check = validateForPublish(examId);
    if (!check.isValid) {
      setValidationModal({
        examTitle: exams.find((e) => e.id === examId)?.title || 'Examination',
        errors: check.errors,
        currentSum: check.currentSum,
        expectedMarks: check.expectedMarks,
        questionCount: check.questionCount,
        examId,
      });
      return;
    }

    const res = publishExamination(examId);
    if (res.success) {
      success('Examination published! It is now available to students within its scheduling window.');
      refreshExams();
    } else {
      error(res.errors?.join('; ') || 'Failed to publish examination.');
    }
  };

  // Handle Unpublish
  const handleUnpublish = (examId) => {
    const res = unpublishExamination(examId);
    if (res.success) {
      warning('Examination unpublished and reverted to Draft.');
      refreshExams();
    } else {
      error(res.error || 'Failed to unpublish.');
    }
  };

  // Handle Delete Exam
  const handleDeleteExam = () => {
    if (!deleteConfirmExam) return;
    const res = deleteExamination(deleteConfirmExam.id);
    if (res.success) {
      warning(`Examination "${deleteConfirmExam.title}" soft-deleted.`);
      setDeleteConfirmExam(null);
      refreshExams();
    } else {
      error(res.error || 'Failed to delete examination.');
    }
  };

  return (
    <div>
      {/* Module Header */}
      <div className="module-header">
        <div className="module-title-group">
          <div className="eyebrow" style={{ marginBottom: '0.375rem' }}>CURRICULUM ORCHESTRATION</div>
          <h1>Examinations Registry</h1>
          <p>Create, configure parameters, validate question points, and publish examinations.</p>
        </div>

        <Button
          variant="primary"
          size="md"
          iconLeft={<Plus size={16} />}
          onClick={() => {
            setFormErrors({});
            setCreateModalOpen(true);
          }}
        >
          Create Examination
        </Button>
      </div>

      {/* Filter and Search Bar Card */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
            <div className="search-input-wrapper" style={{ width: '100%', maxWidth: '360px' }}>
              <Input
                placeholder="Search by title or category..."
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
                <option value="all">All Tests</option>
                <option value="published">Published</option>
                <option value="draft">Drafts Only</option>
              </select>
            </div>
          </div>

          <Badge variant="neutral" size="md">
            {filteredExams.length} Examination{filteredExams.length === 1 ? '' : 's'}
          </Badge>
        </div>

        {/* Examinations Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title & Curriculum</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Total Marks</TableHead>
              <TableHead>Passing %</TableHead>
              <TableHead>Scheduling Window</TableHead>
              <TableHead>Status</TableHead>
              <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExams.length === 0 ? (
              <TableEmpty colSpan={7} message="No examinations match the specified criteria." />
            ) : (
              filteredExams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {exam.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '0.5rem', marginTop: '2px' }}>
                      <Badge variant="neutral" size="sm">{exam.category || 'General'}</Badge>
                      <span>•</span>
                      <span>{exam.questionCount || 0} questions</span>
                      <span>•</span>
                      <span>Retake: {exam.allowRetake ? 'Allowed' : 'Locked'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDuration(exam.durationMinutes)}</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>{exam.totalMarks} pts</TableCell>
                  <TableCell>{exam.passingPercentage}%</TableCell>
                  <TableCell>
                    <div style={{ fontSize: '0.75rem' }}>
                      <div>{formatDate(exam.startDateTime)}</div>
                      <div style={{ color: 'var(--color-text-muted)' }}>to {formatDate(exam.endDateTime)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={exam.status === 'published' ? 'success' : 'neutral'}
                      size="sm"
                      dot
                    >
                      {exam.status === 'published' ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      {/* Manage Questions Link */}
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/admin/questions?examId=${exam.id}`)}
                        title="Manage Questions in Question Bank"
                      >
                        <Layers size={15} color="var(--color-primary)" />
                      </button>

                      {/* Publish / Unpublish Toggle */}
                      {exam.status === 'published' ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleUnpublish(exam.id)}
                          title="Unpublish to Draft"
                        >
                          <DownloadCloud size={15} color="var(--color-warning)" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handlePublish(exam.id)}
                          title="Verify & Publish Examination"
                        >
                          <UploadCloud size={15} color="var(--color-success)" />
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleOpenEdit(exam)}
                        title="Edit examination"
                      >
                        <Edit2 size={15} />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setDeleteConfirmExam(exam)}
                        title="Soft delete examination"
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
      </Card>

      {/* Create Examination Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Examination"
        description="Configure examination details and scheduling window"
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateExam}>
              Draft Examination
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Examination Title"
            placeholder="e.g. Distributed Database Systems & CAP Theorem"
            value={formData.title}
            onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
            error={formErrors.title}
            required
          />

          <Input
            label="Description & Syllabus"
            as="textarea"
            placeholder="Outline covered topics, evaluation criteria, and reference reading..."
            value={formData.description}
            onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
          />

          <div className="grid grid-cols-2 md-grid-cols-1 gap-3">
            <Input
              label="Subject / Academic Category"
              value={formData.category}
              onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
            />

            <Input
              label="Duration (in Minutes)"
              type="number"
              value={formData.durationMinutes}
              onChange={(e) => setFormData((p) => ({ ...p, durationMinutes: e.target.value }))}
              error={formErrors.durationMinutes}
              required
            />
          </div>

          <div className="grid grid-cols-2 md-grid-cols-1 gap-3">
            <Input
              label="Total Marks"
              type="number"
              value={formData.totalMarks}
              onChange={(e) => setFormData((p) => ({ ...p, totalMarks: e.target.value }))}
              error={formErrors.totalMarks}
              helperText="Questions mark sum must strictly equal this before publishing."
              required
            />

            <Input
              label="Passing Percentage (%)"
              type="number"
              value={formData.passingPercentage}
              onChange={(e) => setFormData((p) => ({ ...p, passingPercentage: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 md-grid-cols-1 gap-3">
            <Input
              label="Opening Date & Time"
              type="datetime-local"
              value={formData.startDateTime}
              onChange={(e) => setFormData((p) => ({ ...p, startDateTime: e.target.value }))}
            />

            <Input
              label="Closing Date & Time"
              type="datetime-local"
              value={formData.endDateTime}
              onChange={(e) => setFormData((p) => ({ ...p, endDateTime: e.target.value }))}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            <input
              type="checkbox"
              checked={formData.allowRetake}
              onChange={(e) => setFormData((p) => ({ ...p, allowRetake: e.target.checked }))}
            />
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
              Permit Retakes (Allow students to submit multiple attempts for this test)
            </span>
          </label>
        </div>
      </Modal>

      {/* Edit Examination Modal */}
      <Modal
        isOpen={!!editExam}
        onClose={() => setEditExam(null)}
        title="Edit Examination Configuration"
        description="Update parameters, timing, or marks scheme"
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setEditExam(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveEdit}>
              Save Updates
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Examination Title"
            value={editFormData.title || ''}
            onChange={(e) => setEditFormData((p) => ({ ...p, title: e.target.value }))}
            error={editFormErrors.title}
            required
          />

          <Input
            label="Description & Syllabus"
            as="textarea"
            value={editFormData.description || ''}
            onChange={(e) => setEditFormData((p) => ({ ...p, description: e.target.value }))}
          />

          <div className="grid grid-cols-2 md-grid-cols-1 gap-3">
            <Input
              label="Subject / Academic Category"
              value={editFormData.category || ''}
              onChange={(e) => setEditFormData((p) => ({ ...p, category: e.target.value }))}
            />

            <Input
              label="Duration (in Minutes)"
              type="number"
              value={editFormData.durationMinutes || ''}
              onChange={(e) => setEditFormData((p) => ({ ...p, durationMinutes: e.target.value }))}
              error={editFormErrors.durationMinutes}
              required
            />
          </div>

          <div className="grid grid-cols-2 md-grid-cols-1 gap-3">
            <Input
              label="Total Marks"
              type="number"
              value={editFormData.totalMarks || ''}
              onChange={(e) => setEditFormData((p) => ({ ...p, totalMarks: e.target.value }))}
              error={editFormErrors.totalMarks}
              required
            />

            <Input
              label="Passing Percentage (%)"
              type="number"
              value={editFormData.passingPercentage || ''}
              onChange={(e) => setEditFormData((p) => ({ ...p, passingPercentage: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 md-grid-cols-1 gap-3">
            <Input
              label="Opening Date & Time"
              type="datetime-local"
              value={editFormData.startDateTime || ''}
              onChange={(e) => setEditFormData((p) => ({ ...p, startDateTime: e.target.value }))}
            />

            <Input
              label="Closing Date & Time"
              type="datetime-local"
              value={editFormData.endDateTime || ''}
              onChange={(e) => setEditFormData((p) => ({ ...p, endDateTime: e.target.value }))}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem' }}>
            <input
              type="checkbox"
              checked={!!editFormData.allowRetake}
              onChange={(e) => setEditFormData((p) => ({ ...p, allowRetake: e.target.checked }))}
            />
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
              Permit Retakes (Allow students to submit multiple attempts for this test)
            </span>
          </label>
        </div>
      </Modal>

      {/* Pre-Publish Validation Checklist Modal */}
      <Modal
        isOpen={!!validationModal}
        onClose={() => setValidationModal(null)}
        title="Pre-Publish Integrity Checklist Failed"
        description="Examinations must meet strict verification standards before release to students."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setValidationModal(null)}>
              Dismiss
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconLeft={<Layers size={14} />}
              onClick={() => {
                const targetId = validationModal.examId;
                setValidationModal(null);
                navigate(`/admin/questions?examId=${targetId}`);
              }}
            >
              Go to Question Bank
            </Button>
          </>
        }
      >
        {validationModal && (
          <div>
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-danger-subtle)',
                border: '1px solid #FECACA',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-danger-text)',
                fontSize: '0.8125rem',
                marginBottom: '1rem',
                lineHeight: '1.4',
              }}
            >
              <strong>Cannot Publish "{validationModal.examTitle}"</strong>
              <p style={{ marginTop: '4px' }}>
                The examination failed one or more academic integrity checks. Please correct the discrepancies below:
              </p>
            </div>

            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-danger)' }}>
              {validationModal.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>

            <div
              style={{
                marginTop: '1.25rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.75rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                textAlign: 'center',
              }}
            >
              <div>
                <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Questions</span>
                <strong>{validationModal.questionCount}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Sum of Points</span>
                <strong>{validationModal.currentSum} pts</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Expected Total</span>
                <strong>{validationModal.expectedMarks} pts</strong>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Exam Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmExam}
        onClose={() => setDeleteConfirmExam(null)}
        title="Confirm Examination Deletion"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteConfirmExam(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteExam}>
              Delete Examination
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
              Are you sure you want to delete "{deleteConfirmExam?.title}"?
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
              This test will be soft-deleted and removed from student test listings. All previously completed student test scorecards and answers will remain intact in Results Management.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ExaminationManagement;

