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
}

export { formatFileSize, formatBitrate, formatDuration };

export default function FileList({ files, onTagChange, onRemove, savedTags, getTargetPathForTag, isDark: _isDark, isRunning, showFullPath = true, baseDir = '', thumbnailCount = 1, viewMode = 'thumbnail', ffmpegAvailable = true }: FileListProps) {
  const effectiveViewMode = ffmpegAvailable ? viewMode : 'list';

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      background: 'var(--bg-base)',
    }}>
      {effectiveViewMode === 'thumbnail' ? (
        <ThumbnailView
          files={files}
          onTagChange={onTagChange}
          onRemove={onRemove}
          savedTags={savedTags}
          getTargetPathForTag={getTargetPathForTag}
          isDark={_isDark}
          isRunning={isRunning}
          thumbnailCount={thumbnailCount}
        />
      ) : (
        <ListView
          files={files}
          onTagChange={onTagChange}
          onRemove={onRemove}
          savedTags={savedTags}
          getTargetPathForTag={getTargetPathForTag}
          isDark={_isDark}
          isRunning={isRunning}
          showFullPath={showFullPath}
          baseDir={baseDir}
        />
      )}
    </div>
  );
}

function ThumbnailView({ files, onTagChange, onRemove, savedTags, getTargetPathForTag, isDark, isRunning, thumbnailCount }: {
  files: FileItem[];
  onTagChange: (index: number, tag: string) => void;
  onRemove: (index: number) => void;
  savedTags: SavedTag[];
  getTargetPathForTag: (tagName: string) => string;
  isDark: boolean;
  isRunning?: boolean;
  thumbnailCount: number;
}) {
  const [lightbox, setLightbox] = useState<{ fileIndex: number; thumbIndex: number } | null>(null);
  const thumbColWidth = thumbnailCount <= 1 ? 80 : 72;
  const thumbHeight = thumbnailCount <= 1 ? 45 : 40;
  const gridCols = `${thumbColWidth}px 1fr 160px 1fr 40px`;

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
    <>
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
        <div>Tag</div>
        <div>目标路径</div>
        <div style={{ textAlign: 'center' }}>操作</div>
      </div>
      {files.length === 0 && (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px',
          fontFamily: 'var(--font-ui)',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>+</div>
          暂无文件，请点击"加载"按钮扫描目录
        </div>
      )}
      {files.length > 0 && files.map((file, index) => {
        const targetPath = file.tag.trim() ? getTargetPathForTag(file.tag.trim()) : '';
        const isCompleted = file.status === 'completed';
        const isFailed = file.status === 'failed';

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
                          index % 2 === 0 ? 'var(--bg-surface-1)' : 'var(--bg-base)',
              borderBottom: '1px solid var(--border-subtle)',
              alignItems: 'center',
              opacity: isCompleted ? 0.75 : 1,
              transition: 'background 150ms ease',
            }}
          >
            <div style={{ width: `${thumbColWidth}px`, height: `${thumbHeight}px`, flexShrink: 0, display: 'flex', gap: '4px', position: 'relative' }}>
              <ThumbnailImg
                videoHash={file.videoHash}
                index={0}
                thumbnailCount={thumbnailCount}
                onClick={thumbnailCount > 1 ? () => openLightbox(index, 0) : undefined}
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
                {isCompleted && <span className="badge badge-success">已完成</span>}
                {isFailed && <span className="badge badge-error">失败</span>}
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

            <div>
              <TagInput
                value={file.tag}
                onChange={(tag) => onTagChange(index, tag)}
                savedTags={savedTags}
                isDark={isDark}
                disabled={isCompleted || isFailed}
              />
            </div>

            <div style={{
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: targetPath ? 'var(--accent)' : 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {targetPath || (file.tag.trim() ? '未配置路径' : '-')}
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
      })}
      {lightbox && files[lightbox.fileIndex]?.videoHash && (
        <ThumbnailLightbox
          videoHash={files[lightbox.fileIndex].videoHash!}
          thumbIndex={lightbox.thumbIndex}
          thumbnailCount={thumbnailCount}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
        />
      )}
    </>
  );
}

function ListView({ files, onTagChange, onRemove, savedTags, getTargetPathForTag, isDark, isRunning, showFullPath, baseDir }: {
  files: FileItem[];
  onTagChange: (index: number, tag: string) => void;
  onRemove: (index: number) => void;
  savedTags: SavedTag[];
  getTargetPathForTag: (tagName: string) => string;
  isDark: boolean;
  isRunning?: boolean;
  showFullPath?: boolean;
  baseDir?: string;
}) {
  const GRID_GAP = '16px';
  const ROW_PADDING = '10px 12px';
  const GRID_COLUMNS = 'minmax(120px, 3fr) minmax(140px, 2fr) minmax(120px, 3fr) minmax(60px, 1fr)';

  function shortenPath(filePath: string, base: string): string {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const normalizedBase = base.replace(/\\/g, '/').replace(/\/$/, '');
    if (normalizedPath.toLowerCase().startsWith(normalizedBase.toLowerCase())) {
      return '~' + normalizedPath.slice(normalizedBase.length);
    }
    return filePath;
  }

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: GRID_COLUMNS,
        gap: GRID_GAP,
        padding: '8px 20px',
        background: 'var(--bg-surface-2)',
        borderBottom: '1px solid var(--border-default)',
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>
        <div>文件名</div>
        <div>Tag</div>
        <div>目标路径</div>
        <div style={{ textAlign: 'center' }}>操作</div>
      </div>
      {files.length === 0 && (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px',
          fontFamily: 'var(--font-ui)',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>+</div>
          暂无文件，请点击"加载"按钮扫描目录
        </div>
      )}
      {files.length > 0 && files.map((file, index) => {
        const targetPath = file.tag.trim() ? getTargetPathForTag(file.tag.trim()) : '';
        const isCompleted = file.status === 'completed';
        const isFailed = file.status === 'failed';

        return (
          <div
            key={file.id}
            style={{
              display: 'grid',
              gridTemplateColumns: GRID_COLUMNS,
              gap: GRID_GAP,
              padding: ROW_PADDING,
              background: isCompleted ? 'var(--success-muted)' :
                          isFailed ? 'var(--error-muted)' :
                          index % 2 === 0 ? 'var(--bg-surface-1)' : 'var(--bg-base)',
              borderBottom: '1px solid var(--border-subtle)',
              alignItems: 'center',
              opacity: isCompleted ? 0.75 : 1,
              transition: 'background 150ms ease',
            }}
          >
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', minWidth: 0 }}>
              <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '-0.01em' }}>
                {file.fileName}
                {isCompleted && <span className="badge badge-success">已完成</span>}
                {isFailed && <span className="badge badge-error">失败</span>}
              </div>
              <div style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                marginTop: '3px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {showFullPath ? file.filePath : shortenPath(file.filePath, baseDir || '')}
              </div>
            </div>

            <div>
              <TagInput
                value={file.tag}
                onChange={(tag) => onTagChange(index, tag)}
                savedTags={savedTags}
                isDark={isDark}
                disabled={isCompleted || isFailed}
              />
            </div>

            <div style={{
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: targetPath ? 'var(--accent)' : 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {targetPath || (file.tag.trim() ? '未配置路径' : '-')}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button
                onClick={() => onRemove(index)}
                disabled={isRunning}
                title="删除"
                style={{
                  width: '30px',
                  height: '30px',
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
                <svg viewBox="0 0 1024 1024" width="18" height="18" fill="currentColor">
                  <path d="M576.416 736V383.871c0-17.814 14.521-32.256 32.434-32.256 17.912 0 32.433 14.442 32.433 32.256V736c0 17.815-14.52 32.256-32.433 32.256S576.416 753.814 576.416 736z m-193.7 0V383.871c0-17.814 14.522-32.256 32.434-32.256 17.913 0 32.434 14.442 32.434 32.256V736c0 17.815-14.521 32.256-32.434 32.256-17.912 0-32.433-14.441-32.433-32.256z m548.666-512.063H770.116v-64.064c0-52.774-42.885-95.625-95.949-95.872H350.734c-25.645-0.12-50.28 9.929-68.456 27.921-18.176 17.993-28.394 42.446-28.394 67.95v64.065H92.618C76.295 225.86 64 239.622 64 255.969c0 16.346 12.295 30.108 28.618 32.032h838.764C947.705 286.077 960 272.315 960 255.969c0-16.347-12.295-30.11-28.618-32.032zM318.3 159.873c0.482-17.539 14.794-31.574 32.434-31.808h323.433a31.17 31.17 0 0 1 22.597 9.206 30.82 30.82 0 0 1 8.936 22.602v64.064H318.3v-64.064z m418.932 800.126H286.768c-25.645 0.12-50.28-9.929-68.456-27.921-18.176-17.993-28.394-42.446-28.394-67.95V383.871a31.271 31.271 0 0 1 9.232-22.626 31.623 31.623 0 0 1 22.751-9.182 32.076 32.076 0 0 1 22.907 9.157 31.721 31.721 0 0 1 9.526 22.651v480.255c0.482 17.539 14.794 31.574 32.434 31.808h450.464c17.64-0.234 31.952-14.27 32.434-31.808v-478.91c1.933-16.234 15.771-28.462 32.208-28.462 16.436 0 30.274 12.228 32.208 28.461v478.911c0 25.505-10.218 49.958-28.394 67.95-18.176 17.993-42.811 28.041-68.456 27.922z" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}

function TagInput({ value, onChange, savedTags, isDark: _isDark, disabled }: {
  value: string;
  onChange: (tag: string) => void;
  savedTags: SavedTag[];
  isDark: boolean;
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

  const showDropdown = isOpen && savedTags.length > 0;
  const showClear = value && !disabled;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
          setFilter(e.target.value);
        }}
        onFocus={() => {
          if (!disabled) {
            setIsOpen(true);
            setFilter(value);
          }
        }}
        placeholder="选择 tag..."
        className="input"
        style={{
          padding: showClear ? '6px 28px 6px 10px' : '6px 10px',
          fontSize: '12px',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
      {showClear && (
        <button
          onClick={() => {
            onChange('');
            setFilter('');
          }}
          style={{
            position: 'absolute',
            right: '4px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: 0,
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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="8" height="8" fill="currentColor">
            <path d="M632.118 513.833l361.806 361.735a85.463 85.463 0 1 1-121.002 120.79L511.116 634.553 146.913 998.756a86.027 86.027 0 0 1-121.707-121.707L389.48 512.776 27.675 150.97A85.392 85.392 0 0 1 148.394 30.25L510.2 392.056l366.671-366.671a86.027 86.027 0 0 1 121.707 121.707z" />
          </svg>
        </button>
      )}
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--bg-surface-1)',
          border: '1px solid var(--border-default)',
          borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
          maxHeight: '160px',
          overflowY: 'auto',
          overflowX: 'auto',
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
              onClick={() => {
                onChange(tag.name);
                setIsOpen(false);
              }}
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
              <span style={{ fontWeight: 500 }}>{tag.name}</span>
              <span style={{ fontSize: '11px', color: 'var(--accent)', marginLeft: '8px' }}>
                <br /> {tag.target_path}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
