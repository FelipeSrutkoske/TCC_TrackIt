'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextData {
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const canUseDom = typeof document !== 'undefined';

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  const toastContainer = (
    <div
      aria-live="polite"
      className="fixed left-1/2 top-4 z-[90] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col gap-2 sm:top-6"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-bold text-white shadow-2xl ring-1 ring-black/10 transition-all duration-300 ${
            toast.type === 'success' ? 'border-emerald-300/40 bg-emerald-600' :
            toast.type === 'error' ? 'border-red-300/40 bg-red-600' :
            toast.type === 'warning' ? 'border-amber-300/40 bg-amber-500 text-[#1f2320]' :
            'border-blue-300/40 bg-blue-600'
          }`}
        >
          <span className="leading-relaxed">{toast.message}</span>
          <button
            aria-label="Fechar notificacao"
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-lg leading-none transition hover:bg-white/20 ${toast.type === 'warning' ? 'text-[#1f2320]' : 'text-white'}`}
            onClick={() => removeToast(toast.id)}
            type="button"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {canUseDom && toasts.length > 0 ? createPortal(toastContainer, document.body) : null}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
