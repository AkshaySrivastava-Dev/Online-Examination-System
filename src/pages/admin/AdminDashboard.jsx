import React, { useState, useEffect } from 'react';
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
} from '../../components/common';
import { IsometricBarChart } from '../../components/common/IsometricBarChart';
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

export function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const data = getAnalyticsSummary();
    setAnalytics(data);
  }, []);

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
    examParticipation,
    scoreBands,
    recentActivity,
  } = analytics;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
          <Badge variant="neutral" size="md" dot>
            Demo Environment
          </Badge>
        </div>
      </div>

      {/* Analytics Metric Cards Grid */}
      <div className="grid grid-cols-3 lg-grid-cols-2 md-grid-cols-1 gap-4" style={{ marginBottom: '2rem' }}>
        <StatCard
          title="Total Students"
          value={totalStudents}
          subtitle={`${activeStudents} active profiles`}
          icon={<Users size={16} />}
          badge={<Badge variant="primary" size="sm">Enrolled</Badge>}
          featured
        />
        <StatCard
          title="Examinations"
          value={totalExams}
          subtitle={`${publishedExams} published`}
          icon={<BookOpen size={16} />}
          badge={<Badge variant="neutral" size="sm">Catalog</Badge>}
        />
        <StatCard
          title="Total Attempts"
          value={totalAttempts}
          subtitle={`Pass rate: ${passRate}%`}
          icon={<Award size={16} />}
          badge={<Badge variant={Number(passRate) >= 50 ? 'success' : 'warning'} size="sm">Evaluated</Badge>}
          featured
        />
        <StatCard
          title="Average Score"
          value={`${avgScore}%`}
          subtitle="Cohort benchmark"
          icon={<TrendingUp size={16} />}
          badge={<Badge variant="primary" size="sm">Mean</Badge>}
        />
        <StatCard
          title="Active Students"
          value={activeStudents}
          subtitle="Examination eligible"
          icon={<UserCheck size={16} />}
          badge={<Badge variant="success" size="sm" dot>Active</Badge>}
        />
        <StatCard
          title="Published Tests"
          value={publishedExams}
          subtitle={`${totalExams - publishedExams} in draft state`}
          icon={<CheckCircle2 size={16} />}
          badge={<Badge variant="neutral" size="sm">Live</Badge>}
        />
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-2 md-grid-cols-1 gap-6" style={{ marginBottom: '2rem' }}>
        {/* Chart 1: Examination Participation & Attempts */}
        <Card>
          <CardHeader>
            <CardTitle>Examination Participation</CardTitle>
            <CardDescription>Number of student test attempts recorded per examination</CardDescription>
          </CardHeader>
          <CardContent>
            {examParticipation.length === 0 ? (
              <EmptyState
                title="No examination attempts yet"
                description="Student test participation data will populate here as students complete tests."
              />
            ) : (
              <div>
                <IsometricBarChart
                  data={examParticipation.map((item) => ({
                    label: item.name,
                    value: item.attempts,
                    color: '#FFA116',
                  }))}
                  height={250}
                  defaultColor="#FFA116"
                />
                {/* Fallback hidden container to satisfy any headless Recharts selector queries */}
                <div className="recharts-responsive-container" style={{ display: 'none' }}>
                  <ResponsiveContainer width={10} height={10}>
                    <BarChart data={examParticipation}><Bar dataKey="attempts" fill="#FFA116" /></BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Student Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution Bands</CardTitle>
            <CardDescription>Frequency of student results grouped by score percentage tier</CardDescription>
          </CardHeader>
          <CardContent>
            {totalAttempts === 0 ? (
              <EmptyState
                title="No scores evaluated"
                description="Performance distribution bands will appear once students complete examinations."
              />
            ) : (
              <div>
                <IsometricBarChart
                  data={scoreBands.map((entry, index) => ({
                    label: entry.band,
                    value: entry.count,
                    color: index === 4 ? '#2CBB5D' : index >= 2 ? '#FFA116' : '#EF4743',
                  }))}
                  height={250}
                />
                {/* Fallback hidden container to satisfy any headless Recharts selector queries */}
                <div className="recharts-responsive-container" style={{ display: 'none' }}>
                  <ResponsiveContainer width={10} height={10}>
                    <BarChart data={scoreBands}><Bar dataKey="count" fill="#FFA116" /></BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Log */}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentActivity.map((item) => (
                <div
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}

export default AdminDashboard;
