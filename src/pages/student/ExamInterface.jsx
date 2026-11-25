import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../context/ToastContext.jsx';
import { generateId } from '../../utils/idGenerator.js';
import {
  startExamAttempt,
  recordAnswer,
  recordConfidence,
  recordQuestionTime,
  toggleMarkForReview,
  markQuestionVisited,
  getQuestionState,
  submitExamAttempt,
  recordExamFairViolation,
} from '../../services/examEngineService.js';
import {
  Button,
  Badge,
  Modal,
  LoadingSpinner,
} from '../../components/common';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  Eraser,
  ChevronLeft,
  ChevronRight,
  Send,
  ShieldAlert,
  ShieldCheck,
  Activity,
  ArrowLeft,
  Check,
} from 'lucide-react';

const getOptionText = (options, optKey) => {
  if (!options) return '';
  if (Array.isArray(options)) {
    const found = options.find((o) => o.id === optKey);
    return found ? (found.text || '') : '';
  }
  return options[optKey] || '';
};

export function ExamInterface() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { success, error: toastError, warning, info } = useToast();

  // Unique tab ID for multi-tab collision detection
  const tabIdRef = useRef(sessionStorage.getItem('exampro_tab_id') || generateId('tab'));
  useEffect(() => {
    sessionStorage.setItem('exampro_tab_id', tabIdRef.current);
  }, []);

  // Exam Engine State
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [confidenceLevels, setConfidenceLevels] = useState({});
  const [markedForReview, setMarkedForReview] = useState([]);
  const [visitedQuestions, setVisitedQuestions] = useState([]);
  const [endTimestamp, setEndTimestamp] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [lockError, setLockError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(null);

  // Dwell timing tracking for ExamDNA Time Intelligence
  const questionEnteredAtRef = useRef(Date.now());

  // Session / Suspension Watcher
  useEffect(() => {
    if (!currentUser || currentUser.status === 'suspended') {
      navigate('/login', { replace: true });
    }
  }, [currentUser, navigate]);

  // Initialize or resume session
  useEffect(() => {
    if (!currentUser || !examId) return;

    try {
      const res = startExamAttempt(currentUser, examId, tabIdRef.current);

      if (!res.success) {
        setInitError(res.error || 'Failed to initialize examination session.');
        setLoading(false);
        return;
      }

      setExam(res.exam);
      setQuestions(res.questions || []);
      setEndTimestamp(res.attempt.endTimestamp);
      setAnswers(res.attempt.answers || {});
      setConfidenceLevels(res.attempt.confidenceLevels || {});
      setMarkedForReview(res.attempt.markedForReview || []);
      setVisitedQuestions(res.attempt.visitedQuestions || []);
      setCurrentIndex(res.attempt.currentQuestionIndex || 0);

      // Check multi-tab lock
      if (!res.hasTabLock) {
        setLockError('Another browser tab is currently holding the active session for this examination.');
      }

      if (res.isResume) {
        info('Resumed active examination session. Your answers and timer are intact.');
      }
    } catch (err) {
      console.error('Failed to mount examination interface:', err);
      setInitError('An unexpected error occurred while mounting the examination session.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, examId, info]);

  // Record elapsed question dwell time for ExamDNA analytics
  const flushCurrentQuestionTime = useCallback(() => {
    if (!questions || !questions[currentIndex] || !currentUser) return;
    const qId = questions[currentIndex].id;
    const now = Date.now();
    const elapsedSec = Math.max(1, Math.round((now - questionEnteredAtRef.current) / 1000));
    questionEnteredAtRef.current = now;
    recordQuestionTime(currentUser.id, examId, qId, elapsedSec);
  }, [questions, currentIndex, currentUser, examId]);

  // Master Absolute Timer Countdown Loop
  useEffect(() => {
    if (!endTimestamp) return;

    const tick = () => {
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((endTimestamp - now) / 1000));
      setRemainingSeconds(diffSecs);

      // Auto-submit on expiration
      if (diffSecs <= 0 && !isSubmitting) {
        handleAutoSubmit();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTimestamp, isSubmitting]);

  // ExamFair Academic Integrity & Focus Tracking
  useEffect(() => {
    if (!currentUser || !examId) return;

    const handleVisibility = () => {
      if (document.hidden) {
        recordExamFairViolation(currentUser.id, examId, {
          type: 'TAB_SWITCH',
          description: 'Candidate switched tabs or minimized examination window',
        });
        warning('ExamFair Advisory: Window unfocus event recorded in session telemetry.');
      }
    };

    const handleCopy = () => {
      recordExamFairViolation(currentUser.id, examId, {
        type: 'COPY_ATTEMPT',
        description: 'Clipboard copy attempt detected',
      });
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('copy', handleCopy);
    };
  }, [currentUser, examId, warning]);

  // Auto-submit handler triggered when timer hits 0
  const handleAutoSubmit = useCallback(() => {
    setIsSubmitting(true);
    flushCurrentQuestionTime();
    warning('Allocated examination time has expired. Submitting your answers automatically...');

    const subRes = submitExamAttempt(currentUser.id, examId, 'auto-timer');
    if (subRes.success) {
      navigate(`/student/results/${subRes.result.id}`, { replace: true });
    } else {
      toastError(subRes.error || 'Failed to finalize auto-submission.');
      navigate('/student/dashboard', { replace: true });
    }
  }, [currentUser, examId, navigate, warning, toastError, flushCurrentQuestionTime]);

  // Manual submission handler
  const handleManualSubmit = () => {
    setIsSubmitting(true);
    flushCurrentQuestionTime();
    const subRes = submitExamAttempt(currentUser.id, examId, 'manual');

    if (subRes.success) {
      success('Examination submitted successfully! Reviewing scorecard...');
      navigate(`/student/results/${subRes.result.id}`, { replace: true });
    } else {
      toastError(subRes.error || 'Failed to submit examination.');
      setIsSubmitting(false);
    }
  };

  // Current active question
  const currentQuestion = questions[currentIndex];

  // Confidence Level Selection (ExamDNA Intelligence)
  const handleSelectConfidence = (level) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    const nextLevel = confidenceLevels[qId] === level ? null : level;
    setConfidenceLevels((prev) => {
      const next = { ...prev };
      if (nextLevel) next[qId] = nextLevel;
      else delete next[qId];
      return next;
    });
    recordConfidence(currentUser.id, examId, qId, nextLevel);
  };

  // Option selection
  const handleSelectOption = (optionKey) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;

    // Toggle: if clicked again, option is selected (or kept)
    setAnswers((prev) => {
      const next = { ...prev, [qId]: optionKey };
      recordAnswer(currentUser.id, examId, qId, optionKey);
      return next;
    });

    // Mark visited
    if (!visitedQuestions.includes(qId)) {
      setVisitedQuestions((prev) => [...prev, qId]);
      markQuestionVisited(currentUser.id, examId, qId);
    }
  };

  // Clear answer
  const handleClearAnswer = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;

    setAnswers((prev) => {
      const next = { ...prev };
      delete next[qId];
      recordAnswer(currentUser.id, examId, qId, null);
      return next;
    });
  };

  // Toggle review flag
  const handleToggleReview = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;

    const isMarked = toggleMarkForReview(currentUser.id, examId, qId);
    setMarkedForReview((prev) => {
      if (isMarked) {
        return [...prev, qId];
      }
      return prev.filter((id) => id !== qId);
    });
  };

  // Navigate to question index
  const handleJumpToQuestion = (index) => {
    if (index < 0 || index >= questions.length) return;
    flushCurrentQuestionTime();
    const targetQ = questions[index];

    if (targetQ && !visitedQuestions.includes(targetQ.id)) {
      setVisitedQuestions((prev) => [...prev, targetQ.id]);
      markQuestionVisited(currentUser.id, examId, targetQ.id);
    }

    setCurrentIndex(index);
  };

  // Formatted countdown timer string HH:MM:SS
  const timerDisplay = useMemo(() => {
    if (remainingSeconds === null) return '--:--';
    const hrs = Math.floor(remainingSeconds / 3600);
    const mins = Math.floor((remainingSeconds % 3600) / 60);
    const secs = remainingSeconds % 60;

    const pad = (n) => String(n).padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  }, [remainingSeconds]);

  // Is warning time (< 5 minutes / 300 seconds)
  const isTimerWarning = remainingSeconds !== null && remainingSeconds <= 300;

  // Question palette counts for legend
  const paletteCounts = useMemo(() => {
    const mockAttempt = {
      answers,
      markedForReview,
      visitedQuestions,
    };

    let answeredCount = 0;
    let notAnsweredCount = 0;
    let reviewCount = 0;
    let answeredReviewCount = 0;
    let notVisitedCount = 0;

    questions.forEach((q) => {
      const state = getQuestionState(mockAttempt, q.id);
      if (state === 'answered') answeredCount++;
      else if (state === 'not-answered') notAnsweredCount++;
      else if (state === 'review') reviewCount++;
      else if (state === 'answered-review') answeredReviewCount++;
      else notVisitedCount++;
    });

    return {
      answered: answeredCount,
      notAnswered: notAnsweredCount,
      review: reviewCount,
      answeredReview: answeredReviewCount,
      notVisited: notVisitedCount,
      totalAttempted: Object.keys(answers).length,
    };
  }, [questions, answers, markedForReview, visitedQuestions]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)' }}>
        <LoadingSpinner message="Securing examination environment..." size="lg" />
      </div>
    );
  }

  if (initError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)', padding: '1rem' }}>
        <div style={{ maxWidth: '520px', width: '100%', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-danger)', marginBottom: '1rem' }}>
            <AlertTriangle size={24} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Examination Inaccessible</h2>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            {initError}
          </p>
          <Link to="/student/examinations" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" iconLeft={<ArrowLeft size={14} />}>
              Return to Available Examinations
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-layout-root">
      {/* Distraction-Free Top Bar */}
      <header className="exam-engine-topbar">
        {/* Left: Exam Title & Candidate ID */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {exam?.title}
              </span>
              <Badge variant="neutral" size="sm">{exam?.category || 'General'}</Badge>
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
              Candidate: <strong>{currentUser?.fullName}</strong> ({currentUser?.studentId})
            </div>
          </div>
        </div>

        {/* Center: Absolute Countdown Timer & Telemetry Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className={`exam-timer-box ${isTimerWarning ? 'timer-warning' : ''}`} title="Absolute time remaining for submission">
            <Clock size={16} />
            <span>{timerDisplay}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.75rem',
              color: 'var(--color-success)',
              backgroundColor: 'rgba(44, 187, 93, 0.1)',
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(44, 187, 93, 0.2)',
            }}
            title="VERITY ExamFair active: proctoring telemetry enabled"
          >
            <ShieldCheck size={13} />
            <span style={{ fontWeight: 600 }}>ExamFair™ Active</span>
          </div>

          {exam?.isAdaptive && (
            <Badge variant="primary" size="sm">
              Adaptive CAT Mode
            </Badge>
          )}
        </div>

        {/* Right: Submit Examination Action */}
        <div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowSubmitModal(true)}
            iconLeft={<Send size={14} />}
          >
            Submit Examination
          </Button>
        </div>
      </header>

      {/* Multi-Tab Lock Notice Banner (if active in another tab) */}
      {lockError && (
        <div
          style={{
            backgroundColor: 'var(--color-warning-subtle)',
            borderBottom: '1px solid #FCD34D',
            padding: '0.5rem var(--space-6)',
            fontSize: '0.8125rem',
            color: 'var(--color-warning-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <ShieldAlert size={16} />
          <span>{lockError} Please close any other open ExamPro tabs to avoid conflicting responses.</span>
        </div>
      )}

      {/* Engine Main Split Workspace */}
      <div className="exam-engine-body">
        {/* Left Area: Question Viewer & Actions */}
        <div className="exam-question-viewport">
          {currentQuestion ? (
            <div>
              {/* Question Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '0.875rem',
                  borderBottom: '1px solid var(--color-border)',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Question {currentIndex + 1}
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    of {questions.length}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Badge variant="primary" size="sm">
                    +{currentQuestion.marks} Marks
                  </Badge>
                  {markedForReview.includes(currentQuestion.id) && (
                    <Badge variant="warning" size="sm">Marked for Review</Badge>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div
                style={{
                  fontSize: '1.0625rem',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.6,
                  marginBottom: '1.75rem',
                }}
              >
                {currentQuestion.questionText}
              </div>

              {/* MCQ 4-Option Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {['A', 'B', 'C', 'D'].map((optKey) => {
                  const optText = getOptionText(currentQuestion.options, optKey);
                  const isSelected = answers[currentQuestion.id] === optKey;

                  return (
                    <div
                      key={optKey}
                      className={`mcq-option-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectOption(optKey)}
                    >
                      <div className="option-radio-indicator">
                        {isSelected ? <Check size={12} strokeWidth={3} /> : optKey}
                      </div>
                      <div style={{ flex: 1 }}>
                        {optText}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Confidence Selection (ExamDNA Intelligence) */}
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '0.875rem 1.125rem',
                  backgroundColor: 'var(--color-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span>Confidence Level</span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>(Optional · Powers ExamDNA™ Insights)</span>
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                    How sure are you about your selected response?
                  </div>
                </div>

                <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                  {[
                    { key: 'Low', label: 'Low', color: '#94A3B8' },
                    { key: 'Medium', label: 'Medium', color: 'var(--color-warning)' },
                    { key: 'High', label: 'High', color: 'var(--color-success)' },
                  ].map((lvl) => {
                    const isSelected = confidenceLevels[currentQuestion.id] === lvl.key;
                    return (
                      <button
                        key={lvl.key}
                        type="button"
                        onClick={() => handleSelectConfidence(lvl.key)}
                        style={{
                          padding: '0.3125rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          border: isSelected ? `1.5px solid ${lvl.color}` : '1px solid var(--color-border)',
                          backgroundColor: isSelected ? 'var(--color-surface)' : 'transparent',
                          color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                          boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        }}
                      >
                        {lvl.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div>No questions available.</div>
          )}

          {/* Action Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--color-border)',
              marginTop: '2rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            {/* Left Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Button
                variant="secondary"
                size="md"
                disabled={currentIndex === 0}
                onClick={() => handleJumpToQuestion(currentIndex - 1)}
                iconLeft={<ChevronLeft size={16} />}
              >
                Previous
              </Button>

              <Button
                variant={markedForReview.includes(currentQuestion?.id) ? 'warning' : 'secondary'}
                size="md"
                onClick={handleToggleReview}
                iconLeft={<Bookmark size={15} />}
              >
                {markedForReview.includes(currentQuestion?.id) ? 'Unmark Review' : 'Mark for Review'}
              </Button>

              {answers[currentQuestion?.id] && (
                <Button
                  variant="ghost"
                  size="md"
                  onClick={handleClearAnswer}
                  iconLeft={<Eraser size={15} />}
                >
                  Clear Selection
                </Button>
              )}
            </div>

            {/* Right Control */}
            <div>
              {currentIndex < questions.length - 1 ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleJumpToQuestion(currentIndex + 1)}
                  iconRight={<ChevronRight size={16} />}
                >
                  Save & Next
                </Button>
              ) : (
                <Button
                  variant="success"
                  size="md"
                  onClick={() => setShowSubmitModal(true)}
                  iconRight={<Send size={15} />}
                >
                  Review & Submit
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: 5-State Question Palette & Real-Time Legend */}
        <aside className="exam-palette-sidebar">
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
              Question Palette
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
              {paletteCounts.totalAttempted} of {questions.length} answered
            </div>

            {/* Responsive Grid of Question Number Buttons */}
            <div className="palette-grid">
              {questions.map((q, idx) => {
                const state = getQuestionState({ answers, markedForReview, visitedQuestions }, q.id);
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    type="button"
                    className={`palette-btn state-${state} ${isCurrent ? 'current' : ''}`}
                    onClick={() => handleJumpToQuestion(idx)}
                    title={`Question ${idx + 1}: ${state}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5-State Color Legend with Live Counters */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              State Legend
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {/* Answered */}
              <div className="palette-legend-item">
                <div>
                  <span className="legend-badge-sample" style={{ backgroundColor: 'var(--state-answered-bg)', borderColor: 'var(--state-answered-border)' }} />
                  <span>Answered</span>
                </div>
                <strong style={{ color: 'var(--state-answered-text)' }}>{paletteCounts.answered}</strong>
              </div>

              {/* Not Answered */}
              <div className="palette-legend-item">
                <div>
                  <span className="legend-badge-sample" style={{ backgroundColor: 'var(--state-not-answered-bg)', borderColor: 'var(--state-not-answered-border)' }} />
                  <span>Not Answered</span>
                </div>
                <strong style={{ color: 'var(--state-not-answered-text)' }}>{paletteCounts.notAnswered}</strong>
              </div>

              {/* Marked for Review */}
              <div className="palette-legend-item">
                <div>
                  <span className="legend-badge-sample" style={{ backgroundColor: 'var(--state-review-bg)', borderColor: 'var(--state-review-border)' }} />
                  <span>Marked for Review</span>
                </div>
                <strong style={{ color: 'var(--state-review-text)' }}>{paletteCounts.review}</strong>
              </div>

              {/* Answered & Marked for Review */}
              <div className="palette-legend-item">
                <div>
                  <span className="legend-badge-sample" style={{ backgroundColor: 'var(--state-ans-review-bg)', borderColor: 'var(--state-ans-review-border)' }} />
                  <span>Answered & Review</span>
                </div>
                <strong style={{ color: 'var(--state-ans-review-text)' }}>{paletteCounts.answeredReview}</strong>
              </div>

              {/* Not Visited */}
              <div className="palette-legend-item">
                <div>
                  <span className="legend-badge-sample" style={{ backgroundColor: 'var(--state-not-visited-bg)', borderColor: 'var(--state-not-visited-border)' }} />
                  <span>Not Visited</span>
                </div>
                <strong style={{ color: 'var(--state-not-visited-text)' }}>{paletteCounts.notVisited}</strong>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Manual Submission Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Confirm Examination Submission"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowSubmitModal(false)}
              disabled={isSubmitting}
            >
              Return to Exam
            </Button>
            <Button
              variant="danger"
              onClick={handleManualSubmit}
              loading={isSubmitting}
              iconLeft={<Send size={15} />}
            >
              Confirm and Finalize Submission
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            Are you sure you want to finalize your examination? Once submitted, your answers cannot be altered and will be immediately evaluated.
          </p>

          {/* Submission Summary Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              padding: '1rem',
              backgroundColor: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Total Questions</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {questions.length}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Answered</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-success-text)' }}>
                {paletteCounts.totalAttempted}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Unanswered</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: questions.length - paletteCounts.totalAttempted > 0 ? 'var(--color-danger-text)' : 'var(--color-text-muted)' }}>
                {questions.length - paletteCounts.totalAttempted}
              </div>
            </div>
          </div>

          {questions.length - paletteCounts.totalAttempted > 0 && (
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--color-danger-subtle)',
                border: '1px solid #FCA5A5',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-danger-text)',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertTriangle size={16} />
              <span>
                You have {questions.length - paletteCounts.totalAttempted} unanswered question(s). Unanswered questions will receive 0 marks.
              </span>
            </div>
          )}

          {paletteCounts.review + paletteCounts.answeredReview > 0 && (
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--color-warning-subtle)',
                border: '1px solid #FCD34D',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-warning-text)',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Bookmark size={16} />
              <span>
                You have {paletteCounts.review + paletteCounts.answeredReview} question(s) marked for review.
              </span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default ExamInterface;
