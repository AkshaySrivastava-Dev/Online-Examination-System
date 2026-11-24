import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { getExaminations } from '../../services/examService.js';
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
  Calendar,
  Search,
  Clock,
  Layers,
  Award,
  AlertCircle,
  CalendarCheck,
} from 'lucide-react';
import { formatDateTime, formatDuration } from '../../utils/formatters.js';

export function UpcomingExaminations() {
  const { currentUser } = useAuth();
  const [exams, setExams] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const allExams = getExaminations({ includeDeleted: false });
    const now = Date.now();

    // Published and scheduled to open in the future
    const upcoming = allExams.filter((e) => {
      if (e.status !== 'published') return false;
      const start = new Date(e.startDateTime).getTime();
      return start > now;
    });

    setExams(upcoming);
  }, []);

  const categories = useMemo(() => {
    const set = new Set(exams.map((e) => e.category || 'General'));
    return Array.from(set);
  }, [exams]);

  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      if (categoryFilter !== 'all' && (e.category || 'General') !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = e.title && e.title.toLowerCase().includes(q);
        const matchDesc = e.description && e.description.toLowerCase().includes(q);
        return matchTitle || matchDesc;
      }
      return true;
    }).sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  }, [exams, search, categoryFilter]);

  // Compute time until start string
  const getTimeUntilStart = (startIso) => {
    const diffMs = new Date(startIso).getTime() - Date.now();
    if (diffMs <= 0) return 'Opening momentarily';

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `Opens in ${days}d ${hours}h`;
    if (hours > 0) return `Opens in ${hours}h ${mins}m`;
    return `Opens in ${mins} minutes`;
  };

  return (
    <div>
      {/* Header */}
      <div className="module-header">
        <div className="module-title-group">
          <div className="eyebrow" style={{ marginBottom: '0.375rem' }}>FORWARD SCHEDULE</div>
          <h1>Upcoming Schedule</h1>
          <p>Scheduled institutional examinations opening in upcoming academic cycles.</p>
        </div>
      </div>

      {/* Filter and Search */}
      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1rem var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '320px', flexWrap: 'wrap' }}>
            <div className="search-input-wrapper" style={{ width: '100%', maxWidth: '320px' }}>
              <Input
                placeholder="Search upcoming examinations..."
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
          </div>

          <Badge variant="neutral" size="md">
            {filteredExams.length} Scheduled Test{filteredExams.length === 1 ? '' : 's'}
          </Badge>
        </div>
      </Card>

      {/* Grid */}
      {filteredExams.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck size={32} />}
          title="No upcoming examinations scheduled"
          description="There are currently no scheduled future examinations. Check available tests to sit active examinations."
        />
      ) : (
        <div className="grid grid-cols-2 md-grid-cols-1 gap-6">
          {filteredExams.map((exam) => (
            <Card key={exam.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <Badge variant="neutral" size="sm">{exam.category || 'General'}</Badge>
                  <Badge variant="primary" size="sm" dot>
                    {getTimeUntilStart(exam.startDateTime)}
                  </Badge>
                </div>

                <CardTitle style={{ fontSize: '1.125rem' }}>{exam.title}</CardTitle>
                <CardDescription style={{ lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {exam.description || 'Institutional curriculum scheduled evaluation.'}
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

                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div>
                    Scheduled Opening: <strong style={{ color: 'var(--color-text-primary)' }}>{formatDateTime(exam.startDateTime)}</strong>
                  </div>
                  <div>
                    Submission Deadline: <span>{formatDateTime(exam.endDateTime)}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={14} /> Opens automatically at scheduled start time
                  </span>
                  <Button variant="secondary" size="md" disabled title="Locked until official schedule opens">
                    Locked
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default UpcomingExaminations;

