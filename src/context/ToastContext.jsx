import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { STORAGE_QUOTA_EVENT } from '../services/storageService';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = 'info', title, message, duration = 4000 }) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newToast = { id, type, title, message };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback((message, title = 'Success') => {
    return addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((message, title = 'Error') => {
    return addToast({ type: 'error', title, message });
  }, [addToast]);

  const warning = useCallback((message, title = 'Warning') => {
    return addToast({ type: 'warning', title, message });
  }, [addToast]);

  const info = useCallback((message, title = 'Notice') => {
    return addToast({ type: 'info', title, message });
  }, [addToast]);

  // Storage Quota Event Listener: catch quota errors system-wide
  useEffect(() => {
    const handleQuotaExceeded = (e) => {
      error(
        'Browser storage limit reached. Please clear older test data in the admin settings.',
        'Storage Quota Exceeded'
      );
    };

    window.addEventListener(STORAGE_QUOTA_EVENT, handleQuotaExceeded);
    return () => window.removeEventListener(STORAGE_QUOTA_EVENT, handleQuotaExceeded);
  }, [error]);

  const iconMap = {
    success: <CheckCircle2 size={16} color="var(--color-success)" />,
    error: <AlertCircle size={16} color="var(--color-danger)" />,
    warning: <AlertTriangle size={16} color="var(--color-warning)" />,
    info: <Info size={16} color="var(--color-info)" />,
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`} role="status">
            <span className="toast-icon">{iconMap[toast.type]}</span>
            <div className="toast-content">
              {toast.title && <div className="toast-title">{toast.title}</div>}
              {toast.message && <div className="toast-message">{toast.message}</div>}
            </div>
            <button
              type="button"
              className="toast-close-btn"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastContext;

