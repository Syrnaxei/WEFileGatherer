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
          padding: '8px 16px',
          background: '#1f2937',
          color: '#e5e7eb',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #374151',
        }}
      >
        <span style={{ fontWeight: 'bold' }}>
          失败文件队列 {errors.length > 0 && `(${errors.length})`}
        </span>
        <span>{active ? '▼' : '▶'}</span>
      </div>

      {active && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: '#111827',
          padding: '8px',
        }}>
          {errors.length === 0 ? (
            <div style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
              暂无失败文件
            </div>
          ) : (
            errors.map((err) => (
              <div
                key={err.trace_id}
                style={{
                  padding: '8px 12px',
                  marginBottom: '4px',
                  background: '#1f2937',
                  borderRadius: '4px',
                  borderLeft: '3px solid #ef4444',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#e5e7eb', fontSize: '13px' }}>{err.original_file_name}</div>
                    <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '2px' }}>
                      {err.error_message}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleRetry(err.trace_id)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                      }}
                    >
                      重试
                    </button>
                    <button
                      onClick={() => handleDiscard(err.trace_id)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        background: '#374151',
                        color: '#9ca3af',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                      }}
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
