"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type ToastType = "success" | "error" | "info";
export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: ToastType = "info", title?: string) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, message, title }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3600);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const value = useMemo(() => ({ addToast, removeToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', maxWidth: 340,
      }}>
        {toasts.map((toast) => (
          <div key={toast.id} className="anim-toast" style={{
            display: 'flex', flexDirection: 'column', gap: 6,
            width: '100%', borderRadius: 12, border: '1px solid', padding: '12px 14px',
            color: '#fff', boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
            background: toast.type === 'success' ? 'rgba(34,197,94,0.20)' : toast.type === 'error' ? 'rgba(239,68,68,0.22)' : 'rgba(59,130,246,0.22)',
            borderColor: toast.type === 'success' ? 'rgba(34,197,94,0.45)' : toast.type === 'error' ? 'rgba(239,68,68,0.45)' : 'rgba(59,130,246,0.45)',
            minWidth: 260,
          }}>
            {toast.title && <strong style={{ fontSize: 12, marginBottom: 0 }}>{toast.title}</strong>}
            <span style={{ fontSize: 13, lineHeight: 1.3 }}>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} style={{
              border: 'none', background: 'transparent', color: 'inherit', textAlign: 'right', padding: 0,
              fontSize: 12, cursor: 'pointer', marginTop: 3,
            }}>Dismiss</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
