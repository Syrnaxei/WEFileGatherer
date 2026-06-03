import { useState, useCallback } from 'react';
import { PageHeader, WorkspaceStatsBar, WorkspaceToolbar } from './winui';
import FileList, { type FileItem } from './FileList';
import LogTerminal, { type LogEntry } from './LogTerminal';
import { showToast } from './Toast';
import { type SavedTag } from '../App';

/**
 * WorkspacePage — 工作台页面主组件
 * 组合 PageHeader + WorkspaceToolbar + WorkspaceStatsBar + FileList + LogTerminal
 * 所有 API 调用逻辑仍在 App.tsx 中，通过 Props 透传
 */

interface WorkspacePageProps {
  files: FileItem[];
  onLoad: () => void;
  onStart: () => void;
  onStop: () => void;
  onTagChange: (index: number, tag: string) => void;
  onRemove: (index: number) => void;
  onRemoveSelected: (ids: Set<string>) => void;
  savedTags: SavedTag[];
  getTargetPathForTag: (tagName: string) => string;
  wfpPath: string;
  isRunning: boolean;
  processedCount: number;
  failedCount: number;
  showFullPath: boolean;
  thumbnailCount: number;
  showLogTerminal: boolean;
  ffmpegAvailable: boolean;
  isDark: boolean;
  logs: LogEntry[];
  connected: boolean;
  debugLogEnabled: boolean;
  statsBarGlassEnabled?: boolean;
  statsBarGlassBlur?: number;
}

export default function WorkspacePage({
  files,
  onLoad,
  onStart,
  onStop,
  onTagChange,
  onRemove,
  onRemoveSelected,
  savedTags,
  getTargetPathForTag,
  wfpPath,
  isRunning,
  processedCount,
  failedCount,
  showFullPath,
  thumbnailCount,
  showLogTerminal,
  ffmpegAvailable,
  isDark,
  logs,
  connected,
  debugLogEnabled,
  statsBarGlassEnabled,
  statsBarGlassBlur,
}: WorkspacePageProps) {
  const tagged = files.filter((f) => f.tag.trim() !== '').length;
  const total = files.length;
  const failed = failedCount;

  // 选中文件 id 集合
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 全选/全不选
  const allSelected = total > 0 && selectedIds.size === total;
  const handleToggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map((f) => f.id)));
    }
  }, [allSelected, files]);

  // 单个文件选中切换
  const handleToggleSelect = useCallback((fileId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  }, []);

  // 删除选中项
  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) {
      showToast('无选中文件', 'error');
      return;
    }
    onRemoveSelected(selectedIds);
    setSelectedIds(new Set());
  }, [selectedIds, onRemoveSelected]);

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
        title="工作台"
        description={
          <>
            批量处理视频文件 · 源目录{' '}
            <span style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent)',
              fontWeight: 500,
            }}>
              {wfpPath || '未设置'}
            </span>
          </>
        }
      />

      {/* 工具栏 */}
      <WorkspaceToolbar
        selectedCount={selectedIds.size}
        totalCount={total}
        onSelectAll={handleToggleSelectAll}
        onDeleteSelected={handleDeleteSelected}
        isRunning={isRunning}
      />

      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        padding: '0 24px',
      }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <FileList
            files={files}
            onTagChange={onTagChange}
            onRemove={onRemove}
            savedTags={savedTags}
            getTargetPathForTag={getTargetPathForTag}
            isDark={isDark}
            isRunning={isRunning}
            showFullPath={showFullPath}
            baseDir={wfpPath}
            thumbnailCount={thumbnailCount}
            viewMode="thumbnail"
            ffmpegAvailable={ffmpegAvailable}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            statsBar={
              <WorkspaceStatsBar
                total={total}
                tagged={tagged}
                processed={processedCount}
                failed={failed}
                isRunning={isRunning}
                onLoad={onLoad}
                onStart={onStart}
                onStop={onStop}
                glassEnabled={statsBarGlassEnabled}
                glassBlur={statsBarGlassBlur}
              />
            }
          />
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
              isDark={isDark}
              debugLogEnabled={debugLogEnabled}
            />
          </div>
        )}
      </div>
    </div>
  );
}
