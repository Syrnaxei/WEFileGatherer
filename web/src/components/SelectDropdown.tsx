import { useState, useEffect, useRef } from 'react';

interface SelectDropdownOption {
  value: string;
  label: string;
}

interface SelectDropdownProps {
  options: SelectDropdownOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function SelectDropdown({ options, value, onChange }: SelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        triggerClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const triggerClose = () => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 140);
  };

  const handleTrigger = () => {
    if (open) {
      triggerClose();
    } else {
      setOpen(true);
    }
  };

  const handleSelect = (v: string) => {
    onChange(v);
    triggerClose();
  };

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={handleTrigger}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          minWidth: '140px',
          padding: '6px 8px 6px 12px',
          fontSize: '13px',
          fontFamily: 'var(--font-ui)',
          fontWeight: 500,
          color: 'var(--text-primary)',
          background: 'var(--bg-surface-2)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <span>{selectedLabel}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          style={{
            transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="var(--text-muted)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (() => {
          const selectedIndex = options.findIndex((o) => o.value === value);
          const optionHeight = 32;
          const offsetY = -selectedIndex * optionHeight;

          return (
        <div
          className={closing ? 'animate-fade-out-up' : 'animate-fade-in-up'}
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
            zIndex: 100,
          }}
        >
          <div style={{
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)',
            transform: 'scale(1.04)',
            transformOrigin: 'top left',
          }}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px 6px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontFamily: 'var(--font-ui)',
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: 'transparent',
                  transition: 'background 120ms ease, color 120ms ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-surface-3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '4px',
                    bottom: '4px',
                    width: '3px',
                    borderRadius: '0 2px 2px 0',
                    background: isSelected ? 'var(--accent)' : 'transparent',
                    transition: 'background 200ms ease',
                  }}
                />
                <span style={{ paddingLeft: '2px' }}>{opt.label}</span>
                {isSelected && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    style={{ flexShrink: 0, transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="var(--text-muted)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            );
          })}
          </div>
        </div>
      )})()}
    </div>
  );
}