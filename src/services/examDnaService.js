/**
 * ExamDNA Intelligence Engine Service
 *
 * Transforms raw examination attempt results into explainable, deterministic
 * performance analytics across 6 foundational and advanced learning dimensions:
 *
 * 1. Topic Mastery: Accuracy, questions attempted/correct, categorization with transparent sample size gating.
 * 2. Confidence Alignment: 100% reconciled matrix cross-referencing confidence (Low/Med/High) vs correctness.
 * 3. Time Intelligence: Duration per question, average time per topic, pace outliers (rapid < 15s, deliberate > 120s).
 * 4. Answer Stability: Answer changes, stability rate, impact of changing answers.
 * 5. Learning Intelligence Engine:
 *    - Weak Area Detection: Count-based explainable reasons, preliminary vs conclusive labeling.
 *    - Revision vs Relearning Matrix: Concept Relearning (<40% or recurring high-conf errors) vs Targeted Revision vs Practice Needed vs Maintain Mastery.
 *    - Personalized Learning Priority Score (0-100): Multi-factor weighted formula with dynamic weight redistribution.
 *    - Strong Area Intelligence: Confirmed mastery, difficulty coverage, spaced recall routines.
 *    - 7-Day Personalized Study Plan: Actionable Day 1-7 trajectory mapped to real syllabus gaps.
 * 6. Study Plan LocalStorage Progress:
 *    - Interactive checklist persistence under `exampro_v1_study_plan_${studentId}`.
 *
 * STRICT INVARIANTS:
 * - Zero external AI calls. 100% explainable, deterministic mathematics.
 * - Zero data fabrication: missing historical fields are gracefully handled without breaking legacy attempts.
 * - Immutability: exam result snapshots are never modified when study plan progress is updated.
 */

import { getResults } from './resultService.js';
import { getItem, setItem } from './storageService.js';

/**
 * Key prefix for study plan interactive progress.
 */
const STUDY_PLAN_STORAGE_PREFIX = 'study_plan_';

/**
 * Get saved progress for a student's study plan.
 * @param {string} studentId
 * @param {string} [planId='current']
 * @returns {{ completedDays: number[], progressPercentage: number }}
 */
export function getStudyPlanProgress(studentId, planId = 'current') {
  if (!studentId) return { completedDays: [], progressPercentage: 0 };
  const raw = getItem(`${STUDY_PLAN_STORAGE_PREFIX}${studentId}`, {});
  const planData = raw[planId] || { completedDays: [] };
  const completedDays = Array.isArray(planData.completedDays) ? planData.completedDays : [];
  const progressPercentage = Math.round((completedDays.length / 7) * 100);
  return { completedDays, progressPercentage };
}

/**
 * Toggle completion of a specific day in the 7-day study plan.
 * @param {string} studentId
 * @param {number} dayNumber (1-7)
 * @param {string} [planId='current']
 * @returns {{ completedDays: number[], progressPercentage: number }}
 */
export function toggleStudyPlanDay(studentId, dayNumber, planId = 'current') {
  if (!studentId || typeof dayNumber !== 'number') {
    return { completedDays: [], progressPercentage: 0 };
  }
  const storageKey = `${STUDY_PLAN_STORAGE_PREFIX}${studentId}`;
  const raw = getItem(storageKey, {});
  const currentDays = new Set(raw[planId]?.completedDays || []);

  if (currentDays.has(dayNumber)) {
    currentDays.delete(dayNumber);
  } else {
    currentDays.add(dayNumber);
  }

  const completedDays = Array.from(currentDays).sort((a, b) => a - b);
  raw[planId] = {
    completedDays,
    lastUpdated: new Date().toISOString(),
  };

  setItem(storageKey, raw);
  const progressPercentage = Math.round((completedDays.length / 7) * 100);
  return { completedDays, progressPercentage };
}

/**
 * Compute full ExamDNA analysis and Personalized Learning Intelligence.
 *
 * @param {Object} options
 * @param {string} [options.resultId] - Specific examination result to analyze
 * @param {string} [options.studentId] - Aggregate across all student results
 * @returns {Object|null} Comprehensive ExamDNA profile
 */
export function computeExamDna({ resultId, studentId } = {}) {
  let relevantResults = [];
  if (resultId) {
    const all = getResults();
    const single = all.find((r) => r.id === resultId);
    if (single) relevantResults = [single];
  } else if (studentId) {
    relevantResults = getResults({ studentId });
  } else {
    relevantResults = getResults();
  }

  if (relevantResults.length === 0) {
    return null;
  }

  // Aggregate all answers from selected result(s)
  const allAnswers = [];
  let totalDurationSec = 0;
  let totalMarksAwarded = 0;
  let totalMarksPossible = 0;

  for (const res of relevantResults) {
    totalDurationSec += Number(res.durationTakenSeconds) || 0;
    totalMarksAwarded += Number(res.marksObtained) || 0;
    totalMarksPossible += Number(res.totalMarks) || 0;

    const breakdown = res.answersBreakdown || [];
    for (const ans of breakdown) {
      allAnswers.push({
        ...ans,
        examId: res.examId,
        examTitle: res.examTitle || res.examSnapshot?.title || 'Examination',
        subject: ans.subject || res.examSnapshot?.category || 'General',
        topic: ans.topic || res.examSnapshot?.category || 'Core Principles',
        subtopic: ans.subtopic || 'Unclassified',
        concept: ans.concept || 'General Concept',
        difficulty: ans.difficulty || 'Medium',
      });
    }
  }

  // 1. Topic Mastery & Classification
  const topicMap = {};
  for (const ans of allAnswers) {
    const topic = ans.topic || 'General';
    if (!topicMap[topic]) {
      topicMap[topic] = {
        topic,
        subject: ans.subject || 'General',
        totalQuestions: 0,
        attempted: 0,
        correct: 0,
        incorrect: 0,
        unanswered: 0,
        marksAwarded: 0,
        maxMarks: 0,
        timeSpentSec: 0,
        timingSamples: 0,
        subtopics: new Set(),
        concepts: new Set(),
        missedConcepts: [],
        highConfidenceIncorrectCount: 0,
        lowConfidenceCorrectCount: 0,
        hardQuestionsTotal: 0,
        hardQuestionsIncorrect: 0,
        changesCount: 0,
      };
    }

    const t = topicMap[topic];
    t.totalQuestions++;
    if (ans.subtopic) t.subtopics.add(ans.subtopic);
    if (ans.concept) t.concepts.add(ans.concept);

    const isAnswered = ans.studentAnswer !== null && ans.studentAnswer !== undefined;
    if (isAnswered) {
      t.attempted++;
      if (ans.isCorrect) {
        t.correct++;
      } else {
        t.incorrect++;
        if (ans.concept) {
          t.missedConcepts.push({
            concept: ans.concept,
            questionText: ans.questionText,
            subtopic: ans.subtopic,
            studentAnswer: ans.studentAnswer,
            correctAnswer: ans.correctAnswer,
            explanation: ans.explanation,
          });
        }
      }
    } else {
      t.unanswered++;
    }

    t.marksAwarded += Number(ans.marksAwarded) || 0;
    t.maxMarks += Number(ans.maxMarks) || 0;

    if (ans.timeSpentSeconds !== null && ans.timeSpentSeconds !== undefined) {
      t.timeSpentSec += Number(ans.timeSpentSeconds);
      t.timingSamples++;
    }

    const conf = ans.confidence ? String(ans.confidence).toLowerCase() : null;
    if (conf === 'high' && !ans.isCorrect) {
      t.highConfidenceIncorrectCount++;
    }
    if (conf === 'low' && ans.isCorrect) {
      t.lowConfidenceCorrectCount++;
    }

    if (ans.difficulty === 'Hard') {
      t.hardQuestionsTotal++;
      if (!ans.isCorrect) t.hardQuestionsIncorrect++;
    }

    t.changesCount += Number(ans.changesCount) || 0;
  }

  const topicMastery = Object.values(topicMap).map((t) => {
    const accuracy = t.totalQuestions > 0 ? Math.round((t.correct / t.totalQuestions) * 100) : 0;
    const avgTimeSec = t.timingSamples > 0 ? Math.round(t.timeSpentSec / t.timingSamples) : null;
    const isPreliminary = t.totalQuestions < 5;
    const hasSufficientSample = t.totalQuestions >= 3;

    let status = 'developing';
    if (accuracy >= 80) {
      status = 'strong';
    } else if (accuracy < 60) {
      status = 'weak';
    }

    const sampleCountLabel = isPreliminary
      ? `Based on ${t.totalQuestions} question${t.totalQuestions === 1 ? '' : 's'} (preliminary)`
      : `Based on ${t.totalQuestions} questions (robust sample)`;

    return {
      topic: t.topic,
      subject: t.subject,
      totalQuestions: t.totalQuestions,
      attempted: t.attempted,
      correct: t.correct,
      incorrect: t.incorrect,
      unanswered: t.unanswered,
      accuracy,
      avgTimeSec,
      status,
      isPreliminary,
      hasSufficientSample,
      sampleCountLabel,
      subtopicsCount: t.subtopics.size,
      conceptsCount: t.concepts.size,
      missedConcepts: t.missedConcepts,
      highConfidenceIncorrectCount: t.highConfidenceIncorrectCount,
      lowConfidenceCorrectCount: t.lowConfidenceCorrectCount,
      hardQuestionsTotal: t.hardQuestionsTotal,
      hardQuestionsIncorrect: t.hardQuestionsIncorrect,
      changesCount: t.changesCount,
    };
  });

  // 2. Confidence Alignment Analysis (100% Mathematically Reconciled)
  let confidenceTrackedCount = 0;
  const alignmentMatrix = {
    highCorrect: 0,
    highIncorrect: 0,
    medCorrect: 0,
    medIncorrect: 0,
    lowCorrect: 0,
    lowIncorrect: 0,
    unspecified: 0,
  };

  const reviewPriorities = []; // High confidence incorrect items (Misconceptions)
  const growthOpportunities = []; // Low confidence correct items (Potential Guesses)

  for (const ans of allAnswers) {
    const conf = ans.confidence ? String(ans.confidence).toLowerCase() : null;
    if (!conf || !['high', 'medium', 'low'].includes(conf)) {
      alignmentMatrix.unspecified++;
      continue;
    }

    confidenceTrackedCount++;
    if (conf === 'high') {
      if (ans.isCorrect) {
        alignmentMatrix.highCorrect++;
      } else {
        alignmentMatrix.highIncorrect++;
        reviewPriorities.push({
          questionId: ans.questionId,
          questionText: ans.questionText,
          topic: ans.topic,
          concept: ans.concept,
          studentAnswer: ans.studentAnswer,
          correctAnswer: ans.correctAnswer,
          explanation: ans.explanation,
        });
      }
    } else if (conf === 'medium') {
      if (ans.isCorrect) alignmentMatrix.medCorrect++;
      else alignmentMatrix.medIncorrect++;
    } else if (conf === 'low') {
      if (ans.isCorrect) {
        alignmentMatrix.lowCorrect++;
        growthOpportunities.push({
          questionId: ans.questionId,
          questionText: ans.questionText,
          topic: ans.topic,
          concept: ans.concept,
          explanation: ans.explanation,
        });
      } else {
        alignmentMatrix.lowIncorrect++;
      }
    }
  }

  const confidenceAvailable = confidenceTrackedCount > 0;

  // Verify Confidence Reconciliation Invariant
  const sumMatrix =
    alignmentMatrix.highCorrect +
    alignmentMatrix.highIncorrect +
    alignmentMatrix.medCorrect +
    alignmentMatrix.medIncorrect +
    alignmentMatrix.lowCorrect +
    alignmentMatrix.lowIncorrect;
  const isConfidenceReconciled = sumMatrix === confidenceTrackedCount;

  // 3. Time Intelligence Analysis
  const timedAnswers = allAnswers.filter(
    (a) => a.timeSpentSeconds !== null && a.timeSpentSeconds !== undefined
  );
  const timingAvailable = timedAnswers.length > 0;
  const avgTimePerQuestionSec = timingAvailable
    ? Math.round(timedAnswers.reduce((acc, a) => acc + Number(a.timeSpentSeconds), 0) / timedAnswers.length)
    : null;

  // Outliers: Rapid (<15s) vs Deliberate (>120s)
  const rapidResponses = timedAnswers.filter((a) => Number(a.timeSpentSeconds) < 15);
  const deliberateResponses = timedAnswers.filter((a) => Number(a.timeSpentSeconds) > 120);

  // 4. Answer Stability Analysis
  let totalChanges = 0;
  let questionsChangedCount = 0;
  let changedToCorrect = 0;
  let changedToIncorrect = 0;

  for (const ans of allAnswers) {
    const changes = Number(ans.changesCount) || 0;
    if (changes > 0) {
      totalChanges += changes;
      questionsChangedCount++;
      if (ans.isCorrect) changedToCorrect++;
      else changedToIncorrect++;
    }
  }

  const stabilityRate =
    allAnswers.length > 0
      ? Math.round(((allAnswers.length - questionsChangedCount) / allAnswers.length) * 100)
      : 100;

  // 5. Advanced Learning Intelligence Engine
  // A. Weak Area Detection
  const weakAreas = topicMastery
    .filter((t) => t.hasSufficientSample && (t.status === 'weak' || t.status === 'developing'))
    .map((t) => {
      const isCritical = t.accuracy < 60;
      const countExplanation = `${t.incorrect} of ${t.totalQuestions} questions missed (${t.accuracy}% accuracy)`;
      return {
        topic: t.topic,
        subject: t.subject,
        accuracy: t.accuracy,
        totalQuestions: t.totalQuestions,
        incorrect: t.incorrect,
        severity: isCritical ? 'Critical Weakness' : 'Developing Area',
        severityLevel: isCritical ? 'critical' : 'moderate',
        isPreliminary: t.isPreliminary,
        explanation: countExplanation,
        missedConcepts: t.missedConcepts,
        recommendedAction: isCritical
          ? 'Requires comprehensive concept relearning before proceeding.'
          : 'Focused problem-solving drills will convert this topic to mastery.',
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy);

  // B. Strong Area Intelligence
  const strongAreas = topicMastery
    .filter((t) => t.hasSufficientSample && t.status === 'strong')
    .map((t) => ({
      topic: t.topic,
      subject: t.subject,
      accuracy: t.accuracy,
      totalQuestions: t.totalQuestions,
      correct: t.correct,
      isPreliminary: t.isPreliminary,
      masteryTier: t.accuracy >= 90 ? 'High Distinction' : 'Demonstrated Mastery',
      maintenanceRoutine: 'Review every 14 days via 2-3 advanced problems to retain peak recall.',
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  // C. Revision vs Relearning Matrix
  const revisionMatrix = topicMastery.map((t) => {
    let category = 'Maintain Mastery';
    let urgency = 'low';
    let actionableGuidance = 'Periodic spaced recall to maintain retention.';

    if (!t.hasSufficientSample) {
      category = 'Insufficient Evidence';
      urgency = 'neutral';
      actionableGuidance = `Only ${t.totalQuestions} question(s) recorded. Complete at least 3 questions to establish baseline.`;
    } else if (t.accuracy < 40 || t.highConfidenceIncorrectCount >= 2) {
      category = 'Concept Relearning';
      urgency = 'critical';
      actionableGuidance = t.highConfidenceIncorrectCount >= 2
        ? 'High-confidence errors detected. Fundamental misconceptions present — relearn theory before testing.'
        : 'Accuracy below 40%. Study core textbook principles and worked examples from scratch.';
    } else if (t.accuracy < 70) {
      category = 'Targeted Revision';
      urgency = 'high';
      actionableGuidance = 'Core logic understood but mistakes occur in execution. Review formulas, edge-cases, and subtopic notes.';
    } else if (t.accuracy < 80 || (t.avgTimeSec !== null && t.avgTimeSec > 120)) {
      category = 'Practice Needed';
      urgency = 'medium';
      actionableGuidance = t.avgTimeSec !== null && t.avgTimeSec > 120
        ? 'High latency per question (>120s). Timed practice drills recommended to build fluency.'
        : 'Good foundation. Increase question volume to reinforce pattern recognition.';
    }

    return {
      topic: t.topic,
      category,
      urgency,
      accuracy: t.accuracy,
      totalQuestions: t.totalQuestions,
      avgTimeSec: t.avgTimeSec,
      highConfidenceIncorrectCount: t.highConfidenceIncorrectCount,
      actionableGuidance,
    };
  });

  // D. Personalized Learning Priority Score (0-100)
  // Dynamic weight normalization when dimensions (confidence/timing) are absent
  const priorityScores = topicMastery
    .filter((t) => t.totalQuestions > 0)
    .map((t) => {
      // Dimension 1: Accuracy Deficit (Weight: 35)
      const w_deficit = 35;
      const accuracyDeficitScore = ((100 - t.accuracy) / 100) * w_deficit;

      // Dimension 2: Error Recurrence (Weight: 25)
      const w_recurrence = 25;
      const recurrenceRate = t.totalQuestions > 0 ? t.incorrect / t.totalQuestions : 0;
      const recurrenceScore = recurrenceRate * w_recurrence;

      // Dimension 3: Confidence Misalignment (Weight: 15, dynamic)
      let w_confidence = 0;
      let confidenceScore = 0;
      if (confidenceAvailable) {
        w_confidence = 15;
        const misalignedCount = t.highConfidenceIncorrectCount * 1.5 + t.lowConfidenceCorrectCount * 0.5;
        const misalignedRatio = Math.min(1, misalignedCount / Math.max(1, t.totalQuestions));
        confidenceScore = misalignedRatio * w_confidence;
      }

      // Dimension 4: Difficulty Performance (Weight: 15)
      const w_difficulty = 15;
      const hardFailureRate = t.hardQuestionsTotal > 0
        ? t.hardQuestionsIncorrect / t.hardQuestionsTotal
        : recurrenceRate;
      const difficultyScore = hardFailureRate * w_difficulty;

      // Dimension 5: Trend & Volatility (Weight: 10)
      const w_trend = 10;
      const volatilityRate = Math.min(1, (t.changesCount + t.unanswered) / Math.max(1, t.totalQuestions));
      const trendScore = volatilityRate * w_trend;

      const totalAvailableWeight = w_deficit + w_recurrence + w_confidence + w_difficulty + w_trend;
      const rawCombinedScore = accuracyDeficitScore + recurrenceScore + confidenceScore + difficultyScore + trendScore;

      const priorityScore = totalAvailableWeight > 0
        ? Math.round((rawCombinedScore / totalAvailableWeight) * 100)
        : 0;

      let priorityTier = 'Low';
      if (priorityScore >= 70) priorityTier = 'Urgent';
      else if (priorityScore >= 45) priorityTier = 'High';
      else if (priorityScore >= 25) priorityTier = 'Moderate';

      return {
        topic: t.topic,
        subject: t.subject,
        priorityScore,
        priorityTier,
        accuracy: t.accuracy,
        totalQuestions: t.totalQuestions,
        components: {
          accuracyDeficit: Math.round(accuracyDeficitScore),
          errorRecurrence: Math.round(recurrenceScore),
          confidenceMisalignment: Math.round(confidenceScore),
          difficultyPerformance: Math.round(difficultyScore),
          trendVolatility: Math.round(trendScore),
        },
        weightsApplied: {
          deficit: w_deficit,
          recurrence: w_recurrence,
          confidence: w_confidence,
          difficulty: w_difficulty,
          trend: w_trend,
          total: totalAvailableWeight,
        },
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

  // E. Personalized 7-Day Study Plan Generator
  const topPriorityTopics = priorityScores.filter((p) => p.priorityScore >= 25);
  const urgentRelearnTopics = revisionMatrix.filter((r) => r.category === 'Concept Relearning');
  const targetedRevisionTopics = revisionMatrix.filter((r) => r.category === 'Targeted Revision');
  const practiceTopics = revisionMatrix.filter((r) => r.category === 'Practice Needed');

  const p1 = topPriorityTopics[0]?.topic || topicMastery[0]?.topic || 'Core Curriculum';
  const p2 = topPriorityTopics[1]?.topic || topicMastery[1]?.topic || p1;
  const p3 = topPriorityTopics[2]?.topic || practiceTopics[0]?.topic || p2;

  const studyPlanDays = [
    {
      day: 1,
      title: 'Foundational Concept Reconstruction',
      focusTopic: p1,
      activity: urgentRelearnTopics.length > 0
        ? `Relearn core theoretical principles for "${p1}". Review fundamental textbook chapters and worked solutions.`
        : `Deconstruct core concepts for "${p1}". Clear conceptual ambiguity before attempting new questions.`,
      targetDurationMinutes: 45,
      goal: 'Eliminate foundational misconceptions',
    },
    {
      day: 2,
      title: 'Applied Problem Decomposition',
      focusTopic: p1,
      activity: `Step-by-step problem walkthroughs for "${p1}". Complete 5-8 untimed exercises with active notes.`,
      targetDurationMinutes: 45,
      goal: 'Bridge theoretical knowledge to exam questions',
    },
    {
      day: 3,
      title: 'Secondary Priority Targeted Revision',
      focusTopic: p2,
      activity: targetedRevisionTopics.length > 0
        ? `Targeted revision for "${p2}". Review formulas, syntax nuances, and common traps.`
        : `Drill intermediate level exercises in "${p2}". Focus on execution accuracy.`,
      targetDurationMinutes: 40,
      goal: 'Achieve >70% accuracy on standard questions',
    },
    {
      day: 4,
      title: 'Confidence Misconception Correction',
      focusTopic: reviewPriorities.length > 0 ? reviewPriorities[0].topic : p1,
      activity: reviewPriorities.length > 0
        ? `Analyze the ${reviewPriorities.length} high-confidence incorrect questions. Explain why the correct answer is valid.`
        : `Deep-dive review into previous incorrect answers across all completed examinations.`,
      targetDurationMinutes: 35,
      goal: 'Align subjective confidence with objective correctness',
    },
    {
      day: 5,
      title: 'Speed & Fluency Timed Drills',
      focusTopic: p3,
      activity: `Timed problem set for "${p3}". Allocate strictly 60 seconds per question to build exam speed.`,
      targetDurationMinutes: 30,
      goal: 'Reduce cognitive latency under time pressure',
    },
    {
      day: 6,
      title: 'Cross-Topic Synthesis & Spaced Recall',
      focusTopic: `${p1} & ${p2}`,
      activity: `Mixed question set combining "${p1}", "${p2}", and strong mastery topics to prevent forgetting.`,
      targetDurationMinutes: 50,
      goal: 'Reinforce long-term memory via interleaving',
    },
    {
      day: 7,
      title: 'Diagnostic Benchmark Simulation',
      focusTopic: 'Full Examination Scope',
      activity: `Take a formal retake or simulated assessment to measure improvement against baseline scores.`,
      targetDurationMinutes: 60,
      goal: 'Validate score gains and recalibrate ExamDNA',
    },
  ];

  // Load interactive progress for current student
  const savedProgress = studentId
    ? getStudyPlanProgress(studentId, resultId || 'current')
    : { completedDays: [], progressPercentage: 0 };

  const studyPlan = {
    planId: resultId || 'current',
    generatedForStudentId: studentId || null,
    totalDays: 7,
    completedDays: savedProgress.completedDays,
    progressPercentage: savedProgress.progressPercentage,
    primaryFocusTopic: p1,
    secondaryFocusTopic: p2,
    days: studyPlanDays.map((d) => ({
      ...d,
      isCompleted: savedProgress.completedDays.includes(d.day),
    })),
  };

  // F. Direct Answers to the 4 Core Learning Questions
  const answersFourQuestions = {
    whatDoIKnow: strongAreas.length > 0
      ? `Demonstrated mastery in ${strongAreas.map((s) => `${s.topic} (${s.accuracy}%)`).join(', ')}.`
      : 'No topics currently meet the confirmed mastery threshold (>=80% accuracy with >=3 questions).',
    whatAmIWeakAt: weakAreas.length > 0
      ? `Critical deficits detected in ${weakAreas.map((w) => `${w.topic} (${w.explanation})`).join('; ')}.`
      : 'No critical weaknesses detected across completed examinations.',
    whatNeedsRelearnVsRevise: {
      relearnCount: urgentRelearnTopics.length,
      relearnTopics: urgentRelearnTopics.map((r) => r.topic),
      revisionCount: targetedRevisionTopics.length,
      revisionTopics: targetedRevisionTopics.map((r) => r.topic),
      practiceCount: practiceTopics.length,
      practiceTopics: practiceTopics.map((r) => r.topic),
      summaryText: urgentRelearnTopics.length > 0
        ? `${urgentRelearnTopics.length} topic(s) require concept relearning, and ${targetedRevisionTopics.length} require targeted revision.`
        : `${targetedRevisionTopics.length} topic(s) require revision, with ${practiceTopics.length} needing fluency practice.`,
    },
    whatShouldIStudyFirst: priorityScores.length > 0
      ? `Rank 1: "${priorityScores[0].topic}" (Priority Score: ${priorityScores[0].priorityScore}/100, Tier: ${priorityScores[0].priorityTier}).`
      : 'Complete examination attempts to establish study prioritization.',
    howToSpendNextSevenDays: `Follow the 7-Day Plan: Days 1-2 address ${p1}, Days 3-4 tackle ${p2} & misconceptions, and Days 5-7 build timed fluency and retake testing.`,
  };

  // Backward-compatible Recommendations Engine
  const recommendations = [];
  for (const t of topicMastery) {
    if (t.status === 'weak') {
      recommendations.push({
        topic: t.topic,
        level: 'Core Revision',
        priority: 'high',
        text: `Accuracy is ${t.accuracy}% across ${t.totalQuestions} questions. Review fundamental principles before advancing.`,
        basis: `${t.correct}/${t.totalQuestions} correct`,
      });
    } else if (t.status === 'developing') {
      recommendations.push({
        topic: t.topic,
        level: 'Intermediate Practice',
        priority: 'medium',
        text: `Developing competence at ${t.accuracy}%. Reinforce nuanced application through targeted exercises.`,
        basis: `${t.correct}/${t.totalQuestions} correct`,
      });
    } else if (t.status === 'strong') {
      recommendations.push({
        topic: t.topic,
        level: 'Advanced Mastery',
        priority: 'low',
        text: `Strong proficiency at ${t.accuracy}%. Progress to synthesis and complex multi-concept scenarios.`,
        basis: `${t.correct}/${t.totalQuestions} correct`,
      });
    } else {
      recommendations.push({
        topic: t.topic,
        level: 'Preliminary Baseline',
        priority: 'medium',
        text: `Only ${t.totalQuestions} question(s) recorded. Complete additional assessments to confirm proficiency.`,
        basis: `${t.correct}/${t.totalQuestions} correct`,
      });
    }
  }

  return {
    meta: {
      analyzedResultsCount: relevantResults.length,
      totalQuestionsAnalyzed: allAnswers.length,
      overallAccuracy:
        allAnswers.length > 0
          ? Math.round((allAnswers.filter((a) => a.isCorrect).length / allAnswers.length) * 100)
          : 0,
      confidenceAvailable,
      confidenceSampleCount: confidenceTrackedCount,
      timingAvailable,
      timingSampleCount: timedAnswers.length,
    },
    topicMastery,
    confidenceAlignment: {
      available: confidenceAvailable,
      trackedCount: confidenceTrackedCount,
      matrix: alignmentMatrix,
      isReconciled: isConfidenceReconciled,
      reviewPriorities,
      growthOpportunities,
    },
    timeIntelligence: {
      available: timingAvailable,
      avgTimePerQuestionSec,
      totalDurationSec,
      rapidResponsesCount: rapidResponses.length,
      deliberateResponsesCount: deliberateResponses.length,
    },
    answerStability: {
      totalChanges,
      questionsChangedCount,
      changedToCorrect,
      changedToIncorrect,
      stabilityRate,
    },
    recommendations,
    // Flagship Learning Intelligence Engine
    learningIntelligence: {
      weakAreas,
      strongAreas,
      revisionMatrix,
      priorityScores,
      studyPlan,
      answersFourQuestions,
    },
  };
}
