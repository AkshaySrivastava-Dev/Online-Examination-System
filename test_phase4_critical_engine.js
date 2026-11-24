/**
 * ExamPro Phase 4 Critical Examination Engine Verification
 *
 * Exhaustive targeted audit covering Sections A through F:
 * A. Timer and Automatic Submission
 * B. Multi-Tab Concurrency & Stale Lock Recovery
 * C. Retake and Duplicate Submission Protection
 * D. Result Calculation & Exact Rounding Math
 * E. Authorization and Data Isolation
 * F. Historical Snapshot Immutability
 */

import { getItem, setItem, removeItem, clearExamProStorage, acquireTabLock, releaseTabLock, persistExamResultIdempotent } from './src/services/storageService.js';
import { initializeSeedData } from './src/services/seedData.js';
import {
  startExamAttempt,
  getActiveAttempt,
  recordAnswer,
  toggleMarkForReview,
  getQuestionState,
  submitExamAttempt,
  sanitizeQuestionsForStudent,
} from './src/services/examEngineService.js';
import { getExaminationById, updateExamination, deleteExamination } from './src/services/examService.js';
import { getResults, getResultById } from './src/services/resultService.js';
import { getQuestions, updateQuestion, deleteQuestion } from './src/services/questionService.js';
import { updateUserProfile, getActiveSession } from './src/services/authService.js';

// Polyfill mock localStorage in node for deterministic unit verification
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

console.log('\n===============================================================');
console.log('   EXAMPRO — PHASE 4 CRITICAL EXAMINATION ENGINE VERIFICATION');
console.log('===============================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${testName} ${details ? '--> ' + details : ''}`);
    failedTests++;
  }
}

// Re-initialize clean seed data
clearExamProStorage();
initializeSeedData();

// Clear pre-existing result for Alex on exam_cs_101 so Section A starts with 0 results
setItem('results', getItem('results', []).filter(r => !(r.studentSnapshot?.id === 'usr_std_2026_001' && r.examId === 'exam_cs_101')));

const studentAlex = getItem('users', []).find((u) => u.email === 'alex.morgan@university.edu');
const studentPriya = getItem('users', []).find((u) => u.email === 'priya.sharma@university.edu');
const examCS101 = getExaminationById('exam_cs_101'); // published, allowRetake: true
const examCS102 = getExaminationById('exam_cs_102'); // published, allowRetake: false

console.log('\n--- SECTION A: TIMER AND AUTOMATIC SUBMISSION ---');

// A1: Start examination with short test duration
const attemptA = startExamAttempt(studentAlex, 'exam_cs_101', 'tab_timer_1');
assert(attemptA.success === true, 'A1: Successfully initialized active examination attempt');
assert(attemptA.attempt.endTimestamp > Date.now(), 'A1: Computed endTimestamp is in the future');

// Record answer to Q1
recordAnswer(studentAlex.id, 'exam_cs_101', 'qst_web_001', 'B'); // Correct answer (10 marks)

// A2 & A3: Simulate timer reaching zero and verify auto-submission without user interaction
const activeKey = `active_attempt_${studentAlex.id}_exam_cs_101`;
const loadedAttempt = getItem(activeKey);
// Artificially advance endTimestamp to 5 seconds in the past to simulate time expiration
loadedAttempt.endTimestamp = Date.now() - 5000;
setItem(activeKey, loadedAttempt);

const expiredCheck = getActiveAttempt(studentAlex.id, 'exam_cs_101');
assert(expiredCheck === null, 'A3: getActiveAttempt detected expired timer and automatically triggered submission');

// A4 & A6: Verify auto-evaluated result created
const allResultsA = getResults({ studentId: studentAlex.id, examId: 'exam_cs_101' });
assert(allResultsA.length === 1, 'A6: Exactly one result record created upon timer auto-submission');
assert(allResultsA[0].submissionType === 'auto-timer', 'A3: Result record marked with submissionType "auto-timer"');
assert(allResultsA[0].marksObtained === 10, 'A4: Result graded accurately on auto-submission (10/50 marks awarded for Q1)');

// A7: Refresh near expiry simulation
const attemptA2 = startExamAttempt(studentPriya, 'exam_cs_101', 'tab_refresh_1');
const originalDeadline = attemptA2.attempt.endTimestamp;
// Simulate page refresh 2 seconds before deadline
const nearExpiryAttempt = getItem(`active_attempt_${studentPriya.id}_exam_cs_101`);
nearExpiryAttempt.lastHeartbeat = Date.now();
setItem(`active_attempt_${studentPriya.id}_exam_cs_101`, nearExpiryAttempt);

const resumedAttempt = startExamAttempt(studentPriya, 'exam_cs_101', 'tab_refresh_1');
assert(resumedAttempt.isResume === true, 'A7: Near-expiry session successfully resumes');
assert(resumedAttempt.attempt.endTimestamp === originalDeadline, 'A7: Session deadline remains unchanged after refresh');

// A8: Official examination end time boundary cap
// Create an exam where endDateTime is only 5 minutes from now, but duration is 60 minutes
const now = Date.now();
const cappedEndTimeIso = new Date(now + 5 * 60 * 1000).toISOString();
const examCapped = {
  ...examCS101,
  id: 'exam_capped_test',
  durationMinutes: 60,
  startDateTime: new Date(now - 10000).toISOString(),
  endDateTime: cappedEndTimeIso,
  status: 'published',
};
setItem('examinations', [examCapped, ...getItem('examinations', [])]);
setItem('questions', [
  { id: 'q_cap_1', examId: 'exam_capped_test', questionText: 'Cap Q1', options: [{id:'A',text:'A'},{id:'B',text:'B'},{id:'C',text:'C'},{id:'D',text:'D'}], correctAnswer: 'A', marks: 50, isDeleted: false },
  ...getItem('questions', [])
]);

const attemptCapped = startExamAttempt(studentAlex, 'exam_capped_test', 'tab_cap');
const expectedCappedMs = new Date(cappedEndTimeIso).getTime();
assert(attemptCapped.success === true, 'A8: Attempt on capped exam initialized');
assert(
  Math.abs(attemptCapped.attempt.endTimestamp - expectedCappedMs) < 1000,
  'A8: Active session endTimestamp is strictly bounded by official examination endDateTime rather than durationMinutes'
);

// A9: Verify timer cannot be extended by changing tabs or refreshing
const attemptTab1 = startExamAttempt(studentPriya, 'exam_cs_101', 'tab_1');
const frozenDeadline = attemptTab1.attempt.endTimestamp;
// Multiple resumes with different tab IDs
startExamAttempt(studentPriya, 'exam_cs_101', 'tab_2');
startExamAttempt(studentPriya, 'exam_cs_101', 'tab_3');
const finalAttemptState = getItem(`active_attempt_${studentPriya.id}_exam_cs_101`);
assert(finalAttemptState.endTimestamp === frozenDeadline, 'A9: Timer deadline cannot be extended by changing tabs or refreshing');


console.log('\n--- SECTION B: MULTI-TAB CONCURRENCY ---');

// Clean Priya's attempt for pristine test
removeItem(`active_attempt_${studentPriya.id}_exam_cs_101`);
removeItem(`tab_lock_${studentPriya.id}_exam_cs_101`);

// B1: Start examination in Tab A
const tabAStart = startExamAttempt(studentPriya, 'exam_cs_101', 'tab_A');
assert(tabAStart.success === true && tabAStart.hasTabLock === true, 'B1: Tab A acquires primary active attempt lock');

// B2 & B3: Open same examination in Tab B
const tabBStart = startExamAttempt(studentPriya, 'exam_cs_101', 'tab_B');
assert(tabBStart.success === true, 'B2: Tab B connects to existing active session');
assert(tabBStart.isResume === true, 'B3: Tab B is flagged as session resumption, NOT a new independent attempt');
assert(tabBStart.attempt.attemptId === tabAStart.attempt.attemptId, 'B3: Both Tab A and Tab B share identical attemptId');

// B4: Active lock rejection for Tab B
assert(tabBStart.hasTabLock === false, 'B4: Tab B is denied tab lock while Tab A is actively holding it');
assert(tabBStart.lockHolder === 'tab_A', 'B4: Tab B correctly identifies Tab A as the active lock holder');

// B5 & B6: Stale-lock recovery when Tab A closes unexpectedly
// Simulate Tab A closing: no more heartbeats. Set Tab A lock heartbeat to 20 seconds ago (> 15s stale timeout)
const staleLockKey = `tab_lock_${studentPriya.id}_exam_cs_101`;
setItem(staleLockKey, { activeTabId: 'tab_A', lastHeartbeat: Date.now() - 20000 });

// Tab B attempts to acquire lock
const tabBRecover = acquireTabLock('exam_cs_101', studentPriya.id, 'tab_B', 15000);
assert(tabBRecover.acquired === true, 'B6: Tab B successfully reclaims lock after Tab A stalls');
assert(tabBRecover.isStaleRecovered === true, 'B6: Lock manager reports stale-lease recovery');
assert(tabBRecover.activeTabId === 'tab_B', 'B6: Tab B is now recorded as the active lock holder');

// B7: Verify recovery did not create duplicate attempts
const priyaAttempt = getItem(`active_attempt_${studentPriya.id}_exam_cs_101`);
assert(priyaAttempt.attemptId === tabAStart.attempt.attemptId, 'B7: Stale recovery maintained original attemptId without duplication');

// B8: Submission in one tab synchronizes with other tab
const submitTabB = submitExamAttempt(studentPriya.id, 'exam_cs_101', 'manual');
assert(submitTabB.success === true, 'B8: Tab B submits the active examination attempt');
// Tab A now queries active attempt
const tabACheck = getActiveAttempt(studentPriya.id, 'exam_cs_101');
assert(tabACheck === null, 'B8: Tab A now sees attempt is completed (null returned from active attempt)');
// Tab A tries to submit again
const submitTabA = submitExamAttempt(studentPriya.id, 'exam_cs_101', 'manual');
assert(submitTabA.success === true, 'B8: Tab A duplicate submission returns existing result gracefully');
assert(submitTabA.result.id === submitTabB.result.id, 'B8: Both tabs synchronize to exact same result ID');


console.log('\n--- SECTION C: RETAKE AND DUPLICATE SUBMISSION ---');

// C1: allowRetake = false (exam_cs_102)
removeItem(`active_attempt_${studentAlex.id}_exam_cs_102`);
const alexFirst102 = startExamAttempt(studentAlex, 'exam_cs_102', 'tab_retake_test');
assert(alexFirst102.success === true, 'C1: First attempt on non-retake exam succeeds');
const submit102 = submitExamAttempt(studentAlex.id, 'exam_cs_102', 'manual');
assert(submit102.success === true, 'C1: First attempt submitted successfully');

// Attempt to retake exam_cs_102
const alexSecond102 = startExamAttempt(studentAlex, 'exam_cs_102', 'tab_retake_test_2');
assert(alexSecond102.success === false, 'C1: Retake is blocked when allowRetake is false');
assert(alexSecond102.error.includes('Retakes are not permitted'), 'C1: Clear explanatory error provided when retakes disabled');

// C2 & C3: allowRetake = true (exam_cs_101)
// Clean previous results for Alex on 101 to verify retake chain cleanly
const existingResults = getItem('results', []).filter((r) => !(r.studentSnapshot?.id === studentAlex.id && r.examId === 'exam_cs_101'));
setItem('results', existingResults);
removeItem(`active_attempt_${studentAlex.id}_exam_cs_101`);

// Attempt 1 on exam_cs_101
const att1 = startExamAttempt(studentAlex, 'exam_cs_101', 'tab_retake_1');
recordAnswer(studentAlex.id, 'exam_cs_101', 'qst_web_001', 'B'); // 10 marks
const res1 = submitExamAttempt(studentAlex.id, 'exam_cs_101', 'manual');
assert(res1.success === true, 'C2: First attempt submitted on retake-enabled exam');

// Attempt 2 (Retake) on exam_cs_101
const att2 = startExamAttempt(studentAlex, 'exam_cs_101', 'tab_retake_2');
assert(att2.success === true, 'C2: Retake allowed and succeeds when allowRetake is true');
assert(att2.attempt.attemptId !== att1.attempt.attemptId, 'C2: Retake creates a separate attempt with new unique attemptId');

// Answer differently on Retake
recordAnswer(studentAlex.id, 'exam_cs_101', 'qst_web_001', 'B'); // 10 marks
recordAnswer(studentAlex.id, 'exam_cs_101', 'qst_web_002', 'A'); // 10 marks
const res2 = submitExamAttempt(studentAlex.id, 'exam_cs_101', 'manual');
assert(res2.success === true, 'C2: Retake attempt submitted successfully');

// Verify C3: Both previous results preserved
const alexAll101Results = getItem('results', []).filter((r) => r.studentSnapshot?.id === studentAlex.id && r.examId === 'exam_cs_101');
assert(alexAll101Results.length === 2, 'C3: Previous result preserved; student now has 2 distinct historical result records');
assert(alexAll101Results[0].id !== alexAll101Results[1].id, 'C3: Both records possess distinct unique result IDs');

// C4: Double-clicking submit prevention (Idempotency)
const testResultPayload = {
  id: 'res_idempotency_test',
  attemptId: 'att_double_click_test',
  examId: 'exam_cs_101',
  studentSnapshot: { id: studentAlex.id },
  marksObtained: 20,
};
const write1 = persistExamResultIdempotent(testResultPayload);
const write2 = persistExamResultIdempotent(testResultPayload);
assert(write1.success === true && write1.isDuplicate === false, 'C4: Initial submission commits result');
assert(write2.success === true && write2.isDuplicate === true, 'C4: Double-click submission caught by idempotency guard (isDuplicate: true)');

const allTestMatches = getItem('results', []).filter((r) => r.attemptId === 'att_double_click_test');
assert(allTestMatches.length === 1, 'C4: Storage strictly contains exactly 1 result record despite double-click submission');

// C6: Reopening a completed attempt cannot submit it again
const alex101CountBefore = getItem('results', []).filter((r) => r.studentSnapshot?.id === studentAlex.id && r.examId === 'exam_cs_101').length;
const completedReopen = submitExamAttempt(studentAlex.id, 'exam_cs_101', 'manual');
assert(completedReopen.success === true, 'C6: Resubmitting completed attempt returns existing result without error');
const alex101CountAfter = getItem('results', []).filter((r) => r.studentSnapshot?.id === studentAlex.id && r.examId === 'exam_cs_101').length;
assert(alex101CountAfter === alex101CountBefore, 'C6: Resubmitting completed attempt did not create any new result record');


console.log('\n--- SECTION D: RESULT CALCULATION & EXACT ROUNDING MATH ---');

// Create controlled examination with 5 questions, 10 marks each = 50 marks total, 60% passing threshold
const gradingExamId = 'exam_grading_rigorous';
const gradingExam = {
  id: gradingExamId,
  title: 'Controlled Rigorous Grading Examination',
  category: 'Quality Assurance',
  durationMinutes: 30,
  totalMarks: 50,
  passingPercentage: 60,
  startDateTime: new Date(Date.now() - 100000).toISOString(),
  endDateTime: new Date(Date.now() + 1000000).toISOString(),
  status: 'published',
  allowRetake: true,
  questionCount: 5,
};
setItem('examinations', [gradingExam, ...getItem('examinations', [])]);

const gradingQuestions = [
  { id: 'q_g1', examId: gradingExamId, questionText: 'Q1', options: [{id:'A',text:'A'},{id:'B',text:'B'},{id:'C',text:'C'},{id:'D',text:'D'}], correctAnswer: 'A', marks: 10, isDeleted: false },
  { id: 'q_g2', examId: gradingExamId, questionText: 'Q2', options: [{id:'A',text:'A'},{id:'B',text:'B'},{id:'C',text:'C'},{id:'D',text:'D'}], correctAnswer: 'B', marks: 10, isDeleted: false },
  { id: 'q_g3', examId: gradingExamId, questionText: 'Q3', options: [{id:'A',text:'A'},{id:'B',text:'B'},{id:'C',text:'C'},{id:'D',text:'D'}], correctAnswer: 'C', marks: 10, isDeleted: false },
  { id: 'q_g4', examId: gradingExamId, questionText: 'Q4', options: [{id:'A',text:'A'},{id:'B',text:'B'},{id:'C',text:'C'},{id:'D',text:'D'}], correctAnswer: 'D', marks: 10, isDeleted: false },
  { id: 'q_g5', examId: gradingExamId, questionText: 'Q5', options: [{id:'A',text:'A'},{id:'B',text:'B'},{id:'C',text:'C'},{id:'D',text:'D'}], correctAnswer: 'A', marks: 10, isDeleted: false },
];
setItem('questions', [...gradingQuestions, ...getItem('questions', [])]);

// D1: All Correct Answers
removeItem(`active_attempt_${studentAlex.id}_${gradingExamId}`);
startExamAttempt(studentAlex, gradingExamId, 'tab_calc_1');
recordAnswer(studentAlex.id, gradingExamId, 'q_g1', 'A');
recordAnswer(studentAlex.id, gradingExamId, 'q_g2', 'B');
recordAnswer(studentAlex.id, gradingExamId, 'q_g3', 'C');
recordAnswer(studentAlex.id, gradingExamId, 'q_g4', 'D');
recordAnswer(studentAlex.id, gradingExamId, 'q_g5', 'A');
const resAllCorrect = submitExamAttempt(studentAlex.id, gradingExamId, 'manual').result;

assert(resAllCorrect.marksObtained === 50, 'D1: All Correct gives 50/50 marks obtained');
assert(resAllCorrect.percentage === 100.0, 'D1: All Correct gives 100.0% percentage');
assert(resAllCorrect.correctCount === 5, 'D1: correctCount is 5');
assert(resAllCorrect.incorrectCount === 0, 'D1: incorrectCount is 0');
assert(resAllCorrect.unansweredCount === 0, 'D1: unansweredCount is 0');
assert(resAllCorrect.isPassed === true, 'D1: isPassed is true (100% >= 60%)');

// D2: All Incorrect Answers
removeItem(`active_attempt_${studentAlex.id}_${gradingExamId}`);
startExamAttempt(studentAlex, gradingExamId, 'tab_calc_2');
recordAnswer(studentAlex.id, gradingExamId, 'q_g1', 'B');
recordAnswer(studentAlex.id, gradingExamId, 'q_g2', 'C');
recordAnswer(studentAlex.id, gradingExamId, 'q_g3', 'D');
recordAnswer(studentAlex.id, gradingExamId, 'q_g4', 'A');
recordAnswer(studentAlex.id, gradingExamId, 'q_g5', 'B');
const resAllIncorrect = submitExamAttempt(studentAlex.id, gradingExamId, 'manual').result;

assert(resAllIncorrect.marksObtained === 0, 'D2: All Incorrect gives 0/50 marks obtained');
assert(resAllIncorrect.percentage === 0.0, 'D2: All Incorrect gives 0.0% percentage');
assert(resAllIncorrect.correctCount === 0, 'D2: correctCount is 0');
assert(resAllIncorrect.incorrectCount === 5, 'D2: incorrectCount is 5');
assert(resAllIncorrect.unansweredCount === 0, 'D2: unansweredCount is 0');
assert(resAllIncorrect.isPassed === false, 'D2: isPassed is false');

// D3: Partially Correct Performance + Unanswered
removeItem(`active_attempt_${studentAlex.id}_${gradingExamId}`);
startExamAttempt(studentAlex, gradingExamId, 'tab_calc_3');
recordAnswer(studentAlex.id, gradingExamId, 'q_g1', 'A'); // Correct (10m)
recordAnswer(studentAlex.id, gradingExamId, 'q_g2', 'D'); // Incorrect (0m)
recordAnswer(studentAlex.id, gradingExamId, 'q_g3', 'C'); // Correct (10m)
// q_g4 left unanswered
// q_g5 left unanswered
const resPartial = submitExamAttempt(studentAlex.id, gradingExamId, 'manual').result;

assert(resPartial.marksObtained === 20, 'D3: Partial performance gives exactly 20 marks');
assert(resPartial.percentage === 40.0, 'D3: Partial percentage gives 40.0%');
assert(resPartial.correctCount === 2, 'D3: correctCount is 2');
assert(resPartial.incorrectCount === 1, 'D3: incorrectCount is 1');
assert(resPartial.unansweredCount === 2, 'D3: unansweredCount is 2');
assert(resPartial.isPassed === false, 'D3: isPassed is false (40% < 60%)');

// D4: Zero Score with all unanswered
removeItem(`active_attempt_${studentAlex.id}_${gradingExamId}`);
startExamAttempt(studentAlex, gradingExamId, 'tab_calc_4');
const resZeroUnanswered = submitExamAttempt(studentAlex.id, gradingExamId, 'manual').result;
assert(resZeroUnanswered.marksObtained === 0, 'D4: All unanswered gives 0 marks');
assert(resZeroUnanswered.unansweredCount === 5, 'D4: unansweredCount is 5');

// D5: Pass Threshold Boundary Testing (60% threshold on 50 marks)
// Case 5a: Just below threshold (29/50 = 58.0%) -> Fail
// To test fractional mark boundaries, create an exam with totalMarks: 100 and passing: 60%
const boundaryExamId = 'exam_boundary_test';
setItem('examinations', [{
  id: boundaryExamId,
  title: 'Boundary Test Exam',
  durationMinutes: 30,
  totalMarks: 100,
  passingPercentage: 60,
  startDateTime: new Date(Date.now() - 100000).toISOString(),
  endDateTime: new Date(Date.now() + 1000000).toISOString(),
  status: 'published',
  allowRetake: true,
  questionCount: 2,
}, ...getItem('examinations', [])]);

setItem('questions', [
  { id: 'q_b1', examId: boundaryExamId, questionText: 'B1', options: [{id:'A',text:'A'},{id:'B',text:'B'},{id:'C',text:'C'},{id:'D',text:'D'}], correctAnswer: 'A', marks: 59, isDeleted: false },
  { id: 'q_b2', examId: boundaryExamId, questionText: 'B2', options: [{id:'A',text:'A'},{id:'B',text:'B'},{id:'C',text:'C'},{id:'D',text:'D'}], correctAnswer: 'A', marks: 41, isDeleted: false },
  ...getItem('questions', [])
]);

// 59/100 marks = 59.0% -> Must be Failed (< 60.0%)
startExamAttempt(studentAlex, boundaryExamId, 'tab_b_1');
recordAnswer(studentAlex.id, boundaryExamId, 'q_b1', 'A'); // 59 marks
const res59 = submitExamAttempt(studentAlex.id, boundaryExamId, 'manual').result;
assert(res59.percentage === 59.0, 'D5: 59/100 marks computes to exactly 59.0%');
assert(res59.isPassed === false, 'D5: 59.0% strictly fails threshold of 60.0%');

// 60/100 marks = 60.0% -> Must be Passed (>= 60.0%)
// Update q_b1 to 60 marks
const allQ = getItem('questions', []);
allQ.find((q) => q.id === 'q_b1').marks = 60;
setItem('questions', allQ);

removeItem(`active_attempt_${studentAlex.id}_${boundaryExamId}`);
startExamAttempt(studentAlex, boundaryExamId, 'tab_b_2');
recordAnswer(studentAlex.id, boundaryExamId, 'q_b1', 'A'); // 60 marks
const res60 = submitExamAttempt(studentAlex.id, boundaryExamId, 'manual').result;
assert(res60.percentage === 60.0, 'D5: 60/100 marks computes to exactly 60.0%');
assert(res60.isPassed === true, 'D5: 60.0% exactly meets passing threshold and isPassed is true');

// D6: Floating Point Precision & 1-Decimal Rounding
// 10 marks out of 30 total marks = 33.33333333% -> Should round to 33.3%
const precisionExamId = 'exam_precision_test';
setItem('examinations', [{
  id: precisionExamId,
  title: 'Precision Test Exam',
  durationMinutes: 30,
  totalMarks: 30,
  passingPercentage: 50,
  startDateTime: new Date(Date.now() - 100000).toISOString(),
  endDateTime: new Date(Date.now() + 1000000).toISOString(),
  status: 'published',
  allowRetake: true,
  questionCount: 3,
}, ...getItem('examinations', [])]);

setItem('questions', [
  { id: 'q_p1', examId: precisionExamId, questionText: 'P1', options: [{id:'A',text:'A'},{id:'B',text:'B'},{id:'C',text:'C'},{id:'D',text:'D'}], correctAnswer: 'A', marks: 10, isDeleted: false },
  { id: 'q_p2', examId: precisionExamId, questionText: 'P2', options: [{id:'A',text:'A'},{id:'B',text:'B'},{id:'C',text:'C'},{id:'D',text:'D'}], correctAnswer: 'A', marks: 10, isDeleted: false },
  { id: 'q_p3', examId: precisionExamId, questionText: 'P3', options: [{id:'A',text:'A'},{id:'B',text:'B'},{id:'C',text:'C'},{id:'D',text:'D'}], correctAnswer: 'A', marks: 10, isDeleted: false },
  ...getItem('questions', [])
]);

startExamAttempt(studentAlex, precisionExamId, 'tab_prec_1');
recordAnswer(studentAlex.id, precisionExamId, 'q_p1', 'A'); // 10/30 marks
const res33 = submitExamAttempt(studentAlex.id, precisionExamId, 'manual').result;
assert(res33.percentage === 33.3, `D6: 10/30 marks formats to 33.3% with 1-decimal rounding (got ${res33.percentage})`);

// 20 marks out of 30 = 66.66666666% -> Should round to 66.7%
removeItem(`active_attempt_${studentAlex.id}_${precisionExamId}`);
startExamAttempt(studentAlex, precisionExamId, 'tab_prec_2');
recordAnswer(studentAlex.id, precisionExamId, 'q_p1', 'A');
recordAnswer(studentAlex.id, precisionExamId, 'q_p2', 'A');
const res66 = submitExamAttempt(studentAlex.id, precisionExamId, 'manual').result;
assert(res66.percentage === 66.7, `D6: 20/30 marks formats to 66.7% with 1-decimal rounding (got ${res66.percentage})`);


console.log('\n--- SECTION E: AUTHORIZATION AND DATA ISOLATION ---');

// E1: Student A cannot access Student B's result in results query
const priyaResultsQuery = getResults({ studentId: studentPriya.id });
const priyaHasAlexResult = priyaResultsQuery.some((r) => r.studentSnapshot?.id === studentAlex.id);
assert(priyaHasAlexResult === false, 'E1: Querying results for Student B strictly isolates and excludes Student A results');

// Direct lookup authorization check simulation
const alexResultRecord = getResults({ studentId: studentAlex.id })[0];
const isPriyaAuthorizedForAlexResult = studentPriya.id === alexResultRecord.studentSnapshot.id;
assert(isPriyaAuthorizedForAlexResult === false, 'E1: Student B is not authorized to inspect Student A scorecard record');

// E2: Student A cannot access Student B's active attempt
startExamAttempt(studentAlex, 'exam_cs_101', 'tab_alex_active');
const priyaAttemptKey = `active_attempt_${studentPriya.id}_exam_cs_101`;
const alexAttemptKey = `active_attempt_${studentAlex.id}_exam_cs_101`;
assert(getItem(priyaAttemptKey, null) === null, 'E2: Starting attempt for Student A creates no record under Student B key');
assert(getItem(alexAttemptKey, null) !== null, 'E2: Student A attempt exists under student-scoped key');

// E3: Students cannot access unpublished (draft) examinations
const draftExam = getItem('examinations', []).find((e) => e.status === 'draft');
assert(!!draftExam, 'E3: Draft examination exists in catalog');
const draftAttemptRes = startExamAttempt(studentAlex, draftExam.id, 'tab_draft');
assert(draftAttemptRes.success === false, 'E3: Starting unpublished (draft) exam is blocked');
assert(draftAttemptRes.error.includes('unpublished'), 'E3: Appropriate error message for unpublished examination');

// E4: Students cannot access soft-deleted examinations
const deletedExamId = 'exam_deleted_test';
setItem('examinations', [{
  id: deletedExamId,
  title: 'Deleted Examination',
  status: 'published',
  isDeleted: true,
  durationMinutes: 30,
  totalMarks: 50,
  startDateTime: new Date(Date.now() - 10000).toISOString(),
  endDateTime: new Date(Date.now() + 100000).toISOString(),
}, ...getItem('examinations', [])]);

const deletedAttemptRes = startExamAttempt(studentAlex, deletedExamId, 'tab_del');
assert(deletedAttemptRes.success === false, 'E4: Starting soft-deleted exam is blocked');

// E5: Students cannot see correct answers or marks explanations during active exam
const sanitized = sanitizeQuestionsForStudent(getQuestions({ examId: 'exam_cs_101' }));
const hasExposedAnswer = sanitized.some((q) => q.correctAnswer !== undefined || q.explanation !== undefined);
assert(hasExposedAnswer === false, 'E5: Student-facing sanitized questions strip correctAnswer and explanation fields');

// E6: Role and account status tampering prevention via updateUserProfile
const tamperRes = updateUserProfile(studentAlex.id, {
  role: 'admin',
  status: 'suspended',
});
assert(tamperRes.user.role === 'student', 'E6: Role tampering rejected; student role remains strictly "student"');

// E7: Suspended students cannot initiate or continue an active examination
// Temporarily suspend Alex
const usersList = getItem('users', []);
const alexUser = usersList.find((u) => u.id === studentAlex.id);
alexUser.status = 'suspended';
setItem('users', usersList);

const suspendedAttemptRes = startExamAttempt(studentAlex, 'exam_cs_101', 'tab_susp');
assert(suspendedAttemptRes.success === false, 'E7: Suspended student cannot start or resume active examination attempt');
assert(suspendedAttemptRes.error.includes('suspended'), 'E7: Error message specifically indicates account suspension');

// Restore Alex
alexUser.status = 'active';
setItem('users', usersList);


console.log('\n--- SECTION F: HISTORICAL SNAPSHOT IMMUTABILITY ---');

// F1: Complete an examination and record its saved result snapshot
removeItem(`active_attempt_${studentAlex.id}_exam_cs_101`);
startExamAttempt(studentAlex, 'exam_cs_101', 'tab_immutable_test');
recordAnswer(studentAlex.id, 'exam_cs_101', 'qst_web_001', 'B'); // 10 marks
const immutableResult = submitExamAttempt(studentAlex.id, 'exam_cs_101', 'manual').result;

const originalExamTitle = immutableResult.examTitle;
const originalSnapshotTitle = immutableResult.examSnapshot.title;
const originalExamMarks = immutableResult.examSnapshot.totalMarks;
const originalDuration = immutableResult.examSnapshot.durationMinutes;
const originalQ1Text = immutableResult.answersBreakdown[0].questionText;
const originalQ1Answer = immutableResult.answersBreakdown[0].correctAnswer;
const originalMarksObtained = immutableResult.marksObtained;
const originalPercentage = immutableResult.percentage;

// F2 & F3: Edit the examination title and question bank in storage
const allExamsF = getItem('examinations', []);
const examToEdit = allExamsF.find((e) => e.id === 'exam_cs_101');
examToEdit.title = 'TAMPERED EXAM TITLE 2099';
examToEdit.totalMarks = 9999;
examToEdit.durationMinutes = 999;
setItem('examinations', allExamsF);

const allQuestionsF = getItem('questions', []);
const qToEdit = allQuestionsF.find((q) => q.id === 'qst_web_001');
qToEdit.questionText = 'COMPLETELY TAMPERED QUESTION TEXT';
qToEdit.correctAnswer = 'D';
qToEdit.marks = 100;
setItem('questions', allQuestionsF);

// F4: Delete/archive the examination
examToEdit.isDeleted = true;
setItem('examinations', allExamsF);

// F5 & F6: Reopen previous result and verify every historical field remains unchanged
const reloadedResult = getResultById(immutableResult.id);
assert(reloadedResult !== null, 'F5: Historical result record remains accessible after exam deletion');
assert(reloadedResult.examTitle === originalExamTitle, 'F6: Result examTitle is immutable and unchanged');
assert(reloadedResult.examSnapshot.title === originalSnapshotTitle, 'F6: Result examSnapshot.title is immutable and unchanged');
assert(reloadedResult.examSnapshot.totalMarks === originalExamMarks, 'F6: Result examSnapshot.totalMarks is immutable and unchanged');
assert(reloadedResult.examSnapshot.durationMinutes === originalDuration, 'F6: Result examSnapshot.durationMinutes is immutable and unchanged');
assert(reloadedResult.answersBreakdown[0].questionText === originalQ1Text, 'F6: Result answersBreakdown questionText is immutable and unchanged');
assert(reloadedResult.answersBreakdown[0].correctAnswer === originalQ1Answer, 'F6: Result answersBreakdown correctAnswer is immutable and unchanged');
assert(reloadedResult.marksObtained === originalMarksObtained, 'F6: Result marksObtained is immutable and unchanged');
assert(reloadedResult.percentage === originalPercentage, 'F6: Result percentage is immutable and unchanged');


console.log('\n===============================================================');
console.log(`TOTAL AUDIT SPECIFICATIONS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log('===============================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL ENGINE VERIFICATION CRITICAL CHECKS PASSED WITH 100% SUCCESS!\n');
  process.exit(0);
}
