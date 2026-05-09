import LogTerminal from './LogTerminal';
import ScrapeStatsDashboard from './ScrapeStatsDashboard';
import Toast from './Toast';
import type { ScrapeFileItem } from '../App';

interface LogEntry {
  event: string;
  nodeId?: string;
  nodeType?: string;
  error?: string;
  fileName?: string;
  traceId?: string;
  ctx: {
    traceId: string;
    originalFileName: string;
    currentPath: string;
    tags: string[];
    metadata: Record<string, any>;
  };
  timestamp: number;
}

interface ScrapePageProps {
  isDark: boolean;
  files: ScrapeFileItem[];
  isRunning: boolean;
  scrapeSourceDir: string;
  scrapeExportDir: string;
  scrapeDepth: number;
  processedCount: number;
  failedCount: number;
  logs: LogEntry[];
  connected: boolean;
  onLoad: () => void;
  onStart: () => void;
  onStop: () => void;
  onRemove: (index: number) => void;
}

export default function ScrapePage({
  isDark,
  files,
  isRunning,
  scrapeSourceDir,
  scrapeExportDir,
  scrapeDepth,
  processedCount,
  failedCount,
  logs,
  connected,
  onLoad,
  onStart,
  onStop,
  onRemove,
}: ScrapePageProps) {
  const foldersReady = scrapeSourceDir.trim() !== '' && scrapeExportDir.trim() !== '';

  const getStatusStyle = (status?: string): React.CSSProperties => {
    switch (status) {
      case 'completed':
        return { color: '#10b981', fontWeight: 600 };
      case 'failed':
        return { color: '#ef4444', fontWeight: 600 };
      default:
        return { color: isDark ? '#9ca3af' : '#6b7280' };
    }
  };

  const getStatusText = (status?: string): string => {
    switch (status) {
      case 'completed': return '已完成';
      case 'failed': return '失败';
      default: return '待处理';
    }
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: isDark ? '#111827' : '#f3f4f6',
      overflow: 'hidden',
    }}>
      <Toast isDark={isDark} />

      <header style={{
        height: '56px',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? 'white' : '#111827',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <span style={{ fontSize: '13px', color: isDark ? '#9ca3af' : '#6b7280' }}>
            搜刮目录: {scrapeSourceDir || '未设置'}
          </span>
          <span style={{ fontSize: '13px', color: isDark ? '#9ca3af' : '#6b7280' }}>
            导出目录: {scrapeExportDir || '未设置'}
          </span>
          <span style={{ fontSize: '13px', color: isDark ? '#9ca3af' : '#6b7280' }}>
            深度: {scrapeDepth}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onLoad}
            disabled={!foldersReady || isRunning}
            style={{
              ...btnStyle,
              background: !foldersReady || isRunning ? '#6b7280' : '#4f46e5',
              cursor: !foldersReady || isRunning ? 'not-allowed' : 'pointer',
              opacity: !foldersReady || isRunning ? 0.6 : 1,
            }}
          >
            加载
          </button>
          <button
            onClick={onStart}
            disabled={!foldersReady || isRunning || files.length === 0}
            style={{
              ...btnStyle,
              background: !foldersReady || isRunning || files.length === 0 ? '#6b7280' : '#10b981',
              cursor: !foldersReady || isRunning || files.length === 0 ? 'not-allowed' : 'pointer',
              opacity: !foldersReady || isRunning || files.length === 0 ? 0.6 : 1,
            }}
          >
            {isRunning ? '运行中' : '启动'}
          </button>
          <button
            onClick={onStop}
            disabled={!isRunning}
            style={{
              ...btnStyle,
              background: !isRunning ? '#6b7280' : '#ef4444',
              cursor: !isRunning ? 'not-allowed' : 'pointer',
              opacity: !isRunning ? 0.6 : 1,
            }}
          >
            停止
          </button>
        </div>
      </header>

      <ScrapeStatsDashboard
        total={files.length}
        processed={processedCount}
        failed={failedCount}
        isDark={isDark}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '8px 16px',
            background: isDark ? '#1f2937' : '#ffffff',
            borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            fontSize: '13px',
            fontWeight: 600,
            color: isDark ? '#e5e7eb' : '#111827',
          }}>
            搜刮文件列表 ({files.length})
          </div>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            background: isDark ? '#111827' : '#ffffff',
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
            }}>
              <thead>
                <tr style={{
                  background: isDark ? '#1f2937' : '#f9fafb',
                  borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                }}>
                  <th style={thStyle(isDark)}>文件名</th>
                  <th style={thStyle(isDark)}>路径</th>
                  <th style={{ ...thStyle(isDark), width: '80px', textAlign: 'center' }}>状态</th>
                  <th style={{ ...thStyle(isDark), width: '60px', textAlign: 'center' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {files.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{
                      padding: '40px 16px',
                      textAlign: 'center',
                      color: isDark ? '#6b7280' : '#9ca3af',
                    }}>
                      暂无文件，请点击"加载"按钮扫描目录
                    </td>
                  </tr>
                ) : (
                  files.map((file, index) => (
                    <tr
                      key={file.id}
                      style={{
                        borderBottom: `1px solid ${isDark ? '#1f2937' : '#f3f4f6'}`,
                        background: file.status === 'completed'
                          ? (isDark ? '#064e3b20' : '#ecfdf5')
                          : file.status === 'failed'
                            ? (isDark ? '#7f1d1d20' : '#fef2f2')
                            : 'transparent',
                      }}
                    >
                      <td style={tdStyle(isDark)}>{file.fileName}</td>
                      <td style={{ ...tdStyle(isDark), fontSize: '11px', color: isDark ? '#6b7280' : '#9ca3af' }}>
                        {file.filePath}
                      </td>
                      <td style={{ ...tdStyle(isDark), textAlign: 'center' }}>
                        <span style={getStatusStyle(file.status)}>{getStatusText(file.status)}</span>
                      </td>
                      <td style={{ ...tdStyle(isDark), textAlign: 'center' }}>
                        <button
                          onClick={() => onRemove(index)}
                          disabled={isRunning}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '3px',
                            border: 'none',
                            background: isRunning ? '#6b7280' : '#ef4444',
                            color: 'white',
                            fontSize: '12px',
                            cursor: isRunning ? 'not-allowed' : 'pointer',
                            opacity: isRunning ? 0.5 : 1,
                          }}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{
          width: '400px',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
          background: isDark ? '#111827' : '#f9fafb',
        }}>
          <LogTerminal logs={logs} connected={connected} isDark={isDark} />
        </div>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '4px',
  border: 'none',
  color: 'white',
  fontSize: '13px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const thStyle = (isDark: boolean): React.CSSProperties => ({
  padding: '8px 12px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 600,
  color: isDark ? '#9ca3af' : '#6b7280',
  whiteSpace: 'nowrap',
});

const tdStyle = (isDark: boolean): React.CSSProperties => ({
  padding: '8px 12px',
  color: isDark ? '#e5e7eb' : '#111827',
  maxWidth: '300px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});