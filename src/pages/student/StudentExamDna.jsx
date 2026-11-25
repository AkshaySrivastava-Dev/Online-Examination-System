import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { getResults } from '../../services/resultService.js';
import {
  computeExamDna,
  getStudyPlanProgress,
  toggleStudyPlanDay,
} from '../../services/examDnaService.js';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  EmptyState,
  PageTransition,
  FloatingBackgroundElements,
} from '../../components/common';
import {
  Brain,
  Target,
  Clock,
  Compass,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Info,
  ShieldCheck,
  Zap,
  BookOpen,
  Calendar,
  Award,
  CheckSquare,
  Square,
} from 'lucide-react';

export function StudentExamDna() {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialResultId = searchParams.get('resultId') || 'all';

  const [selectedResultId, setSelectedResultId] = useState(initialResultId);
  const [resultsList, setResultsList] = useState([]);
  const [studyPlanProgress, setStudyPlanProgress] = useState({ completedDays: [], progressPercentage: 0 });

  useEffect(() => {
    if (!currentUser) return;
    const studentResults = getResults({ studentId: currentUser.id });
    setResultsList(studentResults);
  }, [currentUser]);

  // Sync study plan progress from LocalStorage
  useEffect(() => {
    if (!currentUser) return;
    const progress = getStudyPlanProgress(currentUser.id, selectedResultId || 'current');
    setStudyPlanProgress(progress);
  }, [currentUser, selectedResultId]);

  // Handle interactive toggle for study plan day
  const handleToggleDay = (dayNumber) => {
    if (!currentUser) return;
    const updated = toggleStudyPlanDay(currentUser.id, dayNumber, selectedResultId || 'current');
    setStudyPlanProgress(updated);
  };

  // Sync URL search param
  const handleSelectResult = (id) => {
    setSelectedResultId(id);
    if (id === 'all') {
      searchParams.delete('resultId');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ resultId: id });
    }
  };

  // Compute ExamDNA profile
  const dnaProfile = useMemo(() => {
    if (!currentUser) return null;
    if (selectedResultId && selectedResultId !== 'all') {
      return computeExamDna({ resultId: selectedResultId });
    }
    return computeExamDna({ studentId: currentUser.id });
  }, [currentUser, selectedResultId, resultsList]);

  if (!currentUser) return null;

  if (resultsList.length === 0) {
    return (
      <div style={{ maxWidth: '720px', margin: '3rem auto' }}>
        <EmptyState
          icon={<Brain size={48} />}
          title="No Examination Data for ExamDNA™"
          description="You haven't completed any examinations yet. Complete an examination to generate your multidimensional performance intelligence profile."
          action={
            <Link to="/student/examinations" style={{ textDecoration: 'none' }}>
              <Button variant="primary">Browse Available Examinations</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const {
    meta,
    topicMastery,
    confidenceAlignment,
    timeIntelligence,
    answerStability,
    recommendations,
    learningIntelligence,
  } = dnaProfile || {
    meta: {},
    topicMastery: [],
    confidenceAlignment: { available: false, matrix: {}, reviewPriorities: [], growthOpportunities: [] },
    timeIntelligence: { available: false },
    answerStability: {},
    recommendations: [],
    learningIntelligence: null,
  };

  const li = learningIntelligence || {
    weakAreas: [],
    strongAreas: [],
    revisionMatrix: [],
    priorityScores: [],
    studyPlan: { days: [] },
    answersFourQuestions: {
      whatDoIKnow: 'Awaiting exam completion.',
      whatAmIWeakAt: 'Awaiting exam completion.',
      whatNeedsRelearnVsRevise: { relearnCount: 0, revisionCount: 0, practiceCount: 0, summaryText: '' },
      whatShouldIStudyFirst: 'Awaiting exam completion.',
      howToSpendNextSevenDays: 'Awaiting exam completion.',
    },
  };

  return (
    <PageTransition style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Header & Navigation */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '1.25rem var(--space-6)',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <FloatingBackgroundElements count={3} opacity={0.35} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 161, 22, 0.12)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Brain size={18} strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              ExamDNA™ Learning Intelligence
            </h1>
            <Badge variant="primary" size="sm">Flagship</Badge>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            Deterministic performance intelligence answering what you know, where you struggle, and what to study first.
          </p>
        </div>

        {/* Attempt Filter Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Scope:
          </label>
          <select
            className="form-input"
            style={{ width: '260px', height: '36px', fontSize: '0.8125rem' }}
            value={selectedResultId}
            onChange={(e) => handleSelectResult(e.target.value)}
          >
            <option value="all">All Examinations (Aggregate Profile)</option>
            {resultsList.map((res) => (
              <option key={res.id} value={res.id}>
                {res.examTitle || res.examSnapshot?.title || 'Exam'} ({res.percentage}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
          }}
        >
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
            Overall Accuracy
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '0.25rem' }}>
            {meta.overallAccuracy || 0}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.125rem' }}>
            Across {meta.totalQuestionsAnalyzed || 0} questions ({meta.analyzedResultsCount || 0} exam{meta.analyzedResultsCount === 1 ? '' : 's'})
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
          }}
        >
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
            Topic Distribution
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.25rem' }}>
            {topicMastery.length} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Domains</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.125rem' }}>
            {topicMastery.filter((t) => t.status === 'strong').length} Strong · {topicMastery.filter((t) => t.status === 'developing').length} Developing
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
          }}
        >
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
            Study Priority Focus
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFA116', marginTop: '0.25rem' }}>
            {li.priorityScores[0] ? `${li.priorityScores[0].priorityScore}/100` : 'N/A'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.125rem' }}>
            {li.priorityScores[0] ? li.priorityScores[0].topic : 'Awaiting data'}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
          }}
        >
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
            7-Day Plan Progress
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.25rem' }}>
            {studyPlanProgress.progressPercentage}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.125rem' }}>
            {studyPlanProgress.completedDays.length} of 7 days completed
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
          }}
        >
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
            Decision Retention
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '0.25rem' }}>
            {answerStability.stabilityRate || 100}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.125rem' }}>
            {answerStability.totalChanges === 0
              ? 'No answer revisions recorded'
              : `${answerStability.totalChanges} revision${answerStability.totalChanges === 1 ? '' : 's'} made`}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: YOUR LEARNING INTELLIGENCE (FLAGSHIP HERO)    */}
      {/* ========================================================= */}
      <Card style={{ marginBottom: '1.75rem', border: '1px solid rgba(255, 161, 22, 0.35)' }}>
        <CardHeader style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'rgba(255, 161, 22, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} style={{ color: '#FFA116' }} />
                <CardTitle style={{ fontSize: '1.125rem' }}>Your Learning Intelligence Profile</CardTitle>
              </div>
              <CardDescription>
                Deterministic answers to the 4 essential student questions derived from verified test data.
              </CardDescription>
            </div>
            <Badge variant="primary" size="md">Deterministic Diagnosis</Badge>
          </div>
        </CardHeader>
        <CardContent style={{ paddingTop: '1.5rem' }}>
          {/* 4 Direct Answers Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* Question 1: What do I know? */}
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: 'rgba(44, 187, 93, 0.06)',
                border: '1px solid rgba(44, 187, 93, 0.25)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <ShieldCheck size={18} style={{ color: 'var(--color-success)' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase' }}>
                  1. What Do I Know?
                </span>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                Confirmed Mastery Domains
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {li.answersFourQuestions.whatDoIKnow}
              </p>
            </div>

            {/* Question 2: What am I weak at? */}
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: 'rgba(239, 71, 67, 0.06)',
                border: '1px solid rgba(239, 71, 67, 0.25)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase' }}>
                  2. What Am I Weak At?
                </span>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                Critical & Developing Deficits
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {li.answersFourQuestions.whatAmIWeakAt}
              </p>
            </div>

            {/* Question 3: What needs revision vs relearning? */}
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: 'rgba(255, 192, 30, 0.06)',
                border: '1px solid rgba(255, 192, 30, 0.25)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <BookOpen size={18} style={{ color: 'var(--color-warning)' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-warning)', textTransform: 'uppercase' }}>
                  3. Relearn vs Revise
                </span>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                Actionable Gap Categorization
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {li.answersFourQuestions.whatNeedsRelearnVsRevise.summaryText || 'Review the matrix below for specific categorization.'}
              </p>
            </div>

            {/* Question 4: What should I study first? */}
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: 'rgba(255, 161, 22, 0.08)',
                border: '1px solid rgba(255, 161, 22, 0.35)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Zap size={18} style={{ color: '#FFA116' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#FFA116', textTransform: 'uppercase' }}>
                  4. What To Study First?
                </span>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                Highest Priority Target
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {li.answersFourQuestions.whatShouldIStudyFirst}
              </p>
            </div>
          </div>

          {/* Transparent Diagnostic Notice */}
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1.45,
            }}
          >
            <strong>Diagnostic Rules:</strong> Topics with &lt;5 questions are classified as <em>preliminary</em> and non-conclusive. Minimum 3 questions are strictly required before classifying a topic as weak or strong. Recommendations are pure deterministic mathematics derived from actual scorecards without black-box AI.
          </div>
        </CardContent>
      </Card>

      {/* ========================================================= */}
      {/* SECTION 2: LEARNING PRIORITY SCORE & REVISION MATRIX     */}
      {/* ========================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.75rem', marginBottom: '1.75rem' }}>
        {/* Priority Rankings (Score 0-100) */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={18} style={{ color: '#FFA116' }} />
                  <span>Personalized Learning Priority Rankings</span>
                </CardTitle>
                <CardDescription>
                  Multi-factor weighted priority score (0-100) determining what to study first.
                </CardDescription>
              </div>
              <Badge variant="primary" size="sm">Score 0-100</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {li.priorityScores.map((item) => {
                const tierVariant =
                  item.priorityTier === 'Urgent'
                    ? 'danger'
                    : item.priorityTier === 'High'
                    ? 'warning'
                    : item.priorityTier === 'Moderate'
                    ? 'primary'
                    : 'neutral';

                return (
                  <div
                    key={item.topic}
                    style={{
                      padding: '1rem',
                      backgroundColor: 'var(--color-surface-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: item.rank === 1 ? 'rgba(255, 161, 22, 0.2)' : 'var(--color-surface)',
                            color: item.rank === 1 ? '#FFA116' : 'var(--color-text-secondary)',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          #{item.rank}
                        </span>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {item.topic}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                            {item.subject} · {item.totalQuestions} questions tested
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '1.125rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
                            {item.priorityScore}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>/ 100</span>
                          <Badge variant={tierVariant} size="sm">
                            {item.priorityTier} Priority
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Mini Score Bar */}
                    <div
                      style={{
                        height: '6px',
                        backgroundColor: 'var(--color-border)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${item.priorityScore}%`,
                          backgroundColor:
                            item.priorityTier === 'Urgent'
                              ? 'var(--color-danger)'
                              : item.priorityTier === 'High'
                              ? 'var(--color-warning)'
                              : 'var(--color-primary)',
                          borderRadius: '3px',
                        }}
                      />
                    </div>

                    {/* Breakdown dimensions */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        fontSize: '0.6875rem',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      <span>Deficit: <strong>{item.components.accuracyDeficit}/35</strong></span>
                      <span>Recurrence: <strong>{item.components.errorRecurrence}/25</strong></span>
                      <span>Confidence: <strong>{item.components.confidenceMisalignment}/15</strong></span>
                      <span>Difficulty: <strong>{item.components.difficultyPerformance}/15</strong></span>
                      <span>Volatility: <strong>{item.components.trendVolatility}/10</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Revision vs Relearning Matrix */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen size={18} style={{ color: 'var(--color-primary)' }} />
                  <span>Revision vs. Relearning Matrix</span>
                </CardTitle>
                <CardDescription>
                  Actionable categorizations distinguishing theory relearning from targeted problem revision.
                </CardDescription>
              </div>
              <Badge variant="neutral" size="sm">Action Matrix</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {li.revisionMatrix.map((item) => {
                const categoryVariant =
                  item.category === 'Concept Relearning'
                    ? 'danger'
                    : item.category === 'Targeted Revision'
                    ? 'warning'
                    : item.category === 'Practice Needed'
                    ? 'primary'
                    : item.category === 'Maintain Mastery'
                    ? 'success'
                    : 'neutral';

                return (
                  <div
                    key={item.topic}
                    style={{
                      padding: '1rem',
                      backgroundColor: 'var(--color-surface-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {item.topic}
                      </span>
                      <Badge variant={categoryVariant} size="sm">
                        {item.category}
                      </Badge>
                    </div>

                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.45, margin: '0 0 0.5rem 0' }}>
                      {item.actionableGuidance}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                      <span>Accuracy: <strong>{item.accuracy}%</strong></span>
                      <span>Questions: <strong>{item.totalQuestions}</strong></span>
                      {item.avgTimeSec !== null && <span>Avg Time: <strong>{item.avgTimeSec}s</strong></span>}
                      {item.highConfidenceIncorrectCount > 0 && (
                        <span style={{ color: 'var(--color-danger)' }}>
                          <strong>{item.highConfidenceIncorrectCount}</strong> high-conf error{item.highConfidenceIncorrectCount === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================= */}
      {/* SECTION 3: PERSONALIZED 7-DAY STUDY PLAN (INTERACTIVE)    */}
      {/* ========================================================= */}
      <Card style={{ marginBottom: '1.75rem' }}>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
                <span>Personalized 7-Day Study Plan</span>
              </CardTitle>
              <CardDescription>
                Tailored 7-day revision trajectory mapped directly to your priority topics and learning gaps.
              </CardDescription>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                {studyPlanProgress.completedDays.length} of 7 Days Completed
              </span>
              <Badge variant={studyPlanProgress.progressPercentage === 100 ? 'success' : 'primary'} size="md">
                {studyPlanProgress.progressPercentage}% Complete
              </Badge>
            </div>
          </div>

          {/* Interactive Progress Bar */}
          <div
            style={{
              height: '8px',
              backgroundColor: 'var(--color-border)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginTop: '0.75rem',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${studyPlanProgress.progressPercentage}%`,
                backgroundColor: studyPlanProgress.progressPercentage === 100 ? 'var(--color-success)' : 'var(--color-primary)',
                borderRadius: '4px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {li.studyPlan.days.map((d) => {
              const isChecked = studyPlanProgress.completedDays.includes(d.day);

              return (
                <div
                  key={d.day}
                  onClick={() => handleToggleDay(d.day)}
                  style={{
                    padding: '1.125rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isChecked ? 'rgba(44, 187, 93, 0.08)' : 'var(--color-surface-subtle)',
                    border: `1px solid ${isChecked ? 'rgba(44, 187, 93, 0.35)' : 'var(--color-border)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            color: isChecked ? 'var(--color-success)' : 'var(--color-primary)',
                            textTransform: 'uppercase',
                          }}
                        >
                          Day {d.day}
                        </span>
                        <Badge variant="outline" size="sm">
                          {d.focusTopic}
                        </Badge>
                      </div>

                      {/* Interactive Checkbox */}
                      <div style={{ color: isChecked ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                        {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                        marginBottom: '0.375rem',
                        textDecoration: isChecked ? 'line-through' : 'none',
                        opacity: isChecked ? 0.85 : 1,
                      }}
                    >
                      {d.title}
                    </div>

                    <p
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.45,
                        margin: '0 0 0.75rem 0',
                      }}
                    >
                      {d.activity}
                    </p>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid var(--color-border)',
                      paddingTop: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.6875rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <span>Target: <strong>{d.targetDurationMinutes} mins</strong></span>
                    <span style={{ color: isChecked ? 'var(--color-success)' : 'inherit' }}>
                      {isChecked ? '✓ Completed' : d.goal}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ========================================================= */}
      {/* SECTION 4: TELEMETRY & FOUNDATIONAL DIMENSIONS            */}
      {/* ========================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.75rem', marginBottom: '1.75rem' }}>
        {/* Dimension 1: Topic Mastery */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Target size={18} style={{ color: 'var(--color-primary)' }} />
                  <span>Topic Mastery & Accuracy Breakdown</span>
                </CardTitle>
                <CardDescription>
                  Granular performance classified by topic domain with sample-size transparency.
                </CardDescription>
              </div>
              <Badge variant="neutral" size="sm">{topicMastery.length} Topics</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {topicMastery.map((tm) => {
                const badgeVariant =
                  tm.status === 'strong' ? 'success' : tm.status === 'developing' ? 'warning' : 'danger';
                const statusLabel =
                  tm.status === 'strong' ? 'Strong' : tm.status === 'developing' ? 'Developing' : 'Core Revision';

                return (
                  <div
                    key={tm.topic}
                    style={{
                      padding: '1rem 1.25rem',
                      backgroundColor: 'var(--color-surface-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {tm.topic}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '0.75rem' }}>
                          {tm.correct} of {tm.totalQuestions} questions correct ({tm.attempted} attempted)
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        {tm.avgTimeSec !== null && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                            ~{tm.avgTimeSec}s / q
                          </span>
                        )}
                        <Badge variant={badgeVariant} size="sm">
                          {statusLabel}
                        </Badge>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div
                      style={{
                        height: '8px',
                        width: '100%',
                        backgroundColor: 'var(--color-border)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${tm.accuracy}%`,
                          backgroundColor:
                            tm.status === 'strong'
                              ? 'var(--color-success)'
                              : tm.status === 'developing'
                              ? 'var(--color-warning)'
                              : 'var(--color-danger)',
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.375rem' }}>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                        Based on {tm.totalQuestions} question{tm.totalQuestions === 1 ? '' : 's'}
                        {tm.totalQuestions < 5 ? ' (Preliminary sample · Non-conclusive)' : ''}
                      </span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {tm.accuracy}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Dimension 2: Confidence Alignment Matrix */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Compass size={18} style={{ color: 'var(--color-primary)' }} />
                  <span>Confidence Alignment Quadrant (100% Reconciled)</span>
                </CardTitle>
                <CardDescription>
                  Calibration matrix cross-referencing self-reported confidence against actual correctness.
                </CardDescription>
              </div>
              <Badge variant={confidenceAlignment.available ? 'success' : 'neutral'} size="sm">
                {confidenceAlignment.available ? 'Active Matrix' : 'No Confidence Logged'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {!confidenceAlignment.available ? (
              <div
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--color-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--color-border)',
                }}
              >
                <Info size={28} style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Confidence Data Not Recorded for This Scope
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '0.25rem auto 0', lineHeight: 1.5 }}>
                  During future examinations, use the optional <em>Low / Medium / High</em> confidence selector on question cards to unlock your calibration matrix and identify blind spots.
                </div>
              </div>
            ) : (
              <div>
                {/* 2x2 Quadrant Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  {/* High + Correct: True Mastery */}
                  <div
                    style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(44, 187, 93, 0.08)',
                      border: '1px solid rgba(44, 187, 93, 0.25)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-success)' }}>
                        True Mastery
                      </span>
                      <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                      {confidenceAlignment.matrix.highCorrect}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                      High confidence & verified correct. Rock-solid understanding.
                    </div>
                  </div>

                  {/* High + Incorrect: Review Priority */}
                  <div
                    style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(239, 71, 67, 0.08)',
                      border: '1px solid rgba(239, 71, 67, 0.25)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-danger)' }}>
                        Review Priority
                      </span>
                      <AlertTriangle size={16} style={{ color: 'var(--color-danger)' }} />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                      {confidenceAlignment.matrix.highIncorrect}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                      High confidence but incorrect. Critical misconception to address.
                    </div>
                  </div>

                  {/* Low + Correct: Potential Guess */}
                  <div
                    style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(255, 192, 30, 0.08)',
                      border: '1px solid rgba(255, 192, 30, 0.25)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-warning)' }}>
                        Potential Guess
                      </span>
                      <HelpCircle size={16} style={{ color: 'var(--color-warning)' }} />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                      {confidenceAlignment.matrix.lowCorrect}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                      Low confidence but correct. Reinforce with deliberate practice.
                    </div>
                  </div>

                  {/* Low + Incorrect: Formative Area */}
                  <div
                    style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                        Known Unknown
                      </span>
                      <Info size={16} style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                      {confidenceAlignment.matrix.lowIncorrect}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                      Low confidence and incorrect. Expected gap; study required.
                    </div>
                  </div>
                </div>

                {/* Medium Confidence Summary */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <span>
                    Medium Confidence: <strong>{confidenceAlignment.matrix.medCorrect || 0}</strong> correct ·{' '}
                    <strong>{confidenceAlignment.matrix.medIncorrect || 0}</strong> incorrect
                  </span>
                  <span>
                    Unspecified: <strong>{confidenceAlignment.matrix.unspecified || 0}</strong>
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dimension 3 & 4: Time Intelligence and Answer Stability */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.75rem' }}>
          {/* Time Intelligence */}
          <Card>
            <CardHeader>
              <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} style={{ color: 'var(--color-primary)' }} />
                <span>Pacing & Time Allocation</span>
              </CardTitle>
              <CardDescription>Per-question latency and cognitive pacing behavior.</CardDescription>
            </CardHeader>
            <CardContent>
              {timeIntelligence.available ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--color-surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Average Dwell Time</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Per-question across all attempts</div>
                    </div>
                    <strong style={{ fontSize: '1.125rem', fontFamily: 'var(--font-mono)' }}>
                      {timeIntelligence.avgTimePerQuestionSec}s
                    </strong>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--color-surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Rapid Answers (&lt;15s)</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Quick recall or impulsive selection</div>
                    </div>
                    <Badge variant={timeIntelligence.rapidResponsesCount > 0 ? 'warning' : 'neutral'} size="sm">
                      {timeIntelligence.rapidResponsesCount} item{timeIntelligence.rapidResponsesCount === 1 ? '' : 's'}
                    </Badge>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--color-surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Deliberate Answers (&gt;120s)</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Deep deliberation or complex calculation</div>
                    </div>
                    <Badge variant={timeIntelligence.deliberateResponsesCount > 0 ? 'primary' : 'neutral'} size="sm">
                      {timeIntelligence.deliberateResponsesCount} item{timeIntelligence.deliberateResponsesCount === 1 ? '' : 's'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                  No per-question timing data logged for historical attempts.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Answer Stability */}
          <Card>
            <CardHeader>
              <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RefreshCw size={18} style={{ color: 'var(--color-primary)' }} />
                <span>Decision & Answer Stability</span>
              </CardTitle>
              <CardDescription>First-choice retention vs answer modification behavior.</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--color-surface-subtle)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      First-Choice Option Retention
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                      Submitted without revising initial response
                    </div>
                  </div>
                  <strong style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
                    {answerStability.stabilityRate}%
                  </strong>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--color-surface-subtle)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Total Answer Modifications
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                      {answerStability.totalChanges === 0
                        ? 'No answer revisions recorded'
                        : `${answerStability.questionsChangedCount} item${answerStability.questionsChangedCount === 1 ? '' : 's'} altered`}
                    </div>
                  </div>
                  <strong style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>
                    {answerStability.totalChanges}
                  </strong>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--color-surface-subtle)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Revision Effectiveness</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                      {answerStability.totalChanges === 0
                        ? 'All original responses retained'
                        : 'Outcome of modified choices'}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                    {answerStability.totalChanges === 0 ? (
                      <span style={{ color: 'var(--color-text-muted)' }}>No revisions recorded</span>
                    ) : (
                      <>
                        <span style={{ color: 'var(--color-success)' }}>+{answerStability.changedToCorrect} correct</span>
                        {' · '}
                        <span style={{ color: 'var(--color-danger)' }}>-{answerStability.changedToIncorrect} lost</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Cognitive Interpretive Guard */}
                <div
                  style={{
                    padding: '0.625rem 0.875rem',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.6875rem',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.45,
                  }}
                >
                  <em>Note: First-choice retention measures decision stability during the attempt, not conceptual mastery. A high retention rate with low accuracy indicates persistent misconceptions. Refer to Topic Mastery for validated accuracy.</em>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dimension 5: Actionable Personalized Recommendations */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
                  <span>Deterministic Study Recommendations</span>
                </CardTitle>
                <CardDescription>
                  Explainable next steps derived directly from topic mastery accuracy bands.
                </CardDescription>
              </div>
              <Badge variant="neutral" size="sm">Rule-Based · Non-AI</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recommendations.map((rec, i) => {
                const badgeVariant =
                  rec.priority === 'high' ? 'danger' : rec.priority === 'medium' ? 'warning' : 'success';

                return (
                  <div
                    key={i}
                    style={{
                      padding: '1rem 1.25rem',
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
                    <div style={{ flex: 1, minWidth: '260px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {rec.topic}
                        </span>
                        <Badge variant={badgeVariant} size="sm">
                          {rec.level}
                        </Badge>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                        {rec.text}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                        Calculated Basis
                      </div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {rec.basis}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Methodology Note */}
            <div
              style={{
                marginTop: '1.25rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.6875rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.5,
              }}
            >
              <strong>Transparent Methodology:</strong> Recommendations are strictly deterministic. &lt;60% accuracy triggers Core Revision (foundational review); 60–79% triggers Intermediate Practice (application strengthening); &ge;80% triggers Advanced Mastery (synthesis and complex challenges). No external AI models or black-box predictions are used.
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

export default StudentExamDna;
