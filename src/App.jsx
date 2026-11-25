import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { initializeSeedData } from './services/seedData.js';
import { ProtectedRoute, LoadingSpinner } from './components/common';
import { AuthLayout } from './layouts/AuthLayout.jsx';
import { AdminLayout } from './layouts/AdminLayout.jsx';
import { StudentLayout } from './layouts/StudentLayout.jsx';

// Public Auth Pages (Eagerly loaded for instant login performance)
import { Login } from './pages/auth/Login.jsx';
import { Signup } from './pages/auth/Signup.jsx';
import { NotFound } from './pages/common/NotFound.jsx';

// Lazy Loaded Admin Suite (Recharts & Heavy Management Features)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx').then(m => ({ default: m.AdminDashboard })));
const StudentManagement = lazy(() => import('./pages/admin/StudentManagement.jsx').then(m => ({ default: m.StudentManagement })));
const ExaminationManagement = lazy(() => import('./pages/admin/ExaminationManagement.jsx').then(m => ({ default: m.ExaminationManagement })));
const QuestionManagement = lazy(() => import('./pages/admin/QuestionManagement.jsx').then(m => ({ default: m.QuestionManagement })));
const ResultsManagement = lazy(() => import('./pages/admin/ResultsManagement.jsx').then(m => ({ default: m.ResultsManagement })));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile.jsx').then(m => ({ default: m.AdminProfile })));

// Lazy Loaded Student Suite
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard.jsx').then(m => ({ default: m.StudentDashboard })));
const AvailableExaminations = lazy(() => import('./pages/student/AvailableExaminations.jsx').then(m => ({ default: m.AvailableExaminations })));
const UpcomingExaminations = lazy(() => import('./pages/student/UpcomingExaminations.jsx').then(m => ({ default: m.UpcomingExaminations })));
const ExamInstructions = lazy(() => import('./pages/student/ExamInstructions.jsx').then(m => ({ default: m.ExamInstructions })));
const StudentResults = lazy(() => import('./pages/student/StudentResults.jsx').then(m => ({ default: m.StudentResults })));
const StudentResultDetail = lazy(() => import('./pages/student/StudentResultDetail.jsx').then(m => ({ default: m.StudentResultDetail })));
const StudentProfile = lazy(() => import('./pages/student/StudentProfile.jsx').then(m => ({ default: m.StudentProfile })));
const StudentExamDna = lazy(() => import('./pages/student/StudentExamDna.jsx').then(m => ({ default: m.StudentExamDna })));
const ExamInterface = lazy(() => import('./pages/student/ExamInterface.jsx').then(m => ({ default: m.ExamInterface })));

/**
 * Centered Suspense Loading View
 */
function ViewFallback() {
  return (
    <div style={{ padding: '3rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingSpinner message="Loading view..." size="md" />
    </div>
  );
}

/**
 * Root Index Redirection Helper
 */
function RootIndexRedirect() {
  const { isAuthenticated, currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner message="VERITY initializing..." size="lg" />
      </div>
    );
  }

  if (isAuthenticated && currentUser) {
    return <Navigate to={currentUser.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }

  return <Navigate to="/login" replace />;
}

export default function App() {
  useEffect(() => {
    initializeSeedData();
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <Suspense fallback={<ViewFallback />}>
              <Routes>
              {/* Root index route */}
              <Route path="/" element={<RootIndexRedirect />} />

              {/* Public Authentication Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
              </Route>

              {/* Protected Admin Routes (Phase 3 Full Suite) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="students" element={<StudentManagement />} />
                <Route path="examinations" element={<ExaminationManagement />} />
                <Route path="questions" element={<QuestionManagement />} />
                <Route path="results" element={<ResultsManagement />} />
                <Route path="profile" element={<AdminProfile />} />
              </Route>

              {/* Protected Student Portal Routes (Phase 4 Full Suite) */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/student/dashboard" replace />} />
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="examinations" element={<AvailableExaminations />} />
                <Route path="upcoming" element={<UpcomingExaminations />} />
                <Route path="exam/:examId/instructions" element={<ExamInstructions />} />
                <Route path="results" element={<StudentResults />} />
                <Route path="results/:resultId" element={<StudentResultDetail />} />
                <Route path="exam-dna" element={<StudentExamDna />} />
                <Route path="profile" element={<StudentProfile />} />
              </Route>

              {/* Distraction-Free Active Examination Engine Route */}
              <Route
                path="/student/exam/:examId"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <ExamInterface />
                  </ProtectedRoute>
                }
              />

              {/* Fallback 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </ThemeProvider>
);
}
