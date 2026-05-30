import { useState } from 'react';
import { PageHeader, WorkspaceStatsBar } from './winui';
import LogTerminal, { type LogEntry } from './LogTerminal';
import type { ScrapeFileItem } from '../App';
import ThumbnailImg from './ThumbnailImg';
import ThumbnailLightbox from './ThumbnailLightbox';
import { formatFileSize, formatBitrate, formatDuration } from '../utils/format';

interface ScrapePageProps {
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

/** 缩略图预览列宽 */
const THUMB_COL_WIDTH = 72;
/** 缩略图高度 */
const THUMB_HEIGHT = 44;
/** 源路径列宽 */
const PATH_COL_WIDTH = 200;
/** 状态列宽 */
const STATUS_COL_WIDTH = 90;
/** 操作列宽 */
const ACTION_COL_WIDTH = 32;

export default function ScrapePage({
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
  const total = files.length;
  const failed = failedCount;

  const shortenPath = (filePath: string, baseDir: string): string => {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const normalizedBase = baseDir.replace(/\\/g, '/').replace(/\/$/, '');
    if (normalizedPath.toLowerCase().startsWith(normalizedBase.toLowerCase())) {
      return '~' + normalizedPath.slice(normalizedBase.length);
    }
    return filePath;
  };

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
      background: 'var(--settings-page-bg)',
      overflow: 'hidden',
      userSelect: 'none',
    }}>
      <PageHeader
        title="搜刮"
        description={
          <>
            递归扫描目录中的视频文件并导出到指定位置 · 源目录{' '}
            <span style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent)',
              fontWeight: 500,
            }}>
              {scrapeSourceDir || '未设置'}
            </span>
            {' '}· 导出{' '}
            <span style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent)',
              fontWeight: 500,
            }}>
              {scrapeExportDir || '未设置'}
            </span>
            {' '}· 深度{' '}
            <span style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent)',
              fontWeight: 500,
            }}>
              {scrapeDepth}
            </span>
          </>
        }
      />

      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        padding: '0 24px 16px',
      }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* 表头 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '8px 16px',
            background: 'transparent',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.04em',
            userSelect: 'none',
          }}>
            <span style={{ width: THUMB_COL_WIDTH, flexShrink: 0 }}>预览</span>
            <span style={{ flex: 1 }}>文件名</span>
            <span style={{ width: PATH_COL_WIDTH, flexShrink: 0 }}>源路径</span>
            <span style={{ width: STATUS_COL_WIDTH, flexShrink: 0, textAlign: 'right' }}>状态</span>
            <span style={{ width: ACTION_COL_WIDTH, flexShrink: 0 }} />
          </div>

          {/* 文件卡片列表 */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            background: 'var(--settings-page-bg)',
          }}>
            <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
              {files.length === 0 ? (
                <div style={{
                  padding: '60px 20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-ui)',
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>+</div>
                  暂无文件，请点击加载按钮扫描目录
                </div>
              ) : (
                <div style={{ padding: '0 0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {files.map((file, index) => (
                    <ScrapeFileCard
                      key={file.id}
                      file={file}
                      onRemove={() => onRemove(index)}
                      isRunning={isRunning}
                      scrapeSourceDir={scrapeSourceDir}
                      scrapeShowFullPath={scrapeShowFullPath}
                      thumbnailCount={thumbnailCount}
                      onThumbnailClick={thumbnailCount > 1 ? (thumbIdx) => openLightbox(index, thumbIdx) : undefined}
                    />
                  ))}
                </div>
              )}

              {/* 弹性占位：确保文件少时面板仍吸附底部 */}
              <div style={{ flex: 1 }} />

              {/* 底部浮动面板 — sticky 吸附，毛玻璃穿透效果 */}
              <WorkspaceStatsBar
                total={total}
                processed={processedCount}
                failed={failed}
                isRunning={isRunning}
                onLoad={onLoad}
                onStart={onStart}
                onStop={onStop}
              />
            </div>
          </div>
        </div>

        {showLogTerminal && (
          <div style={{
            width: '420px',
            minWidth: '320px',
            marginLeft: '24px',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid var(--border-default)',
            background: 'var(--bg-base)',
            overflow: 'hidden',
            borderRadius: 'var(--radius-md)',
          }}>
            <LogTerminal
              logs={logs}
              connected={connected}
              isDark={false}
              debugLogEnabled={debugLogEnabled}
            />
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

/** 搜刮单行文件卡片 — WinUI3 卡片风格 */
function ScrapeFileCard({
  file,
  onRemove,
  isRunning,
  scrapeSourceDir,
  scrapeShowFullPath,
  thumbnailCount,
  onThumbnailClick,
}: {
  file: ScrapeFileItem;
  onRemove: () => void;
  isRunning: boolean;
  scrapeSourceDir: string;
  scrapeShowFullPath: boolean;
  thumbnailCount: number;
  onThumbnailClick?: (thumbIndex: number) => void;
}) {
  const { status } = file;
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const isProcessing = status === 'processing';

  const shortenPath = (filePath: string, baseDir: string): string => {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const normalizedBase = baseDir.replace(/\\/g, '/').replace(/\/$/, '');
    if (normalizedPath.toLowerCase().startsWith(normalizedBase.toLowerCase())) {
      return '~' + normalizedPath.slice(normalizedBase.length);
    }
    return filePath;
  };

  const displayPath = scrapeShowFullPath ? file.filePath : shortenPath(file.filePath, scrapeSourceDir);

  const cardBg = isProcessing ? 'var(--accent-muted)' : 'var(--settings-tile-bg)';

  let statusDotColor = 'transparent';
  let statusDotShadow = 'none';
  if (isProcessing) {
    statusDotColor = 'var(--accent)';
    statusDotShadow = '0 0 4px rgba(76,194,255,0.4)';
  } else if (isCompleted) {
    statusDotColor = 'var(--success)';
    statusDotShadow = '0 0 4px rgba(107,191,110,0.4)';
  } else if (isFailed) {
    statusDotColor = 'var(--error)';
    statusDotShadow = '0 0 4px rgba(241,112,123,0.4)';
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '14px 16px',
      background: cardBg,
      borderRadius: '4px',
      opacity: isCompleted ? 0.8 : 1,
      transition: 'background 150ms ease',
    }}>
      {/* 预览/缩略图 */}
      <div style={{
        width: THUMB_COL_WIDTH,
        height: THUMB_HEIGHT,
        flexShrink: 0,
        position: 'relative',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        background: isProcessing ? 'rgba(76,194,255,0.08)' : 'var(--bg-surface-2)',
      }}>
        <ThumbnailImg
          videoHash={file.videoHash}
          index={0}
          thumbnailCount={thumbnailCount}
          onClick={onThumbnailClick ? () => onThumbnailClick(0) : undefined}
        />
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
        {/* 状态圆点 */}
        {statusDotColor !== 'transparent' && (
          <div style={{
            position: 'absolute',
            bottom: '3px',
            left: '3px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: statusDotColor,
            boxShadow: statusDotShadow,
          }} />
        )}
      </div>

      {/* 文件名 + 元数据 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
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
          marginTop: '3px',
          display: 'flex',
          gap: '10px',
        }}>
          <span style={{ color: 'var(--accent)' }}>{formatFileSize(file.fileSize, file.probePending)}</span>
          <span>{formatBitrate(file.bitrate, file.probePending)}</span>
          <span>{formatDuration(file.duration, file.probePending)}</span>
        </div>
      </div>

      {/* 源路径 */}
      <div style={{ width: PATH_COL_WIDTH, flexShrink: 0 }}>
        <span style={{
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'block',
          padding: '6px 0',
        }}>
          {displayPath}
        </span>
      </div>

      {/* 状态 */}
      <div style={{ width: STATUS_COL_WIDTH, flexShrink: 0 }}>
        <StatusCell status={status} />
      </div>

      {/* 删除按钮 */}
      <div style={{ width: ACTION_COL_WIDTH, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        <RemoveButton onRemove={onRemove} disabled={isRunning} />
      </div>
    </div>
  );
}

/** 状态单元格 */
function StatusCell({ status }: { status?: string }) {
  if (status === 'processing') {
    return (
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>处理中</span>
        <div style={{
          height: '3px',
          borderRadius: '2px',
          background: 'var(--bg-surface-3)',
          marginTop: '4px',
          overflow: 'hidden',
        }}>
          <div className="progress-pill-indeterminate" style={{ height: '3px', background: 'var(--accent)', borderRadius: '2px' }} />
        </div>
      </div>
    );
  }
  if (status === 'completed') {
    return <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 500, textAlign: 'right', display: 'block' }}>完成</span>;
  }
  if (status === 'failed') {
    return <span style={{ fontSize: '11px', color: 'var(--error)', fontWeight: 500, textAlign: 'right', display: 'block' }}>失败</span>;
  }
  return <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', display: 'block' }}>待处理</span>;
}

/** 删除按钮 */
function RemoveButton({ onRemove, disabled }: { onRemove: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onRemove}
      disabled={disabled}
      title="移除"
      style={{
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        background: 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: 'var(--text-muted)',
        padding: 0,
        transition: 'all 150ms ease',
        opacity: disabled ? 0.35 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = 'var(--error-muted)';
          e.currentTarget.style.color = 'var(--error)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-muted)';
        }
      }}
    >
      <svg viewBox="0 0 1024 1024" width="14" height="14" fill="currentColor">
        <path d="M576.416 736V383.871c0-17.814 14.521-32.256 32.434-32.256 17.912 0 32.433 14.442 32.433 32.256V736c0 17.815-14.52 32.256-32.433 32.256S576.416 753.814 576.416 736z m-193.7 0V383.871c0-17.814 14.522-32.256 32.434-32.256 17.913 0 32.434 14.442 32.434 32.256V736c0 17.815-14.521 32.256-32.434 32.256-17.912 0-32.433-14.441-32.433-32.256z m548.666-512.063H770.116v-64.064c0-52.774-42.885-95.625-95.949-95.872H350.734c-25.645-0.12-50.28 9.929-68.456 27.921-18.176 17.993-28.394 42.446-28.394 67.95v64.065H92.618C76.295 225.86 64 239.622 64 255.969c0 16.346 12.295 30.108 28.618 32.032h838.764C947.705 286.077 960 272.315 960 255.969c0-16.347-12.295-30.11-28.618-32.032zM318.3 159.873c0.482-17.539 14.794-31.574 32.434-31.808h323.433a31.17 31.17 0 0 1 22.597 9.206 30.82 30.82 0 0 1 8.936 22.602v64.064H318.3v-64.064z m418.932 800.126H286.768c-25.645 0.12-50.28-9.929-68.456-27.921-18.176-17.993-28.394-42.446-28.394-67.95V383.871a31.271 31.271 0 0 1 9.232-22.626 31.623 31.623 0 0 1 22.751-9.182 32.076 32.076 0 0 1 22.907 9.157 31.721 31.721 0 0 1 9.526 22.651v480.255c0.482 17.539 14.794 31.574 32.434 31.808h450.464c17.64-0.234 31.952-14.27 32.434-31.808v-478.91c1.933-16.234 15.771-28.462 32.208-28.462 16.436 0 30.274 12.228 32.208 28.461v478.911c0 25.505-10.218 49.958-28.394 67.95-18.176 17.993-42.811 28.041-68.456 27.922z" />
      </svg>
    </button>
  );
}
