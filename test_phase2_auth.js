/**
 * Phase 2 Authentication Suite Unit & Integration Verification
 */

import {
  loginUser,
  registerStudent,
  getActiveSession,
  saveSession,
  clearSession,
  isValidEmail,
  validatePasswordStrength,
} from './src/services/authService.js';
import { initializeSeedData, PREDEFINED_ADMIN } from './src/services/seedData.js';
import { getItem, setItem, clearExamProStorage } from './src/services/storageService.js';

// Polyfill mock localStorage in node for testing
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; },
  get length() { return Object.keys(mockStorage).length; },
  key: (i) => Object.keys(mockStorage)[i] || null,
};

global.window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
};

console.log('--- Starting ExamPro Phase 2 Auth Test Suite ---');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failedTests++;
  }
}

// 1. Initialize Seed Data
const seedResult = initializeSeedData();
assert(seedResult.usersCount >= 5, 'Seed data initialized users correctly');

// 2. Admin login with correct credentials
const adminLogin = loginUser({ email: 'admin@exampro.com', password: 'Admin@123' });
assert(adminLogin.success === true, 'Admin login succeeds with valid credentials');
assert(adminLogin.user?.role === 'admin', 'Admin login user has role "admin"');
assert(!adminLogin.user?.passwordHash, 'Admin login response strips passwordHash');

// 3. Admin login with incorrect credentials
const adminBadLogin = loginUser({ email: 'admin@exampro.com', password: 'WrongPassword@123' });
assert(adminBadLogin.success === false, 'Admin login fails with incorrect password');
assert(adminBadLogin.error.includes('Invalid email or password'), 'Admin bad login gives friendly error');

// 4. Student login with sample credentials
const studentLogin = loginUser({ email: 'alex.morgan@university.edu', password: 'Student@123' });
assert(studentLogin.success === true, 'Sample student login succeeds');
assert(studentLogin.user?.role === 'student', 'Sample student has role "student"');

// 5. Student Signup: Valid Registration
const newStudent = registerStudent({
  fullName: 'Eleanor Vance',
  email: 'eleanor.vance@university.edu',
  password: 'Password123',
  confirmPassword: 'Password123',
  phone: '+1 555-0199',
});
assert(newStudent.success === true, 'Student registration succeeds with valid data');
assert(newStudent.user?.role === 'student', 'Student registration strictly enforces role="student"');
assert(newStudent.user?.studentId.startsWith('STD-2026-'), 'Student registration automatically generates student ID');

// 6. Student Login with Newly Created Account
const newStudentLogin = loginUser({ email: 'eleanor.vance@university.edu', password: 'Password123' });
assert(newStudentLogin.success === true, 'Newly registered student can log in immediately');
assert(newStudentLogin.user?.fullName === 'Eleanor Vance', 'Logged in user profile matches registration');

// 7. Duplicate Email Registration Prevention
const duplicateSignup = registerStudent({
  fullName: 'Imposter Eleanor',
  email: 'eleanor.vance@university.edu',
  password: 'Password123',
  confirmPassword: 'Password123',
});
assert(duplicateSignup.success === false, 'Duplicate email registration is rejected');
assert(duplicateSignup.error.includes('already exists'), 'Duplicate email error message is descriptive');

// 8. Invalid Email Format Validation
const invalidEmailSignup = registerStudent({
  fullName: 'Bad Email User',
  email: 'not-an-email',
  password: 'Password123',
  confirmPassword: 'Password123',
});
assert(invalidEmailSignup.success === false, 'Malformed email format is rejected');

// 9. Empty Fields Rejection
const emptyFields = registerStudent({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
});
assert(emptyFields.success === false, 'Empty registration fields are rejected');

// 10. Password Mismatch Rejection
const passwordMismatch = registerStudent({
  fullName: 'Mismatch User',
  email: 'mismatch@university.edu',
  password: 'Password123',
  confirmPassword: 'DifferentPassword123',
});
assert(passwordMismatch.success === false, 'Password mismatch is rejected');

// 11. Weak Password Rejection
const weakPassword = registerStudent({
  fullName: 'Weak Pwd User',
  email: 'weak@university.edu',
  password: '123',
  confirmPassword: '123',
});
assert(weakPassword.success === false, 'Short/weak password is rejected');

// 12. Public Admin Registration Prevention (Simulated Injection)
const adminInjectionAttempt = registerStudent({
  fullName: 'Hacker User',
  email: 'hacker@university.edu',
  password: 'Password123',
  confirmPassword: 'Password123',
  role: 'admin', // Malicious attempt to inject role
});
assert(adminInjectionAttempt.success === true, 'Registration succeeds');
assert(adminInjectionAttempt.user?.role === 'student', 'Role remains strictly "student" despite injected admin payload');

// 13. Active Session Recovery & Validation
saveSession(newStudentLogin.user);
const recoveredSession = getActiveSession();
assert(recoveredSession !== null, 'Active session is recovered from storage');
assert(recoveredSession?.email === 'eleanor.vance@university.edu', 'Recovered session has matching user email');

// 14. Suspended User Session Rejection
const users = getItem('users', []);
const userToSuspend = users.find(u => u.email === 'eleanor.vance@university.edu');
userToSuspend.status = 'suspended';
setItem('users', users);

const suspendedLogin = loginUser({ email: 'eleanor.vance@university.edu', password: 'Password123' });
assert(suspendedLogin.success === false, 'Suspended account is blocked from login');
assert(suspendedLogin.error.includes('suspended'), 'Suspended error message provided');

const suspendedSessionCheck = getActiveSession();
assert(suspendedSessionCheck === null, 'Suspended user session is invalidated automatically');

// 15. Session Logout / Clear
saveSession(studentLogin.user);
assert(getActiveSession() !== null, 'Session active before logout');
clearSession();
assert(getActiveSession() === null, 'Session completely cleared on logout');

console.log(`\n--- Test Suite Completed: ${passedTests} Passed, ${failedTests} Failed ---`);
if (failedTests > 0) process.exit(1);

