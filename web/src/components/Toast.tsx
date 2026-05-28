import { useEffect, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  /** 标记正在播放退出动画 */
  leaving?: boolean;
}

let addToastFn: ((message: string, type: ToastType) => void) | null = null;
let nextId = 0;
let toastDurationMs = 5000;

/** 设置通知自动消失时长（秒），0 表示不自动消失 */
export function setToastDuration(seconds: number) {
  toastDurationMs = seconds * 1000;
}

/** 弹出通知 —— 零破坏性，所有现存调用无需修改 */
export function showToast(message: string, type: ToastType = 'info') {
  if (addToastFn) {
    addToastFn(message, type);
  }
}

// ── WinUI 3 Fluent 风格 SVG 图标 ──────────────────────────────

/** 成功 — 对勾 */
function SuccessIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5L6.5 12L13 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 错误 — 叉号 */
function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4.5 4.5L11.5 11.5M11.5 4.5L4.5 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** 信息 — 圆圈 i */
function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7V10.5M8 5.003V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** 关闭按钮 — 小叉号 */
function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function getIcon(type: ToastType) {
  switch (type) {
    case 'success': return <SuccessIcon />;
    case 'error':   return <ErrorIcon />;
    case 'info':    return <InfoIcon />;
  }
}

// ── 组件 ──────────────────────────────────────────────────────

interface ToastProps {
  isDark: boolean;
}

export default function Toast({ isDark: _isDark }: ToastProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  /** 启动退出动画，动画结束后从 DOM 移除 */
  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 220); // 略长于 toast-exit 动画时长 (200ms)，确保动画播完
  }, []);

  const addToast = useCallback((message: string, type: ToastType) => {
    if (toastDurationMs <= 0) return;
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    // 自动消失
    if (toastDurationMs > 0) {
      setTimeout(() => removeToast(id), toastDurationMs);
    }
  }, [removeToast]);

  useEffect(() => {
    addToastFn = addToast;
    return () => {
      addToastFn = null;
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        const classNames = [
          'toast-winui',
          `toast-${toast.type}`,
          toast.leaving ? 'toast-exit' : '',
        ].filter(Boolean).join(' ');

        return (
          <div key={toast.id} className={classNames}>
            <span className="toast-icon">{getIcon(toast.type)}</span>
            <span className="toast-message">{toast.message}</span>
            <button
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="关闭通知"
            >
              <CloseIcon />
            </button>
          </div>
        );
      })}
    </div>
  );
}
