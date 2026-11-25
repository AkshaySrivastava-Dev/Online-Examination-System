/**
 * VERITY Phase 2.2 — ExamDNA Intelligence Engine Test Suite
 *
 * Verifies explainable, deterministic student performance analytics:
 * 1. Topic Mastery (accuracy, status classification, sample sizes)
 * 2. Confidence Alignment (matrix, review priorities, growth areas)
 * 3. Time Intelligence (dwell time, pace averages, outliers)
 * 4. Answer Stability (changes count, stability rate, answer comparison)
 * 5. Deterministic Recommendations (explainable rules, calculation basis)
 * 6. Backward Compatibility (historical records without timing/confidence)
 */

// Polyfill mock localStorage in Node
const mockStorage = {};
global.localStorage = {
  getItem: (key) => (key in mockStorage ? mockStorage[key] : null),
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; },
  get length() { return Object.keys(mockStorage).length; },
  key: (i) => Object.keys(mockStorage)[i] || null,
};

global.window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
};

import { initializeSeedData } from './src/services/seedData.js';
import {
  startExamAttempt,
  recordAnswer,
  recordConfidence,
  recordQuestionTime,
  submitExamAttempt,
  getActiveAttempt,
} from './src/services/examEngineService.js';
import {
  computeExamDna,
  getStudyPlanProgress,
  toggleStudyPlanDay,
} from './src/services/examDnaService.js';
import { getQuestions } from './src/services/questionService.js';
import { getResults } from './src/services/resultService.js';
import { getItem, setItem, persistExamResultIdempotent } from './src/services/storageService.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition, description) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${description}`);
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    throw new Error(`Assertion failed: ${description}`);
  }
}

console.log('\n===============================================================');
console.log('   VERITY — PHASE 2.2 EXAMDNA INTELLIGENCE ENGINE VERIFICATION');
console.log('===============================================================\n');

// Initialize base seeds
initializeSeedData();

// Student candidate mock
const student = {
  id: 'usr_student_dna_test',
  fullName: 'Ada Lovelace',
  email: 'ada@verity.edu',
  role: 'student',
  status: 'active',
  studentId: 'STD-2026-DNA',
};

// Register candidate in storage users
const currentUsers = getItem('users', []);
setItem('users', [...currentUsers, student]);

// Exam mock id from seed
const examId = 'exam_cs_101';

console.log('--- SECTION 1: Active Engine Confidence, Timing & Changes Tracking ---');

const startRes = startExamAttempt(student, examId, 'tab_dna_1');
assert(startRes.success, 'startExamAttempt succeeded');

const questions = startRes.questions;
assert(questions && questions.length >= 3, 'Examination has at least 3 questions');

const q1 = questions[0];
const q2 = questions[1];
const q3 = questions[2];

// Record initial answers
recordAnswer(student.id, examId, q1.id, 'A');
recordConfidence(student.id, examId, q1.id, 'High');
recordQuestionTime(student.id, examId, q1.id, 45);

recordAnswer(student.id, examId, q2.id, 'B');
recordConfidence(student.id, examId, q2.id, 'Low');
recordQuestionTime(student.id, examId, q2.id, 10); // Rapid outlier (<15s)

recordAnswer(student.id, examId, q3.id, 'C');
recordConfidence(student.id, examId, q3.id, 'High');
recordQuestionTime(student.id, examId, q3.id, 140); // Deliberate outlier (>120s)

// Verify active attempt state
const active = getActiveAttempt(student.id, examId);
assert(active.confidenceLevels[q1.id] === 'High', 'Confidence level High recorded for Q1');
assert(active.confidenceLevels[q2.id] === 'Low', 'Confidence level Low recorded for Q2');
assert(active.questionTimeSpent[q1.id] === 45, 'Time spent 45s recorded for Q1');
assert(active.questionTimeSpent[q2.id] === 10, 'Time spent 10s recorded for Q2');

// Test Answer Modification Tracking
recordAnswer(student.id, examId, q1.id, 'B'); // Change 1: A -> B
recordAnswer(student.id, examId, q1.id, 'C'); // Change 2: B -> C

const activeAfterEdit = getActiveAttempt(student.id, examId);
assert(activeAfterEdit.answerHistory[q1.id]?.changesCount === 2, 'Two answer modifications recorded for Q1');
assert(activeAfterEdit.answerHistory[q1.id]?.originalAnswer === 'A', 'Original answer A preserved in history');
assert(activeAfterEdit.answerHistory[q1.id]?.finalAnswer === 'C', 'Final answer C updated in history');

console.log('\n--- SECTION 2: Final Submission Snapshotting of ExamDNA Fields ---');

const subRes = submitExamAttempt(student.id, examId, 'manual');
assert(subRes.success, 'submitExamAttempt succeeded');
const result = subRes.result;
assert(result && result.id, 'Result created with valid ID');

const breakdownQ1 = result.answersBreakdown.find((a) => a.questionId === q1.id);
assert(breakdownQ1 !== undefined, 'Answers breakdown contains Q1');
assert(breakdownQ1.confidence === 'High', 'Breakdown preserved confidence High');
assert(breakdownQ1.timeSpentSeconds === 45, 'Breakdown preserved timeSpentSeconds 45');
assert(breakdownQ1.changesCount === 2, 'Breakdown preserved changesCount 2');
assert(breakdownQ1.originalAnswer === 'A', 'Breakdown preserved originalAnswer A');
assert(breakdownQ1.topic !== undefined && breakdownQ1.topic.length > 0, 'Breakdown has assigned topic');
assert(breakdownQ1.subject !== undefined && breakdownQ1.subject.length > 0, 'Breakdown preserved academic subject');
assert(breakdownQ1.subtopic !== undefined, 'Breakdown preserved subtopic');
assert(breakdownQ1.concept !== undefined, 'Breakdown preserved concept');
assert(['Easy', 'Medium', 'Hard'].includes(breakdownQ1.difficulty), 'Breakdown preserved valid difficulty tier');

console.log('\n--- SECTION 3: ExamDNA Computation (Topic Mastery) ---');

const dna = computeExamDna({ resultId: result.id });
assert(dna !== null, 'computeExamDna returned valid profile');
assert(Array.isArray(dna.topicMastery), 'dna.topicMastery is an array');
assert(dna.topicMastery.length > 0, 'dna.topicMastery has at least 1 topic');

const firstTopic = dna.topicMastery[0];
assert(typeof firstTopic.accuracy === 'number', 'topic.accuracy is numeric');
assert(['strong', 'developing', 'weak'].includes(firstTopic.status), 'topic.status is strong, developing, or weak');
assert(typeof firstTopic.hasSufficientSample === 'boolean', 'topic.hasSufficientSample is boolean');

console.log('\n--- SECTION 4: ExamDNA Confidence Alignment Matrix ---');

assert(dna.confidenceAlignment.available === true, 'confidenceAlignment is marked available');
assert(dna.confidenceAlignment.trackedCount >= 3, 'confidenceAlignment tracked at least 3 questions');

const matrix = dna.confidenceAlignment.matrix;
assert(typeof matrix.highCorrect === 'number', 'matrix.highCorrect is numeric');
assert(typeof matrix.highIncorrect === 'number', 'matrix.highIncorrect is numeric');
assert(typeof matrix.lowCorrect === 'number', 'matrix.lowCorrect is numeric');
assert(typeof matrix.lowIncorrect === 'number', 'matrix.lowIncorrect is numeric');

// Verify review priorities collection
if (matrix.highIncorrect > 0) {
  assert(dna.confidenceAlignment.reviewPriorities.length === matrix.highIncorrect, 'reviewPriorities matches highIncorrect count');
  assert(dna.confidenceAlignment.reviewPriorities[0].questionText, 'review priority includes questionText');
  assert(dna.confidenceAlignment.reviewPriorities[0].correctAnswer, 'review priority includes correctAnswer');
}

console.log('\n--- SECTION 5: ExamDNA Time Intelligence ---');

assert(dna.timeIntelligence.available === true, 'timeIntelligence is available');
assert(typeof dna.timeIntelligence.avgTimePerQuestionSec === 'number', 'avgTimePerQuestionSec is numeric');
assert(dna.timeIntelligence.rapidResponsesCount >= 1, 'Rapid responses outlier detected (Q2: 10s < 15s)');
assert(dna.timeIntelligence.deliberateResponsesCount >= 1, 'Deliberate responses outlier detected (Q3: 140s > 120s)');

console.log('\n--- SECTION 6: ExamDNA Answer Stability ---');

assert(dna.answerStability.totalChanges >= 2, 'Total modifications tracked (>= 2)');
assert(dna.answerStability.questionsChangedCount >= 1, 'Questions changed count tracked');
assert(typeof dna.answerStability.stabilityRate === 'number', 'stabilityRate is numeric percentage');
assert(dna.answerStability.stabilityRate >= 0 && dna.answerStability.stabilityRate <= 100, 'stabilityRate between 0 and 100');

console.log('\n--- SECTION 7: Deterministic Recommendations Engine ---');

assert(Array.isArray(dna.recommendations), 'dna.recommendations is an array');
assert(dna.recommendations.length === dna.topicMastery.length, 'Every topic received a deterministic recommendation');

for (const rec of dna.recommendations) {
  assert(['Core Revision', 'Intermediate Practice', 'Advanced Mastery'].includes(rec.level), `Valid level: ${rec.level}`);
  assert(['high', 'medium', 'low'].includes(rec.priority), `Valid priority: ${rec.priority}`);
  assert(rec.basis && rec.basis.includes('/'), `Recommendation contains exact calculation basis: "${rec.basis}"`);
  assert(rec.text && rec.text.length > 10, 'Recommendation contains explanatory guidance');
}

console.log('\n--- SECTION 8: Backward Compatibility with Historical Results ---');

// Synthesize an older result that lacked confidence and timeSpentSeconds
const historicalResult = {
  id: 'res_historical_legacy_101',
  attemptId: 'att_historical_legacy_101',
  studentId: 'usr_student_dna_test',
  studentSnapshot: {
    id: 'usr_student_dna_test',
    fullName: 'Ada Lovelace',
    email: 'ada@verity.edu',
  },
  examId: 'exam_cs_101',
  examTitle: 'Legacy Examination',
  marksObtained: 15,
  totalMarks: 30,
  percentage: '50.0',
  isPassed: false,
  durationTakenSeconds: 900,
  answersBreakdown: [
    {
      questionId: 'q_legacy_1',
      questionText: 'What is a binary tree?',
      studentAnswer: 'A',
      correctAnswer: 'A',
      isCorrect: true,
      marksAwarded: 5,
      maxMarks: 5,
      topic: 'Data Structures',
      // No confidence
      // No timeSpentSeconds
      // No changesCount
    },
    {
      questionId: 'q_legacy_2',
      questionText: 'Explain depth-first search.',
      studentAnswer: 'B',
      correctAnswer: 'C',
      isCorrect: false,
      marksAwarded: 0,
      maxMarks: 5,
      topic: 'Algorithms',
    },
  ],
};

persistExamResultIdempotent(historicalResult);

// Run computeExamDna on the historical result
const historicalDna = computeExamDna({ resultId: historicalResult.id });
assert(historicalDna !== null, 'computeExamDna safely processed historical result');
assert(historicalDna.meta.confidenceAvailable === false, 'Historical result correctly reports confidenceAvailable = false');
assert(historicalDna.meta.timingAvailable === false, 'Historical result correctly reports timingAvailable = false');
assert(historicalDna.timeIntelligence.avgTimePerQuestionSec === null, 'avgTimePerQuestionSec is null instead of NaN or 0');
assert(historicalDna.topicMastery.length === 2, 'Topic mastery successfully extracted 2 topics');
assert(historicalDna.recommendations.length === 2, 'Recommendations cleanly generated for historical topics');

console.log('\n--- SECTION 9: Academic Question Taxonomy & Filtering ---');

const allBankQuestions = getQuestions();
assert(allBankQuestions.length >= 17, 'Question bank loaded all seed questions');
for (const q of allBankQuestions) {
  assert(typeof q.subject === 'string' && q.subject.length > 0, `Question ${q.id} has valid subject`);
  assert(typeof q.topic === 'string' && q.topic.length > 0, `Question ${q.id} has valid topic`);
  assert(typeof q.subtopic === 'string', `Question ${q.id} has subtopic string`);
  assert(typeof q.concept === 'string', `Question ${q.id} has concept string`);
  assert(['Easy', 'Medium', 'Hard'].includes(q.difficulty), `Question ${q.id} has valid difficulty tier`);
}

// Test questionService filters
const webArchQuestions = getQuestions({ topic: 'Web Architecture' });
assert(webArchQuestions.length >= 2, 'Filtering by topic "Web Architecture" returns matching questions');
const hardQuestions = getQuestions({ difficulty: 'Hard' });
assert(hardQuestions.length >= 3, 'Filtering by difficulty "Hard" returns matching questions');

console.log('\n--- SECTION 10: Personalized Learning Intelligence Engine ---');

assert(dna.learningIntelligence !== null && typeof dna.learningIntelligence === 'object', 'dna.learningIntelligence profile is present');
const { answersFourQuestions, weakAreas, strongAreas, revisionMatrix, priorityScores, studyPlan } = dna.learningIntelligence;

// 1. Core 4 Questions
assert(typeof answersFourQuestions.whatDoIKnow === 'string' && answersFourQuestions.whatDoIKnow.length > 5, 'Direct answer provided for "What do I know?"');
assert(typeof answersFourQuestions.whatAmIWeakAt === 'string' && answersFourQuestions.whatAmIWeakAt.length > 5, 'Direct answer provided for "What am I weak at?"');
assert(answersFourQuestions.whatNeedsRelearnVsRevise && typeof answersFourQuestions.whatNeedsRelearnVsRevise === 'object', 'Relearn vs Revise summary present');
assert(typeof answersFourQuestions.whatShouldIStudyFirst === 'string' && answersFourQuestions.whatShouldIStudyFirst.length > 5, 'Direct answer provided for "What should I study first?"');
assert(typeof answersFourQuestions.howToSpendNextSevenDays === 'string' && answersFourQuestions.howToSpendNextSevenDays.length > 5, 'Direct answer provided for "How to spend next 7 days?"');

// 2. Weak Area Detection
assert(Array.isArray(weakAreas), 'weakAreas is an array');
for (const w of weakAreas) {
  assert(['critical', 'moderate'].includes(w.severityLevel), 'weak area has valid severity level');
  assert(w.explanation && w.explanation.includes('questions missed'), `weak area has count-based explanation: "${w.explanation}"`);
  assert(typeof w.isPreliminary === 'boolean', 'weak area tracks preliminary flag');
}

// 3. Revision vs Relearning Matrix
assert(Array.isArray(revisionMatrix), 'revisionMatrix is an array');
const validCategories = ['Concept Relearning', 'Targeted Revision', 'Practice Needed', 'Maintain Mastery', 'Insufficient Evidence'];
for (const item of revisionMatrix) {
  assert(validCategories.includes(item.category), `revision item categorized into valid tier: ${item.category}`);
  assert(item.actionableGuidance && item.actionableGuidance.length > 10, 'revision item provides actionable guidance');
}

// 4. Learning Priority Scores (0-100) & Dynamic Weight Normalization
assert(Array.isArray(priorityScores), 'priorityScores is an array');
let prevScore = 101;
for (const p of priorityScores) {
  assert(p.priorityScore >= 0 && p.priorityScore <= 100, `Priority score ${p.priorityScore} is bounded [0, 100]`);
  assert(['Urgent', 'High', 'Moderate', 'Low'].includes(p.priorityTier), `Priority tier is valid: ${p.priorityTier}`);
  assert(p.priorityScore <= prevScore, 'Priority rankings are sorted in descending order');
  prevScore = p.priorityScore;
  assert(p.weightsApplied.total > 0, 'Available weights properly normalized in denominator');
}

// 5. 100% Confidence Matrix Reconciliation
assert(dna.confidenceAlignment.isReconciled === true, 'Confidence matrix is 100% mathematically reconciled');
const matrixSum =
  dna.confidenceAlignment.matrix.highCorrect +
  dna.confidenceAlignment.matrix.highIncorrect +
  dna.confidenceAlignment.matrix.medCorrect +
  dna.confidenceAlignment.matrix.medIncorrect +
  dna.confidenceAlignment.matrix.lowCorrect +
  dna.confidenceAlignment.matrix.lowIncorrect;
assert(matrixSum === dna.confidenceAlignment.trackedCount, `Reconciliation holds: sum(${matrixSum}) === trackedCount(${dna.confidenceAlignment.trackedCount})`);

// 6. 7-Day Study Plan Generation & Interactive LocalStorage Progress
assert(studyPlan.days.length === 7, 'Study plan generates exactly 7 daily trajectories');
for (let i = 0; i < 7; i++) {
  assert(studyPlan.days[i].day === i + 1, `Day ${i + 1} correctly indexed`);
  assert(studyPlan.days[i].title && studyPlan.days[i].title.length > 0, `Day ${i + 1} has title`);
  assert(studyPlan.days[i].targetDurationMinutes > 0, `Day ${i + 1} has target duration`);
}

// Test Study Plan interactive toggle in LocalStorage
const testStudentId = 'usr_std_interactive_test';
let progress = getStudyPlanProgress(testStudentId, 'test_plan_001');
assert(progress.completedDays.length === 0, 'Initial study plan progress has 0 completed days');
assert(progress.progressPercentage === 0, 'Initial progress is 0%');

// Toggle Day 1
progress = toggleStudyPlanDay(testStudentId, 1, 'test_plan_001');
assert(progress.completedDays.includes(1), 'Day 1 marked completed');
assert(progress.completedDays.length === 1, 'Exactly 1 day completed');
assert(progress.progressPercentage === 14, 'Progress is 14% (1/7)');

// Toggle Day 2
progress = toggleStudyPlanDay(testStudentId, 2, 'test_plan_001');
assert(progress.completedDays.length === 2, '2 days completed');
assert(progress.progressPercentage === 29, 'Progress is 29% (2/7)');

// Untoggle Day 1
progress = toggleStudyPlanDay(testStudentId, 1, 'test_plan_001');
assert(!progress.completedDays.includes(1), 'Day 1 untoggled');
assert(progress.completedDays.length === 1, '1 day remains completed');

// Verify immutability of exam results
const resultAfterStudyPlan = getResults().find((r) => r.id === result.id);
assert(resultAfterStudyPlan.durationTakenSeconds === result.durationTakenSeconds, 'Exam results remain 100% immutable after study plan interaction');

console.log('\n===============================================================');
console.log(`   ALL ${passedTests} OF ${totalTests} EXAMDNA TESTS PASSED SUCCESSFULLY (100%)`);
console.log('===============================================================\n');
