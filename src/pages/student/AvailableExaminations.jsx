import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { getExaminations } from '../../services/examService.js';
import { getResults } from '../../services/resultService.js';
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
  EmptyState,
  PageTransition,
  FloatingBackgroundElements,
  StaggerContainer,
  StaggerItem,
} from '../../components/common';
import {
  BookOpen,
  Search,
  Clock,
  Award,
  Layers,
  Play,
  CheckCircle2,
  Lock,
  ArrowUpDown,
} from 'lucide-react';
import { formatDate, formatDateTime, formatDuration } from '../../utils/formatters.js';

export function AvailableExaminations() {
  const { currentUser } = useAuth();

  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('closingSoon');

  useEffect(() => {
    if (!currentUser) return;

    const allExams = getExaminations({ includeDeleted: false });
    const now = Date.now();

    // Published and within active window
    const openExams = allExams.filter((e) => {
      if (e.status !== 'published') return false;
      const start = new Date(e.startDateTime).getTime();
      const end = new Date(e.endDateTime).getTime();
      return now >= start && now <= end && (e.questionCount || 0) > 0;
    });

    const studentResults = getResults({ studentId: currentUser.id });

    setExams(openExams);
    setResults(studentResults);
  }, [currentUser]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set(exams.map((e) => e.category || 'General'));
    return Array.from(set);
  }, [exams]);

  // Filter & Sort
  const filteredExams = useMemo(() => {
    let list = exams.filter((e) => {
      if (categoryFilter !== 'all' && (e.category || 'General') !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = e.title && e.title.toLowerCase().includes(q);
        const matchDesc = e.description && e.description.toLowerCase().includes(q);
        return matchTitle || matchDesc;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === 'closingSoon') {
        return new Date(a.endDateTime).getTime() - new Date(b.endDateTime).getTime();
      }
      if (sortBy === 'duration') {
        return a.durationMinutes - b.durationMinutes;
      }
      if (sortBy === 'marks') {
        return b.totalMarks - a.totalMarks;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return list;
  }, [exams, search, categoryFilter, sortBy]);

  return (
    <PageTransition>
      {/* Module Header */}
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
            <BookOpen size={12} />
            ACTIVE TESTING CATALOG
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--color-text-primary)' }}>
            Available Examinations
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '640px', fontSize: '0.875rem' }}>
            Institutional test sessions currently open and ready for candidate attempt.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1rem var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '320px', flexWrap: 'wrap' }}>
            <div className="search-input-wrapper" style={{ width: '100%', maxWidth: '320px' }}>
              <Input
                placeholder="Search open examinations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                iconLeft={<Search size={15} />}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Category:</span>
              <select
                className="form-input"
                style={{ width: '170px', height: '38px', padding: '0 0.5rem' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Sort:</span>
              <select
                className="form-input"
                style={{ width: '160px', height: '38px', padding: '0 0.5rem' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="closingSoon">Closing Soonest</option>
                <option value="duration">Shortest Duration</option>
                <option value="marks">Highest Marks</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>
          </div>

          <Badge variant="neutral" size="md">
            {filteredExams.length} Available Test{filteredExams.length === 1 ? '' : 's'}
          </Badge>
        </div>
      </Card>

      {/* Examinations Grid */}
      {filteredExams.length === 0 ? (
        <EmptyState
          title="No open examinations found"
          description="There are currently no active tests matching your search or category filter. Check upcoming schedules."
        />
      ) : (
        <StaggerContainer style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredExams.map((exam) => {
            const pastResult = results.find((r) => r.examId === exam.id);
            const isCompleted = !!pastResult;
            const isLocked = isCompleted && !exam.allowRetake;

            return (
              <StaggerItem key={exam.id}>
                <Card
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'border-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast)',
                  }}
                >
                {/* 1. Dedicated Header Badge Strip: Cleanly isolates badges from title */}
                <div
                  style={{
                    padding: '0.75rem 1.25rem',
                    backgroundColor: 'var(--color-surface-subtle)',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <Badge variant="neutral" size="sm">{exam.category || 'General'}</Badge>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      ID: {exam.id}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {exam.isAdaptive && (
                      <Badge variant="primary" size="sm">Adaptive CAT</Badge>
                    )}
                    {exam.allowRetake && (
                      <Badge variant="outline" size="sm">Retakes Allowed</Badge>
                    )}
                    <Badge variant={isLocked ? 'neutral' : 'success'} size="sm" dot>
                      {isLocked ? 'Completed (Locked)' : isCompleted ? 'Completed (Retake Ready)' : 'Open for Attempt'}
                    </Badge>
                  </div>
                </div>

                {/* 2. Main Body: Generous Title Width & Description */}
                <div style={{ padding: '1.25rem 1.25rem 0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                      <h2
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: 'var(--color-text-primary)',
                          letterSpacing: '-0.02em',
                          margin: '0 0 0.5rem 0',
                          lineHeight: 1.35,
                        }}
                      >
                        {exam.title}
                      </h2>
                      <p
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--color-text-secondary)',
                          lineHeight: 1.55,
                          margin: 0,
                          maxWidth: '780px',
                        }}
                      >
                        {exam.description || 'Standard institutional evaluation module.'}
                      </p>
                    </div>

                    {/* Aligned 4-Metric Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '0.5rem',
                        padding: '0.625rem 0.875rem',
                        backgroundColor: 'var(--color-surface-subtle)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        textAlign: 'center',
                        minWidth: '320px',
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 600 }}>Duration</span>
                        <strong style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}>{formatDuration(exam.durationMinutes)}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 600 }}>Total Marks</span>
                        <strong style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}>{exam.totalMarks} pts</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 600 }}>Questions</span>
                        <strong style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}>{exam.questionCount || 0} MCQs</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 600 }}>Pass Mark</span>
                        <strong style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}>{exam.passingPercentage}%</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Footer: Aligned Metadata & Primary Action */}
                <div
                  style={{
                    padding: '0.875rem 1.25rem',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                    <span>Closes on: <strong>{formatDateTime(exam.endDateTime)}</strong></span>
                    {pastResult && (
                      <span
                        style={{
                          color: pastResult.isPassed ? 'var(--color-success)' : 'var(--color-danger)',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: pastResult.isPassed ? 'rgba(44, 187, 93, 0.1)' : 'rgba(239, 71, 67, 0.1)',
                        }}
                      >
                        Previous Score: {pastResult.percentage}% ({pastResult.isPassed ? 'Passed' : 'Failed'})
                      </span>
                    )}
                  </div>

                  <div>
                    {isLocked ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Lock size={13} /> Attempt limit reached (Retakes locked)
                        </span>
                        <Link to={`/student/results/${pastResult.id}`} style={{ textDecoration: 'none' }}>
                          <Button variant="secondary" size="sm">
                            View My Scorecard
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {isCompleted ? 'Additional attempt allowed' : 'First attempt'}
                        </span>
                        <Link to={`/student/exam/${exam.id}/instructions`} style={{ textDecoration: 'none' }}>
                          <Button variant="primary" size="md" iconLeft={<Play size={14} />}>
                            {isCompleted ? 'Retake Examination' : 'Start Examination'}
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    )}
    </PageTransition>
  );
}

export default AvailableExaminations;

