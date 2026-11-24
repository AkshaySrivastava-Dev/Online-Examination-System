/**
 * ExamPro Examination Engine Service
 *
 * Core engine orchestrating candidate examination attempts, absolute timestamp countdown,
 * resilient answer persistence, multi-tab state synchronization, auto-evaluation,
 * and immutable submission snapshotting.
 */

import { getItem, setItem, removeItem, persistExamResultIdempotent, acquireTabLock, releaseTabLock } from './storageService.js';
import { generateId } from '../utils/idGenerator.js';
import { getExaminationById } from './examService.js';
import { getQuestions } from './questionService.js';

const ATTEMPT_PREFIX = 'active_attempt_';

/**
 * Helper to construct storage key for active attempt.
 */
export const getAttemptKey = (studentId, examId) => `${ATTEMPT_PREFIX}${studentId}_${examId}`;

/**
 * Retrieve active examination attempt for a student and exam.
 * If timer has expired, automatically triggers submission.
 *
 * @param {string} studentId
 * @param {string} examId
 * @returns {Object|null}
 */
export const getActiveAttempt = (studentId, examId) => {
  if (!studentId || !examId) return null;
  const key = getAttemptKey(studentId, examId);
  const attempt = getItem(key, null);

  if (!attempt) return null;

  // Check if timer has expired
  if (Date.now() >= attempt.endTimestamp && attempt.status !== 'submitted') {
    // Auto-submit expired attempt
    const submitRes = submitExamAttempt(studentId, examId, 'auto-timer');
    if (submitRes.success) {
      return null;
    }
  }

  return attempt;
};

/**
 * Prepare safe student-facing questions by stripping correct answers and explanations.
 * @param {Array} questions
 * @returns {Array} Safe questions
 */
export const sanitizeQuestionsForStudent = (questions) => {
  return questions.map((q) => ({
    id: q.id,
    examId: q.examId,
    questionText: q.questionText,
    options: q.options,
    marks: q.marks,
  }));
};

/**
 * Start or resume an examination attempt.
 *
 * @param {Object} student - Active user object
 * @param {string} examId - Examination ID
 * @param {string} tabId - Unique ID for active browser tab
 * @returns {{ success: boolean, attempt?: Object, questions?: Array, exam?: Object, error?: string, isResume?: boolean }}
 */
export const startExamAttempt = (student, examId, tabId) => {
  if (!student || !student.id) {
    return { success: false, error: 'Student authentication required.' };
  }

  const users = getItem('users', []);
  const liveStudent = users.find((u) => u.id === student.id);
  if (!liveStudent || liveStudent.isDeleted || liveStudent.status === 'suspended') {
    return { success: false, error: 'Student account is suspended or no longer active.' };
  }

  const exam = getExaminationById(examId);
  if (!exam) {
    return { success: false, error: 'Examination not found or has been deleted.' };
  }

  if (exam.status !== 'published') {
    return { success: false, error: 'This examination is currently unpublished.' };
  }

  const now = Date.now();
  const startTime = new Date(exam.startDateTime).getTime();
  const endTime = new Date(exam.endDateTime).getTime();

  if (now < startTime) {
    return { success: false, error: 'This examination has not opened yet.' };
  }

  if (now > endTime) {
    return { success: false, error: 'This examination has closed and is no longer accessible.' };
  }

  // Check previous results / retake eligibility
  const results = getItem('results', []);
  const previousResults = results.filter(
    (r) => r.examId === examId && r.studentSnapshot?.id === student.id
  );

  if (previousResults.length > 0 && !exam.allowRetake) {
    return {
      success: false,
      error: 'You have already completed this examination. Retakes are not permitted.',
    };
  }

  // Check if an attempt is already active in storage
  const existingAttempt = getItem(getAttemptKey(student.id, examId), null);
  const rawQuestions = getQuestions({ examId, includeDeleted: false });

  if (rawQuestions.length === 0) {
    return { success: false, error: 'This examination has no questions available.' };
  }

  const studentQuestions = sanitizeQuestionsForStudent(rawQuestions);

  if (existingAttempt) {
    // If expired, submit automatically
    if (now >= existingAttempt.endTimestamp) {
      submitExamAttempt(student.id, examId, 'auto-timer');
      return { success: false, error: 'Examination session time has expired.' };
    }

    // Try acquiring tab lock (with stale tab recovery)
    const lockRes = acquireTabLock(examId, student.id, tabId);

    // Update heartbeat and tab
    existingAttempt.lastHeartbeat = now;
    existingAttempt.activeTabId = tabId;
    setItem(getAttemptKey(student.id, examId), existingAttempt);

    return {
      success: true,
      attempt: existingAttempt,
      questions: studentQuestions,
      exam,
      isResume: true,
      hasTabLock: lockRes.acquired,
      lockHolder: lockRes.activeTabId,
    };
  }

  // New Attempt: Compute absolute end timestamp
  const durationMs = Number(exam.durationMinutes) * 60 * 1000;
  // Bounded by official exam end time
  const endTimestamp = Math.min(now + durationMs, endTime);

  const newAttempt = {
    attemptId: generateId('att'),
    examId,
    studentId: student.id,
    startTimestamp: now,
    endTimestamp,
    durationMinutes: Number(exam.durationMinutes),
    answers: {}, // questionId -> chosenOption ('A'|'B'|'C'|'D')
    markedForReview: [], // array of questionIds
    visitedQuestions: rawQuestions.length > 0 ? [rawQuestions[0].id] : [],
    currentQuestionIndex: 0,
    status: 'in-progress',
    activeTabId: tabId,
    lastHeartbeat: now,
  };

  const saved = setItem(getAttemptKey(student.id, examId), newAttempt);
  if (!saved) {
    return { success: false, error: 'Failed to initialize examination session in storage.' };
  }

  // Acquire tab lock
  const lock = acquireTabLock(examId, student.id, tabId);

  return {
    success: true,
    attempt: newAttempt,
    questions: studentQuestions,
    exam,
    isResume: false,
    hasTabLock: lock.acquired,
  };
};

/**
 * Record student answer selection immediately in LocalStorage.
 *
 * @param {string} studentId
 * @param {string} examId
 * @param {string} questionId
 * @param {'A'|'B'|'C'|'D'|null} optionId - Selected option or null to clear
 * @returns {boolean} Success status
 */
export const recordAnswer = (studentId, examId, questionId, optionId) => {
  const key = getAttemptKey(studentId, examId);
  const attempt = getItem(key, null);
  if (!attempt || attempt.status === 'submitted') return false;

  const updatedAnswers = { ...attempt.answers };
  if (optionId === null) {
    delete updatedAnswers[questionId];
  } else {
    updatedAnswers[questionId] = optionId;
  }

  // Also ensure question is in visitedQuestions
  const visited = new Set(attempt.visitedQuestions || []);
  visited.add(questionId);

  attempt.answers = updatedAnswers;
  attempt.visitedQuestions = Array.from(visited);
  attempt.lastHeartbeat = Date.now();

  return setItem(key, attempt);
};

/**
 * Toggle Mark for Review flag for a question.
 *
 * @param {string} studentId
 * @param {string} examId
 * @param {string} questionId
 * @returns {boolean} New review status
 */
export const toggleMarkForReview = (studentId, examId, questionId) => {
  const key = getAttemptKey(studentId, examId);
  const attempt = getItem(key, null);
  if (!attempt || attempt.status === 'submitted') return false;

  const currentReviews = new Set(attempt.markedForReview || []);
  let isNowMarked = false;

  if (currentReviews.has(questionId)) {
    currentReviews.delete(questionId);
    isNowMarked = false;
  } else {
    currentReviews.add(questionId);
    isNowMarked = true;
  }

  attempt.markedForReview = Array.from(currentReviews);
  attempt.lastHeartbeat = Date.now();
  setItem(key, attempt);

  return isNowMarked;
};

/**
 * Record that a question has been visited by the student.
 */
export const markQuestionVisited = (studentId, examId, questionId) => {
  const key = getAttemptKey(studentId, examId);
  const attempt = getItem(key, null);
  if (!attempt || attempt.status === 'submitted') return;

  const visited = new Set(attempt.visitedQuestions || []);
  if (!visited.has(questionId)) {
    visited.add(questionId);
    attempt.visitedQuestions = Array.from(visited);
    attempt.lastHeartbeat = Date.now();
    setItem(key, attempt);
  }
};

/**
 * Determine the visual state of a question in the Question Palette.
 *
 * States:
 * 1. 'answered-review': Answered & Marked for Review (Purple)
 * 2. 'review': Marked for Review (Amber)
 * 3. 'answered': Answered (Green)
 * 4. 'not-answered': Visited but not answered (Red)
 * 5. 'not-visited': Not yet visited (Slate Gray)
 *
 * @param {Object} attempt
 * @param {string} questionId
 * @returns {'answered-review'|'review'|'answered'|'not-answered'|'not-visited'}
 */
export const getQuestionState = (attempt, questionId) => {
  if (!attempt) return 'not-visited';

  const isAnswered = !!attempt.answers?.[questionId];
  const isMarked = attempt.markedForReview?.includes(questionId);
  const isVisited = attempt.visitedQuestions?.includes(questionId);

  if (isAnswered && isMarked) return 'answered-review';
  if (isMarked) return 'review';
  if (isAnswered) return 'answered';
  if (isVisited) return 'not-answered';
  return 'not-visited';
};

/**
 * Submit examination attempt and perform automatic evaluation.
 * Creates an immutable result snapshot with safe question breakdowns.
 *
 * @param {string} studentId
 * @param {string} examId
 * @param {'manual'|'auto-timer'} [submissionType='manual']
 * @returns {{ success: boolean, result?: Object, error?: string }}
 */
export const submitExamAttempt = (studentId, examId, submissionType = 'manual') => {
  const key = getAttemptKey(studentId, examId);
  const attempt = getItem(key, null);

  if (!attempt) {
    // Check if result was already submitted and exists in results
    const results = getItem('results', []);
    const existing = results.find(
      (r) => r.studentSnapshot?.id === studentId && r.examId === examId
    );
    if (existing) {
      return { success: true, result: existing };
    }
    return { success: false, error: 'No active examination attempt found to submit.' };
  }

  // Idempotency check: see if this exact attemptId has already been persisted
  const results = getItem('results', []);
  const duplicate = results.find((r) => r.attemptId === attempt.attemptId);
  if (duplicate) {
    removeItem(key);
    return { success: true, result: duplicate };
  }

  const exam = getExaminationById(examId);
  if (!exam) {
    return { success: false, error: 'Associated examination record not found.' };
  }

  const users = getItem('users', []);
  const student = users.find((u) => u.id === studentId);
  if (!student || student.isDeleted || student.status === 'suspended') {
    return { success: false, error: 'Student record not found or account is suspended.' };
  }

  // Retrieve raw questions containing true answer keys and explanations
  const allQuestions = getQuestions({ examId, includeDeleted: true });
  const activeQuestions = allQuestions.filter((q) => !q.isDeleted);

  let totalMarks = Number(exam.totalMarks) || 0;
  let marksObtained = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const answersBreakdown = activeQuestions.map((q) => {
    const studentChoice = attempt.answers?.[q.id] || null;
    const isAnswered = studentChoice !== null && studentChoice !== undefined;
    const isCorrect = isAnswered && studentChoice === q.correctAnswer;
    const qMarks = Number(q.marks) || 0;
    const awarded = isCorrect ? qMarks : 0;

    if (!isAnswered) {
      unansweredCount++;
    } else if (isCorrect) {
      correctCount++;
      marksObtained += qMarks;
    } else {
      incorrectCount++;
    }

    return {
      questionId: q.id,
      questionText: q.questionText,
      options: q.options,
      studentAnswer: studentChoice,
      correctAnswer: q.correctAnswer,
      isCorrect,
      marksAwarded: awarded,
      maxMarks: qMarks,
      explanation: q.explanation || '',
    };
  });

  const percentage = totalMarks > 0 ? Number(((marksObtained / totalMarks) * 100).toFixed(1)) : 0;
  const isPassed = percentage >= (Number(exam.passingPercentage) || 40);

  // Construct Immutable Frozen Result Snapshot
  const finalResult = {
    id: generateId('res'),
    attemptId: attempt.attemptId,
    examId: exam.id,
    examTitle: exam.title,
    examSnapshot: {
      title: exam.title,
      description: exam.description || '',
      category: exam.category || 'General',
      durationMinutes: exam.durationMinutes,
      totalMarks: exam.totalMarks,
      passingPercentage: exam.passingPercentage,
    },
    studentSnapshot: {
      id: student.id,
      studentId: student.studentId || '',
      fullName: student.fullName,
      email: student.email,
    },
    totalQuestions: activeQuestions.length,
    attemptedCount: Object.keys(attempt.answers || {}).length,
    correctCount,
    incorrectCount,
    unansweredCount,
    totalMarks,
    marksObtained,
    percentage,
    isPassed,
    submittedAt: new Date().toISOString(),
    durationTakenSeconds: Math.max(1, Math.round((Date.now() - attempt.startTimestamp) / 1000)),
    submissionType,
    answersBreakdown,
  };

  // Idempotently commit result first, then remove attempt
  const persistRes = persistExamResultIdempotent(finalResult);

  if (!persistRes.success) {
    return { success: false, error: 'Failed to commit examination result to storage.' };
  }

  // Release multi-tab lock
  releaseTabLock(examId, studentId, attempt.activeTabId);

  return { success: true, result: finalResult };
};

