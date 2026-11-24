import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * Route protection guard for authenticated and role-based routes.
 *
 * @param {Object} props
 * @param {string[]} [props.allowedRoles] - e.g. ['admin'] or ['student']
 * @param {React.ReactNode} props.children
 */
export function ProtectedRoute({ allowedRoles, children }) {
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Wait for session recovery before evaluating route access
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner message="Verifying session..." size="lg" />
      </div>
    );
  }

  // Not logged in -> Redirect to /login with state preserved
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    // If an authenticated user tries to access a route for another role,
    // redirect them cleanly to their respective dashboard
    const destination = currentUser.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
    return <Navigate to={destination} replace />;
  }

  return children;
}

export default ProtectedRoute;

