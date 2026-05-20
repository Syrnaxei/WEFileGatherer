import { useState } from 'react';
import LogTerminal from './LogTerminal';
import ScrapeStatsDashboard from './ScrapeStatsDashboard';
import type { ScrapeFileItem } from '../App';
import ThumbnailImg from './ThumbnailImg';
import ThumbnailLightbox from './ThumbnailLightbox';
import { formatFileSize, formatBitrate, formatDuration } from '../utils/format';

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
  debugLogEnabled: boolean;
  scrapeShowFullPath: boolean;
  thumbnailCount: number;
  showLogTerminal: boolean;
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
  debugLogEnabled,
  scrapeShowFullPath,
  thumbnailCount,
  showLogTerminal,
  onLoad,
  onStart,
  onStop,
  onRemove,
}: ScrapePageProps) {
  const foldersReady = scrapeSourceDir.trim() !== '' && scrapeExportDir.trim() !== '';

  const shortenPath = (filePath: string, baseDir: string): string => {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const normalizedBase = baseDir.replace(/\\/g, '/').replace(/\/$/, '');
    if (normalizedPath.toLowerCase().startsWith(normalizedBase.toLowerCase())) {
      return '~' + normalizedPath.slice(normalizedBase.length);
    }
    return filePath;
  };

  const thumbColWidth = thumbnailCount <= 1 ? 80 : 72;
  const thumbHeight = thumbnailCount <= 1 ? 45 : 40;
  const gridCols = `${thumbColWidth}px 1fr 1fr 120px 40px`;

  const [lightbox, setLightbox] = useState<{ fileIndex: number; thumbIndex: number } | null>(null);

  const openLightbox = (fileIndex: number, thumbIndex: number) => {
    setLightbox({ fileIndex, thumbIndex });
  };

  const closeLightbox = () => {
    setLightbox(null);
  };

  const navigateLightbox = (direction: -1 | 1) => {
    if (!lightbox) return;
    const newIndex = lightbox.thumbIndex + direction;
    if (newIndex < 0 || newIndex >= thumbnailCount) return;
    setLightbox({ ...lightbox, thumbIndex: newIndex });
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-base)',
      overflow: 'hidden',
    }}>

      <div style={{
        padding: '20px 24px',
        background: 'var(--bg-surface-1)',
        borderBottom: '1px solid var(--border-default)',
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}>
          搜刮
        </h2>
        <p style={{
          margin: '4px 0 0',
          fontSize: '12px',
          color: 'var(--text-muted)',
          letterSpacing: '-0.01em',
        }}>
          递归扫描目录中的视频文件并导出到指定位置
        </p>
      </div>

      <header style={{
        height: '52px',
        minHeight: '52px',
        background: 'var(--bg-surface-1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        borderBottom: '1px solid var(--border-default)',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            搜刮: {scrapeSourceDir || '未设置'}
          </span>
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            导出: {scrapeExportDir || '未设置'}
          </span>
          <span className="tag-chip">深度 {scrapeDepth}</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={onLoad}
            disabled={!foldersReady || isRunning}
            className="btn btn-primary"
          >
            加载
          </button>
          <button
            onClick={onStart}
            disabled={!foldersReady || isRunning || files.length === 0}
            className="btn btn-success"
          >
            {isRunning ? '运行中' : '启动'}
          </button>
          <button
            onClick={onStop}
            disabled={!isRunning}
            className="btn btn-danger"
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{
            padding: '10px 20px',
            background: 'var(--bg-surface-1)',
            borderBottom: '1px solid var(--border-default)',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}>
            搜刮文件列表 ({files.length})
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: gridCols,
            gap: '12px',
            padding: '8px 20px',
            background: 'var(--bg-surface-2)',
            borderBottom: '1px solid var(--border-default)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.04em',
            alignItems: 'center',
          }}>
            <div>预览</div>
            <div>文件名</div>
            <div>路径</div>
            <div style={{ textAlign: 'center' }}>处理进度</div>
            <div style={{ textAlign: 'center' }}>操作</div>
          </div>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            background: 'var(--bg-base)',
          }}>
            {files.length === 0 ? (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '13px',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>+</div>
                暂无文件，请点击"加载"按钮扫描目录
              </div>
            ) : (
              files.map((file, index) => {
                const isCompleted = file.status === 'completed';
                const isFailed = file.status === 'failed';
                const isProcessing = file.status === 'processing';

                return (
                  <div
                    key={file.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: gridCols,
                      gap: '12px',
                      padding: '10px 20px',
                      background: isCompleted ? 'var(--success-muted)' :
                                  isFailed ? 'var(--error-muted)' :
                                  isProcessing ? 'var(--accent-muted)' :
                                  index % 2 === 0 ? 'var(--bg-surface-1)' : 'var(--bg-base)',
                      borderBottom: '1px solid var(--border-subtle)',
                      alignItems: 'center',
                      opacity: isCompleted ? 0.75 : 1,
                      transition: 'background 150ms ease',
                    }}
                  >
                    <div style={{ width: `${thumbColWidth}px`, height: `${thumbHeight}px`, flexShrink: 0, display: 'flex', gap: '4px', position: 'relative' }}>
                      <ThumbnailImg videoHash={file.videoHash} index={0} thumbnailCount={thumbnailCount} onClick={thumbnailCount > 1 ? () => openLightbox(index, 0) : undefined} />
                      {thumbnailCount > 1 && (
                        <div style={{
                          position: 'absolute',
                          bottom: '2px',
                          right: '2px',
                          background: 'rgba(0,0,0,0.65)',
                          color: '#fff',
                          fontSize: '9px',
                          fontFamily: 'var(--font-mono)',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          lineHeight: '14px',
                          pointerEvents: 'none',
                        }}>
                          +{thumbnailCount - 1}
                        </div>
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.01em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {file.fileName}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-muted)',
                        marginTop: '4px',
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}>
                        <span>{formatFileSize(file.fileSize, file.probePending)}</span>
                        <span>{formatBitrate(file.bitrate, file.probePending)}</span>
                        <span>{formatDuration(file.duration, file.probePending)}</span>
                      </div>
                    </div>

                    <div style={{
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {scrapeShowFullPath ? file.filePath : shortenPath(file.filePath, scrapeSourceDir)}
                    </div>

                    <div className="file-progress-cell">
                      {isProcessing && (
                        <>
                          <span className="progress-label">处理中</span>
                          <div className="progress-pill">
                            <div className="progress-pill-indeterminate" />
                          </div>
                        </>
                      )}
                      {isCompleted && (
                        <>
                          <span className="progress-label" style={{ color: 'var(--success)' }}>完成</span>
                          <div className="progress-pill">
                            <div className="progress-pill-fill" style={{ width: '100%', background: 'var(--success)' }} />
                          </div>
                        </>
                      )}
                      {isFailed && (
                        <>
                          <span className="progress-label" style={{ color: 'var(--error)' }}>失败</span>
                          <div className="progress-pill">
                            <div className="progress-pill-fill" style={{ width: '100%', background: 'var(--error)' }} />
                          </div>
                        </>
                      )}
                      {!isProcessing && !isCompleted && !isFailed && (
                        <span className="progress-label">-</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <button
                        onClick={() => onRemove(index)}
                        disabled={isRunning}
                        title="删除"
                        style={{
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          background: 'transparent',
                          cursor: isRunning ? 'not-allowed' : 'pointer',
                          color: 'var(--text-muted)',
                          padding: 0,
                          transition: 'all 150ms ease',
                          outline: 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (!isRunning) {
                            e.currentTarget.style.background = 'var(--error-muted)';
                            e.currentTarget.style.color = 'var(--error)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isRunning) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-muted)';
                          }
                        }}
                      >
                        <svg viewBox="0 0 1024 1024" width="14" height="14" fill="currentColor">
                          <path d="M576.416 736V383.871c0-17.814 14.521-32.256 32.434-32.256 17.912 0 32.433 14.442 32.433 32.256V736c0 17.815-14.52 32.256-32.433 32.256S576.416 753.814 576.416 736z m-193.7 0V383.871c0-17.814 14.522-32.256 32.434-32.256 17.913 0 32.434 14.442 32.434 32.256V736c0 17.815-14.521 32.256-32.434 32.256-17.912 0-32.433-14.441-32.433-32.256z m548.666-512.063H770.116v-64.064c0-52.774-42.885-95.625-95.949-95.872H350.734c-25.645-0.12-50.28 9.929-68.456 27.921-18.176 17.993-28.394 42.446-28.394 67.95v64.065H92.618C76.295 225.86 64 239.622 64 255.969c0 16.346 12.295 30.108 28.618 32.032h838.764C947.705 286.077 960 272.315 960 255.969c0-16.347-12.295-30.11-28.618-32.032zM318.3 159.873c0.482-17.539 14.794-31.574 32.434-31.808h323.433a31.17 31.17 0 0 1 22.597 9.206 30.82 30.82 0 0 1 8.936 22.602v64.064H318.3v-64.064z m418.932 800.126H286.768c-25.645 0.12-50.28-9.929-68.456-27.921-18.176-17.993-28.394-42.446-28.394-67.95V383.871a31.271 31.271 0 0 1 9.232-22.626 31.623 31.623 0 0 1 22.751-9.182 32.076 32.076 0 0 1 22.907 9.157 31.721 31.721 0 0 1 9.526 22.651v480.255c0.482 17.539 14.794 31.574 32.434 31.808h450.464c17.64-0.234 31.952-14.27 32.434-31.808v-478.91c1.933-16.234 15.771-28.462 32.208-28.462 16.436 0 30.274 12.228 32.208 28.461v478.911c0 25.505-10.218 49.958-28.394 67.95-18.176 17.993-42.811 28.041-68.456 27.922z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {showLogTerminal && (
        <div style={{
          width: '420px',
          minWidth: '320px',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid var(--border-default)',
          background: 'var(--bg-base)',
          overflow: 'hidden',
        }}>
          <LogTerminal logs={logs} connected={connected} isDark={isDark} debugLogEnabled={debugLogEnabled} />
        </div>
      )}
      </div>
      {lightbox && files[lightbox.fileIndex]?.videoHash && (
        <ThumbnailLightbox
          videoHash={files[lightbox.fileIndex].videoHash!}
          thumbIndex={lightbox.thumbIndex}
          thumbnailCount={thumbnailCount}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
        />
      )}
    </div>
  );
}
