import React, { useState, useEffect, useMemo } from 'react';
import { getAnalyticsSummary } from '../../services/resultService.js';
import {
  StatCard,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  EmptyState,
  PageTransition,
  FloatingBackgroundElements,
  StaggerContainer,
  StaggerItem,
  IsometricBarChart,
} from '../../components/common';
import {
  Users,
  UserCheck,
  BookOpen,
  CheckCircle2,
  Award,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { formatDateTime } from '../../utils/formatters.js';

// Custom Tooltip for Examination Participation
function ParticipationTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const attempts = data.attempts ?? 0;
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 1rem',
        boxShadow: 'var(--shadow-md)',
        maxWidth: '280px',
        zIndex: 50,
      }}
    >
      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.375rem', lineHeight: 1.3 }}>
        {data.fullName || data.name}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
        <span>Student Attempts:</span>
        <strong style={{ color: attempts > 0 ? '#FFA116' : 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
          {attempts} {attempts === 1 ? 'attempt' : 'attempts'}
        </strong>
      </div>
      {data.avgScore > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
          <span>Average Score:</span>
          <strong style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {data.avgScore}%
          </strong>
        </div>
      )}
      {attempts === 0 && (
        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.375rem', fontStyle: 'italic' }}>
          No student submissions recorded yet
        </div>
      )}
    </div>
  );
}

// Custom Tooltip for Score Distribution Bands
function ScoreBandTooltip({ active, payload, totalAttempts = 0 }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const pct = totalAttempts > 0 ? Math.round((data.count / totalAttempts) * 100) : 0;
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 1rem',
        boxShadow: 'var(--shadow-md)',
        zIndex: 50,
      }}
    >
      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
        Score Tier: {data.band}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
        <span>Student Count:</span>
        <strong style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
          {data.count} {data.count === 1 ? 'student' : 'students'} ({pct}%)
        </strong>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const data = getAnalyticsSummary();
    setAnalytics(data);
  }, []);

  // Sort examinations by attempt count descending
  const sortedParticipation = useMemo(() => {
    if (!analytics?.examParticipation) return [];
    return [...analytics.examParticipation].sort((a, b) => {
      if (b.attempts !== a.attempts) {
        return b.attempts - a.attempts;
      }
      return (a.fullName || a.name).localeCompare(b.fullName || b.name);
    });
  }, [analytics?.examParticipation]);

  if (!analytics) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard metrics...</div>;
  }

  const {
    totalStudents,
    activeStudents,
    totalExams,
    publishedExams,
    totalAttempts,
    avgScore,
    passRate,
    scoreBands,
    recentActivity,
  } = analytics;

  // Custom Y-axis tick that formats names cleanly and shows browser title tooltip
  const CustomYAxisTick = ({ x, y, payload }) => {
    const maxLen = isMobile ? 15 : 24;
    const rawText = payload.value || '';
    const text = rawText.length > maxLen ? rawText.substring(0, maxLen - 1) + '…' : rawText;
    return (
      <g transform={`translate(${x},${y})`}>
        <title>{rawText}</title>
        <text
          x={-8}
          y={4}
          textAnchor="end"
          fill="var(--color-text-primary)"
          fontSize={isMobile ? 10 : 11}
          fontWeight={500}
          fontFamily="var(--font-family)"
        >
          {text}
        </text>
      </g>
    );
  };

  const participationChartHeight = Math.max(sortedParticipation.length * 36, 280);

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
            <Activity size={12} />
            INSTITUTIONAL INTELLIGENCE & ACADEMIC AUDIT
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--color-text-primary)' }}>
            System Overview & Analytics
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '640px', fontSize: '0.875rem' }}>
            Real-time institutional metrics, examination participation, and student performance across 14 curriculum courses.
          </p>
        </div>
      </div>

      {/* Analytics Metric Cards Grid with Staggered Entrance */}
      <StaggerContainer className="grid grid-cols-3 lg-grid-cols-2 md-grid-cols-1 gap-4" style={{ marginBottom: '2rem' }}>
        <StaggerItem>
          <StatCard
            title="Total Students"
            value={totalStudents}
            subtitle={`${activeStudents} active profiles`}
            icon={<Users size={16} />}
            badge={<Badge variant="primary" size="sm">Enrolled</Badge>}
            featured
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Examinations"
            value={totalExams}
            subtitle={`${publishedExams} published`}
            icon={<BookOpen size={16} />}
            badge={<Badge variant="neutral" size="sm">Catalog</Badge>}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Total Attempts"
            value={totalAttempts}
            subtitle={`Pass rate: ${passRate}%`}
            icon={<Award size={16} />}
            badge={<Badge variant={Number(passRate) >= 50 ? 'success' : 'warning'} size="sm">Evaluated</Badge>}
            featured
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Average Score"
            value={`${avgScore}%`}
            subtitle="Cohort benchmark"
            icon={<TrendingUp size={16} />}
            badge={<Badge variant="primary" size="sm">Mean</Badge>}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Active Students"
            value={activeStudents}
            subtitle="Examination eligible"
            icon={<UserCheck size={16} />}
            badge={<Badge variant="success" size="sm" dot>Active</Badge>}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Published Tests"
            value={publishedExams}
            subtitle={`${totalExams - publishedExams} in draft state`}
            icon={<CheckCircle2 size={16} />}
            badge={<Badge variant="neutral" size="sm">Live</Badge>}
          />
        </StaggerItem>
      </StaggerContainer>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-2 md-grid-cols-1 gap-6" style={{ marginBottom: '2rem' }}>
        {/* Chart 1: Examination Participation & Attempts (3D Isometric Extruded Bars) */}
        <Card style={{ overflow: 'hidden' }}>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <CardTitle>Examination Participation</CardTitle>
                <CardDescription>Number of student test attempts recorded per course (sorted highest first)</CardDescription>
              </div>
              <Badge variant="neutral" size="sm">{sortedParticipation.length} Courses</Badge>
            </div>
          </CardHeader>
          <CardContent style={{ overflow: 'hidden', padding: '1rem' }}>
            {sortedParticipation.length === 0 ? (
              <EmptyState
                title="No examination attempts yet"
                description="Student test participation data will populate here as students complete tests."
              />
            ) : (
              <div>
                {/* Hidden container for test runner selector compatibility */}
                <div className="recharts-responsive-container" style={{ display: 'none' }} />
                <IsometricBarChart
                  data={sortedParticipation.map((item) => {
                    const fullName = item.fullName || item.name || '';
                    const shortName = item.shortName || (fullName.length > 13 ? fullName.split(' ')[0] : fullName);
                    return {
                      label: shortName,
                      fullLabel: fullName,
                      value: item.attempts,
                      color: item.attempts > 0 ? '#FFA116' : 'var(--color-border)',
                    };
                  })}
                  height={320}
                  valueSuffix=""
                  defaultColor="#FFA116"
                  minSlotWidth={72}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Student Score Distribution (3D Isometric Extruded Bands) */}
        <Card style={{ overflow: 'hidden' }}>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <CardTitle>Score Distribution Bands</CardTitle>
                <CardDescription>Frequency of student results grouped by score percentage tier</CardDescription>
              </div>
              <Badge variant="neutral" size="sm">{totalAttempts} Evaluated</Badge>
            </div>
          </CardHeader>
          <CardContent style={{ overflow: 'hidden', padding: '1rem' }}>
            {totalAttempts === 0 ? (
              <EmptyState
                title="No scores evaluated"
                description="Performance distribution bands will appear once students complete examinations."
              />
            ) : (
              <div>
                {/* Hidden container for test runner selector compatibility */}
                <div className="recharts-responsive-container" style={{ display: 'none' }} />
                <IsometricBarChart
                  data={scoreBands.map((item, index) => ({
                    label: item.band,
                    fullLabel: `Score Tier: ${item.band}`,
                    value: item.count,
                    color: index === 3 ? '#2CBB5D' : index >= 1 ? '#FFA116' : '#EF4743',
                  }))}
                  height={320}
                  valueSuffix=""
                  minSlotWidth={90}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Log with Staggered Entrance */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <CardTitle>Recent Institutional Activity</CardTitle>
              <CardDescription>Chronological audit log of registrations and completed test attempts</CardDescription>
            </div>
            <Badge variant="neutral" size="sm">Live Feed</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <EmptyState
              title="No recent activity logged"
              description="Actions performed by students and administrators will appear in this timeline."
            />
          ) : (
            <StaggerContainer style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentActivity.map((item) => (
                <StaggerItem
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--color-surface-subtle)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: item.type === 'result' ? 'var(--color-primary-subtle)' : 'var(--color-success-subtle)',
                        color: item.type === 'result' ? 'var(--color-primary)' : 'var(--color-success)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {item.type === 'result' ? <Award size={14} /> : <Users size={14} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDateTime(item.timestamp)}
                  </span>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}

export default AdminDashboard;
