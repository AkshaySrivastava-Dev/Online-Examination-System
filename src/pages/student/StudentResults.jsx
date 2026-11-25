import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { getResults } from '../../services/resultService.js';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
  PageTransition,
  FloatingBackgroundElements,
  AnimatedCounter,
  StaggerContainer,
  StaggerItem,
} from '../../components/common';
import {
  Award,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { formatDate, formatDateTime, formatDuration } from '../../utils/formatters.js';

export function StudentResults() {
  const { currentUser } = useAuth();
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!currentUser) return;
    const studentResults = getResults({ studentId: currentUser.id });
    // Sort latest first
    studentResults.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    setResults(studentResults);
  }, [currentUser]);

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      if (statusFilter === 'passed' && !r.isPassed) return false;
      if (statusFilter === 'failed' && r.isPassed) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const title = (r.examTitle || r.examSnapshot?.title || '').toLowerCase();
        return title.includes(q);
      }
      return true;
    });
  }, [results, search, statusFilter]);

  // Overall performance stats
  const stats = useMemo(() => {
    if (results.length === 0) return { total: 0, passed: 0, avg: 0 };
    const total = results.length;
    const passed = results.filter((r) => r.isPassed).length;
    const sum = results.reduce((acc, r) => acc + (r.percentage || 0), 0);
    const avg = Number((sum / total).toFixed(1));
    return { total, passed, avg };
  }, [results]);

  const columns = [
    {
      key: 'exam',
      header: 'Examination',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {row.examTitle || row.examSnapshot?.title || 'Examination'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Category: {row.examSnapshot?.category || 'General'}
          </div>
        </div>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      render: (val) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          {formatDateTime(val)}
        </span>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
            {row.marksObtained} / {row.totalMarks} pts
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {row.percentage}%
          </div>
        </div>
      ),
    },
    {
      key: 'outcome',
      header: 'Status',
      render: (_, row) => (
        <Badge variant={row.isPassed ? 'success' : 'danger'} size="sm" dot>
          {row.isPassed ? 'Passed' : 'Failed'}
        </Badge>
      ),
    },
    {
      key: 'submissionType',
      header: 'Mode',
      render: (val) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
          {val === 'auto-timer' ? 'Auto (Timer)' : 'Manual'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (_, row) => (
        <div style={{ textAlign: 'right' }}>
          <Link to={`/student/results/${row.id}`} style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm" iconRight={<ArrowRight size={13} />}>
              View Scorecard
            </Button>
          </Link>
        </div>
      ),
    },
  ];

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
            <Award size={12} />
            ASSESSMENT ARCHIVE & SCORECARDS
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--color-text-primary)' }}>
            My Examination Results
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '640px', fontSize: '0.875rem' }}>
            Historical evaluation records, verified scorecards and itemized answer breakdowns.
          </p>
        </div>
      </div>

      {/* Summary KPI Strip with Stagger and Animated Counters */}
      <StaggerContainer className="grid grid-cols-3 md-grid-cols-1 gap-4" style={{ marginBottom: '1.5rem' }}>
        <StaggerItem>
          <Card style={{ padding: '1rem var(--space-5)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Completed Attempts
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
              <AnimatedCounter value={stats.total} />
            </div>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card style={{ padding: '1rem var(--space-5)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Passed Assessments
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-success-text)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
              <AnimatedCounter value={stats.passed} />{' '}
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
                ({stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0}%)
              </span>
            </div>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card style={{ padding: '1rem var(--space-5)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Cumulative Average
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary-text)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
              <AnimatedCounter value={`${stats.avg}%`} />
            </div>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Filter and Table Card */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '300px' }}>
              <div className="search-input-wrapper" style={{ width: '100%', maxWidth: '300px' }}>
                <Input
                  placeholder="Search examinations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  iconLeft={<Search size={15} />}
                />
              </div>

              <select
                className="form-input"
                style={{ width: '150px', height: '38px', padding: '0 0.5rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Outcomes</option>
                <option value="passed">Passed Only</option>
                <option value="failed">Failed Only</option>
              </select>
            </div>

            <Badge variant="neutral" size="md">
              {filteredResults.length} Result{filteredResults.length === 1 ? '' : 's'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent style={{ padding: 0 }}>
          {filteredResults.length === 0 ? (
            <div style={{ padding: '2rem' }}>
              <EmptyState
                icon={<Award size={32} />}
                title="No examination results available"
                description="You have not completed any examinations matching the search criteria yet."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Examination</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {row.examTitle || row.examSnapshot?.title || 'Examination'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Category: {row.examSnapshot?.category || 'General'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        {formatDateTime(row.submittedAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                          {row.marksObtained} / {row.totalMarks} pts
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {row.percentage}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.isPassed ? 'success' : 'danger'} size="sm" dot>
                        {row.isPassed ? 'Passed' : 'Failed'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                        {row.submissionType === 'auto-timer' ? 'Auto (Timer)' : 'Manual'}
                      </span>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <Link to={`/student/results/${row.id}`} style={{ textDecoration: 'none' }}>
                        <Button variant="secondary" size="sm" iconRight={<ArrowRight size={13} />}>
                          View Scorecard
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}

export default StudentResults;
