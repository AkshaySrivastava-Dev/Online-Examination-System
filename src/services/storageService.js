/**
 * ExamPro Storage Service (v1)
 *
 * Provides a robust, versioned abstraction over browser localStorage.
 * Features:
 * - Versioned key prefixing (`exampro_v1_`)
 * - Safe JSON parsing with fallback defaults
 * - Storage quota error handling and notification event dispatch
 * - Stale-lease recovery for multi-tab locks (prevents permanent lock if tab closes)
 * - Idempotent result persistence safeguards (handles non-atomic storage limitations)
 *
 * NOTE ON CLIENT-SIDE PASSWORD SECURITY:
 * Storing user passwords or authentication tokens in localStorage is an
 * educational simulation. Browser storage is accessible to any script
 * running in the window and must NEVER be treated as a production-grade
 * cryptographically secure credential repository.
 */

const STORAGE_PREFIX = 'exampro_v1_';
const SCHEMA_VERSION = '1.0.0';

// Global custom event name for quota errors
export const STORAGE_QUOTA_EVENT = 'exampro:storage_quota_exceeded';

/**
 * Prefix a key with the storage namespace.
 * @param {string} key
 * @returns {string}
 */
export const getFullKey = (key) => `${STORAGE_PREFIX}${key}`;

/**
 * Safely parse JSON from a raw string.
 * @param {string|null} rawValue
 * @param {*} fallback
 * @returns {*}
 */
export const safeJSONParse = (rawValue, fallback = null) => {
  if (rawValue === null || rawValue === undefined) return fallback;
  try {
    return JSON.parse(rawValue);
  } catch (err) {
    console.warn(`[storageService] JSON parse error for raw value:`, err);
    return fallback;
  }
};

/**
 * Safely stringify a JavaScript object/value.
 * @param {*} value
 * @returns {string}
 */
export const safeJSONStringify = (value) => {
  try {
    return JSON.stringify(value);
  } catch (err) {
    console.error(`[storageService] JSON stringify error:`, err);
    throw err;
  }
};

/**
 * Retrieve an item from LocalStorage with safe parsing and default fallback.
 * @param {string} key - Raw key (prefix will be applied automatically)
 * @param {*} fallback - Default value if key is not found or corrupted
 * @returns {*}
 */
export const getItem = (key, fallback = null) => {
  try {
    const fullKey = getFullKey(key);
    const rawValue = localStorage.getItem(fullKey);
    return safeJSONParse(rawValue, fallback);
  } catch (err) {
    console.error(`[storageService] Failed to read key "${key}":`, err);
    return fallback;
  }
};

/**
 * Store an item in LocalStorage with quota protection.
 * @param {string} key - Raw key
 * @param {*} value - Value to serialize and store
 * @returns {boolean} Success status
 */
export const setItem = (key, value) => {
  try {
    const fullKey = getFullKey(key);
    const serialized = safeJSONStringify(value);
    localStorage.setItem(fullKey, serialized);
    return true;
  } catch (err) {
    // Check if error is due to storage quota exhaustion
    const isQuotaError =
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err.code === 22 ||
      err.code === 1014;

    if (isQuotaError) {
      console.error(`[storageService] Storage quota exceeded while writing "${key}".`, err);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(STORAGE_QUOTA_EVENT, {
            detail: { key, error: err.message },
          })
        );
      }
    } else {
      console.error(`[storageService] Failed to write key "${key}":`, err);
    }
    return false;
  }
};

/**
 * Remove an item from LocalStorage.
 * @param {string} key
 * @returns {boolean}
 */
export const removeItem = (key) => {
  try {
    const fullKey = getFullKey(key);
    localStorage.removeItem(fullKey);
    return true;
  } catch (err) {
    console.error(`[storageService] Failed to remove key "${key}":`, err);
    return false;
  }
};

/**
 * Clear all ExamPro keys while leaving other application keys intact.
 */
export const clearExamProStorage = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    console.info(`[storageService] Cleared ${keysToRemove.length} ExamPro keys.`);
    return true;
  } catch (err) {
    console.error(`[storageService] Failed to clear storage:`, err);
    return false;
  }
};

/**
 * Idempotent Result Persistence
 * Since LocalStorage lacks atomic two-phase commit transactions,
 * we store the final result first, verify its presence, and then update/remove
 * the in-progress attempt state.
 *
 * @param {Object} result - The complete ExamResult object with snapshot
 * @returns {{ success: boolean, isDuplicate: boolean, error?: string }}
 */
export const persistExamResultIdempotent = (result) => {
  if (!result || !result.attemptId) {
    return { success: false, isDuplicate: false, error: 'Invalid result object: missing attemptId' };
  }

  const existingResults = getItem('results', []);

  // Check if this attempt was already recorded (idempotency guard)
  const isDuplicate = existingResults.some((r) => r.attemptId === result.attemptId);
  if (isDuplicate) {
    console.warn(`[storageService] Attempt ${result.attemptId} already recorded. Skipping duplicate append.`);
    return { success: true, isDuplicate: true };
  }

  // Append new result
  const updatedResults = [result, ...existingResults];
  const saveSuccess = setItem('results', updatedResults);

  if (!saveSuccess) {
    return { success: false, isDuplicate: false, error: 'Failed to write result to storage' };
  }

  // Clear in-progress attempt for this student and exam
  if (result.studentSnapshot?.id && result.examId) {
    removeItem(`active_attempt_${result.studentSnapshot.id}_${result.examId}`);
  }

  return { success: true, isDuplicate: false };
};

/**
 * Multi-Tab Stale-Lease Recovery & Lock Management
 * Allows a tab to acquire an exam session lock, but gracefully recovers
 * if the previous tab was closed, refreshed, or stalled without cleanly unlocking.
 *
 * @param {string} examId
 * @param {string} studentId
 * @param {string} currentTabId
 * @param {number} staleTimeoutMs - Default 15 seconds
 * @returns {{ acquired: boolean, activeTabId: string, isStaleRecovered: boolean }}
 */
export const acquireTabLock = (examId, studentId, currentTabId, staleTimeoutMs = 15000) => {
  const lockKey = `tab_lock_${studentId}_${examId}`;
  const now = Date.now();
  const currentLock = getItem(lockKey, null);

  // If no active lock, acquire immediately
  if (!currentLock) {
    const lockPayload = { activeTabId: currentTabId, lastHeartbeat: now };
    setItem(lockKey, lockPayload);
    return { acquired: true, activeTabId: currentTabId, isStaleRecovered: false };
  }

  // If already owned by this tab, update heartbeat
  if (currentLock.activeTabId === currentTabId) {
    setItem(lockKey, { activeTabId: currentTabId, lastHeartbeat: now });
    return { acquired: true, activeTabId: currentTabId, isStaleRecovered: false };
  }

  // If owned by another tab, check if that tab's heartbeat has stalled (stale lease recovery)
  const isStale = now - (currentLock.lastHeartbeat || 0) > staleTimeoutMs;
  if (isStale) {
    console.info(`[storageService] Stale lock detected for tab ${currentLock.activeTabId}. Reclaiming for ${currentTabId}.`);
    setItem(lockKey, { activeTabId: currentTabId, lastHeartbeat: now });
    return { acquired: true, activeTabId: currentTabId, isStaleRecovered: true };
  }

  // Active lock exists in another alive tab
  return { acquired: false, activeTabId: currentLock.activeTabId, isStaleRecovered: false };
};

/**
 * Release an active tab lock.
 */
export const releaseTabLock = (examId, studentId, currentTabId) => {
  const lockKey = `tab_lock_${studentId}_${examId}`;
  const currentLock = getItem(lockKey, null);
  if (currentLock && currentLock.activeTabId === currentTabId) {
    removeItem(lockKey);
  }
};

/**
 * Get schema metadata.
 */
export const getSchemaInfo = () => ({
  version: SCHEMA_VERSION,
  prefix: STORAGE_PREFIX,
});

