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
    <div>
      {/* Module Header */}
      <div className="module-header">
        <div className="module-title-group">
          <div className="eyebrow" style={{ marginBottom: '0.375rem' }}>ACTIVE TESTING CATALOG</div>
          <h1>Available Examinations</h1>
          <p>Institutional test sessions currently open and ready for candidate attempt.</p>
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
        <div className="grid grid-cols-2 md-grid-cols-1 gap-6">
          {filteredExams.map((exam) => {
            const pastResult = results.find((r) => r.examId === exam.id);
            const isCompleted = !!pastResult;
            const isLocked = isCompleted && !exam.allowRetake;

            return (
              <Card key={exam.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <CardHeader>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <Badge variant="neutral" size="sm">{exam.category || 'General'}</Badge>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {exam.allowRetake && (
                        <Badge variant="primary" size="sm">Retakes Allowed</Badge>
                      )}
                      <Badge variant={isLocked ? 'neutral' : 'success'} size="sm" dot>
                        {isLocked ? 'Completed (Locked)' : isCompleted ? 'Completed (Retake Ready)' : 'Open for Attempt'}
                      </Badge>
                    </div>
                  </div>

                  <CardTitle style={{ fontSize: '1.125rem' }}>{exam.title}</CardTitle>
                  <CardDescription style={{ lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {exam.description || 'Standard institutional evaluation module.'}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      backgroundColor: 'var(--color-surface-subtle)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.75rem',
                      textAlign: 'center',
                      marginBottom: '1rem',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Duration</span>
                      <strong>{formatDuration(exam.durationMinutes)}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Total Marks</span>
                      <strong>{exam.totalMarks} pts</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Questions</span>
                      <strong>{exam.questionCount || 0} MCQs</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Pass Mark</span>
                      <strong>{exam.passingPercentage}%</strong>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Closes on: <strong>{formatDateTime(exam.endDateTime)}</strong></span>
                    {pastResult && (
                      <span style={{ color: pastResult.isPassed ? 'var(--color-success-text)' : 'var(--color-danger-text)', fontWeight: 600 }}>
                        Previous Score: {pastResult.percentage}% ({pastResult.isPassed ? 'Passed' : 'Failed'})
                      </span>
                    )}
                  </div>
                </CardContent>

                <CardFooter>
                  {isLocked ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Lock size={14} /> Attempt limit reached (Retakes locked)
                      </span>
                      <Link to={`/student/results/${pastResult.id}`} style={{ textDecoration: 'none' }}>
                        <Button variant="secondary" size="sm">
                          View My Scorecard
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        {isCompleted ? 'Additional attempt allowed' : 'First attempt'}
                      </span>
                      <Link to={`/student/exam/${exam.id}/instructions`} style={{ textDecoration: 'none' }}>
                        <Button variant="primary" size="md" iconLeft={<Play size={14} />}>
                          {isCompleted ? 'Retake Examination' : 'Start Examination'}
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AvailableExaminations;

