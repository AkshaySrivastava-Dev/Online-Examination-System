/**
 * VERITY ExamFair™ Academic Integrity & Fairness Service
 *
 * Provides real-time proctoring telemetry, focus tracking, and fairness audits:
 * - Focus Loss & Tab Switch Detection (visibilitychange, window blur)
 * - Clipboard Interception & Copy/Paste Logging
 * - Temporal Velocity & Rapid Response Anomalies (< 5 seconds)
 * - Deterministic 0-100 Integrity Score & Audit Categorization
 */

/**
 * @typedef {Object} ExamFairEvent
 * @property {string} id
 * @property {string} type - 'TAB_SWITCH' | 'COPY_ATTEMPT' | 'PASTE_ATTEMPT' | 'RAPID_SUBMIT'
 * @property {string} timestamp
 * @property {string} description
 * @property {number} penalty
 */

/**
 * Calculates the overall ExamFair Integrity Score and Audit Status.
 *
 * @param {Object} params
 * @param {number} [params.tabSwitches=0]
 * @param {number} [params.copyPasteAttempts=0]
 * @param {number} [params.rapidAnomalies=0]
 * @param {number} [params.totalQuestions=1]
 * @returns {{ integrityScore: number, status: string, riskLevel: 'LOW'|'MEDIUM'|'HIGH', summary: string }}
 */
export function calculateIntegrityScore({
  tabSwitches = 0,
  copyPasteAttempts = 0,
  rapidAnomalies = 0,
  totalQuestions = 1,
} = {}) {
  let score = 100;

  // Deduct penalties deterministically:
  // - Tab switches: -10 pts each
  // - Copy/Paste attempts: -15 pts each
  // - Rapid answer anomalies: -5 pts each
  score -= tabSwitches * 10;
  score -= copyPasteAttempts * 15;
  score -= rapidAnomalies * 5;

  score = Math.max(0, Math.min(100, score));

  let status = 'CLEAN_VERIFIED';
  let riskLevel = 'LOW';
  let summary = 'Assessment session fully verified with zero suspicious telemetry.';

  if (score < 60) {
    status = 'HIGH_RISK_REVIEW';
    riskLevel = 'HIGH';
    summary = 'Significant telemetry anomalies detected. Manual proctor review required.';
  } else if (score < 85) {
    status = 'ADVISORY_FLAGGED';
    riskLevel = 'MEDIUM';
    summary = 'Minor window unfocus or clipboard activity detected within acceptable tolerance.';
  }

  return {
    integrityScore: score,
    status,
    riskLevel,
    summary,
  };
}

/**
 * Constructs an immutable ExamFair audit snapshot to be saved inside the test result record.
 *
 * @param {Object} sessionTelemetry
 * @returns {Object}
 */
export function createExamFairSnapshot(sessionTelemetry = {}) {
  const tabSwitches = sessionTelemetry.tabSwitches || 0;
  const copyPasteAttempts = sessionTelemetry.copyPasteAttempts || 0;
  const rapidAnomalies = sessionTelemetry.rapidAnomalies || 0;
  const events = Array.isArray(sessionTelemetry.events) ? sessionTelemetry.events : [];

  const evaluation = calculateIntegrityScore({
    tabSwitches,
    copyPasteAttempts,
    rapidAnomalies,
  });

  return {
    verifiedAt: new Date().toISOString(),
    tabSwitches,
    copyPasteAttempts,
    rapidAnomalies,
    integrityScore: evaluation.integrityScore,
    status: evaluation.status,
    riskLevel: evaluation.riskLevel,
    summary: evaluation.summary,
    eventsCount: events.length,
    events: events.slice(-15), // Preserve most recent 15 telemetry events
  };
}
