/**
 * ExamPro ID Generator & Academic Helper Utilities
 */

/**
 * Generate a unique, human-readable ID with a descriptive prefix and timestamp.
 * Example: generateId('usr') => 'usr_1730810400000_a1b2c3'
 *
 * @param {string} prefix - Entity prefix ('usr', 'exam', 'qst', 'att', 'res')
 * @returns {string}
 */
export const generateId = (prefix = 'id') => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${randomSuffix}`;
};

/**
 * ACADEMIC PASSWORD TRANSFORMATION HELPER
 *
 * ⚠️ WARNING - EDUCATIONAL PURPOSES ONLY ⚠️
 * In a frontend-only application with no backend server, storing or comparing
 * passwords in browser LocalStorage cannot provide true security. This function
 * implements a lightweight client-side obfuscation (DJB2 hash simulation)
 * so passwords are not plainly visible in raw storage dumps, but this does
 * NOT offer cryptographic protection against determined inspection.
 *
 * Real production applications must use server-side hashing (e.g. bcrypt, Argon2)
 * over TLS/HTTPS with salt rounds and secure session cookies.
 *
 * @param {string} rawPassword
 * @returns {string} Mock transformed string
 */
export const mockTransformPassword = (rawPassword) => {
  if (!rawPassword) return '';
  let hash = 5381;
  for (let i = 0; i < rawPassword.length; i++) {
    hash = ((hash << 5) + hash) + rawPassword.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return `mock_hash_${Math.abs(hash).toString(16)}`;
};

