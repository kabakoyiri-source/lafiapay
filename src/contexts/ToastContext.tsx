// ============================================================================
// LafiaPay — Toast Notification Context
// Global toast system for success/error/info notifications
// ============================================================================

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  dismissToast: () => {},
});

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS: Record<ToastType, string> = {
  success: 'var(--color-success-500)',
  error: 'var(--color-error-500)',
  warning: 'var(--color-warning-500)',
  info: 'var(--color-primary-500)',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {/* Toast Container */}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map(toast => {
            const Icon = ICONS[toast.type];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.95 }}
                className={`toast toast-${toast.type}`}
              >
                <Icon size={20} style={{ color: COLORS[toast.type], flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{toast.title}</div>
                  {toast.message && (
                    <div style={{ fontSize: '0.8125rem', opacity: 0.7, marginTop: '0.125rem' }}>
                      {toast.message}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => dismissToast(toast.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, padding: '0.25rem' }}
                >
                  <X size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
