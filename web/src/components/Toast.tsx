import { useEffect, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

let addToastFn: ((message: string, type: ToastType) => void) | null = null;
let nextId = 0;

export function showToast(message: string, type: ToastType = 'info') {
  if (addToastFn) {
    addToastFn(message, type);
  }
}

interface ToastProps {
  isDark: boolean;
}

export default function Toast({ isDark }: ToastProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => {
      addToastFn = null;
    };
  }, [addToast]);

  const getColor = (type: ToastType) => {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'info': return '#3b82f6';
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'info': return 'ℹ';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      pointerEvents: 'none',
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            padding: '10px 16px',
            background: isDark ? '#1f2937' : '#ffffff',
            border: `1px solid ${getColor(toast.type)}`,
            borderLeft: `4px solid ${getColor(toast.type)}`,
            borderRadius: '6px',
            color: isDark ? '#e5e7eb' : '#111827',
            fontSize: '13px',
            boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'toast-in 0.2s ease-out',
            pointerEvents: 'auto',
          }}
        >
          <span style={{
            color: getColor(toast.type),
            fontWeight: 'bold',
            fontSize: '14px',
          }}>
            {getIcon(toast.type)}
          </span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
