import { useEffect, useState } from 'react';

interface ErrorFile {
  trace_id: string;
  original_file_name: string;
  current_path: string;
  error_message: string;
  updated_at: number;
}

interface ErrorQueueProps {
  flowId?: string;
}

export default function ErrorQueue({ flowId }: ErrorQueueProps) {
  const [errors, setErrors] = useState<ErrorFile[]>([]);
  const [active, setActive] = useState(false);

  const fetchErrors = async () => {
    if (window.electronAPI) {
      const data = await window.electronAPI.getErrors(flowId);
      setErrors(data.map((row: any) => ({
        trace_id: row.trace_id,
        original_file_name: row.original_file_name,
        current_path: row.current_path,
        error_message: row.error_message,
        updated_at: row.updated_at,
      })));
    }
  };

  useEffect(() => {
    if (active) {
      fetchErrors();
      const interval = setInterval(fetchErrors, 3000);
      return () => clearInterval(interval);
    }
  }, [active, flowId]);

  const handleDiscard = async (traceId: string) => {
    if (window.electronAPI) {
      await window.electronAPI.discardFile(traceId);
      fetchErrors();
    }
  };

  const handleRetry = async (traceId: string) => {
    console.log('Retry:', traceId);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        onClick={() => setActive(!active)}
        style={{
          padding: '10px 16px',
          background: 'var(--bg-surface-1)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-default)',
          fontWeight: 600,
          fontSize: '13px',
          letterSpacing: '-0.01em',
          transition: 'background 150ms ease',
        }}
      >
        <span>
          失败文件队列 {errors.length > 0 && `(${errors.length})`}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{active ? '▲' : '▼'}</span>
      </div>

      {active && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--bg-base)',
          padding: '8px',
        }}>
          {errors.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px', fontSize: '13px' }}>
              暂无失败文件
            </div>
          ) : (
            errors.map((err) => (
              <div
                key={err.trace_id}
                style={{
                  padding: '10px 14px',
                  marginBottom: '6px',
                  background: 'var(--bg-surface-1)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '3px solid var(--error)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>
                      {err.original_file_name}
                    </div>
                    <div style={{ color: 'var(--error)', fontSize: '11px', marginTop: '3px', lineHeight: 1.4 }}>
                      {err.error_message}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button
                      onClick={() => handleRetry(err.trace_id)}
                      className="btn btn-success"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      重试
                    </button>
                    <button
                      onClick={() => handleDiscard(err.trace_id)}
                      className="btn btn-ghost"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      丢弃
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
