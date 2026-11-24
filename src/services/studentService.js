/**
 * ExamPro Student Management Service
 *
 * Provides administrative CRUD operations, status transitions (activate/suspend),
 * and soft-deletion for student accounts while preserving historical examination records.
 */

import { getItem, setItem } from './storageService.js';
import { sanitizeUser } from './authService.js';

/**
 * Retrieve students with optional search, status filtering, and deletion inclusion.
 *
 * @param {Object} [options]
 * @param {string} [options.search=''] - Matches name, email, or studentId
 * @param {'all'|'active'|'suspended'} [options.status='all']
 * @param {boolean} [options.includeDeleted=false]
 * @returns {Array} Filtered list of students
 */
export const getStudents = ({ search = '', status = 'all', includeDeleted = false } = {}) => {
  const users = getItem('users', []);
  const query = search.trim().toLowerCase();

  return users
    .filter((u) => u.role === 'student') // Only students, never admins
    .filter((u) => {
      if (!includeDeleted && u.isDeleted) return false;
      if (status !== 'all' && u.status !== status) return false;
      if (query) {
        const matchesName = u.fullName && u.fullName.toLowerCase().includes(query);
        const matchesEmail = u.email && u.email.toLowerCase().includes(query);
        const matchesStudentId = u.studentId && u.studentId.toLowerCase().includes(query);
        return matchesName || matchesEmail || matchesStudentId;
      }
      return true;
    })
    .map((u) => sanitizeUser(u));
};

/**
 * Get student by ID.
 * @param {string} id
 * @returns {Object|null}
 */
export const getStudentById = (id) => {
  if (!id) return null;
  const users = getItem('users', []);
  const student = users.find((u) => u.id === id && u.role === 'student' && !u.isDeleted);
  return student ? sanitizeUser(student) : null;
};

/**
 * Update student profile information.
 * Enforces role immutability.
 *
 * @param {string} id
 * @param {Object} updates
 * @param {string} [updates.fullName]
 * @param {string} [updates.phone]
 * @returns {{ success: boolean, student?: Object, error?: string }}
 */
export const updateStudent = (id, updates) => {
  if (!id) return { success: false, error: 'Student ID is required.' };

  const users = getItem('users', []);
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    return { success: false, error: 'Student record not found.' };
  }

  const existing = users[index];

  // Critical Safety Rule: Cannot modify an admin via student management
  if (existing.role !== 'student') {
    return { success: false, error: 'Cannot modify non-student accounts through this portal.' };
  }

  if (updates.fullName !== undefined && (!updates.fullName || updates.fullName.trim().length < 2)) {
    return { success: false, error: 'Full name must be at least 2 characters.' };
  }

  const updatedUser = {
    ...existing,
    fullName: updates.fullName !== undefined ? updates.fullName.trim() : existing.fullName,
    phone: updates.phone !== undefined ? updates.phone.trim() : existing.phone,
    role: 'student', // Invariant
    updatedAt: new Date().toISOString(),
  };

  users[index] = updatedUser;
  const saved = setItem('users', users);

  return { success: saved, student: sanitizeUser(updatedUser) };
};

/**
 * Activate or suspend student account.
 *
 * @param {string} id
 * @param {'active'|'suspended'} status
 * @returns {{ success: boolean, error?: string }}
 */
export const setStudentStatus = (id, status) => {
  if (!id) return { success: false, error: 'Student ID is required.' };
  if (!['active', 'suspended'].includes(status)) {
    return { success: false, error: 'Invalid status value.' };
  }

  const users = getItem('users', []);
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    return { success: false, error: 'Student not found.' };
  }

  const user = users[index];
  if (user.role !== 'student') {
    return { success: false, error: 'Cannot alter status of administrator accounts.' };
  }

  users[index] = {
    ...user,
    status,
    updatedAt: new Date().toISOString(),
  };

  const saved = setItem('users', users);
  return { success: saved };
};

/**
 * Soft-delete a student account.
 * Historical records in `exampro_v1_results` are preserved and remain readable.
 *
 * @param {string} id
 * @returns {{ success: boolean, error?: string }}
 */
export const deleteStudent = (id) => {
  if (!id) return { success: false, error: 'Student ID is required.' };

  const users = getItem('users', []);
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    return { success: false, error: 'Student not found.' };
  }

  const user = users[index];
  if (user.role !== 'student') {
    return { success: false, error: 'Administrative accounts cannot be deleted.' };
  }

  users[index] = {
    ...user,
    isDeleted: true,
    deletedAt: new Date().toISOString(),
    status: 'suspended',
    updatedAt: new Date().toISOString(),
  };

  const saved = setItem('users', users);
  return { success: saved };
};

