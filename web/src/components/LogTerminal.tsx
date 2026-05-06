import { useRef, useEffect } from 'react';

interface LogEntry {
  event: string;
  nodeId?: string;
  nodeType?: string;
  error?: string;
  ctx: {
    traceId: string;
    originalFileName: string;
    currentPath: string;
    tags: string[];
    metadata: Record<string, any>;
  };
  timestamp: number;
}

interface LogTerminalProps {
  logs: LogEntry[];
  connected: boolean;
  isDark: boolean;
}

export default function LogTerminal({ logs, connected, isDark }: LogTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getEventColor = (event: string) => {
    switch (event) {
      case 'enqueue': return '#6366f1';
      case 'node_start': return '#3b82f6';
      case 'node_complete': return '#10b981';
      case 'flow_complete': return '#059669';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{
      height: '200px',
      background: isDark ? '#1f2937' : '#ffffff',
      color: isDark ? '#e5e7eb' : '#111827',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '8px 16px',
        borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
      }}>
        <span>实时日志终端</span>
        <span style={{ color: connected ? '#10b981' : '#ef4444' }}>
          ● {connected ? '已连接' : '未连接'}
        </span>
      </div>
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 16px',
          fontSize: '12px',
          fontFamily: 'monospace',
        }}
      >
        {logs.length === 0 && (
          <div style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>等待文件进入工作流...</div>
        )}
        {logs.map((log, i) => (
          <div key={i} style={{ marginBottom: '4px', lineHeight: '1.5' }}>
            <span style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            {' '}
            <span style={{ color: getEventColor(log.event), fontWeight: 'bold' }}>
              [{log.event.toUpperCase()}]
            </span>
            {' '}
            <span>
              {log.nodeId && `(${log.nodeId})`}
              {log.error && ` ❌ ${log.error}`}
              {!log.error && ` → ${log.ctx.originalFileName}`}
              {log.ctx.tags.length > 0 && ` [${log.ctx.tags.join(', ')}]`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
