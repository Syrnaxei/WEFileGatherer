import { useState, useRef, useEffect } from 'react';
import { type SavedTag } from '../App';

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
}

export default function FileList({ files, onTagChange, onRemove, savedTags, getTargetPathForTag, isDark, isRunning }: FileListProps) {
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
      padding: '16px',
      background: isDark ? '#111827' : '#f9fafb',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 180px 1fr 80px',
        gap: '12px',
        padding: '8px 12px',
        background: isDark ? '#1f2937' : '#ffffff',
        borderRadius: '6px 6px 0 0',
        fontSize: '12px',
        fontWeight: 600,
        color: '#9ca3af',
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}>
        <div>文件名</div>
        <div>Tag</div>
        <div>目标路径</div>
        <div style={{ textAlign: 'center' }}>操作</div>
      </div>

      {files.map((file, index) => {
        const targetPath = file.tag.trim() ? getTargetPathForTag(file.tag.trim()) : '';
        const isCompleted = file.status === 'completed';
        const isFailed = file.status === 'failed';

        return (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 180px 1fr 80px',
              gap: '12px',
              padding: '10px 12px',
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
              <div style={{ fontSize: '11px', color: isDark ? '#6b7280' : '#9ca3af', marginTop: '2px' }}>{file.filePath}</div>
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

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => onRemove(index)}
                disabled={isRunning}
                style={{
                  padding: '4px 10px',
                  background: 'transparent',
                  border: '1px solid #ef4444',
                  color: isRunning ? '#6b7280' : '#ef4444',
                  borderRadius: '4px',
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                }}
              >
                删除
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
          padding: '6px 10px',
          background: isDark ? '#374151' : '#f9fafb',
          border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
          borderRadius: '4px',
          color: isDark ? '#e5e7eb' : '#111827',
          fontSize: '13px',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
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
