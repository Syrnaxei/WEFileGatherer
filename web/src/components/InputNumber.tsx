import { useCallback } from 'react';

export interface InputNumberProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}

export default function InputNumber({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  disabled = false,
}: InputNumberProps) {
  const canDecrement = min === undefined || value > min;
  const canIncrement = max === undefined || value < max;

  const handleDecrement = useCallback(() => {
    if (!canDecrement || disabled) return;
    const next = value - step;
    const clamped = min !== undefined ? Math.max(min, next) : next;
    onChange(clamped);
  }, [value, step, min, canDecrement, disabled, onChange]);

  const handleIncrement = useCallback(() => {
    if (!canIncrement || disabled) return;
    const next = value + step;
    const clamped = max !== undefined ? Math.min(max, next) : next;
    onChange(clamped);
  }, [value, step, max, canIncrement, disabled, onChange]);

  const btnBase: React.CSSProperties = {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-surface-3)',
    color: 'var(--text-secondary)',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
    fontFamily: 'var(--font-mono)',
    transition: 'all var(--duration-fast) var(--ease-out)',
    flexShrink: 0,
    userSelect: 'none',
  };

  const btnDisabledStyle: React.CSSProperties = disabled ? {
    opacity: 0.35,
    cursor: 'not-allowed',
  } : {};

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        userSelect: 'none',
      }}
      role="group"
      aria-label={unit ? `数值调节器，单位${unit}` : '数值调节器'}
    >
      <button
        type="button"
        style={{
          ...btnBase,
          ...btnDisabledStyle,
          ...(!canDecrement ? { opacity: 0.35, cursor: 'not-allowed' } : {}),
        }}
        disabled={!canDecrement || disabled}
        onClick={handleDecrement}
        onMouseEnter={(e) => {
          if (canDecrement && !disabled) {
            e.currentTarget.style.background = 'var(--md-sys-color-surface-container-highest)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--bg-surface-3)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
        onMouseDown={(e) => {
          if (canDecrement && !disabled) {
            e.currentTarget.style.transform = 'scale(0.92)';
          }
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        aria-label="减少"
      >
        &minus;
      </button>

      <span
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: '2px',
          minWidth: unit ? '48px' : '32px',
          padding: '0 4px',
          fontSize: '14px',
          lineHeight: '28px',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          fontWeight: 500,
          letterSpacing: '-0.01em',
        }}
        aria-live="polite"
      >
        {value}
        {unit && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 400,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-ui)',
              letterSpacing: '0',
            }}
          >
            {unit}
          </span>
        )}
      </span>

      <button
        type="button"
        style={{
          ...btnBase,
          ...btnDisabledStyle,
          ...(!canIncrement ? { opacity: 0.35, cursor: 'not-allowed' } : {}),
        }}
        disabled={!canIncrement || disabled}
        onClick={handleIncrement}
        onMouseEnter={(e) => {
          if (canIncrement && !disabled) {
            e.currentTarget.style.background = 'var(--md-sys-color-surface-container-highest)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--bg-surface-3)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
        onMouseDown={(e) => {
          if (canIncrement && !disabled) {
            e.currentTarget.style.transform = 'scale(0.92)';
          }
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        aria-label="增加"
      >
        +
      </button>
    </div>
  );
}