import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { getResults } from '../../services/resultService.js';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
  LoadingSpinner,
  Modal,
  PageTransition,
  AnimatedCounter,
  StaggerContainer,
  StaggerItem,
} from '../../components/common';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowLeft,
  Printer,
  ShieldCheck,
  AlertCircle,
  FileText,
  User,
  Brain,
  Sparkles,
  Shield,
  Activity,
} from 'lucide-react';
import { formatDateTime, formatDuration } from '../../utils/formatters.js';
import { buildReplayTimeline } from '../../services/examReplayService.js';
import { ExamReplayViewer } from '../../components/exam/ExamReplayViewer.jsx';

const getOptionText = (options, optKey) => {
  if (!options) return '';
  if (Array.isArray(options)) {
    const found = options.find((o) => o.id === optKey);
    return found ? (found.text || '') : '';
  }
  return options[optKey] || '';
};

export function StudentResultDetail() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReplayModal, setShowReplayModal] = useState(false);

  useEffect(() => {
    if (!currentUser || !resultId) return;

    try {
      const allResults = getResults();
      const found = allResults.find((r) => r.id === resultId);

      if (!found) {
        setError('Scorecard record not found.');
        setLoading(false);
        return;
      }

      // Security check: ensure student can only view their own results (unless admin)
      if (currentUser.role === 'student' && found.studentSnapshot?.id !== currentUser.id) {
        setError('You are not authorized to view this candidate scorecard.');
        setLoading(false);
        return;
      }

      setResult(found);
    } catch (err) {
      console.error('Error fetching result detail:', err);
      setError('An error occurred while loading result details.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, resultId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
        <LoadingSpinner message="Retrieving institutional scorecard..." />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div style={{ maxWidth: '560px', margin: '3rem auto' }}>
        <Card>
          <CardHeader>
            <CardTitle style={{ color: 'var(--color-danger)' }}>Record Unavailable</CardTitle>
            <CardDescription>{error || 'Requested scorecard could not be retrieved.'}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link to="/student/results" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" iconLeft={<ArrowLeft size={14} />}>
                Back to My Results
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const {
    examTitle,
    examSnapshot,
    studentSnapshot,
    marksObtained,
    totalMarks,
    percentage,
    isPassed,
    submittedAt,
    durationTakenSeconds,
    submissionType,
    correctCount,
    incorrectCount,
    unansweredCount,
    totalQuestions,
    answersBreakdown = [],
  } = result;

  const durationMins = Math.round((durationTakenSeconds || 0) / 60);

  return (
    <PageTransition style={{ maxWidth: '920px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Navigation and Print Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <Link
          to="/student/results"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft size={14} />
          <span>Back to My Results</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Sparkles size={14} />}
            onClick={() => setShowReplayModal(true)}
            style={{ borderColor: 'rgba(255, 161, 22, 0.4)' }}
          >
            Launch ExamReplay™
          </Button>
          <Link to={`/student/exam-dna?resultId=${result.id}`} style={{ textDecoration: 'none' }}>
            <Button
              variant="primary"
              size="sm"
              iconLeft={<Brain size={14} />}
            >
              View ExamDNA™ Analytics
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Printer size={14} />}
            onClick={() => window.print()}
          >
            Print Scorecard
          </Button>
        </div>
      </div>

      {/* Main Score Hero Card */}
      <Card style={{ marginBottom: '1.75rem', overflow: 'hidden' }}>
        <div
          style={{
            height: '6px',
            backgroundColor: isPassed ? 'var(--color-success)' : 'var(--color-danger)',
          }}
        />

        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                <Badge variant="neutral" size="sm">{examSnapshot?.category || 'General'}</Badge>
                <Badge variant={isPassed ? 'success' : 'danger'} size="md" dot>
                  {isPassed ? 'Passed' : 'Failed'}
                </Badge>
              </div>
              <CardTitle style={{ fontSize: '1.5rem' }}>{examTitle || examSnapshot?.title}</CardTitle>
              <CardDescription>
                Candidate: <strong>{studentSnapshot?.fullName}</strong> ({studentSnapshot?.studentId}) • Submitted on {formatDateTime(submittedAt)}
              </CardDescription>
            </div>

            {/* Big Percentage Badge */}
            <div
              style={{
                textAlign: 'right',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
              }}
            >
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  color: isPassed ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                  lineHeight: 1,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <AnimatedCounter value={`${percentage}%`} />
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                Score: <strong><AnimatedCounter value={marksObtained} /></strong> / {totalMarks} pts
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Key Metrics Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.75rem',
              padding: '1rem',
              backgroundColor: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Correct Answers</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-success-text)', marginTop: '0.125rem' }}>
                {correctCount} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>/ {totalQuestions}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Incorrect Answers</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-danger-text)', marginTop: '0.125rem' }}>
                {incorrectCount}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Unanswered</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
                {unansweredCount}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Time Taken</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '0.125rem' }}>
                {durationMins > 0 ? `${durationMins} min` : `${durationTakenSeconds}s`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            <span>Passing threshold: <strong>{examSnapshot?.passingPercentage || 40}%</strong></span>
            <span>Submission mode: <strong style={{ textTransform: 'capitalize' }}>{submissionType === 'auto-timer' ? 'Automatic (Timer Expired)' : 'Manual Candidate Submission'}</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* ExamFair & Adaptive Assessment Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: result.adaptiveReport ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr', gap: '1rem', marginBottom: '1.75rem' }}>
        {/* ExamFair Integrity Shield */}
        <Card>
          <CardContent style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} color="var(--color-success)" />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  ExamFair™ Academic Integrity Audit
                </span>
              </div>
              <Badge variant={result.examFairAudit?.status === 'HIGH_RISK_REVIEW' ? 'danger' : result.examFairAudit?.status === 'ADVISORY_FLAGGED' ? 'warning' : 'success'} size="sm">
                {result.examFairAudit?.integrityScore !== undefined ? `${result.examFairAudit.integrityScore}% Score` : '100% Verified'}
              </Badge>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
              {result.examFairAudit?.summary || 'Assessment session fully verified with zero suspicious telemetry.'}
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              <span>Tab Switches: <strong style={{ color: '#FFFFFF' }}>{result.examFairAudit?.tabSwitches || 0}</strong></span>
              <span>Clipboard Events: <strong style={{ color: '#FFFFFF' }}>{result.examFairAudit?.copyPasteAttempts || 0}</strong></span>
              <span>Audit Status: <strong style={{ color: 'var(--color-success)' }}>{result.examFairAudit?.status || 'CLEAN_VERIFIED'}</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Adaptive CAT Diagnostics (if applicable) */}
        {result.adaptiveReport && (
          <Card>
            <CardContent style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={18} color="var(--color-primary)" />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Adaptive CAT Proficiency
                  </span>
                </div>
                <Badge variant="primary" size="sm">
                  {result.adaptiveReport.proficiencyTier}
                </Badge>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                Dynamic Ability ($\theta$): <strong style={{ color: '#FFFFFF' }}>{result.adaptiveReport.theta > 0 ? `+${result.adaptiveReport.theta}` : result.adaptiveReport.theta}</strong> • Scaled Score: <strong style={{ color: 'var(--color-primary)' }}>{result.adaptiveReport.scaledScore}%</strong>
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Trajectory: {result.adaptiveReport.trajectory.slice(0, 4).join(' → ')}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Itemized Questions Breakdown */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
          Detailed Answer Key & Evaluation
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
          Review each question, your chosen option, the verified answer, and institutional explanations.
        </p>

        <StaggerContainer style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {answersBreakdown.map((item, index) => {
            const hasChosen = item.studentAnswer !== null && item.studentAnswer !== undefined;

            return (
              <StaggerItem key={item.questionId || index}>
                <Card>
                <CardHeader style={{ paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                        Question {index + 1}
                      </span>
                      {item.isCorrect ? (
                        <Badge variant="success" size="sm">Correct</Badge>
                      ) : !hasChosen ? (
                        <Badge variant="neutral" size="sm">Unanswered</Badge>
                      ) : (
                        <Badge variant="danger" size="sm">Incorrect</Badge>
                      )}
                    </div>

                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {item.marksAwarded} / {item.maxMarks} marks
                    </div>
                  </div>

                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
                    {item.questionText}
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Options List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    {['A', 'B', 'C', 'D'].map((optKey) => {
                      const optText = getOptionText(item.options, optKey);
                      const isCandidateChoice = item.studentAnswer === optKey;
                      const isCorrectChoice = item.correctAnswer === optKey;

                      let borderColor = 'var(--color-border)';
                      let bgColor = 'var(--color-surface)';
                      let textColor = 'var(--color-text-primary)';

                      if (isCorrectChoice) {
                        borderColor = 'var(--color-success)';
                        bgColor = 'var(--color-success-subtle)';
                        textColor = 'var(--color-success-text)';
                      } else if (isCandidateChoice && !item.isCorrect) {
                        borderColor = 'var(--color-danger)';
                        bgColor = 'var(--color-danger-subtle)';
                        textColor = 'var(--color-danger-text)';
                      }

                      return (
                        <div
                          key={optKey}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.625rem 0.875rem',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${borderColor}`,
                            backgroundColor: bgColor,
                            fontSize: '0.8125rem',
                            color: textColor,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <strong style={{ width: '18px' }}>{optKey}.</strong>
                            <span>{optText}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
                            {isCorrectChoice && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-success-text)' }}>
                                <CheckCircle2 size={14} /> Correct Answer
                              </span>
                            )}
                            {isCandidateChoice && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: item.isCorrect ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                                {item.isCorrect ? '(Your Selection)' : <><XCircle size={14} /> Your Selection</>}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Callout */}
                  {item.explanation && (
                    <div
                      style={{
                        padding: '0.75rem',
                        backgroundColor: 'var(--color-surface-subtle)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)',
                        borderLeft: '3px solid var(--color-primary)',
                      }}
                    >
                      <strong style={{ color: 'var(--color-text-primary)', display: 'block', marginBottom: '0.25rem' }}>
                        Explanation:
                      </strong>
                      {item.explanation}
                    </div>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
      </div>

      {/* ExamReplay Modal */}
      <Modal
        isOpen={showReplayModal}
        onClose={() => setShowReplayModal(false)}
        title="ExamReplay™ Attempt Session Reconstruction"
        description="Chronological step-by-step playback of candidate decision paths, answer modifications, and pacing."
        size="lg"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setShowReplayModal(false)}>
            Close Replay
          </Button>
        }
      >
        <ExamReplayViewer
          timeline={buildReplayTimeline(result)}
          totalDuration={result.durationTakenSeconds || 0}
          examTitle={examTitle || examSnapshot?.title}
        />
      </Modal>
    </PageTransition>
  );
}

export default StudentResultDetail;
