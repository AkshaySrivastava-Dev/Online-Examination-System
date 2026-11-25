import React, { useState, useEffect } from 'react';
import { getResults, getResultById } from '../../services/resultService.js';
import { getExaminations } from '../../services/examService.js';
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
  StatCard,
  PageTransition,
  FloatingBackgroundElements,
  StaggerContainer,
  StaggerItem,
} from '../../components/common';
import {
  Award,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  User,
  BookOpen,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Activity,
} from 'lucide-react';
import { formatDate, formatDateTime, formatDuration } from '../../utils/formatters.js';
import { buildReplayTimeline } from '../../services/examReplayService.js';
import { ExamReplayViewer } from '../../components/exam/ExamReplayViewer.jsx';

export function ResultsManagement() {
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [activeResult, setActiveResult] = useState(null);
  const [showReplayModal, setShowReplayModal] = useState(false);

  // Load data
  useEffect(() => {
    const examList = getExaminations({ includeDeleted: true });
    setExams(examList);
  }, []);

  const refreshResults = () => {
    const list = getResults({
      search,
      examId: selectedExamId,
      status: selectedStatus,
    });
    setResults(list);
  };

  useEffect(() => {
    refreshResults();
  }, [search, selectedExamId, selectedStatus]);

  const handleOpenDetail = (id) => {
    const res = getResultById(id);
    setActiveResult(res);
  };

  // Compute real analytics metrics from actual stored results
  const totalAttempts = results.length;
  const passedAttempts = results.filter((r) => r.isPassed).length;
  const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
  const avgScore =
    totalAttempts > 0
      ? Math.round(results.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0) / totalAttempts)
      : 0;
  const cleanIntegrityCount = results.filter((r) => !r.examFairAudit || r.examFairAudit.integrityScore >= 90).length;
  const avgIntegrity =
    totalAttempts > 0
      ? Math.round(
          results.reduce((sum, r) => sum + (r.examFairAudit?.integrityScore ?? 100), 0) / totalAttempts
        )
      : 100;

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
            <Award size={12} />
            EVALUATION LEDGER & ASSESSMENT AUDIT
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--color-text-primary)' }}>
            Results & Assessment Records
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '640px', fontSize: '0.875rem' }}>
            Inspect immutable examination submissions, candidate responses, ExamFair academic integrity audits, and itemized scorecards.
          </p>
        </div>
      </div>

      {/* KPI Summary Section with Real Data and Staggered Entrance */}
      <StaggerContainer
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <StaggerItem>
          <StatCard
            title="Total Attempts"
            value={totalAttempts}
            subtitle="Submitted candidate tests"
            icon={<BookOpen size={16} />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Institutional Pass Rate"
            value={`${passRate}%`}
            subtitle={`${passedAttempts} of ${totalAttempts} passed`}
            badge={
              <Badge variant={passRate >= 60 ? 'success' : 'warning'} size="xs" dot>
                {passRate >= 60 ? 'Healthy' : 'Developing'}
              </Badge>
            }
            icon={<Award size={16} />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Average Score"
            value={`${avgScore}%`}
            subtitle="Overall mean percentage"
            badge={
              <Badge variant="neutral" size="xs">
                Mean
              </Badge>
            }
            icon={<Activity size={16} />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="ExamFair™ Integrity"
            value={`${avgIntegrity}%`}
            subtitle={`${cleanIntegrityCount} sessions verified clean`}
            badge={
              <Badge variant="success" size="xs" dot>
                Audit Verified
              </Badge>
            }
            icon={<ShieldCheck size={16} />}
          />
        </StaggerItem>
      </StaggerContainer>

      {/* Filter and Search Bar Card */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '320px', flexWrap: 'wrap' }}>
            <div className="search-input-wrapper" style={{ width: '100%', maxWidth: '280px' }}>
              <Input
                placeholder="Search by student, ID, or test title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                iconLeft={<Search size={15} />}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Exam:</span>
              <select
                className="form-input"
                style={{ width: '200px', height: '38px', padding: '0 0.5rem' }}
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
              >
                <option value="">All Examinations</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Result:</span>
              <select
                className="form-input"
                style={{ width: '110px', height: '38px', padding: '0 0.5rem' }}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <Badge variant="neutral" size="md">
            {results.length} Attempt{results.length === 1 ? '' : 's'} Logged
          </Badge>
        </div>

        {/* Results Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name & ID</TableHead>
              <TableHead>Examination Title</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Percentage</TableHead>
              <TableHead>ExamFair™</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Submitted On</TableHead>
              <TableHead style={{ textAlign: 'right' }}>Inspection</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length === 0 ? (
              <TableEmpty colSpan={8} message="No student examination attempts match the specified query." />
            ) : (
              results.map((res) => (
                <TableRow key={res.id}>
                  <TableCell>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {res.studentSnapshot?.fullName || 'Student'}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                      ID: <code>{res.studentSnapshot?.studentId || 'N/A'}</code> • {res.studentSnapshot?.email}
                    </div>
                  </TableCell>
                  <TableCell style={{ maxWidth: '240px' }}>
                    <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {res.examSnapshot?.title || res.examTitle || 'Examination'}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                      {res.submissionType === 'auto-timer' ? '⏱ Auto-submitted (Time expired)' : '✓ Manual submission'}
                    </div>
                  </TableCell>
                  <TableCell style={{ fontWeight: 600 }}>
                    {res.marksObtained} / {res.totalMarks} pts
                  </TableCell>
                  <TableCell style={{ fontWeight: 600 }}>
                    {res.percentage}%
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={res.examFairAudit?.status === 'HIGH_RISK_REVIEW' ? 'danger' : res.examFairAudit?.status === 'ADVISORY_FLAGGED' ? 'warning' : 'success'}
                      size="sm"
                      dot
                    >
                      {res.examFairAudit?.integrityScore !== undefined ? `${res.examFairAudit.integrityScore}%` : '100% Clean'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={res.isPassed ? 'success' : 'danger'}
                      size="sm"
                      dot
                    >
                      {res.isPassed ? 'Passed' : 'Failed'}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {formatDateTime(res.submittedAt)}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenDetail(res.id)}
                      iconLeft={<Eye size={14} />}
                    >
                      Inspect
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Result Detail Inspection Modal */}
      <Modal
        isOpen={!!activeResult}
        onClose={() => setActiveResult(null)}
        title="Official Examination Evaluation Report"
        description="Immutable snapshot captured at submission time"
        size="lg"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setActiveResult(null)}>
            Close Report
          </Button>
        }
      >
        {activeResult && (
          <div>
            {/* Header Score Card */}
            <div
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: activeResult.isPassed ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${activeResult.isPassed ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                  <Badge variant={activeResult.isPassed ? 'success' : 'danger'} size="md" dot>
                    {activeResult.isPassed ? 'PASSED' : 'FAILED'}
                  </Badge>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    Passing Threshold: {activeResult.examSnapshot?.passingPercentage || 40}%
                  </span>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: activeResult.isPassed ? '#166534' : '#991B1B' }}>
                  {activeResult.marksObtained} / {activeResult.totalMarks} Points ({activeResult.percentage}%)
                </h2>
              </div>

              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                <div>Submitted: <strong>{formatDateTime(activeResult.submittedAt)}</strong></div>
                <div>Duration Taken: <strong>{formatDuration(Math.round(activeResult.durationTakenSeconds / 60))}</strong></div>
              </div>
            </div>

            {/* Snapshot Metadata Box */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
                padding: '1rem',
                backgroundColor: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Candidate</span>
                <strong>{activeResult.studentSnapshot?.fullName}</strong> (ID: {activeResult.studentSnapshot?.studentId})
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{activeResult.studentSnapshot?.email}</div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Examination</span>
                <strong>{activeResult.examSnapshot?.title}</strong>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Category: {activeResult.examSnapshot?.category}</div>
              </div>
            </div>

            {/* ExamFair Integrity & Adaptive Trajectory Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: activeResult.adaptiveReport ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  padding: '0.875rem 1rem',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={18} color="var(--color-success)" />
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      ExamFair™ Integrity: {activeResult.examFairAudit?.integrityScore !== undefined ? `${activeResult.examFairAudit.integrityScore}%` : '100%'}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                      Tab Switches: {activeResult.examFairAudit?.tabSwitches || 0} • Status: {activeResult.examFairAudit?.status || 'CLEAN_VERIFIED'}
                    </div>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft={<Sparkles size={14} />}
                  onClick={() => setShowReplayModal(true)}
                >
                  ExamReplay™
                </Button>
              </div>

              {activeResult.adaptiveReport && (
                <div
                  style={{
                    padding: '0.875rem 1rem',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Activity size={16} color="var(--color-primary)" />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Adaptive Proficiency: {activeResult.adaptiveReport.proficiencyTier}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                    Theta ($\theta$): {activeResult.adaptiveReport.theta > 0 ? `+${activeResult.adaptiveReport.theta}` : activeResult.adaptiveReport.theta} • Scaled Score: {activeResult.adaptiveReport.scaledScore}%
                  </div>
                </div>
              )}
            </div>

            {/* Answer Breakdown Sheet */}
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              Question & Answer Breakdown Sheet ({activeResult.answersBreakdown?.length || 0} items)
            </h3>

            {(!activeResult.answersBreakdown || activeResult.answersBreakdown.length === 0) ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                Itemized question breakdown was omitted or archived for this attempt snapshot.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeResult.answersBreakdown.map((item, index) => {
                  const hasAnswered = !!item.studentAnswer;
                  const isCorrect = item.isCorrect;

                  return (
                    <div
                      key={item.questionId || index}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${isCorrect ? '#BBF7D0' : '#FECACA'}`,
                        backgroundColor: isCorrect ? '#F0FDF4' : '#FEF2F2',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                          Question #{index + 1}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            Awarded: {item.marksAwarded} / {item.maxMarks} pts
                          </span>
                          <Badge variant={isCorrect ? 'success' : 'danger'} size="sm">
                            {isCorrect ? 'Correct' : hasAnswered ? 'Incorrect' : 'Unanswered'}
                          </Badge>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                        {item.questionText}
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.8125rem' }}>
                        {item.options?.map((opt) => {
                          const wasChosen = item.studentAnswer === opt.id;
                          const wasCorrect = item.correctAnswer === opt.id;

                          let borderColor = 'var(--color-border)';
                          let bgColor = 'var(--color-surface)';
                          if (wasCorrect) {
                            borderColor = 'var(--color-success)';
                            bgColor = '#DCFCE7';
                          } else if (wasChosen && !wasCorrect) {
                            borderColor = 'var(--color-danger)';
                            bgColor = '#FEE2E2';
                          }

                          return (
                            <div
                              key={opt.id}
                              style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: 'var(--radius-sm)',
                                border: `1px solid ${borderColor}`,
                                backgroundColor: bgColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <span>
                                <strong>{opt.id}:</strong> {opt.text}
                              </span>
                              {wasChosen && wasCorrect && (
                                <Badge variant="success" size="sm">Chosen (Correct)</Badge>
                              )}
                              {wasChosen && !wasCorrect && (
                                <Badge variant="danger" size="sm">Chosen</Badge>
                              )}
                              {!wasChosen && wasCorrect && (
                                <Badge variant="success" size="sm">Correct Key</Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {item.explanation && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 'var(--radius-sm)' }}>
                          💡 <strong>Explanation:</strong> {item.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ExamReplay Modal */}
      {activeResult && (
        <Modal
          isOpen={showReplayModal}
          onClose={() => setShowReplayModal(false)}
          title="ExamReplay™ Candidate Session Audit"
          description={`Replay decision timeline for ${activeResult.studentSnapshot?.fullName} on ${activeResult.examSnapshot?.title}`}
          size="lg"
          footer={
            <Button variant="secondary" size="sm" onClick={() => setShowReplayModal(false)}>
              Close Replay
            </Button>
          }
        >
          <ExamReplayViewer
            timeline={buildReplayTimeline(activeResult)}
            totalDuration={activeResult.durationTakenSeconds || 0}
            examTitle={activeResult.examSnapshot?.title || activeResult.examTitle}
          />
        </Modal>
      )}
    </PageTransition>
  );
}

export default ResultsManagement;

