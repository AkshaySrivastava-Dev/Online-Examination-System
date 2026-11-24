/**
 * ExamPro Examination Service
 *
 * Manages examination lifecycle, CRUD operations, scheduling validation,
 * and pre-publish integrity enforcement.
 */

import { getItem, setItem } from './storageService.js';
import { generateId } from '../utils/idGenerator.js';

/**
 * Get all examinations.
 * @param {Object} [options]
 * @param {boolean} [options.includeDeleted=false]
 * @returns {Array}
 */
export const getExaminations = ({ includeDeleted = false } = {}) => {
  const exams = getItem('examinations', []);
  if (includeDeleted) return exams;
  return exams.filter((e) => !e.isDeleted);
};

/**
 * Get single examination by ID.
 * @param {string} id
 * @returns {Object|null}
 */
export const getExaminationById = (id) => {
  if (!id) return null;
  const exams = getItem('examinations', []);
  return exams.find((e) => e.id === id && !e.isDeleted) || null;
};

/**
 * Pre-Publish Validation Checklist
 *
 * Verifies:
 * 1. Title is non-empty
 * 2. Duration > 0
 * 3. Start date is earlier than End date
 * 4. At least one valid question exists
 * 5. Every question has exactly four non-empty options
 * 6. Every question has a valid correct answer (A, B, C, or D)
 * 7. Sum of question marks strictly equals examination total marks
 *
 * @param {string} examId
 * @returns {{ isValid: boolean, errors: string[], questionCount: number, currentSum: number, expectedMarks: number }}
 */
export const validateForPublish = (examId) => {
  const exam = getExaminationById(examId);
  const errors = [];

  if (!exam) {
    return {
      isValid: false,
      errors: ['Examination does not exist.'],
      questionCount: 0,
      currentSum: 0,
      expectedMarks: 0,
    };
  }

  // 1. Title check
  if (!exam.title || !exam.title.trim()) {
    errors.push('Examination title cannot be empty.');
  }

  // 2. Duration check
  if (!exam.durationMinutes || Number(exam.durationMinutes) <= 0) {
    errors.push('Duration must be greater than zero minutes.');
  }

  // 3. Scheduling dates check
  if (exam.startDateTime && exam.endDateTime) {
    const start = new Date(exam.startDateTime).getTime();
    const end = new Date(exam.endDateTime).getTime();
    if (isNaN(start) || isNaN(end)) {
      errors.push('Start and end dates must be valid ISO date representations.');
    } else if (start >= end) {
      errors.push('Start date and time must be earlier than end date and time.');
    }
  } else {
    errors.push('Start and end date/time are required.');
  }

  // 4. Questions check
  const allQuestions = getItem('questions', []);
  const examQuestions = allQuestions.filter(
    (q) => q.examId === examId && !q.isDeleted
  );

  if (examQuestions.length === 0) {
    errors.push('At least one question must be added before publishing.');
  }

  let marksSum = 0;
  examQuestions.forEach((q, idx) => {
    const qNum = idx + 1;
    if (!q.questionText || !q.questionText.trim()) {
      errors.push(`Question #${qNum}: Question text cannot be empty.`);
    }

    if (!Array.isArray(q.options) || q.options.length !== 4) {
      errors.push(`Question #${qNum}: Must have exactly four answer options.`);
    } else {
      const emptyOptions = q.options.filter((opt) => !opt.text || !opt.text.trim());
      if (emptyOptions.length > 0) {
        errors.push(`Question #${qNum}: All four options (A, B, C, D) must contain text.`);
      }
    }

    if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
      errors.push(`Question #${qNum}: Must have a valid correct answer assigned (A, B, C, or D).`);
    }

    const qMarks = Number(q.marks);
    if (isNaN(qMarks) || qMarks <= 0) {
      errors.push(`Question #${qNum}: Marks must be a positive number.`);
    } else {
      marksSum += qMarks;
    }
  });

  // 5. Total Marks Match
  const expectedMarks = Number(exam.totalMarks);
  if (isNaN(expectedMarks) || expectedMarks <= 0) {
    errors.push('Examination total marks must be a positive number.');
  } else if (examQuestions.length > 0 && marksSum !== expectedMarks) {
    errors.push(
      `Total question marks (${marksSum}) does not match examination total marks (${expectedMarks}). Difference: ${Math.abs(
        expectedMarks - marksSum
      )} marks.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    questionCount: examQuestions.length,
    currentSum: marksSum,
    expectedMarks,
  };
};

/**
 * Create a new examination (defaults to 'draft' status).
 * @param {Object} data
 * @returns {{ success: boolean, examination?: Object, error?: string }}
 */
export const createExamination = (data) => {
  if (!data.title || !data.title.trim()) {
    return { success: false, error: 'Title is required.' };
  }
  const duration = Number(data.durationMinutes);
  if (isNaN(duration) || duration <= 0) {
    return { success: false, error: 'Duration must be greater than 0 minutes.' };
  }
  const totalMarks = Number(data.totalMarks);
  if (isNaN(totalMarks) || totalMarks <= 0) {
    return { success: false, error: 'Total marks must be greater than 0.' };
  }
  const passingPercentage = Number(data.passingPercentage) || 40;
  if (passingPercentage <= 0 || passingPercentage > 100) {
    return { success: false, error: 'Passing percentage must be between 1 and 100.' };
  }

  const start = new Date(data.startDateTime || Date.now()).toISOString();
  const defaultEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const end = new Date(data.endDateTime || defaultEnd).toISOString();

  if (new Date(start).getTime() >= new Date(end).getTime()) {
    return { success: false, error: 'Start date must be earlier than end date.' };
  }

  const newExam = {
    id: generateId('exam'),
    title: data.title.trim(),
    description: data.description ? data.description.trim() : '',
    category: data.category ? data.category.trim() : 'General',
    durationMinutes: duration,
    totalMarks,
    passingPercentage,
    startDateTime: start,
    endDateTime: end,
    status: 'draft', // Always created as draft until validated
    allowRetake: !!data.allowRetake,
    questionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
  };

  const exams = getItem('examinations', []);
  const updatedExams = [newExam, ...exams];
  const saved = setItem('examinations', updatedExams);

  if (!saved) {
    return { success: false, error: 'Failed to save examination.' };
  }

  return { success: true, examination: newExam };
};

/**
 * Update existing examination.
 * @param {string} id
 * @param {Object} updates
 * @returns {{ success: boolean, examination?: Object, error?: string }}
 */
export const updateExamination = (id, updates) => {
  if (!id) return { success: false, error: 'Examination ID is required.' };

  const exams = getItem('examinations', []);
  const index = exams.findIndex((e) => e.id === id);

  if (index === -1) {
    return { success: false, error: 'Examination not found.' };
  }

  const existing = exams[index];

  // If changing duration, totalMarks, or dates, validate values
  let duration = existing.durationMinutes;
  if (updates.durationMinutes !== undefined) {
    duration = Number(updates.durationMinutes);
    if (isNaN(duration) || duration <= 0) {
      return { success: false, error: 'Duration must be greater than 0 minutes.' };
    }
  }

  let totalMarks = existing.totalMarks;
  if (updates.totalMarks !== undefined) {
    totalMarks = Number(updates.totalMarks);
    if (isNaN(totalMarks) || totalMarks <= 0) {
      return { success: false, error: 'Total marks must be greater than 0.' };
    }
  }

  const updatedExam = {
    ...existing,
    ...updates,
    id: existing.id, // Immutable
    durationMinutes: duration,
    totalMarks,
    updatedAt: new Date().toISOString(),
  };

  // If exam was published and totalMarks was updated, check if it still meets validation
  if (updatedExam.status === 'published' && updates.totalMarks !== undefined) {
    const check = validateForPublish(id);
    if (!check.isValid) {
      // Revert to draft if it no longer satisfies criteria
      updatedExam.status = 'draft';
    }
  }

  exams[index] = updatedExam;
  const saved = setItem('examinations', exams);

  if (!saved) {
    return { success: false, error: 'Failed to update examination in storage.' };
  }

  return { success: true, examination: updatedExam };
};

/**
 * Publish examination after pre-publish validation.
 * @param {string} id
 * @returns {{ success: boolean, examination?: Object, errors?: string[] }}
 */
export const publishExamination = (id) => {
  const validation = validateForPublish(id);
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  return updateExamination(id, {
    status: 'published',
    questionCount: validation.questionCount,
  });
};

/**
 * Unpublish examination (set to draft).
 * @param {string} id
 * @returns {{ success: boolean, examination?: Object, error?: string }}
 */
export const unpublishExamination = (id) => {
  return updateExamination(id, { status: 'draft' });
};

/**
 * Soft-delete examination.
 * Preserves historical student results and question references.
 *
 * @param {string} id
 * @returns {{ success: boolean, error?: string }}
 */
export const deleteExamination = (id) => {
  if (!id) return { success: false, error: 'Examination ID is required.' };

  const exams = getItem('examinations', []);
  const index = exams.findIndex((e) => e.id === id);

  if (index === -1) {
    return { success: false, error: 'Examination not found.' };
  }

  // Soft-delete
  exams[index] = {
    ...exams[index],
    isDeleted: true,
    deletedAt: new Date().toISOString(),
    status: 'draft',
    updatedAt: new Date().toISOString(),
  };

  const saved = setItem('examinations', exams);
  return { success: saved };
};

