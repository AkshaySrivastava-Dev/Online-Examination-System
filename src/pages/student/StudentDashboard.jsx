import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { getExaminations } from '../../services/examService.js';
import { getResults } from '../../services/resultService.js';
import {
  StatCard,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Button,
  EmptyState,
  PageTransition,
  FloatingBackgroundElements,
  StaggerContainer,
  StaggerItem,
} from '../../components/common';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Award,
  TrendingUp,
  Clock,
  ArrowRight,
  GraduationCap,
  Play,
  Brain,
} from 'lucide-react';
import { formatDate, formatDateTime, formatDuration } from '../../utils/formatters.js';

export function StudentDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [availableExams, setAvailableExams] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [studentResults, setStudentResults] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    const allExams = getExaminations({ includeDeleted: false });
    const now = Date.now();

    // Published exams
    const published = allExams.filter((e) => e.status === 'published');

    // Available now (startTime <= now <= endTime)
    const available = published.filter((e) => {
      const start = new Date(e.startDateTime).getTime();
      const end = new Date(e.endDateTime).getTime();
      return now >= start && now <= end && (e.questionCount || 0) > 0;
    });

    // Upcoming (startTime > now)
    const upcoming = published.filter((e) => {
      const start = new Date(e.startDateTime).getTime();
      return now < start;
    });

    // Student's results
    const results = getResults({ studentId: currentUser.id });

    setAvailableExams(available);
    setUpcomingExams(upcoming);
    setStudentResults(results);
  }, [currentUser]);

  // Statistics
  const completedCount = studentResults.length;
  const passedCount = studentResults.filter((r) => r.isPassed).length;
  const avgScore =
    completedCount > 0
      ? (
          studentResults.reduce((acc, c) => acc + (Number(c.percentage) || 0), 0) /
          completedCount
        ).toFixed(1)
      : '0.0';

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <PageTransition>
      {/* Welcome Section */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '2rem var(--space-8)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <FloatingBackgroundElements count={3} opacity={0.35} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div className="eyebrow">CANDIDATE PORTAL</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{todayFormatted}</span>
          </div>
          <h1 style={{ fontSize: '2.125rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#FFFFFF' }}>
            Welcome back, {currentUser?.fullName}!
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Candidate ID: <code className="mono" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{currentUser?.studentId}</code> • Institutional examination credentials verified
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/student/examinations" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="md" iconLeft={<BookOpen size={16} />}>
              View Available Exams
            </Button>
          </Link>
          <Link to="/student/results" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="md" iconLeft={<Award size={16} />}>
              My Results
            </Button>
          </Link>
          <Link to="/student/exam-dna" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="md" iconLeft={<Brain size={16} />}>
              ExamDNA™
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric StatCards Grid with Staggered Entrance */}
      <StaggerContainer className="grid grid-cols-4 lg-grid-cols-2 md-grid-cols-1 gap-4" style={{ marginBottom: '2.5rem' }}>
        <StaggerItem>
          <StatCard
            title="Available Tests"
            value={availableExams.length}
            subtitle="Open for attempt right now"
            icon={<BookOpen size={16} />}
            badge={<Badge variant="success" size="sm" dot>Open</Badge>}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Upcoming Tests"
            value={upcomingExams.length}
            subtitle="Scheduled on calendar"
            icon={<Calendar size={16} />}
            badge={<Badge variant="primary" size="sm">Scheduled</Badge>}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Tests Completed"
            value={completedCount}
            subtitle={`${passedCount} test${passedCount === 1 ? '' : 's'} passed`}
            icon={<CheckCircle2 size={16} />}
            badge={<Badge variant="neutral" size="sm">History</Badge>}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Average Score"
            value={`${avgScore}%`}
            subtitle={`Pass rate: ${completedCount > 0 ? ((passedCount / completedCount) * 100).toFixed(0) : 0}%`}
            icon={<TrendingUp size={16} />}
            badge={<Badge variant={Number(avgScore) >= 60 ? 'success' : 'warning'} size="sm">Academic</Badge>}
          />
        </StaggerItem>
      </StaggerContainer>

      {/* Available Examinations Section */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Available Examinations</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Open examination sessions currently within their official active time window
            </p>
          </div>
          <Link to="/student/examinations" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View all ({availableExams.length}) <ArrowRight size={14} />
          </Link>
        </div>

        {availableExams.length === 0 ? (
          <EmptyState
            title="No tests currently open"
            description="There are no examinations available to take right now. Check the upcoming schedule for future dates."
          />
        ) : (
          <StaggerContainer className="grid grid-cols-3 lg-grid-cols-2 md-grid-cols-1 gap-4">
            {availableExams.slice(0, 3).map((exam) => {
              const prev = studentResults.find((r) => r.examId === exam.id);
              const isLocked = prev && !exam.allowRetake;

              return (
                <StaggerItem key={exam.id} style={{ display: 'flex' }}>
                  <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}>
                    <CardHeader>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <Badge variant="neutral" size="sm">{exam.category || 'General'}</Badge>
                        <Badge variant={isLocked ? 'neutral' : 'success'} size="sm" dot>
                          {isLocked ? 'Completed' : 'Open'}
                        </Badge>
                      </div>
                      <CardTitle style={{ fontSize: '1rem', marginTop: '4px' }}>{exam.title}</CardTitle>
                      <CardDescription style={{ lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {exam.description || 'Institutional test evaluation session.'}
                      </CardDescription>
                    </CardHeader>

                    <CardContent style={{ paddingTop: 0 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', padding: '0.625rem', backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                        <div>
                          <span>Duration: </span>
                          <strong>{formatDuration(exam.durationMinutes)}</strong>
                        </div>
                        <div>
                          <span>Total Marks: </span>
                          <strong>{exam.totalMarks} pts</strong>
                        </div>
                        <div>
                          <span>Pass Mark: </span>
                          <strong>{exam.passingPercentage}%</strong>
                        </div>
                        <div>
                          <span>Questions: </span>
                          <strong>{exam.questionCount || 0} MCQs</strong>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter style={{ backgroundColor: '#fff', borderTop: 'none', paddingTop: 0 }}>
                      {isLocked ? (
                        <Link to={`/student/results/${prev.id}`} style={{ width: '100%', textDecoration: 'none' }}>
                          <Button variant="secondary" size="sm" style={{ width: '100%' }}>
                            View My Score ({prev.percentage}%)
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/student/exam/${exam.id}/instructions`} style={{ width: '100%', textDecoration: 'none' }}>
                          <Button variant="primary" size="sm" style={{ width: '100%' }} iconLeft={<Play size={14} />}>
                            {prev ? 'Retake Examination' : 'Start Examination'}
                          </Button>
                        </Link>
                      )}
                    </CardFooter>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </section>

      {/* Recent Results Section */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Recent Test Results</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Historical evaluations and evaluated scorecards
            </p>
          </div>
          <Link to="/student/results" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View all results <ArrowRight size={14} />
          </Link>
        </div>

        {studentResults.length === 0 ? (
          <EmptyState
            title="No past test results"
            description="You have not submitted any test attempts yet. Completed examinations will be archived here with detailed breakdown sheets."
          />
        ) : (
          <StaggerContainer style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {studentResults.slice(0, 3).map((res) => (
              <StaggerItem
                key={res.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                    <Badge variant={res.isPassed ? 'success' : 'danger'} size="sm" dot>
                      {res.isPassed ? 'Passed' : 'Failed'}
                    </Badge>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Submitted {formatDateTime(res.submittedAt)}
                    </span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {res.examSnapshot?.title || res.examTitle}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: res.isPassed ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                      {res.marksObtained} / {res.totalMarks} pts
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {res.percentage}% Score
                    </div>
                  </div>

                  <Link to={`/student/results/${res.id}`} style={{ textDecoration: 'none' }}>
                    <Button variant="secondary" size="sm" iconRight={<ArrowRight size={14} />}>
                      Scorecard
                    </Button>
                  </Link>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>
    </PageTransition>
  );
}

export default StudentDashboard;
