/**
 * VERITY Computerized Adaptive Testing (CAT) Engine
 *
 * Dynamically calibrates question difficulty to candidate proficiency:
 * - Real-time Difficulty Scaling: Easy ↔ Medium ↔ Hard
 * - Dynamic Theta / Ability Estimation
 * - Progression Trajectory Mapping
 */

import { getQuestions } from './questionService.js';
import { getExaminationById } from './examService.js';

export const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'];

/**
 * Calculates the next recommended difficulty level based on previous answer accuracy.
 *
 * @param {boolean} wasCorrect
 * @param {'Easy'|'Medium'|'Hard'} currentDifficulty
 * @returns {'Easy'|'Medium'|'Hard'}
 */
export function getNextDifficultyLevel(wasCorrect, currentDifficulty = 'Medium') {
  if (wasCorrect) {
    if (currentDifficulty === 'Easy') return 'Medium';
    if (currentDifficulty === 'Medium') return 'Hard';
    return 'Hard';
  } else {
    if (currentDifficulty === 'Hard') return 'Medium';
    if (currentDifficulty === 'Medium') return 'Easy';
    return 'Easy';
  }
}

/**
 * Selects the next adaptive question from the pool of unasked questions.
 *
 * @param {Object} params
 * @param {string} params.examId
 * @param {Array<string>} params.askedQuestionIds
 * @param {'Easy'|'Medium'|'Hard'} params.targetDifficulty
 * @returns {Object|null}
 */
export function selectAdaptiveQuestion({ examId, askedQuestionIds = [], targetDifficulty = 'Medium' }) {
  const allExamQuestions = getQuestions({ examId });
  const unasked = allExamQuestions.filter((q) => !askedQuestionIds.includes(q.id));

  if (unasked.length === 0) return null;

  // 1. Try matching exact target difficulty
  let matched = unasked.filter((q) => (q.difficulty || 'Medium').toLowerCase() === targetDifficulty.toLowerCase());

  // 2. Fallback to adjacent difficulty if exact is exhausted
  if (matched.length === 0) {
    if (targetDifficulty === 'Hard') {
      matched = unasked.filter((q) => (q.difficulty || 'Medium') === 'Medium');
    } else if (targetDifficulty === 'Easy') {
      matched = unasked.filter((q) => (q.difficulty || 'Medium') === 'Medium');
    }
  }

  // 3. Fallback to any remaining unasked question
  if (matched.length === 0) {
    matched = unasked;
  }

  // Return first unasked candidate
  return matched[0] || null;
}

/**
 * Computes estimated candidate proficiency (Theta Ability & Scaled Score).
 *
 * @param {Array<{isCorrect: boolean, difficulty: string, marks: number}>} history
 * @returns {{ theta: number, scaledScore: number, proficiencyTier: string, trajectory: Array<string> }}
 */
export function calculateAdaptiveProficiency(history = []) {
  if (!Array.isArray(history) || history.length === 0) {
    return {
      theta: 0.0,
      scaledScore: 50,
      proficiencyTier: 'Baseline Intermediate',
      trajectory: [],
    };
  }

  let weightSum = 0;
  let earnedWeight = 0;
  const trajectory = [];

  const weights = { Easy: 1.0, Medium: 2.0, Hard: 3.5 };

  history.forEach((h) => {
    const diff = h.difficulty || 'Medium';
    const w = weights[diff] || 2.0;
    weightSum += w;
    if (h.isCorrect) {
      earnedWeight += w;
    }
    trajectory.push(`${diff} (${h.isCorrect ? 'Correct' : 'Incorrect'})`);
  });

  const ratio = weightSum > 0 ? earnedWeight / weightSum : 0.5;

  // Map ratio to theta scale (-3.0 to +3.0)
  const theta = parseFloat(((ratio - 0.5) * 6.0).toFixed(2));
  const scaledScore = Math.round(ratio * 100);

  let proficiencyTier = 'Proficient';
  if (scaledScore >= 85) proficiencyTier = 'Advanced / Mastery';
  else if (scaledScore >= 70) proficiencyTier = 'High Competence';
  else if (scaledScore >= 50) proficiencyTier = 'Competent Baseline';
  else proficiencyTier = 'Foundational / Developing';

  return {
    theta,
    scaledScore,
    proficiencyTier,
    trajectory,
    totalEvaluated: history.length,
  };
}
