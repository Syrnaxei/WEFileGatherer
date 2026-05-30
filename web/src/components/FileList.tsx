import { useState, useRef, useEffect } from 'react';
import { type SavedTag } from '../App';
import ThumbnailImg from './ThumbnailImg';
import ThumbnailLightbox from './ThumbnailLightbox';
import { formatFileSize, formatBitrate, formatDuration } from '../utils/format';

export interface FileItem {
  id: string;
  fileName: string;
  filePath: string;
  tag: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  fileSize?: number;
  duration?: number;
  bitrate?: number;
  videoHash?: string;
  probePending?: boolean;
}

type ViewMode = 'thumbnail' | 'list';

export type { ViewMode };

interface FileListProps {
  files: FileItem[];
  onTagChange: (index: number, tag: string) => void;
  onRemove: (index: number) => void;
  savedTags: SavedTag[];
  getTargetPathForTag: (tagName: string) => string;
  isDark: boolean;
  isRunning?: boolean;
  showFullPath?: boolean;
  baseDir?: string;
  thumbnailCount?: number;
  viewMode?: ViewMode;
  ffmpegAvailable?: boolean;
  statsBar?: React.ReactNode;
}

export { formatFileSize, formatBitrate, formatDuration };

/** 缩略图预览列宽 */
const THUMB_COL_WIDTH = 72;
/** 缩略图高度 */
const THUMB_HEIGHT = 44;
/** Tag 列宽 */
const TAG_COL_WIDTH = 130;
/** Tag-目标路径间距 */
const TAG_PATH_SPACER = 28;
/** 目标路径列宽 */
const PATH_COL_WIDTH = 180;
/** 状态列宽 */
const STATUS_COL_WIDTH = 90;
/** 操作列宽 */
const ACTION_COL_WIDTH = 32;

export default function FileList({
  files,
  onTagChange,
  onRemove,
  savedTags,
  getTargetPathForTag,
  isRunning,
  thumbnailCount = 1,
  statsBar,
}: FileListProps) {
  const [lightbox, setLightbox] = useState<{ fileIndex: number; thumbIndex: number } | null>(null);

  const openLightbox = (fileIndex: number, thumbIndex: number) => {
    setLightbox({ fileIndex, thumbIndex });
  };
  const closeLightbox = () => setLightbox(null);
  const navigateLightbox = (direction: -1 | 1) => {
    if (!lightbox) return;
    const newIndex = lightbox.thumbIndex + direction;
    if (newIndex < 0 || newIndex >= thumbnailCount) return;
    setLightbox({ ...lightbox, thumbIndex: newIndex });
  };

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      background: 'var(--settings-page-bg)',
    }}>
      <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
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
          <span style={{ width: TAG_COL_WIDTH, flexShrink: 0 }}>Tag</span>
          <span style={{ width: TAG_PATH_SPACER, flexShrink: 0 }} />
          <span style={{ width: PATH_COL_WIDTH, flexShrink: 0 }}>目标路径</span>
          <span style={{ width: STATUS_COL_WIDTH, flexShrink: 0, textAlign: 'right' }}>状态</span>
          <span style={{ width: ACTION_COL_WIDTH, flexShrink: 0 }} />
        </div>

        {/* 空状态 */}
        {files.length === 0 && (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '13px',
            fontFamily: 'var(--font-ui)',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>+</div>
            暂无文件，点击 FolderPlus 按钮加载文件
          </div>
        )}

        {/* 文件卡片列表 */}
        {files.length > 0 && (
          <div style={{ padding: '0 0 72px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {files.map((file, index) => (
              <FileCard
                key={file.id}
                file={file}
                index={index}
                onTagChange={(tag) => onTagChange(index, tag)}
                onRemove={() => onRemove(index)}
                savedTags={savedTags}
                getTargetPathForTag={getTargetPathForTag}
                isRunning={isRunning}
                thumbnailCount={thumbnailCount}
                onThumbnailClick={thumbnailCount > 1 ? (thumbIdx) => openLightbox(index, thumbIdx) : undefined}
              />
            ))}
          </div>
        )}

        {/* 弹性占位：确保文件少时底部统计栏仍吸附底部 */}
        <div style={{ flex: 1 }} />

        {/* 底部统计栏 — sticky 吸附，毛玻璃穿透效果 */}
        {statsBar}
      </div>

      {/* 缩略图灯箱 */}
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

/** 单行文件卡片 */
function FileCard({
  file,
  onTagChange,
  onRemove,
  savedTags,
  getTargetPathForTag,
  isRunning,
  thumbnailCount,
  onThumbnailClick,
}: {
  file: FileItem;
  index: number;
  onTagChange: (tag: string) => void;
  onRemove: () => void;
  savedTags: SavedTag[];
  getTargetPathForTag: (tagName: string) => string;
  isRunning?: boolean;
  thumbnailCount: number;
  onThumbnailClick?: (thumbIndex: number) => void;
}) {
  const { status } = file;
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const isProcessing = status === 'processing';
  const targetPath = file.tag.trim() ? getTargetPathForTag(file.tag.trim()) : '';

  // 卡片背景与边框 — 对齐 settings-tile 风格
  const cardBg = isProcessing ? 'var(--accent-muted)' : 'var(--settings-tile-bg)';

  // 状态圆点颜色
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

      {/* Tag Chip */}
      <div style={{ width: TAG_COL_WIDTH, flexShrink: 0 }}>
        <TagChip
          value={file.tag}
          onChange={onTagChange}
          savedTags={savedTags}
          disabled={isCompleted || isFailed}
        />
      </div>

      {/* 间距 */}
      <div style={{ width: TAG_PATH_SPACER, flexShrink: 0 }} />

      {/* 目标路径 */}
      <div style={{ width: PATH_COL_WIDTH, flexShrink: 0 }}>
        {targetPath ? (
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
            {targetPath}
          </span>
        ) : (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {file.tag.trim() ? '未配置路径' : '-'}
          </span>
        )}
      </div>

      {/* 状态 */}
      <div style={{ width: STATUS_COL_WIDTH, flexShrink: 0 }}>
        <StatusCell status={status} />
      </div>

      {/* 删除按钮 */}
      <div style={{ width: ACTION_COL_WIDTH, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        <RemoveButton onRemove={onRemove} isRunning={isRunning} isProcessing={isProcessing} />
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
  // pending — 根据是否有 tag 区分
  return <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', display: 'block' }}>待处理</span>;
}

/** 删除按钮 */
function RemoveButton({ onRemove, isRunning, isProcessing }: { onRemove: () => void; isRunning?: boolean; isProcessing?: boolean }) {
  const disabled = isRunning || isProcessing;
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

/** Tag Chip — 点击弹出下拉选择 */
function TagChip({
  value,
  onChange,
  savedTags,
  disabled,
}: {
  value: string;
  onChange: (tag: string) => void;
  savedTags: SavedTag[];
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTags = savedTags.filter((t) =>
    t.name.toLowerCase().includes(filter.toLowerCase())
  );

  const handleChipClick = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) setFilter(value);
  };

  const handleSelect = (tagName: string) => {
    onChange(tagName);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setFilter('');
    setIsOpen(false);
  };

  // 已设置 tag 的 chip 样式
  if (value) {
    return (
      <div ref={containerRef} style={{ position: 'relative' }}>
        <div
          onClick={handleChipClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: '4px',
            border: `1px solid ${isOpen ? 'var(--accent)' : 'var(--border-default)'}`,
            background: isOpen ? 'var(--bg-surface-3)' : 'var(--bg-surface-2)',
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 150ms ease',
            userSelect: 'none',
          }}
        >
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--text-muted)',
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {value}
          </span>
          {!disabled && (
            <button
              onClick={handleClear}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '3px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 0,
                marginLeft: 'auto',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-surface-3)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <svg viewBox="0 0 1024 1024" width="8" height="8" fill="currentColor">
                <path d="M632.118 513.833l361.806 361.735a85.463 85.463 0 1 1-121.002 120.79L511.116 634.553 146.913 998.756a86.027 86.027 0 0 1-121.707-121.707L389.48 512.776 27.675 150.97A85.392 85.392 0 0 1 148.394 30.25L510.2 392.056l366.671-366.671a86.027 86.027 0 0 1 121.707 121.707z" />
              </svg>
            </button>
          )}
        </div>

        {/* 下拉选择器 */}
        {isOpen && !disabled && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '2px',
            background: 'var(--bg-surface-1)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            maxHeight: '160px',
            overflowY: 'auto',
            zIndex: 10,
            boxShadow: 'var(--shadow-lg)',
          }}>
            {filteredTags.length === 0 && (
              <div style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                无匹配 tag
              </div>
            )}
            {filteredTags.map((tag) => (
              <div
                key={tag.id}
                onClick={() => handleSelect(tag.name)}
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: tag.name === value ? 'var(--accent)' : 'var(--text-primary)',
                  fontWeight: tag.name === value ? 600 : 400,
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-subtle)',
                  transition: 'background 100ms ease',
                  borderLeft: tag.name === value ? '3px solid var(--accent)' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-surface-2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                }}
              >
                <span>{tag.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 未设置 tag — 占位 chip
  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div
        onClick={handleChipClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          borderRadius: '4px',
          border: `1px dashed ${isOpen ? 'var(--accent)' : 'var(--border-default)'}`,
          background: isOpen ? 'var(--bg-surface-3)' : 'transparent',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 150ms ease',
          userSelect: 'none',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>选择 tag</span>
      </div>

      {/* 下拉选择器 */}
      {isOpen && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '2px',
          background: 'var(--bg-surface-1)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          maxHeight: '160px',
          overflowY: 'auto',
          zIndex: 10,
          boxShadow: 'var(--shadow-lg)',
        }}>
          {filteredTags.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>
              无匹配 tag
            </div>
          )}
          {filteredTags.map((tag) => (
            <div
              key={tag.id}
              onClick={() => handleSelect(tag.name)}
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-subtle)',
                transition: 'background 100ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-surface-2)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              }}
            >
              <span>{tag.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
