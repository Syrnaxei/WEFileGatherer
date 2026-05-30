import { useRef, useEffect, useMemo } from 'react';

export interface LogEntry {
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

export default function LogTerminal({ logs, connected, isDark: _isDark, debugLogEnabled }: LogTerminalProps) {
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
      case 'enqueue': return 'var(--accent)';
      case 'node_start': return 'var(--info)';
      case 'node_complete': return 'var(--success)';
      case 'flow_complete': return 'var(--success)';
      case 'error': return 'var(--error)';
      default: return 'var(--text-muted)';
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
      height: '100%',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--border-default)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        fontWeight: 500,
        color: 'var(--text-secondary)',
        background: 'var(--bg-surface-1)',
      }}>
        <span style={{ letterSpacing: '-0.01em' }}>日志终端</span>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: connected ? 'var(--success)' : 'var(--error)',
          fontSize: '11px',
        }}>
          <span className={`status-dot ${connected ? 'status-dot-active' : 'status-dot-inactive'}`} />
          {connected ? '已连接' : '未连接'}
        </span>
      </div>
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          padding: '12px 16px',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          lineHeight: '1.7',
          background: 'var(--bg-base)',
        }}
      >
        {filteredLogs.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
            等待文件进入工作流...
          </div>
        )}
        {filteredLogs.map((log, i) => (
          <div key={i} style={{ marginBottom: '3px', lineHeight: '1.6' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            {' '}
            <span style={{
              color: getEventColor(log.event),
              fontWeight: 600,
              fontSize: '11px',
            }}>
              [{getEventLabel(log.event)}]
            </span>
            {' '}
            <span style={{
              color: log.event === 'error'
                ? 'var(--error)'
                : log.event === 'flow_complete'
                  ? 'var(--success)'
                  : 'var(--text-primary)',
            }}>
              {formatLogLine(log)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
