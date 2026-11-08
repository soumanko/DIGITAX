'use client';

import React, { createContext, useContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 11);
    const newToast: Toast = { ...toast, id, duration: toast.duration ?? 5000 };
    setToasts((prev) => [...prev, newToast]);
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => dismissToast(id), newToast.duration);
    }
  }, [dismissToast]);

  const value = useMemo<ToastContextType>(
    () => ({ toasts, showToast, dismissToast }),
    [toasts, showToast, dismissToast]
  );

  const typeConfig: Record<ToastType, { icon: React.ElementType; bg: string; text: string }> = {
    success: { icon: CheckCircle2, bg: 'bg-success-50 dark:bg-success-50/10', text: 'text-success-700 dark:text-success-400' },
    error: { icon: AlertCircle, bg: 'bg-error-50 dark:bg-error-50/10', text: 'text-error-700 dark:text-error-400' },
    warning: { icon: AlertTriangle, bg: 'bg-warning-50 dark:bg-warning-50/10', text: 'text-warning-700 dark:text-warning-400' },
    info: { icon: Info, bg: 'bg-primary-50 dark:bg-primary-50/10', text: 'text-primary-700 dark:text-primary-400' },
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const Icon = typeConfig[toast.type].icon;
          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl animate-slide-up min-w-[320px] max-w-xs',
                typeConfig[toast.type].bg,
                'border-border'
              )}
              role="alert"
            >
              <div className="mt-0.5 shrink-0">
                <Icon className={cn('h-5 w-5', typeConfig[toast.type].text)} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-text-primary">{toast.title}</h4>
                {toast.description && (
                  <p className="text-xs text-text-secondary mt-0.5">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-tertiary transition-colors"
                aria-label="Dismiss notification"
              >
                <span className="sr-only">Dismiss</span>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
