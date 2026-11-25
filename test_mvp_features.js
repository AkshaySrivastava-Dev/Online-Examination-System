/**
 * VERITY MVP Features Test Suite
 *
 * Verifies:
 * 1. ExamReplay (timeline construction, action logging, revision tracking, playback data)
 * 2. Adaptive Assessment (difficulty scaling, question selection, theta ability estimation)
 * 3. ExamFair (telemetry logging, penalty calculation, integrity score, audit snapshotting)
 * 4. Engine & Workflow Integration (persistence into immutable results, backward compatibility)
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

import { initializeSeedData, SEED_STUDENTS } from './src/services/seedData.js';
import { buildReplayTimeline, getReplayData } from './src/services/examReplayService.js';
import {
  getNextDifficultyLevel,
  selectAdaptiveQuestion,
  calculateAdaptiveProficiency,
} from './src/services/adaptiveAssessmentService.js';
import {
  calculateIntegrityScore,
  createExamFairSnapshot,
} from './src/services/examFairService.js';
import {
  startExamAttempt,
  recordAnswer,
  recordExamFairViolation,
  submitExamAttempt,
} from './src/services/examEngineService.js';
import { getResults } from './src/services/resultService.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`  FAIL [${totalTests}]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    passedTests++;
    console.log(`  PASS [${totalTests}]: ${message}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log(' VERITY — Remaining MVP Features Test Suite');
  console.log(' (ExamReplay, Adaptive Assessment, ExamFair)');
  console.log('======================================================\n');

  localStorage.clear();
  initializeSeedData();

  // -----------------------------------------------------------------
  // 1. EXAMREPLAY TIMELINE VERIFICATION
  // -----------------------------------------------------------------
  console.log('--- Suite 1: ExamReplay Engine ---');
  const results = getResults();
  assert(results.length > 0, `Results loaded from seed data (${results.length} records)`);

  const sampleResult = results[0];
  const timeline = buildReplayTimeline(sampleResult);
  assert(Array.isArray(timeline) && timeline.length > 0, `Replay timeline constructed with ${timeline.length} sequential frames`);

  const firstFrame = timeline[0];
  assert(firstFrame.step === 1, 'First frame has step 1');
  assert(firstFrame.action === 'NAVIGATE', 'First frame represents question navigation');
  assert(firstFrame.questionNumber === 1, 'First frame targets Question 1');
  assert(typeof firstFrame.timestampSec === 'number', 'Frame contains valid timestamp');

  // Verify getReplayData API
  const replayData = getReplayData(sampleResult.id);
  assert(replayData.success === true, 'getReplayData succeeds with valid result ID');
  assert(replayData.totalSteps === timeline.length, 'Replay step count matches timeline frames');

  // Verify missing result handling
  const badReplay = getReplayData('non_existent_result_999');
  assert(badReplay.success === false, 'getReplayData handles non-existent result gracefully');

  // -----------------------------------------------------------------
  // 2. ADAPTIVE ASSESSMENT (CAT) ENGINE VERIFICATION
  // -----------------------------------------------------------------
  console.log('\n--- Suite 2: Adaptive Assessment Engine ---');

  // Difficulty calibration rules
  assert(getNextDifficultyLevel(true, 'Easy') === 'Medium', 'Correct answer on Easy escalates to Medium');
  assert(getNextDifficultyLevel(true, 'Medium') === 'Hard', 'Correct answer on Medium escalates to Hard');
  assert(getNextDifficultyLevel(true, 'Hard') === 'Hard', 'Correct answer on Hard caps at Hard');
  assert(getNextDifficultyLevel(false, 'Hard') === 'Medium', 'Incorrect answer on Hard de-escalates to Medium');
  assert(getNextDifficultyLevel(false, 'Medium') === 'Easy', 'Incorrect answer on Medium de-escalates to Easy');
  assert(getNextDifficultyLevel(false, 'Easy') === 'Easy', 'Incorrect answer on Easy floors at Easy');

  // Adaptive Question Selection
  const nextQ = selectAdaptiveQuestion({
    examId: 'exam_cs_102',
    askedQuestionIds: ['qst_dsa_001'],
    targetDifficulty: 'Medium',
  });
  assert(nextQ !== null && nextQ.id, 'Adaptive question selected from unasked pool');
  assert(nextQ.id !== 'qst_dsa_001', 'Adaptive question guarantees candidate does not repeat previously asked question');

  // Theta Ability & Scaled Score Estimation
  const highPerformance = calculateAdaptiveProficiency([
    { isCorrect: true, difficulty: 'Medium', marks: 10 },
    { isCorrect: true, difficulty: 'Hard', marks: 10 },
    { isCorrect: true, difficulty: 'Hard', marks: 10 },
  ]);
  assert(highPerformance.theta > 0, `High performance generates positive theta ability (+${highPerformance.theta})`);
  assert(highPerformance.scaledScore >= 80, `High performance generates high scaled score (${highPerformance.scaledScore}%)`);
  assert(highPerformance.proficiencyTier.includes('Mastery') || highPerformance.proficiencyTier.includes('Advanced'), 'High performance classified in top proficiency tier');

  const lowPerformance = calculateAdaptiveProficiency([
    { isCorrect: false, difficulty: 'Medium', marks: 10 },
    { isCorrect: false, difficulty: 'Easy', marks: 10 },
    { isCorrect: true, difficulty: 'Easy', marks: 10 },
  ]);
  assert(lowPerformance.theta < 0, `Low performance generates negative theta ability (${lowPerformance.theta})`);
  assert(lowPerformance.scaledScore < 50, `Low performance generates scaled score < 50% (${lowPerformance.scaledScore}%)`);

  // -----------------------------------------------------------------
  // 3. EXAMFAIR ACADEMIC INTEGRITY ENGINE VERIFICATION
  // -----------------------------------------------------------------
  console.log('\n--- Suite 3: ExamFair Academic Integrity Engine ---');

  // Clean session
  const cleanScore = calculateIntegrityScore({ tabSwitches: 0, copyPasteAttempts: 0, rapidAnomalies: 0 });
  assert(cleanScore.integrityScore === 100, 'Zero violations gives 100% integrity score');
  assert(cleanScore.status === 'CLEAN_VERIFIED', 'Zero violations status is CLEAN_VERIFIED');
  assert(cleanScore.riskLevel === 'LOW', 'Zero violations risk is LOW');

  // Moderate infractions
  const moderateScore = calculateIntegrityScore({ tabSwitches: 2, copyPasteAttempts: 0, rapidAnomalies: 0 });
  assert(moderateScore.integrityScore === 80, 'Two tab switches deducts 20 pts (80% score)');
  assert(moderateScore.status === 'ADVISORY_FLAGGED', '80% score status is ADVISORY_FLAGGED');
  assert(moderateScore.riskLevel === 'MEDIUM', '80% score risk is MEDIUM');

  // Severe infractions
  const severeScore = calculateIntegrityScore({ tabSwitches: 3, copyPasteAttempts: 2, rapidAnomalies: 2 });
  assert(severeScore.integrityScore <= 50, `Multiple infractions deducts score to ${severeScore.integrityScore}%`);
  assert(severeScore.status === 'HIGH_RISK_REVIEW', 'High infraction status is HIGH_RISK_REVIEW');
  assert(severeScore.riskLevel === 'HIGH', 'High infraction risk is HIGH');

  // Snapshot generation
  const snapshot = createExamFairSnapshot({ tabSwitches: 1, copyPasteAttempts: 0, events: [] });
  assert(snapshot.integrityScore === 90, 'Snapshot integrity score accurately computed');
  assert(snapshot.verifiedAt && typeof snapshot.verifiedAt === 'string', 'Snapshot records ISO verification timestamp');

  // -----------------------------------------------------------------
  // 4. WORKFLOW & ENGINE INTEGRATION VERIFICATION
  // -----------------------------------------------------------------
  console.log('\n--- Suite 4: Engine Integration & Submission Flow ---');

  const student = SEED_STUDENTS[0];
  const attemptRes = startExamAttempt(student, 'exam_cs_101', 'test_tab_001');
  assert(attemptRes.success === true, 'startExamAttempt succeeded');

  // Log ExamFair violation in active session
  const logRes = recordExamFairViolation(student.id, 'exam_cs_101', {
    type: 'TAB_SWITCH',
    description: 'Simulated tab switch during examination',
  });
  assert(logRes === true, 'recordExamFairViolation successfully recorded in session telemetry');

  // Answer a question
  recordAnswer(student.id, 'exam_cs_101', attemptRes.questions[0].id, 'A');

  // Submit attempt
  const submitRes = submitExamAttempt(student.id, 'exam_cs_101', 'manual');
  assert(submitRes.success === true && submitRes.result?.id, 'Examination attempt submitted successfully');

  // Verify result includes ExamFair audit
  const savedResult = submitRes.result;
  assert(savedResult.examFairAudit !== undefined, 'Result snapshot contains examFairAudit object');
  assert(savedResult.examFairAudit.tabSwitches === 1, 'Saved audit preserved logged tab switch (1)');
  assert(savedResult.examFairAudit.integrityScore === 90, 'Saved audit computed correct 90% integrity score');

  // Verify Replay timeline can immediately be constructed from this new result
  const newTimeline = buildReplayTimeline(savedResult);
  assert(newTimeline.length > 0, `Freshly submitted result immediately generates replay timeline (${newTimeline.length} frames)`);

  console.log('\n======================================================');
  console.log(` ALL MVP FEATURE CHECKS PASSED: ${passedTests}/${totalTests} tests successful.`);
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
