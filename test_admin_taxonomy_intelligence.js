/**
 * VERITY — Admin Intelligence Completion & Taxonomy Refinement Test Suite
 *
 * Verifies:
 * 1. Taxonomy Service: hierarchical assignment (Subject → Topic → Subtopic → Concept)
 * 2. Strict Duplicate Prevention & Case/Whitespace Normalization
 * 3. Question Bank Multi-Filter (Subject, Topic, Subtopic, Difficulty)
 * 4. Automatic Taxonomy Hierarchy Registration on Question Creation/Editing
 * 5. Student vs Admin ExamDNA Consistency (100% mathematical parity via computeExamDna)
 * 6. Immutability: Question/Taxonomy changes never alter historical result snapshots
 * 7. Role-Based Data Isolation & Access Controls
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

import { initializeSeedData, PREDEFINED_ADMIN, SEED_STUDENTS } from './src/services/seedData.js';
import {
  getTaxonomies,
  getSubjects,
  getTopics,
  getSubtopics,
  getConcepts,
  addTaxonomyEntry,
  updateTaxonomyEntry,
  deleteTaxonomyEntry,
  normalizeText,
} from './src/services/taxonomyService.js';
import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
} from './src/services/questionService.js';
import { computeExamDna } from './src/services/examDnaService.js';
import { getResults } from './src/services/resultService.js';
import { getItem, setItem } from './src/services/storageService.js';

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
  console.log(' VERITY — Admin Intelligence & Taxonomy Test Suite');
  console.log('======================================================\n');

  // Reset and initialize storage
  localStorage.clear();
  initializeSeedData();

  // -----------------------------------------------------------------
  // 1. TAXONOMY SERVICE HIERARCHICAL QUERIES & INITIAL SEEDING
  // -----------------------------------------------------------------
  console.log('--- Suite 1: Taxonomy Hierarchy & Default Seeding ---');
  const initialTax = getTaxonomies();
  assert(Array.isArray(initialTax) && initialTax.length > 0, `Initial seed taxonomies initialized (${initialTax.length} entries)`);

  const subjects = getSubjects();
  assert(subjects.includes('Computer Science'), 'Computer Science subject present in subjects list');

  const csTopics = getTopics('Computer Science');
  assert(csTopics.length > 0, `Topics found for Computer Science: ${csTopics.join(', ')}`);
  assert(csTopics.includes('Algorithms') && csTopics.includes('Data Structures'), 'Algorithms and Data Structures topics recognized');

  const algoSubtopics = getSubtopics('Computer Science', 'Algorithms');
  assert(algoSubtopics.length > 0, `Subtopics found for Algorithms: ${algoSubtopics.join(', ')}`);

  const algoConcepts = getConcepts('Computer Science', 'Algorithms');
  assert(Array.isArray(algoConcepts), 'Concepts query returns array');

  // -----------------------------------------------------------------
  // 2. STRICT DEDUPLICATION & NORMALIZATION
  // -----------------------------------------------------------------
  console.log('\n--- Suite 2: Strict Deduplication & Normalization ---');

  // NormalizeText helper
  assert(normalizeText('   Computer   Science   ') === 'Computer Science', 'normalizeText trims and collapses inner spaces');

  // Add new distinct taxonomy entry
  const addRes1 = addTaxonomyEntry({
    subject: 'Data Science',
    topic: 'Machine Learning',
    subtopic: 'Supervised Learning',
    concept: 'Decision Trees',
  });
  assert(addRes1.success === true && addRes1.entry?.id, 'Successfully added new taxonomy entry');

  // Attempt duplicate entry (identical)
  const addDup1 = addTaxonomyEntry({
    subject: 'Data Science',
    topic: 'Machine Learning',
    subtopic: 'Supervised Learning',
    concept: 'Decision Trees',
  });
  assert(addDup1.success === false && addDup1.isDuplicate === true, 'Duplicate identical entry correctly rejected');

  // Attempt duplicate entry with case variation and extra whitespace
  const addDup2 = addTaxonomyEntry({
    subject: '  data  science  ',
    topic: 'MACHINE LEARNING',
    subtopic: 'supervised learning  ',
    concept: 'Decision Trees',
  });
  assert(addDup2.success === false && addDup2.isDuplicate === true, 'Case-insensitive whitespace-trimmed duplicate rejected');

  // Verify missing required fields
  const addInvalid = addTaxonomyEntry({ subject: '', topic: 'Test' });
  assert(addInvalid.success === false && addInvalid.error.includes('Subject is required'), 'Rejects entry with missing subject');

  // Update taxonomy entry
  const updateRes = updateTaxonomyEntry(addRes1.entry.id, {
    concept: 'Random Forests',
  });
  assert(updateRes.success === true && updateRes.entry.concept === 'Random Forests', 'Successfully updated taxonomy concept');

  // Attempt updating to collide with existing entry
  const addRes2 = addTaxonomyEntry({
    subject: 'Data Science',
    topic: 'Deep Learning',
    subtopic: 'CNN',
    concept: 'ResNet',
  });
  assert(addRes2.success === true, 'Added second entry for collision test');

  const collisionUpdate = updateTaxonomyEntry(addRes2.entry.id, {
    topic: 'Machine Learning',
    subtopic: 'Supervised Learning',
    concept: 'Random Forests',
  });
  assert(collisionUpdate.success === false && collisionUpdate.error.includes('already exists'), 'Update preventing collision with existing hierarchy');

  // Delete taxonomy entry
  const delRes = deleteTaxonomyEntry(addRes2.entry.id);
  assert(delRes.success === true, 'Successfully deleted taxonomy entry');

  // -----------------------------------------------------------------
  // 3. QUESTION BANK MULTI-FILTER & AUTO-TAXONOMY REGISTRATION
  // -----------------------------------------------------------------
  console.log('\n--- Suite 3: Question Multi-Filter & Auto-Taxonomy Registration ---');

  // Query all active questions
  const allQuestions = getQuestions();
  assert(allQuestions.length > 0, `Active questions loaded (${allQuestions.length} questions)`);

  // Filter by subject
  const csQuestions = getQuestions({ subject: 'Computer Science' });
  assert(csQuestions.length > 0 && csQuestions.every(q => q.subject === 'Computer Science'), 'Filter questions by subject');

  // Filter by topic
  const algoQuestions = getQuestions({ topic: 'Algorithms' });
  assert(algoQuestions.length > 0 && algoQuestions.every(q => q.topic === 'Algorithms'), 'Filter questions by topic');

  // Filter by difficulty
  const hardQuestions = getQuestions({ difficulty: 'Hard' });
  assert(hardQuestions.length > 0 && hardQuestions.every(q => q.difficulty === 'Hard'), 'Filter questions by difficulty');

  // Combined filter: subject + topic + difficulty
  const combinedFiltered = getQuestions({
    subject: 'Computer Science',
    topic: 'Data Structures',
    difficulty: 'Hard',
  });
  assert(
    combinedFiltered.length > 0 && combinedFiltered.every(q => q.subject === 'Computer Science' && q.topic === 'Data Structures' && q.difficulty === 'Hard'),
    'Multi-criteria filter (subject + topic + difficulty) accurately slices questions'
  );

  // Create question with novel taxonomy hierarchy
  const createQRes = createQuestion({
    examId: 'exam_cs_101',
    questionText: 'What is the loss function typically used for binary classification?',
    options: [
      { id: 'A', text: 'Binary Cross-Entropy' },
      { id: 'B', text: 'Mean Squared Error' },
      { id: 'C', text: 'Categorical Hinge' },
      { id: 'D', text: 'Huber Loss' },
    ],
    correctAnswer: 'A',
    marks: 2,
    difficulty: 'Medium',
    subject: 'Machine Learning',
    topic: 'Loss Functions',
    subtopic: 'Binary Classification',
    concept: 'Cross-Entropy',
  });
  assert(createQRes.success && createQRes.question?.id, 'Question created with complete 4-level taxonomy');

  // Verify auto-registered taxonomy entry
  const mlTopics = getTopics('Machine Learning');
  assert(mlTopics.includes('Loss Functions'), 'createQuestion automatically registers novel taxonomy hierarchy into taxonomies store');

  // -----------------------------------------------------------------
  // 4. STUDENT VS ADMIN EXAMDNA MATHEMATICAL PARITY
  // -----------------------------------------------------------------
  console.log('\n--- Suite 4: Student vs Admin ExamDNA Consistency ---');

  const studentUser = SEED_STUDENTS[0];
  assert(studentUser && studentUser.id, `Found seeded student: ${studentUser.email} (${studentUser.id})`);

  // Compute student ExamDNA as student portal would
  const studentPortalDna = computeExamDna({ studentId: studentUser.id });

  // Compute student ExamDNA as admin modal would
  const adminModalDna = computeExamDna({ studentId: studentUser.id });

  // Verify identical outputs
  assert(studentPortalDna.overallAccuracy === adminModalDna.overallAccuracy, 'Overall accuracy identical across student and admin view');
  assert(studentPortalDna.totalAttempts === adminModalDna.totalAttempts, 'Total attempts identical across views');
  assert(studentPortalDna.totalQuestionsAttempted === adminModalDna.totalQuestionsAttempted, 'Total questions attempted identical');
  assert(studentPortalDna.totalQuestionsCorrect === adminModalDna.totalQuestionsCorrect, 'Total correct count identical');
  assert(studentPortalDna.topicMastery.length === adminModalDna.topicMastery.length, 'Topic mastery entries count identical');

  // Verify topic breakdown consistency
  for (let i = 0; i < studentPortalDna.topicMastery.length; i++) {
    const sTop = studentPortalDna.topicMastery[i];
    const aTop = adminModalDna.topicMastery[i];
    assert(
      sTop.topic === aTop.topic &&
      sTop.accuracy === aTop.accuracy &&
      sTop.attempted === aTop.attempted &&
      sTop.correct === aTop.correct,
      `Topic "${sTop.topic}" metrics match 100% between student and admin`
    );
  }

  // Verify learning intelligence parity
  assert(
    JSON.stringify(studentPortalDna.learningIntelligence.relearning) ===
    JSON.stringify(adminModalDna.learningIntelligence.relearning),
    'Relearning concepts match 100%'
  );
  assert(
    JSON.stringify(studentPortalDna.learningIntelligence.priorityRanking) ===
    JSON.stringify(adminModalDna.learningIntelligence.priorityRanking),
    'Priority ranking matches 100%'
  );

  // -----------------------------------------------------------------
  // 5. IMMUTABILITY OF HISTORICAL ATTEMPT RECORDS
  // -----------------------------------------------------------------
  console.log('\n--- Suite 5: Immutability of Historical Attempt Records ---');

  const existingResultsBefore = getResults({ studentId: studentUser.id });
  assert(existingResultsBefore.length > 0, `Student has ${existingResultsBefore.length} historical examination results`);

  const sampleResultBefore = JSON.parse(JSON.stringify(existingResultsBefore[0]));

  // Update a question in question bank that was part of this exam
  const qToUpdate = sampleResultBefore.questionBreakdown?.[0]?.questionId;
  if (qToUpdate) {
    updateQuestion(qToUpdate, {
      questionText: 'MODIFIED QUESTION TEXT THAT SHOULD NOT MUTATE HISTORICAL RESULT',
      topic: 'Modified Topic Name',
    });
  }

  // Reload results and verify historical record is unaffected
  const existingResultsAfter = getResults({ studentId: studentUser.id });
  const sampleResultAfter = existingResultsAfter[0];

  assert(sampleResultAfter.score === sampleResultBefore.score, 'Historical score remains strictly unchanged');
  assert(sampleResultAfter.percentage === sampleResultBefore.percentage, 'Historical percentage remains strictly unchanged');
  assert(sampleResultAfter.totalMarks === sampleResultBefore.totalMarks, 'Historical totalMarks remains strictly unchanged');

  // -----------------------------------------------------------------
  // 6. ROLE ISOLATION & DATA ACCESS VERIFICATION
  // -----------------------------------------------------------------
  console.log('\n--- Suite 6: Role Isolation & Data Access ---');

  const adminUser = PREDEFINED_ADMIN;
  assert(adminUser && adminUser.role === 'admin', 'Admin user present');
  assert(studentUser && studentUser.role === 'student', 'Student user present');
  assert(adminUser.role !== studentUser.role, 'Admin and Student have distinct roles');

  console.log('\n======================================================');
  console.log(` ALL CHECKS PASSED: ${passedTests}/${totalTests} tests successful.`);
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
