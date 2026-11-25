/**
 * VERITY ExamReplay Service
 *
 * Chronologically reconstructs a candidate's complete examination attempt:
 * - Sequential navigation timeline
 * - Dwell time per question
 * - Choice modifications & revision history
 * - Confidence level shifts
 * - Review flagging events
 */

import { getResultById } from './resultService.js';

/**
 * @typedef {Object} ReplayFrame
 * @property {number} step - Step index (0-based)
 * @property {number} timestampSec - Accumulated elapsed time in seconds
 * @property {string} questionId
 * @property {number} questionNumber
 * @property {string} questionText
 * @property {Array<{id: string, text: string}>} options
 * @property {string} selectedAnswer
 * @property {string} originalAnswer
 * @property {number} changesCount
 * @property {string} correctAnswer
 * @property {boolean} isCorrect
 * @property {string} confidence
 * @property {boolean} isFlagged
 * @property {number} timeSpentSeconds
 * @property {string} actionDescription
 */

/**
 * Builds a chronological step-by-step replay event log from a completed examination result.
 *
 * @param {Object} result
 * @returns {Array<ReplayFrame>}
 */
export function buildReplayTimeline(result) {
  if (!result || !Array.isArray(result.answersBreakdown)) {
    return [];
  }

  const breakdown = result.answersBreakdown;
  const frames = [];
  let accumulatedTime = 0;

  breakdown.forEach((item, index) => {
    const questionNumber = index + 1;
    const dwell = item.timeSpentSeconds || Math.max(15, Math.round(result.timeSpentSeconds / breakdown.length) || 30);
    const changes = item.changesCount || 0;
    const original = item.originalAnswer || item.selectedAnswer || null;
    const finalAnswer = item.selectedAnswer || null;
    const confidence = item.confidence || 'Medium';
    const isFlagged = !!item.isFlagged;

    // Frame 1: Candidate lands on question
    frames.push({
      step: frames.length + 1,
      timestampSec: accumulatedTime,
      questionId: item.questionId,
      questionNumber,
      questionText: item.questionText,
      options: item.options || [],
      currentChoice: null,
      selectedAnswer: finalAnswer,
      originalAnswer: original,
      changesCount: 0,
      correctAnswer: item.correctAnswer,
      isCorrect: item.isCorrect,
      confidence: 'Medium',
      isFlagged: false,
      timeSpentSeconds: dwell,
      action: 'NAVIGATE',
      actionDescription: `Navigated to Question ${questionNumber}`,
    });

    // Frame 2: Initial choice recorded (if answered)
    if (original) {
      const firstDecisionTime = Math.round(dwell * 0.4);
      frames.push({
        step: frames.length + 1,
        timestampSec: accumulatedTime + firstDecisionTime,
        questionId: item.questionId,
        questionNumber,
        questionText: item.questionText,
        options: item.options || [],
        currentChoice: original,
        selectedAnswer: finalAnswer,
        originalAnswer: original,
        changesCount: 0,
        correctAnswer: item.correctAnswer,
        isCorrect: original === item.correctAnswer,
        confidence,
        isFlagged,
        timeSpentSeconds: dwell,
        action: 'INITIAL_ANSWER',
        actionDescription: `Selected Option ${original}${confidence ? ` with ${confidence} confidence` : ''}`,
      });
    }

    // Frame 3: Revision recorded (if answer was modified)
    if (changes > 0 && finalAnswer && finalAnswer !== original) {
      const revisionTime = Math.round(dwell * 0.85);
      frames.push({
        step: frames.length + 1,
        timestampSec: accumulatedTime + revisionTime,
        questionId: item.questionId,
        questionNumber,
        questionText: item.questionText,
        options: item.options || [],
        currentChoice: finalAnswer,
        selectedAnswer: finalAnswer,
        originalAnswer: original,
        changesCount: changes,
        correctAnswer: item.correctAnswer,
        isCorrect: item.isCorrect,
        confidence,
        isFlagged,
        timeSpentSeconds: dwell,
        action: 'ANSWER_REVISED',
        actionDescription: `Changed answer from Option ${original} to Option ${finalAnswer} (${changes} revision${changes > 1 ? 's' : ''})`,
      });
    }

    // Frame 4: Question completed / locked
    accumulatedTime += dwell;
    frames.push({
      step: frames.length + 1,
      timestampSec: accumulatedTime,
      questionId: item.questionId,
      questionNumber,
      questionText: item.questionText,
      options: item.options || [],
      currentChoice: finalAnswer,
      selectedAnswer: finalAnswer,
      originalAnswer: original,
      changesCount: changes,
      correctAnswer: item.correctAnswer,
      isCorrect: item.isCorrect,
      confidence,
      isFlagged,
      timeSpentSeconds: dwell,
      action: 'CONFIRM_STEP',
      actionDescription: `Confirmed answer and proceeded after ${dwell}s dwell`,
    });
  });

  return frames;
}

/**
 * Loads result data and constructs the full replay model.
 *
 * @param {string} resultId
 * @returns {{ success: boolean, result?: Object, timeline?: Array<ReplayFrame>, error?: string }}
 */
export function getReplayData(resultId) {
  if (!resultId) {
    return { success: false, error: 'Result ID is required.' };
  }

  const result = getResultById(resultId);
  if (!result) {
    return { success: false, error: 'Examination result record not found.' };
  }

  const timeline = buildReplayTimeline(result);
  return {
    success: true,
    result,
    timeline,
    totalSteps: timeline.length,
    totalDurationSeconds: result.timeSpentSeconds || 0,
  };
}
