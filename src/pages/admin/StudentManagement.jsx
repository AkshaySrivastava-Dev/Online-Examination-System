import React, { useState, useEffect, useMemo } from 'react';
import {
  getStudents,
  getStudentById,
  updateStudent,
  setStudentStatus,
  deleteStudent,
} from '../../services/studentService.js';
import { getResults } from '../../services/resultService.js';
import { computeExamDna } from '../../services/examDnaService.js';
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
  PageTransition,
  FloatingBackgroundElements,
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
  Brain,
  Target,
  Compass,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  Zap,
  Info,
  HelpCircle,
  FileText,
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
  const [studentDna, setStudentDna] = useState(null);
  const [studentAttempts, setStudentAttempts] = useState([]);
  const [activeIntelligenceTab, setActiveIntelligenceTab] = useState('overview');

  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '' });
  const [editErrors, setEditErrors] = useState({});

  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState(null);

  const allResults = useMemo(() => getResults(), [students]);
  const studentResultsMap = useMemo(() => {
    const map = new Map();
    for (const r of allResults) {
      const sId = r.studentSnapshot?.id;
      if (sId) {
        if (!map.has(sId)) map.set(sId, []);
        map.get(sId).push(r);
      }
    }
    return map;
  }, [allResults]);

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
    setActiveIntelligenceTab('overview');
    const results = getResults({ studentId: student.id });
    setStudentAttempts(results);

    const attemptsCount = results.length;
    const avgScore =
      attemptsCount > 0
        ? (
            results.reduce((acc, c) => acc + (Number(c.percentage) || 0), 0) /
            attemptsCount
          ).toFixed(1)
        : '0.0';
    const passedCount = results.filter((r) => r.isPassed).length;
    const passRate = attemptsCount > 0 ? Math.round((passedCount / attemptsCount) * 100) : 0;

    setStudentStats({
      attemptsCount,
      avgScore,
      passedCount,
      passRate,
    });
    setStudentDna(computeExamDna({ studentId: student.id }));
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
      error(res.error || 'Failed to update account status.');
    }
  };

  // Soft Delete
  const handleDeleteStudent = () => {
    if (!deleteConfirmStudent) return;
    const res = deleteStudent(deleteConfirmStudent.id);
    if (res.success) {
      warning(`Account for ${deleteConfirmStudent.fullName} soft-deleted.`);
      setDeleteConfirmStudent(null);
      refreshStudents();
    } else {
      error(res.error || 'Failed to delete student.');
    }
  };

  const li = studentDna?.learningIntelligence || {
    weakAreas: [],
    strongAreas: [],
    revisionMatrix: [],
    priorityScores: [],
    studyPlan: { days: [] },
    answersFourQuestions: {},
  };

  const topicMastery = studentDna?.topicMastery || [];
  const weakTopics = topicMastery.filter((t) => t.hasSufficientSample && t.status === 'weak');
  const developingTopics = topicMastery.filter((t) => t.hasSufficientSample && t.status === 'developing');
  const strongTopics = topicMastery.filter((t) => t.hasSufficientSample && t.status === 'strong');
  const insufficientDataTopics = topicMastery.filter((t) => !t.hasSufficientSample);

  return (
    <PageTransition>
      {/* Module Header with Linear aesthetic and subtle floating accents */}
      <div
        className="module-header"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '1.5rem var(--space-6)',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          marginBottom: '1.5rem',
        }}
      >
        <FloatingBackgroundElements count={3} opacity={0.35} />
        <div className="module-title-group" style={{ position: 'relative', zIndex: 1 }}>
          <div className="eyebrow" style={{ marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Users size={12} />
            ACADEMIC REGISTRY & COHORT INTELLIGENCE
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--color-text-primary)' }}>
            Student Directory
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '640px', fontSize: '0.875rem' }}>
            Inspect academic records, review ExamDNA diagnostic learning intelligence, and manage student credentials across 24 enrolled candidates.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            padding: '1rem var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
            <div className="search-input-wrapper" style={{ flex: 1, maxWidth: '340px' }}>
              <Input
                placeholder="Search by name, email, or student ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                iconLeft={<Search size={15} />}
              />
            </div>

            <select
              className="form-input"
              style={{ width: '160px', height: '38px', padding: '0 0.5rem', fontWeight: 500 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Accounts ({students.length})</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>

          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            Showing <strong>{students.length}</strong> registered students
          </div>
        </div>

        {/* Students Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: '130px' }}>Student ID</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead style={{ width: '120px' }}>Account Status</TableHead>
              <TableHead style={{ width: '120px' }}>Enrolled On</TableHead>
              <TableHead style={{ textAlign: 'right', width: '140px' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedStudents.length === 0 ? (
              <TableEmpty
                colSpan={6}
                message={
                  search || statusFilter !== 'all'
                    ? 'No students match your filter criteria.'
                    : 'No student accounts found in the database.'
                }
              />
            ) : (
              paginatedStudents.map((s) => {
                const attempts = studentResultsMap.get(s.id) || [];
                const attemptsCount = attempts.length;
                const avgScore =
                  attemptsCount > 0
                    ? Math.round(attempts.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0) / attemptsCount)
                    : null;

                return (
                  <TableRow key={s.id} style={{ transition: 'background-color var(--transition-fast)' }}>
                    <TableCell
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        color: 'var(--color-primary)',
                        fontSize: '0.8125rem',
                      }}
                    >
                      {s.studentId || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--color-surface-subtle)',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            color: 'var(--color-text-primary)',
                            flexShrink: 0,
                          }}
                        >
                          {s.fullName?.charAt(0) || 'S'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                            {s.fullName}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                            {s.department && (
                              <span
                                style={{
                                  fontSize: '0.6875rem',
                                  color: 'var(--color-text-muted)',
                                  backgroundColor: 'var(--color-surface-subtle)',
                                  padding: '0.0625rem 0.375rem',
                                  borderRadius: 'var(--radius-xs)',
                                  border: '1px solid var(--color-border-subtle)',
                                }}
                              >
                                {s.department}
                              </span>
                            )}
                            {attemptsCount > 0 ? (
                              <span
                                style={{
                                  fontSize: '0.6875rem',
                                  color: avgScore >= 70 ? 'var(--color-success)' : 'var(--color-primary)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  fontWeight: 500,
                                }}
                              >
                                <Sparkles size={10} />
                                {avgScore}% ({attemptsCount} test{attemptsCount > 1 ? 's' : ''})
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                                No attempts
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                      {s.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.status === 'active' ? 'success' : 'danger'} size="sm" dot>
                        {s.status === 'active' ? 'Active' : 'Suspended'}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                      {formatDate(s.createdAt)}
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleOpenView(s)}
                          title="Inspect student record & ExamDNA"
                          aria-label="View Student"
                          style={{ padding: '0.375rem' }}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleOpenEdit(s)}
                          title="Edit student profile"
                          aria-label="Edit Student"
                          style={{ padding: '0.375rem' }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleToggleStatus(s)}
                          title={s.status === 'active' ? 'Suspend account' : 'Reactivate account'}
                          aria-label="Toggle Status"
                          style={{ padding: '0.375rem' }}
                        >
                          {s.status === 'active' ? <UserX size={15} /> : <UserCheck size={15} />}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setDeleteConfirmStudent(s)}
                          title="Delete student"
                          aria-label="Delete Student"
                          style={{ color: 'var(--color-danger)', padding: '0.375rem' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '0.875rem var(--space-6)',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8125rem',
            }}
          >
            <span style={{ color: 'var(--color-text-secondary)' }}>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                iconLeft={<ChevronLeft size={14} />}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                iconRight={<ChevronRight size={14} />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ========================================================= */}
      {/* MODAL 1: VIEW STUDENT PROFILE & ADMIN INTELLIGENCE        */}
      {/* ========================================================= */}
      <Modal
        isOpen={!!viewStudent}
        onClose={() => setViewStudent(null)}
        title="Student Profile & Academic Record"
        description="Granular performance audit, diagnostic topic mastery, and learning trajectory."
        size="lg"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setViewStudent(null)}>
            Close
          </Button>
        }
      >
        {viewStudent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Student Header Strip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.875rem 1rem',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(255, 161, 22, 0.15)',
                  color: '#FFA116',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.125rem',
                }}
              >
                {viewStudent.fullName.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0 }}>{viewStudent.fullName}</h3>
                  <Badge variant={viewStudent.status === 'active' ? 'success' : 'danger'} size="sm" dot>
                    {viewStudent.status === 'active' ? 'Active' : 'Suspended'}
                  </Badge>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Student ID: <code style={{ color: 'var(--color-primary)' }}>{viewStudent.studentId || 'N/A'}</code> · {viewStudent.email}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '0.375rem',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: '2px',
                overflowX: 'auto',
              }}
            >
              {[
                { id: 'overview', label: 'Academic Overview', icon: <FileText size={14} /> },
                { id: 'topics', label: 'Topic Intelligence', icon: <Target size={14} /> },
                { id: 'recommendations', label: 'Recommendations & Priority', icon: <TrendingUp size={14} /> },
                { id: 'confidence_timing', label: 'Confidence & Time', icon: <Compass size={14} /> },
                { id: 'study_plan', label: '7-Day Study Plan', icon: <Calendar size={14} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveIntelligenceTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem 0.875rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: activeIntelligenceTab === tab.id ? 'var(--color-surface)' : 'transparent',
                    color: activeIntelligenceTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontWeight: activeIntelligenceTab === tab.id ? 700 : 500,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    borderBottom: activeIntelligenceTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* TAB 1: ACADEMIC OVERVIEW */}
            {activeIntelligenceTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* 4-KPI Overview Strip */}
                {studentStats && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '0.75rem',
                      padding: '1rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-surface-subtle)',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                        {studentStats.attemptsCount}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                        Tests Attempted
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)' }}>
                        {studentStats.avgScore}%
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                        Average Score
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                        {studentStats.passedCount}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                        Tests Passed
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                        {studentStats.passRate}%
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                        Pass Rate
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Takeaway Alert */}
                {li.answersFourQuestions?.whatShouldIStudyFirst && (
                  <div
                    style={{
                      padding: '0.875rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(255, 161, 22, 0.08)',
                      border: '1px solid rgba(255, 161, 22, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                    }}
                  >
                    <Zap size={18} style={{ color: '#FFA116', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', lineHeight: 1.45 }}>
                      <strong style={{ color: '#FFA116' }}>Top Study Priority:</strong>{' '}
                      {li.answersFourQuestions.whatShouldIStudyFirst}
                    </div>
                  </div>
                )}

                {/* Recent Examination Performance Table */}
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                    Recent Examination Attempts ({studentAttempts.length})
                  </div>
                  {studentAttempts.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8125rem', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                      No examination records completed yet.
                    </div>
                  ) : (
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                        <thead style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                          <tr>
                            <th style={{ padding: '0.625rem 0.75rem', textAlign: 'left', fontWeight: 600 }}>Examination Title</th>
                            <th style={{ padding: '0.625rem 0.75rem', textAlign: 'left', fontWeight: 600 }}>Submitted Date</th>
                            <th style={{ padding: '0.625rem 0.75rem', textAlign: 'center', fontWeight: 600 }}>Score</th>
                            <th style={{ padding: '0.625rem 0.75rem', textAlign: 'center', fontWeight: 600 }}>Outcome</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentAttempts.map((att) => (
                            <tr key={att.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>
                                {att.examTitle || att.examSnapshot?.title || 'Examination'}
                              </td>
                              <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-secondary)' }}>
                                {formatDate(att.submittedAt)}
                              </td>
                              <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                                {att.marksObtained}/{att.totalMarks} ({att.percentage}%)
                              </td>
                              <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}>
                                <Badge variant={att.isPassed ? 'success' : 'danger'} size="sm">
                                  {att.isPassed ? 'PASSED' : 'FAILED'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: TOPIC INTELLIGENCE */}
            {activeIntelligenceTab === 'topics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* 4 Diagnostic Groups */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  {/* Weak Topics */}
                  <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(239, 71, 67, 0.06)', border: '1px solid rgba(239, 71, 67, 0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase' }}>
                        Critical Weakness (&lt;60%)
                      </span>
                      <Badge variant="danger" size="sm">{weakTopics.length}</Badge>
                    </div>
                    {weakTopics.length === 0 ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>No critical weaknesses detected.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {weakTopics.map((t) => (
                          <div key={t.topic} style={{ fontSize: '0.75rem' }}>
                            <strong>{t.topic}:</strong> {t.accuracy}% ({t.correct}/{t.totalQuestions})
                            {t.isPreliminary && <span style={{ color: 'var(--color-text-muted)' }}> • prelim</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Developing Topics */}
                  <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255, 192, 30, 0.06)', border: '1px solid rgba(255, 192, 30, 0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-warning)', textTransform: 'uppercase' }}>
                        Developing (60–79%)
                      </span>
                      <Badge variant="warning" size="sm">{developingTopics.length}</Badge>
                    </div>
                    {developingTopics.length === 0 ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>No developing topics.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {developingTopics.map((t) => (
                          <div key={t.topic} style={{ fontSize: '0.75rem' }}>
                            <strong>{t.topic}:</strong> {t.accuracy}% ({t.correct}/{t.totalQuestions})
                            {t.isPreliminary && <span style={{ color: 'var(--color-text-muted)' }}> • prelim</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Strong Topics */}
                  <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(44, 187, 93, 0.06)', border: '1px solid rgba(44, 187, 93, 0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase' }}>
                        Strong Mastery (&ge;80%)
                      </span>
                      <Badge variant="success" size="sm">{strongTopics.length}</Badge>
                    </div>
                    {strongTopics.length === 0 ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>No confirmed strong topics.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {strongTopics.map((t) => (
                          <div key={t.topic} style={{ fontSize: '0.75rem' }}>
                            <strong>{t.topic}:</strong> {t.accuracy}% ({t.correct}/{t.totalQuestions})
                            {t.isPreliminary && <span style={{ color: 'var(--color-text-muted)' }}> • prelim</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Insufficient Data Topics */}
                  <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                        Insufficient Data (&lt;3 items)
                      </span>
                      <Badge variant="neutral" size="sm">{insufficientDataTopics.length}</Badge>
                    </div>
                    {insufficientDataTopics.length === 0 ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>All tested topics have sufficient data.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {insufficientDataTopics.map((t) => (
                          <div key={t.topic} style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            <strong>{t.topic}:</strong> {t.totalQuestions} question(s) tested (min 3 required)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Granular Topic Accuracy Table */}
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                    Granular Topic Accuracy Breakdown ({topicMastery.length})
                  </div>
                  <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                          <th style={{ padding: '0.625rem 0.75rem', textAlign: 'left', fontWeight: 600 }}>Topic Domain</th>
                          <th style={{ padding: '0.625rem 0.75rem', textAlign: 'center', fontWeight: 600 }}>Sample Size</th>
                          <th style={{ padding: '0.625rem 0.75rem', textAlign: 'left', fontWeight: 600, width: '160px' }}>Accuracy Bar</th>
                          <th style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>Accuracy</th>
                          <th style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topicMastery.map((tm) => (
                          <tr key={tm.topic} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>{tm.topic}</td>
                            <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                              {tm.correct}/{tm.totalQuestions} ({tm.isPreliminary ? 'Preliminary' : 'Robust'})
                            </td>
                            <td style={{ padding: '0.625rem 0.75rem' }}>
                              <div style={{ height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${tm.accuracy}%`,
                                    backgroundColor:
                                      tm.status === 'strong'
                                        ? 'var(--color-success)'
                                        : tm.status === 'developing'
                                        ? 'var(--color-warning)'
                                        : 'var(--color-danger)',
                                    borderRadius: '3px',
                                  }}
                                />
                              </div>
                            </td>
                            <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                              {tm.accuracy}%
                            </td>
                            <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right' }}>
                              <Badge
                                variant={tm.status === 'strong' ? 'success' : tm.status === 'developing' ? 'warning' : 'danger'}
                                size="sm"
                              >
                                {tm.status === 'strong' ? 'Strong' : tm.status === 'developing' ? 'Developing' : 'Weak'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: RECOMMENDATIONS & PRIORITY */}
            {activeIntelligenceTab === 'recommendations' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Learning Priority Rankings (Score 0-100) */}
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                    Personalized Learning Priority Rankings (Score 0–100)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {li.priorityScores.map((p) => (
                      <div
                        key={p.topic}
                        style={{
                          padding: '0.75rem 1rem',
                          backgroundColor: 'var(--color-surface-subtle)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            #{p.rank} {p.topic}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.9375rem' }}>
                              {p.priorityScore}/100
                            </span>
                            <Badge
                              variant={p.priorityTier === 'Urgent' ? 'danger' : p.priorityTier === 'High' ? 'warning' : 'primary'}
                              size="sm"
                            >
                              {p.priorityTier}
                            </Badge>
                          </div>
                        </div>

                        {/* Breakdown Explanation */}
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                          <strong>Explanation:</strong> Deficit: {p.components.accuracyDeficit}/35 · Recurrence: {p.components.errorRecurrence}/25 · Confidence: {p.components.confidenceMisalignment}/15 · Difficulty: {p.components.difficultyPerformance}/15 · Trend: {p.components.trendVolatility}/10
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revision vs. Relearning Matrix */}
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                    Revision vs. Relearning Categorization
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {li.revisionMatrix.map((r) => (
                      <div
                        key={r.topic}
                        style={{
                          padding: '0.75rem 1rem',
                          backgroundColor: 'var(--color-surface-subtle)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {r.topic}
                          </span>
                          <Badge
                            variant={
                              r.category === 'Concept Relearning'
                                ? 'danger'
                                : r.category === 'Targeted Revision'
                                ? 'warning'
                                : r.category === 'Practice Needed'
                                ? 'primary'
                                : 'success'
                            }
                            size="sm"
                          >
                            {r.category}
                          </Badge>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                          {r.actionableGuidance}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: CONFIDENCE & TIME INTELLIGENCE */}
            {activeIntelligenceTab === 'confidence_timing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Confidence Quadrant Cards */}
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                    Confidence Alignment Calibration Quadrant
                  </div>
                  {studentDna?.confidenceAlignment?.available ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                      <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(44, 187, 93, 0.08)', border: '1px solid rgba(44, 187, 93, 0.25)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase' }}>True Mastery</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>{studentDna.confidenceAlignment.matrix.highCorrect}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>High confidence & correct.</div>
                      </div>

                      <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 71, 67, 0.08)', border: '1px solid rgba(239, 71, 67, 0.25)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase' }}>Review Priority</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>{studentDna.confidenceAlignment.matrix.highIncorrect}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>High confidence & incorrect (Misconceptions).</div>
                      </div>

                      <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(255, 192, 30, 0.08)', border: '1px solid rgba(255, 192, 30, 0.25)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-warning)', textTransform: 'uppercase' }}>Potential Guess</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>{studentDna.confidenceAlignment.matrix.lowCorrect}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>Low confidence & correct.</div>
                      </div>

                      <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Known Unknown</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>{studentDna.confidenceAlignment.matrix.lowIncorrect}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>Low confidence & incorrect.</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8125rem', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                      No confidence telemetry recorded for this student's attempts.
                    </div>
                  )}
                </div>

                {/* Time Intelligence */}
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                    Cognitive Pacing & Time Intelligence
                  </div>
                  {studentDna?.timeIntelligence?.available ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                      <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Average Question Time</div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{studentDna.timeIntelligence.avgTimePerQuestionSec}s</div>
                      </div>
                      <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Rapid Answers (&lt;15s)</div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-warning)' }}>{studentDna.timeIntelligence.rapidResponsesCount}</div>
                      </div>
                      <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Deliberate Answers (&gt;120s)</div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-primary)' }}>{studentDna.timeIntelligence.deliberateResponsesCount}</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8125rem', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                      No per-question timing logs recorded for historical attempts.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: 7-DAY STUDY PLAN */}
            {activeIntelligenceTab === 'study_plan' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {li.studyPlan?.days ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>7-Day Study Trajectory Status</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                          {li.studyPlan.completedDays?.length || 0} tasks completed · {7 - (li.studyPlan.completedDays?.length || 0)} tasks pending
                        </div>
                      </div>
                      <Badge variant={li.studyPlan.progressPercentage === 100 ? 'success' : 'primary'} size="md">
                        {li.studyPlan.progressPercentage || 0}% Complete
                      </Badge>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '380px', overflowY: 'auto' }}>
                      {li.studyPlan.days.map((d) => (
                        <div
                          key={d.day}
                          style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: d.isCompleted ? 'rgba(44, 187, 93, 0.06)' : 'var(--color-surface)',
                            border: `1px solid ${d.isCompleted ? 'rgba(44, 187, 93, 0.3)' : 'var(--color-border)'}`,
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: d.isCompleted ? 'var(--color-success)' : 'var(--color-primary)' }}>
                                Day {d.day}
                              </span>
                              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                {d.title}
                              </span>
                              <Badge variant="outline" size="sm">{d.focusTopic}</Badge>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                              {d.activity}
                            </div>
                          </div>
                          <Badge variant={d.isCompleted ? 'success' : 'neutral'} size="sm">
                            {d.isCompleted ? '✓ Completed' : 'Pending'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                    Complete an examination to generate a 7-day study plan.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: EDIT STUDENT INFORMATION                         */}
      {/* ========================================================= */}
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

      {/* ========================================================= */}
      {/* MODAL 3: SOFT-DELETE CONFIRMATION DIALOG                  */}
      {/* ========================================================= */}
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
    </PageTransition>
  );
}

export default StudentManagement;
