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
    <div>
      {/* Module Header */}
      <div className="module-header">
        <div className="module-title-group">
          <div className="eyebrow" style={{ marginBottom: '0.375rem' }}>INSTITUTIONAL INTELLIGENCE</div>
          <h1>System Overview & Analytics</h1>
          <p>Real-time institutional metrics, examination participation, and student performance.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Badge variant="primary" size="md" dot>
            Live Production Node
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
        />
        <StatCard
          title="Examinations"
          value={totalExams}
          subtitle={`${publishedExams} currently published`}
          icon={<BookOpen size={16} />}
          badge={<Badge variant="success" size="sm">Curriculum</Badge>}
        />
        <StatCard
          title="Total Attempts"
          value={totalAttempts}
          subtitle={`Pass rate: ${passRate}%`}
          icon={<Award size={16} />}
          badge={<Badge variant={Number(passRate) >= 50 ? 'success' : 'warning'} size="sm">Evaluated</Badge>}
        />
        <StatCard
          title="Average Score"
          value={`${avgScore}%`}
          subtitle="Across all completed tests"
          icon={<TrendingUp size={16} />}
          badge={<Badge variant="neutral" size="sm">Mean</Badge>}
        />
        <StatCard
          title="Active Students"
          value={activeStudents}
          subtitle="Eligible for examinations"
          icon={<UserCheck size={16} />}
          badge={<Badge variant="success" size="sm" dot>Live</Badge>}
        />
        <StatCard
          title="Published Tests"
          value={publishedExams}
          subtitle={`${totalExams - publishedExams} in draft review`}
          icon={<CheckCircle2 size={16} />}
          badge={<Badge variant="primary" size="sm">Available</Badge>}
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
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={examParticipation} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#202527" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#A5A9AC' }}
                      axisLine={{ stroke: '#303638' }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#A5A9AC' }}
                      axisLine={{ stroke: '#303638' }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#171B1D',
                        border: '1px solid #303638',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#FFFFFF',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                      }}
                      itemStyle={{ color: '#FF7900' }}
                      labelStyle={{ color: '#FFFFFF', fontWeight: 600 }}
                      formatter={(val, name, item) => [`${val} attempts`, item.payload.fullName]}
                    />
                    <Bar dataKey="attempts" fill="var(--color-primary)" radius={[3, 3, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
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
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreBands} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#202527" />
                    <XAxis
                      dataKey="band"
                      tick={{ fontSize: 11, fill: '#A5A9AC' }}
                      axisLine={{ stroke: '#303638' }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#A5A9AC' }}
                      axisLine={{ stroke: '#303638' }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#171B1D',
                        border: '1px solid #303638',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#FFFFFF',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                      }}
                      itemStyle={{ color: '#FF7900' }}
                      labelStyle={{ color: '#FFFFFF', fontWeight: 600 }}
                      formatter={(val) => [`${val} students`, 'Count']}
                    />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={36}>
                      {scoreBands.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 4 ? '#22C55E' : index >= 2 ? '#FF7900' : '#EF4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
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
    </div>
  );
}

export default AdminDashboard;
