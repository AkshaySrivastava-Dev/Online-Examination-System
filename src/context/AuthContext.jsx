import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getActiveSession,
  loginUser as authServiceLogin,
  registerStudent as authServiceRegister,
  clearSession as authServiceLogout,
  updateUserProfile as authServiceUpdateProfile,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore and validate session from LocalStorage on mount
  useEffect(() => {
    try {
      const activeUser = getActiveSession();
      if (activeUser) {
        setCurrentUser(activeUser);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('[AuthContext] Failed to restore session:', err);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Multi-tab logout synchronization via storage event
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key && e.key.includes('current_session')) {
        const freshUser = getActiveSession();
        setCurrentUser(freshUser);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * Log in user with credentials.
   */
  const login = useCallback(async ({ email, password }) => {
    setIsLoading(true);
    try {
      const result = authServiceLogin({ email, password });
      if (result.success && result.user) {
        setCurrentUser(result.user);
        return { success: true, user: result.user };
      }
      return { success: false, error: result.error || 'Authentication failed' };
    } catch (err) {
      console.error('[AuthContext] Login error:', err);
      return { success: false, error: 'An unexpected error occurred during login.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register a new student account.
   */
  const signup = useCallback(async (studentData) => {
    setIsLoading(true);
    try {
      const result = authServiceRegister(studentData);
      return result;
    } catch (err) {
      console.error('[AuthContext] Signup error:', err);
      return { success: false, error: 'An unexpected error occurred during registration.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Log out active user and clear session.
   */
  const logout = useCallback(() => {
    authServiceLogout();
    setCurrentUser(null);
  }, []);

  /**
   * Update active user's profile.
   */
  const updateProfile = useCallback(async (updates) => {
    if (!currentUser) return { success: false, error: 'No active session' };
    try {
      const result = authServiceUpdateProfile(currentUser.id, updates);
      if (result.success && result.user) {
        setCurrentUser(result.user);
        return { success: true, user: result.user };
      }
      return { success: false, error: result.error };
    } catch (err) {
      console.error('[AuthContext] Update profile error:', err);
      return { success: false, error: 'Failed to update profile.' };
    }
  }, [currentUser]);

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === 'admin',
    isStudent: currentUser?.role === 'student',
    isLoading,
    login,
    signup,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

