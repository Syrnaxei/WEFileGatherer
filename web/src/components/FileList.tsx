import { useState, useRef, useEffect } from 'react';
import { type SavedTag } from '../App';

/*
 * 布局间距比例系统 — 详见 doc/布局间距比例系统.md
 * 列宽比例: 文件名:Tag:目标路径:操作 = 3:2:3:1
 * 调整 GRID_GAP / GRID_COLUMNS / ROW_PADDING 即可改变布局
 */
const GRID_GAP = '18px';
const ROW_PADDING = '10px 12px';
// const HEADER_PADDING = '8px 16px';
const GRID_COLUMNS = 'minmax(120px, 3fr) minmax(140px, 2fr) minmax(120px, 3fr) minmax(60px, 1fr)';

export interface FileItem {
  id: string;
  fileName: string;
  filePath: string;
  tag: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

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
}

function shortenPath(filePath: string, baseDir: string): string {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const normalizedBase = baseDir.replace(/\\/g, '/').replace(/\/$/, '');
  if (normalizedPath.toLowerCase().startsWith(normalizedBase.toLowerCase())) {
    return '~' + normalizedPath.slice(normalizedBase.length);
  }
  return filePath;
}

export default function FileList({ files, onTagChange, onRemove, savedTags, getTargetPathForTag, isDark, isRunning, showFullPath = true, baseDir = '' }: FileListProps) {
  if (files.length === 0) {
    return (
      <div style={{
        flex: 1,
        padding: '40px',
        textAlign: 'center',
        color: isDark ? '#6b7280' : '#9ca3af',
        fontSize: '14px',
        background: isDark ? '#111827' : '#f9fafb',
      }}>
        暂无文件，请点击"加载"按钮扫描目录
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      background: isDark ? '#111827' : '#f9fafb',
    }}>
      {files.map((file, index) => {
        const targetPath = file.tag.trim() ? getTargetPathForTag(file.tag.trim()) : '';
        const isCompleted = file.status === 'completed';
        const isFailed = file.status === 'failed';

        return (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: GRID_COLUMNS,
              gap: GRID_GAP,
              padding: ROW_PADDING,
              background: isCompleted ? (isDark ? '#064e3b' : '#d1fae5') :
                          isFailed ? (isDark ? '#450a0a' : '#fee2e2') :
                          index % 2 === 0 ? (isDark ? '#1f2937' : '#ffffff') : (isDark ? '#18212f' : '#f9fafb'),
              borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              alignItems: 'center',
              opacity: isCompleted ? 0.8 : 1,
            }}
          >
            <div style={{ fontSize: '13px', color: isDark ? '#e5e7eb' : '#111827' }}>
              <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {file.fileName}
                {isCompleted && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    background: '#10b981',
                    color: 'white',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}>已完成</span>
                )}
                {isFailed && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}>失败</span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: isDark ? '#6b7280' : '#9ca3af', marginTop: '2px' }}>{showFullPath ? file.filePath : shortenPath(file.filePath, baseDir)}</div>
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
              fontFamily: 'monospace',
              color: targetPath ? '#60a5fa' : (isDark ? '#4b5563' : '#9ca3af'),
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
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'transparent',
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  color: isRunning ? '#6b7280' : '#ef4444',
                  padding: 0,
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isRunning) {
                    e.currentTarget.style.background = isDark ? '#374151' : '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isRunning) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="20" height="20" fill="currentColor">
                  <path d="M576.416 736V383.871c0-17.814 14.521-32.256 32.434-32.256 17.912 0 32.433 14.442 32.433 32.256V736c0 17.815-14.52 32.256-32.433 32.256S576.416 753.814 576.416 736z m-193.7 0V383.871c0-17.814 14.522-32.256 32.434-32.256 17.913 0 32.434 14.442 32.434 32.256V736c0 17.815-14.521 32.256-32.434 32.256-17.912 0-32.433-14.441-32.433-32.256z m548.666-512.063H770.116v-64.064c0-52.774-42.885-95.625-95.949-95.872H350.734c-25.645-0.12-50.28 9.929-68.456 27.921-18.176 17.993-28.394 42.446-28.394 67.95v64.065H92.618C76.295 225.86 64 239.622 64 255.969c0 16.346 12.295 30.108 28.618 32.032h838.764C947.705 286.077 960 272.315 960 255.969c0-16.347-12.295-30.11-28.618-32.032zM318.3 159.873c0.482-17.539 14.794-31.574 32.434-31.808h323.433a31.17 31.17 0 0 1 22.597 9.206 30.82 30.82 0 0 1 8.936 22.602v64.064H318.3v-64.064z m418.932 800.126H286.768c-25.645 0.12-50.28-9.929-68.456-27.921-18.176-17.993-28.394-42.446-28.394-67.95V383.871a31.271 31.271 0 0 1 9.232-22.626 31.623 31.623 0 0 1 22.751-9.182 32.076 32.076 0 0 1 22.907 9.157 31.721 31.721 0 0 1 9.526 22.651v480.255c0.482 17.539 14.794 31.574 32.434 31.808h450.464c17.64-0.234 31.952-14.27 32.434-31.808v-478.91c1.933-16.234 15.771-28.462 32.208-28.462 16.436 0 30.274 12.228 32.208 28.461v478.911c0 25.505-10.218 49.958-28.394 67.95-18.176 17.993-42.811 28.041-68.456 27.922z" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TagInput({ value, onChange, savedTags, isDark, disabled }: {
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

  const iconColor = isDark ? '#9ca3af' : '#6b7280';
  const iconHoverColor = isDark ? '#e5e7eb' : '#374151';
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
        style={{
          width: '100%',
          padding: showClear ? '6px 30px 6px 10px' : '6px 10px',
          background: isDark ? '#374151' : '#f9fafb',
          border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
          borderRadius: '4px',
          color: isDark ? '#e5e7eb' : '#111827',
          fontSize: '13px',
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
            color: iconColor,
            padding: 0,
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? '#4b5563' : '#e5e7eb';
            e.currentTarget.style.color = iconHoverColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = iconColor;
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="8" height="8" fill="currentColor">
            <path d="M632.118 513.833l361.806 361.735a85.463 85.463 0 1 1-121.002 120.79L511.116 634.553 146.913 998.756a86.027 86.027 0 0 1-121.707-121.707L389.48 512.776 27.675 150.97A85.392 85.392 0 0 1 148.394 30.25L510.2 392.056l366.671-366.671a86.027 86.027 0 0 1 121.707 121.707z" />
          </svg>
        </button>
      )}
      {showDropdown && (
        <div className="tag-dropdown-scroll" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: isDark ? '#1f2937' : '#ffffff',
          border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
          borderRadius: '0 0 4px 4px',
          maxHeight: '160px',
          overflowY: 'auto',
          overflowX: 'auto',
          zIndex: 10,
        }}>
          {filteredTags.length === 0 && (
            <div style={{ padding: '8px 10px', fontSize: '12px', color: '#6b7280' }}>
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
                padding: '6px 10px',
                fontSize: '13px',
                color: isDark ? '#e5e7eb' : '#111827',
                cursor: 'pointer',
                borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = isDark ? '#374151' : '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              }}
            >
              <span style={{ fontWeight: 500 }}>{tag.name}</span>
              <span style={{ fontSize: '11px', color: '#60a5fa', marginLeft: '8px' }}>
                <br /> {tag.target_path}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
