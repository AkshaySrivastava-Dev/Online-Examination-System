/**
 * ExamPro Authentication Service
 *
 * Encapsulates authentication business logic, input validation,
 * role integrity enforcement, and session synchronization.
 *
 * ⚠️ NOTE ON FRONTEND CREDENTIAL SECURITY:
 * Storing user passwords or authentication tokens in localStorage is an
 * educational simulation. Real production applications must use server-side
 * authentication (e.g. JWT in HttpOnly cookies, bcrypt hashing, TLS).
 */

import { getItem, setItem, removeItem } from './storageService.js';
import { generateId, mockTransformPassword } from '../utils/idGenerator.js';

const SESSION_KEY = 'current_session';

/**
 * Validate an email address format.
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate password strength for student registration.
 * Requires at least 6 characters with both letters and numbers.
 * @param {string} password
 * @returns {{ isValid: boolean, message?: string }}
 */
export const validatePasswordStrength = (password) => {
  if (!password || password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long.' };
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one letter and one number.' };
  }
  return { isValid: true };
};

/**
 * Clean user record by stripping passwordHash.
 * @param {Object} user
 * @returns {Object} Safe user object
 */
export const sanitizeUser = (user) => {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

/**
 * Authenticate user with email and password.
 * Checks account status (active, suspended, deleted).
 *
 * @param {Object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {{ success: boolean, user?: Object, error?: string }}
 */
export const loginUser = ({ email, password }) => {
  if (!email || !email.trim()) {
    return { success: false, error: 'Email address is required.' };
  }
  if (!isValidEmail(email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (!password) {
    return { success: false, error: 'Password is required.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = getItem('users', []);
  const user = users.find((u) => u.email && u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return { success: false, error: 'Invalid email or password. Please check your credentials.' };
  }

  // Check if account has been soft-deleted
  if (user.isDeleted) {
    return { success: false, error: 'This account has been deleted. Please contact administration.' };
  }

  // Check if account has been suspended
  if (user.status === 'suspended') {
    return { success: false, error: 'Your account has been suspended. Please contact the administrator.' };
  }

  // Compare mock hashed password
  const inputHash = mockTransformPassword(password);
  if (user.passwordHash !== inputHash) {
    return { success: false, error: 'Invalid email or password. Please check your credentials.' };
  }

  const safeUser = sanitizeUser(user);
  saveSession(safeUser);

  return { success: true, user: safeUser };
};

/**
 * Register a new student account.
 * Enforces role='student' regardless of any client tampering.
 *
 * @param {Object} studentData
 * @param {string} studentData.fullName
 * @param {string} studentData.email
 * @param {string} studentData.password
 * @param {string} studentData.confirmPassword
 * @param {string} [studentData.phone]
 * @returns {{ success: boolean, user?: Object, error?: string }}
 */
export const registerStudent = ({
  fullName,
  email,
  password,
  confirmPassword,
  phone = '',
}) => {
  // 1. Validate Full Name
  if (!fullName || !fullName.trim() || fullName.trim().length < 2) {
    return { success: false, error: 'Full name is required (minimum 2 characters).' };
  }

  // 2. Validate Email
  if (!email || !email.trim()) {
    return { success: false, error: 'Email address is required.' };
  }
  if (!isValidEmail(email)) {
    return { success: false, error: 'Please enter a valid email address format.' };
  }

  // 3. Validate Password Strength
  const pwdValidation = validatePasswordStrength(password);
  if (!pwdValidation.isValid) {
    return { success: false, error: pwdValidation.message };
  }

  // 4. Validate Confirm Password
  if (password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match. Please re-enter your password.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = getItem('users', []);

  // 5. Duplicate Email Check
  const emailExists = users.some(
    (u) => u.email && u.email.toLowerCase() === normalizedEmail && !u.isDeleted
  );
  if (emailExists) {
    return {
      success: false,
      error: 'An account with this email address already exists. Please log in or use another email.',
    };
  }

  // 6. Generate Unique Student ID and Record
  // Strict: role is hardcoded to 'student' to prevent privilege escalation
  const newStudentId = `STD-2026-${Math.floor(100 + Math.random() * 900)}`;
  const newUser = {
    id: generateId('usr_std'),
    studentId: newStudentId,
    fullName: fullName.trim(),
    email: normalizedEmail,
    passwordHash: mockTransformPassword(password),
    role: 'student', // Non-negotiable: public signup only creates student role
    phone: phone ? phone.trim() : '',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
  };

  const updatedUsers = [newUser, ...users];
  const saved = setItem('users', updatedUsers);

  if (!saved) {
    return { success: false, error: 'Failed to save student account. Storage limit may be reached.' };
  }

  return { success: true, user: sanitizeUser(newUser) };
};

/**
 * Retrieve current active session from LocalStorage,
 * validating against live users list in storage.
 *
 * @returns {Object|null} Verified active user or null
 */
export const getActiveSession = () => {
  const sessionData = getItem(SESSION_KEY, null);
  if (!sessionData || !sessionData.user || !sessionData.user.id) {
    return null;
  }

  const users = getItem('users', []);
  const liveUser = users.find((u) => u.id === sessionData.user.id);

  // If user was removed, deleted, or suspended since login, invalidate session
  if (!liveUser || liveUser.isDeleted || liveUser.status === 'suspended') {
    clearSession();
    return null;
  }

  // Sync any updated fields (e.g. name or status) from live record
  return sanitizeUser(liveUser);
};

/**
 * Persist active session in LocalStorage.
 * @param {Object} safeUser
 */
export const saveSession = (safeUser) => {
  if (!safeUser) return;
  const sessionPayload = {
    user: safeUser,
    sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    lastActive: Date.now(),
  };
  setItem(SESSION_KEY, sessionPayload);
};

/**
 * Terminate active session in LocalStorage.
 */
export const clearSession = () => {
  removeItem(SESSION_KEY);
};

/**
 * Update user profile details.
 *
 * @param {string} userId
 * @param {Object} updates
 * @returns {{ success: boolean, user?: Object, error?: string }}
 */
export const updateUserProfile = (userId, updates) => {
  if (!userId) return { success: false, error: 'User ID is required' };

  const users = getItem('users', []);
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return { success: false, error: 'User not found.' };
  }

  const existingUser = users[userIndex];

  // Prevent role tampering via updateProfile
  const sanitizedUpdates = {
    ...updates,
    id: existingUser.id,
    role: existingUser.role, // immutable via profile
    email: existingUser.email, // email immutable for stability
    updatedAt: new Date().toISOString(),
  };

  const updatedUser = { ...existingUser, ...sanitizedUpdates };
  users[userIndex] = updatedUser;

  const saved = setItem('users', users);
  if (!saved) {
    return { success: false, error: 'Failed to update profile.' };
  }

  const safeUser = sanitizeUser(updatedUser);
  saveSession(safeUser);

  return { success: true, user: safeUser };
};
