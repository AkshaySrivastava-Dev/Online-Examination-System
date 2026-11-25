/**
 * ExamPro Question Service
 *
 * Manages question authoring, MCQ validation, and question bank operations.
 *
 * CRITICAL IMMUTABILITY INVARIANT:
 * Creating, modifying, or deleting questions in the question bank modifies ONLY
 * future examination attempts. Historical records stored in `exampro_v1_results`
 * reference frozen snapshots created at submission time and are NEVER mutated.
 */

import { getItem, setItem } from './storageService.js';
import { generateId } from '../utils/idGenerator.js';
import { getExaminationById, updateExamination } from './examService.js';
import { addTaxonomyEntry } from './taxonomyService.js';

/**
 * Get all questions (optionally filtered by exam, subject, topic, subtopic, difficulty).
 * @param {Object} [filter]
 * @param {string} [filter.examId]
 * @param {string} [filter.subject]
 * @param {string} [filter.topic]
 * @param {string} [filter.subtopic]
 * @param {string} [filter.difficulty]
 * @param {boolean} [filter.includeDeleted=false]
 * @returns {Array}
 */
export const getQuestions = ({ examId, subject, topic, subtopic, difficulty, includeDeleted = false } = {}) => {
  const questions = getItem('questions', []);
  return questions.filter((q) => {
    if (!includeDeleted && q.isDeleted) return false;
    if (examId && q.examId !== examId) return false;
    if (subject && q.subject !== subject) return false;
    if (topic && q.topic !== topic) return false;
    if (subtopic && q.subtopic !== subtopic) return false;
    if (difficulty && q.difficulty !== difficulty) return false;
    return true;
  });
};

/**
 * Get single question by ID.
 * @param {string} id
 * @returns {Object|null}
 */
export const getQuestionById = (id) => {
  if (!id) return null;
  const questions = getItem('questions', []);
  return questions.find((q) => q.id === id && !q.isDeleted) || null;
};

/**
 * Create a new MCQ question.
 *
 * @param {Object} data
 * @param {string} data.examId
 * @param {string} data.questionText
 * @param {Array<{id: string, text: string}>} data.options
 * @param {'A'|'B'|'C'|'D'} data.correctAnswer
 * @param {number} data.marks
 * @param {string} [data.explanation]
 * @returns {{ success: boolean, question?: Object, error?: string }}
 */
export const createQuestion = (data) => {
  if (!data.examId) {
    return { success: false, error: 'Target examination must be selected.' };
  }
  const exam = getExaminationById(data.examId);
  if (!exam) {
    return { success: false, error: 'Associated examination not found or deleted.' };
  }

  if (!data.questionText || !data.questionText.trim()) {
    return { success: false, error: 'Question text is required.' };
  }

  if (!Array.isArray(data.options) || data.options.length !== 4) {
    return { success: false, error: 'Exactly four options (A, B, C, D) are required.' };
  }

  for (const opt of data.options) {
    if (!opt.text || !opt.text.trim()) {
      return { success: false, error: `Option ${opt.id || ''} cannot be empty.` };
    }
  }

  if (!['A', 'B', 'C', 'D'].includes(data.correctAnswer)) {
    return { success: false, error: 'A valid correct answer (A, B, C, or D) must be specified.' };
  }

  const marks = Number(data.marks);
  if (isNaN(marks) || marks <= 0) {
    return { success: false, error: 'Marks must be a positive number greater than 0.' };
  }

  const newQuestion = {
    id: generateId('qst'),
    examId: data.examId,
    subject: data.subject?.trim() || exam.category || 'General',
    topic: data.topic?.trim() || 'Unclassified',
    subtopic: data.subtopic?.trim() || 'Unclassified',
    concept: data.concept?.trim() || 'General Concept',
    difficulty: ['Easy', 'Medium', 'Hard'].includes(data.difficulty) ? data.difficulty : 'Medium',
    questionText: data.questionText.trim(),
    options: data.options.map((opt) => ({
      id: opt.id,
      text: opt.text.trim(),
    })),
    correctAnswer: data.correctAnswer,
    marks,
    explanation: data.explanation ? data.explanation.trim() : '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
  };

  const questions = getItem('questions', []);
  const updatedQuestions = [newQuestion, ...questions];
  const saved = setItem('questions', updatedQuestions);

  if (!saved) {
    return { success: false, error: 'Failed to write question to storage.' };
  }

  // Update parent exam questionCount
  const activeExamQuestions = updatedQuestions.filter(
    (q) => q.examId === data.examId && !q.isDeleted
  );
  updateExamination(data.examId, { questionCount: activeExamQuestions.length });

  // Register in structured taxonomy if classified
  if (newQuestion.topic && newQuestion.topic !== 'Unclassified') {
    addTaxonomyEntry({
      subject: newQuestion.subject,
      topic: newQuestion.topic,
      subtopic: newQuestion.subtopic,
      concept: newQuestion.concept,
    });
  }

  return { success: true, question: newQuestion };
};

/**
 * Update existing MCQ question.
 * Note: Never modifies previous ExamResult snapshots.
 *
 * @param {string} id
 * @param {Object} updates
 * @returns {{ success: boolean, question?: Object, error?: string }}
 */
export const updateQuestion = (id, updates) => {
  if (!id) return { success: false, error: 'Question ID is required.' };

  const questions = getItem('questions', []);
  const index = questions.findIndex((q) => q.id === id);

  if (index === -1) {
    return { success: false, error: 'Question not found.' };
  }

  const existing = questions[index];

  if (updates.questionText !== undefined && !updates.questionText.trim()) {
    return { success: false, error: 'Question text cannot be empty.' };
  }

  if (updates.options !== undefined) {
    if (!Array.isArray(updates.options) || updates.options.length !== 4) {
      return { success: false, error: 'Question must have exactly four options.' };
    }
    for (const opt of updates.options) {
      if (!opt.text || !opt.text.trim()) {
        return { success: false, error: `Option ${opt.id} cannot be empty.` };
      }
    }
  }

  if (updates.correctAnswer !== undefined && !['A', 'B', 'C', 'D'].includes(updates.correctAnswer)) {
    return { success: false, error: 'Correct answer must be A, B, C, or D.' };
  }

  let marks = existing.marks;
  if (updates.marks !== undefined) {
    marks = Number(updates.marks);
    if (isNaN(marks) || marks <= 0) {
      return { success: false, error: 'Marks must be greater than 0.' };
    }
  }

  let difficulty = existing.difficulty || 'Medium';
  if (updates.difficulty !== undefined) {
    if (['Easy', 'Medium', 'Hard'].includes(updates.difficulty)) {
      difficulty = updates.difficulty;
    }
  }

  const updatedQuestion = {
    ...existing,
    ...updates,
    id: existing.id,
    marks,
    difficulty,
    subject: updates.subject !== undefined ? updates.subject.trim() : (existing.subject || 'General'),
    topic: updates.topic !== undefined ? updates.topic.trim() : (existing.topic || 'Unclassified'),
    subtopic: updates.subtopic !== undefined ? updates.subtopic.trim() : (existing.subtopic || 'Unclassified'),
    concept: updates.concept !== undefined ? updates.concept.trim() : (existing.concept || 'General Concept'),
    updatedAt: new Date().toISOString(),
  };

  questions[index] = updatedQuestion;
  const saved = setItem('questions', questions);

  if (saved && updatedQuestion.topic && updatedQuestion.topic !== 'Unclassified') {
    addTaxonomyEntry({
      subject: updatedQuestion.subject,
      topic: updatedQuestion.topic,
      subtopic: updatedQuestion.subtopic,
      concept: updatedQuestion.concept,
    });
  }

  return { success: saved, question: updatedQuestion };
};

/**
 * Soft-delete an MCQ question.
 * Does not mutate historical results.
 *
 * @param {string} id
 * @returns {{ success: boolean, error?: string }}
 */
export const deleteQuestion = (id) => {
  if (!id) return { success: false, error: 'Question ID is required.' };

  const questions = getItem('questions', []);
  const index = questions.findIndex((q) => q.id === id);

  if (index === -1) {
    return { success: false, error: 'Question not found.' };
  }

  const q = questions[index];
  questions[index] = {
    ...q,
    isDeleted: true,
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = setItem('questions', questions);

  if (saved) {
    // Update exam questionCount
    const activeRemaining = questions.filter(
      (item) => item.examId === q.examId && !item.isDeleted
    );
    updateExamination(q.examId, { questionCount: activeRemaining.length });
  }

  return { success: saved };
};

