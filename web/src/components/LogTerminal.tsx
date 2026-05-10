import { useRef, useEffect, useMemo } from 'react';

interface LogEntry {
  event: string;
  nodeId?: string;
  nodeType?: string;
  error?: string;
  fileName?: string;
  fileSize?: string;
  traceId?: string;
  progress?: string;
  message?: string;
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
  debugLogEnabled: boolean;
}

export default function LogTerminal({ logs, connected, isDark, debugLogEnabled }: LogTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const visibleEvents = new Set(['enqueue', 'flow_complete', 'error']);

  const filteredLogs = useMemo(() => {
    if (debugLogEnabled) return logs;
    return logs.filter((log) => visibleEvents.has(log.event));
  }, [logs, debugLogEnabled]);

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

  const getEventLabel = (event: string) => {
    switch (event) {
      case 'enqueue': return 'START';
      case 'node_start': return 'PROC';
      case 'node_complete': return 'OK';
      case 'flow_complete': return 'DONE';
      case 'error': return 'ERR';
      default: return event.toUpperCase();
    }
  };

  const formatLogLine = (log: LogEntry) => {
    const name = log.fileName || log.ctx.originalFileName;
    const size = log.fileSize ? `${log.fileSize}MB` : '';
    const progress = log.progress ? `[${log.progress}]` : '';

    switch (log.event) {
      case 'enqueue':
        return `${name} ${size} start：${progress}`;
      case 'flow_complete':
        return `${name} done. ${progress}`;
      case 'error':
        return `${name} error: ${log.error || 'unknown'} ${progress}`;
      case 'node_start':
        return `${name} ${size} → ${log.nodeType || log.nodeId} ${progress}`;
      case 'node_complete':
        return `${name} ← ${log.nodeType || log.nodeId} ${progress}`;
      default:
        return log.message || `${name} ${log.event} ${progress}`;
    }
  };

  return (
    <div style={{
      height: '50vh',
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
        className="log-terminal-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          padding: '8px 16px',
          fontSize: '12px',
          fontFamily: 'monospace',
        }}
      >
        {filteredLogs.length === 0 && (
          <div style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>等待文件进入工作流...</div>
        )}
        {filteredLogs.map((log, i) => (
          <div key={i} style={{ marginBottom: '4px', lineHeight: '1.5' }}>
            <span style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            {' '}
            <span style={{ color: getEventColor(log.event), fontWeight: 'bold' }}>
              [{getEventLabel(log.event)}]
            </span>
            {' '}
            <span style={{
              color: log.event === 'error'
                ? '#ef4444'
                : log.event === 'flow_complete'
                  ? '#059669'
                  : isDark ? '#e5e7eb' : '#111827',
            }}>
              {formatLogLine(log)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
