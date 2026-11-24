/**
 * ExamPro Results & Analytics Service
 *
 * Provides querying over immutable examination results and
 * computes real-time analytics for the Admin Dashboard.
 */

import { getItem } from './storageService.js';
import { getExaminations } from './examService.js';
import { getStudents } from './studentService.js';

/**
 * Retrieve examination results with optional filters.
 *
 * @param {Object} [filter]
 * @param {string} [filter.search='']
 * @param {string} [filter.examId='']
 * @param {string} [filter.studentId='']
 * @param {'all'|'passed'|'failed'} [filter.status='all']
 * @returns {Array} Filtered list of results
 */
export const getResults = ({
  search = '',
  examId = '',
  studentId = '',
  status = 'all',
} = {}) => {
  const results = getItem('results', []);
  const query = search.trim().toLowerCase();

  return results.filter((res) => {
    if (examId && res.examId !== examId) return false;
    if (studentId && res.studentSnapshot?.id !== studentId) return false;
    if (status === 'passed' && !res.isPassed) return false;
    if (status === 'failed' && res.isPassed) return false;

    if (query) {
      const studentName = res.studentSnapshot?.fullName?.toLowerCase() || '';
      const studentEmail = res.studentSnapshot?.email?.toLowerCase() || '';
      const stdId = res.studentSnapshot?.studentId?.toLowerCase() || '';
      const examTitle = res.examSnapshot?.title?.toLowerCase() || '';

      return (
        studentName.includes(query) ||
        studentEmail.includes(query) ||
        stdId.includes(query) ||
        examTitle.includes(query)
      );
    }

    return true;
  });
};

/**
 * Retrieve single result by ID.
 * @param {string} id
 * @returns {Object|null}
 */
export const getResultById = (id) => {
  if (!id) return null;
  const results = getItem('results', []);
  return results.find((r) => r.id === id) || null;
};

/**
 * Compute real-time dashboard analytics derived from LocalStorage.
 *
 * @returns {Object} Dashboard metrics, charts data, and recent activity
 */
export const getAnalyticsSummary = () => {
  const students = getStudents({ includeDeleted: false });
  const activeStudents = students.filter((s) => s.status === 'active');

  const exams = getExaminations({ includeDeleted: false });
  const publishedExams = exams.filter((e) => e.status === 'published');

  const results = getItem('results', []);

  // Compute Overall Averages
  const totalAttempts = results.length;
  const avgScore =
    totalAttempts > 0
      ? (
          results.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0) /
          totalAttempts
        ).toFixed(1)
      : '0.0';

  const passedCount = results.filter((r) => r.isPassed).length;
  const passRate =
    totalAttempts > 0 ? ((passedCount / totalAttempts) * 100).toFixed(1) : '0.0';

  // Chart 1: Examination Participation & Average Score
  const examParticipation = publishedExams.map((exam) => {
    const examResults = results.filter((r) => r.examId === exam.id);
    const count = examResults.length;
    const examAvg =
      count > 0
        ? (
            examResults.reduce((acc, c) => acc + (Number(c.percentage) || 0), 0) /
            count
          ).toFixed(1)
        : 0;

    return {
      name: exam.title.length > 20 ? exam.title.substring(0, 18) + '...' : exam.title,
      fullName: exam.title,
      attempts: count,
      avgScore: Number(examAvg),
    };
  });

  // Chart 2: Performance Distribution Bands
  const scoreBands = [
    { band: '0–39%', count: 0, fill: '#DC2626' },
    { band: '40–59%', count: 0, fill: '#D97706' },
    { band: '60–79%', count: 0, fill: '#4F46E5' },
    { band: '80–100%', count: 0, fill: '#16A34A' },
  ];

  results.forEach((r) => {
    const p = Number(r.percentage) || 0;
    if (p < 40) scoreBands[0].count++;
    else if (p < 60) scoreBands[1].count++;
    else if (p < 80) scoreBands[2].count++;
    else scoreBands[3].count++;
  });

  // Recent Activity Log (assembled chronologically from results and student records)
  const activities = [];

  // Add recent results
  results.slice(0, 5).forEach((r) => {
    activities.push({
      id: `act_${r.id}`,
      type: 'result',
      title: `${r.studentSnapshot?.fullName || 'Student'} completed ${r.examSnapshot?.title || 'Examination'}`,
      description: `Scored ${r.marksObtained}/${r.totalMarks} (${r.percentage}%) • ${r.isPassed ? 'Passed' : 'Failed'}`,
      timestamp: r.submittedAt,
    });
  });

  // Add recent students
  students.slice(0, 3).forEach((s) => {
    activities.push({
      id: `act_${s.id}`,
      type: 'student',
      title: `New student registration: ${s.fullName}`,
      description: `Assigned ID ${s.studentId || 'N/A'} (${s.email})`,
      timestamp: s.createdAt,
    });
  });

  // Sort by timestamp descending
  activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return {
    totalStudents: students.length,
    activeStudents: activeStudents.length,
    totalExams: exams.length,
    publishedExams: publishedExams.length,
    totalAttempts,
    avgScore,
    passRate,
    examParticipation,
    scoreBands,
    recentActivity: activities.slice(0, 6),
  };
};

