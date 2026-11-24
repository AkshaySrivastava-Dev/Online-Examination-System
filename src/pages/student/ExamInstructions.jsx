import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../context/ToastContext.jsx';
import { getExaminationById } from '../../services/examService.js';
import { getQuestions } from '../../services/questionService.js';
import { getActiveAttempt, startExamAttempt } from '../../services/examEngineService.js';
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
} from '../../components/common';
import {
  Clock,
  Award,
  AlertTriangle,
  CheckSquare,
  ShieldAlert,
  ArrowLeft,
  Play,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { formatDateTime, formatDuration } from '../../utils/formatters.js';

export function ExamInstructions() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { warning } = useToast();

  const [exam, setExam] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [isCompletedLocked, setIsCompletedLocked] = useState(false);
  const [hasPreviousAttempt, setHasPreviousAttempt] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser || !examId) return;

    try {
      const foundExam = getExaminationById(examId);
      if (!foundExam || foundExam.isDeleted) {
        setError('Examination not found or has been removed.');
        setLoading(false);
        return;
      }

      if (foundExam.status !== 'published') {
        setError('This examination is currently in draft status and not open for student access.');
        setLoading(false);
        return;
      }

      const now = Date.now();
      const start = new Date(foundExam.startDateTime).getTime();
      const end = new Date(foundExam.endDateTime).getTime();

      if (now < start) {
        setError(`This examination is scheduled to open on ${formatDateTime(foundExam.startDateTime)}.`);
        setLoading(false);
        return;
      }

      if (now > end) {
        setError('This examination has officially closed and submissions are no longer accepted.');
        setLoading(false);
        return;
      }

      const questions = getQuestions({ examId, includeDeleted: false });
      if (questions.length === 0) {
        setError('This examination has no active questions assigned.');
        setLoading(false);
        return;
      }

      // Check retake policy
      const studentResults = getResults({ studentId: currentUser.id });
      const pastResults = studentResults.filter((r) => r.examId === examId);
      if (pastResults.length > 0) {
        setHasPreviousAttempt(true);
        if (!foundExam.allowRetake) {
          setIsCompletedLocked(true);
          setError('You have already completed this examination. Retakes are not allowed.');
          setLoading(false);
          return;
        }
      }

      // Check active attempt in progress
      const currentAttempt = getActiveAttempt(currentUser.id, examId);
      if (currentAttempt) {
        setActiveAttempt(currentAttempt);
      }

      setExam(foundExam);
      setQuestionCount(questions.length);
    } catch (err) {
      console.error('Error preparing exam instructions:', err);
      setError('An unexpected error occurred while loading examination specifications.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, examId]);

  const handleStartExam = () => {
    if (!acknowledged) {
      warning('Please confirm that you have read and understood the instructions.');
      return;
    }

    navigate(`/student/exam/${examId}`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
        <LoadingSpinner message="Validating examination parameters..." />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div style={{ maxWidth: '640px', margin: '3rem auto' }}>
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-danger)' }}>
              <AlertTriangle size={24} />
              <CardTitle style={{ color: 'var(--color-danger)' }}>Access Restricted</CardTitle>
            </div>
            <CardDescription>{error || 'Unable to access examination.'}</CardDescription>
          </CardHeader>
          <CardFooter>
            <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
              <Link to="/student/examinations" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" iconLeft={<ArrowLeft size={14} />}>
                  Back to Available Tests
                </Button>
              </Link>
              {isCompletedLocked && (
                <Link to="/student/results" style={{ textDecoration: 'none' }}>
                  <Button variant="primary">
                    View Completed Results
                  </Button>
                </Link>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Back Link */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/student/examinations" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          <ArrowLeft size={14} />
          <span>Back to Available Examinations</span>
        </Link>
      </div>

      {/* Main Instruction Card */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <Badge variant="neutral" size="sm">{exam.category || 'General'}</Badge>
            <Badge variant={activeAttempt ? 'warning' : 'primary'} size="sm" dot>
              {activeAttempt ? 'Session In Progress' : 'Candidate Pre-Flight'}
            </Badge>
          </div>

          <CardTitle style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            {exam.title}
          </CardTitle>
          <CardDescription>
            {exam.description || 'Institutional examination guidelines and testing environment protocols.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Key Exam Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              marginBottom: '1.75rem',
              textAlign: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block' }}>Duration</span>
              <strong style={{ fontSize: '1.125rem', color: 'var(--color-text-primary)' }}>{formatDuration(exam.durationMinutes)}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block' }}>Total Marks</span>
              <strong style={{ fontSize: '1.125rem', color: 'var(--color-text-primary)' }}>{exam.totalMarks} pts</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block' }}>Total Questions</span>
              <strong style={{ fontSize: '1.125rem', color: 'var(--color-text-primary)' }}>{questionCount} MCQs</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block' }}>Passing Score</span>
              <strong style={{ fontSize: '1.125rem', color: 'var(--color-text-primary)' }}>{exam.passingPercentage}%</strong>
            </div>
          </div>

          {/* Active attempt resumption alert if applicable */}
          {activeAttempt && (
            <div
              style={{
                padding: '0.875rem 1rem',
                backgroundColor: 'var(--color-warning-subtle)',
                border: '1px solid #FCD34D',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-warning-text)',
                fontSize: '0.8125rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <RotateCcw size={18} />
              <div>
                <strong>Active Attempt Detected:</strong> You have an ongoing session started at{' '}
                {new Date(activeAttempt.startTimestamp).toLocaleTimeString()}. Resuming will maintain your saved answers and remaining time.
              </div>
            </div>
          )}

          {/* Guidelines Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
                1. Structure and Scoring
              </h3>
              <p>
                This test contains {questionCount} multiple choice questions. Each question has four choices with exactly one correct answer.
                Marks are awarded based on question difficulty weighting. There is no negative deduction for incorrect answers.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
                2. Question Navigation & Palette States
              </h3>
              <p>
                Use the question palette on the right side to jump directly to any question. Questions use 5 color-coded states:
              </p>
              <ul style={{ paddingLeft: '1.25rem', marginTop: '0.375rem' }}>
                <li><strong style={{ color: 'var(--color-text-primary)' }}>Slate Gray:</strong> Question has not been visited yet.</li>
                <li><strong style={{ color: 'var(--color-danger-text)' }}>Soft Red:</strong> Question visited but no option selected.</li>
                <li><strong style={{ color: 'var(--color-success-text)' }}>Emerald Green:</strong> Question answered.</li>
                <li><strong style={{ color: 'var(--color-warning-text)' }}>Amber Yellow:</strong> Question marked for review (unanswered).</li>
                <li><strong style={{ color: '#4F46E5' }}>Indigo Purple:</strong> Question answered and marked for review.</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
                3. Countdown Timer & Auto-Submission
              </h3>
              <p>
                The countdown timer runs on an absolute timestamp clock. Refreshing your browser or temporarily navigating away will
                <strong> not reset or pause</strong> the timer. When the remaining time reaches 00:00:00, the examination engine will automatically evaluate and submit your answers.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
                4. Academic Integrity & State Persistence
              </h3>
              <p>
                All selections are saved directly to your browser's persistent storage on every click. Please ensure you remain within a single browser tab for the duration of the test.
              </p>
            </div>
          </div>

          {/* Acknowledgement Checkbox */}
          <div
            style={{
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              cursor: 'pointer',
            }}
            onClick={() => setAcknowledged((p) => !p)}
          >
            <input
              type="checkbox"
              id="ack-checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
            />
            <label htmlFor="ack-checkbox" style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', cursor: 'pointer', userSelect: 'none' }}>
              <strong>Declaration:</strong> I have reviewed all examination rules and technical instructions. I understand that my answers will be saved continuously and that the test will auto-submit when the allocated time ends.
            </label>
          </div>
        </CardContent>

        <CardFooter>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
            <Link to="/student/examinations" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="md">
                Cancel
              </Button>
            </Link>

            <Button
              variant="primary"
              size="lg"
              disabled={!acknowledged}
              onClick={handleStartExam}
              iconRight={<Play size={16} />}
            >
              {activeAttempt ? 'Resume Examination' : hasPreviousAttempt ? 'Proceed to Retake' : 'Start Examination'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default ExamInstructions;
