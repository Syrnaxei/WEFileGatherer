import { useState, useEffect, useCallback } from 'react';
import FileList, { type FileItem } from './components/FileList';
import LogTerminal from './components/LogTerminal';
import StatsDashboard from './components/StatsDashboard';
import Toast, { showToast } from './components/Toast';
import Sidebar, { type PageKey } from './components/Sidebar';
import TagManagement from './components/TagManagement';
import SettingsPage from './components/SettingsPage';
import { useSocket } from './hooks/useSocket';
import { useTheme } from './contexts/ThemeContext';

const API_BASE = 'http://localhost:3000/api';

export interface SavedTag {
  id: number;
  name: string;
  target_path: string;
  description: string;
}

export default function App() {
  const { isDark } = useTheme();
  const [activePage, setActivePage] = useState<PageKey>('workspace');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [wfpPath, setWfpPathState] = useState('./wfp');
  const [flowId] = useState('flow-batch');
  const [isRunning, setIsRunning] = useState(false);
  const [savedTags, setSavedTags] = useState<SavedTag[]>([]);

  const { logs, connected, subscribe, clearLogs } = useSocket(flowId);

  const fetchSavedTags = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/tags`);
      const data = await res.json();
      if (data.success) {
        setSavedTags(data.tags.map((t: any) => ({
          id: t.id,
          name: t.name,
          target_path: t.target_path ?? '',
          description: t.description ?? '',
        })));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchSavedTags();
  }, [fetchSavedTags]);

  useEffect(() => {
    if (activePage === 'workspace') {
      fetchSavedTags();
    }
  }, [activePage, fetchSavedTags]);

  useEffect(() => {
    fetch(`${API_BASE}/settings/sourceDir`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value) {
          setWfpPathState(data.value);
        }
      })
      .catch(() => {});
  }, []);

  const setWfpPath = useCallback((value: string) => {
    setWfpPathState(value);
    fetch(`${API_BASE}/settings/sourceDir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    }).catch(() => {});
  }, []);

  const getTargetPathForTag = (tagName: string): string => {
    const tag = savedTags.find((t) => t.name === tagName);
    return tag ? tag.target_path : '';
  };

  const handleLoad = async () => {
    try {
      const res = await fetch(`${API_BASE}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory: wfpPath }),
      });
      const data = await res.json();
      if (data.success) {
        setFiles(data.files);
        showToast(`已加载 ${data.files.length} 个视频文件`, 'success');
      } else {
        showToast(data.error || '加载失败', 'error');
      }
    } catch (err) {
      showToast('加载失败: ' + (err as Error).message, 'error');
    }
  };

  const handleTagChange = (index: number, tag: string) => {
    setFiles((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], tag };
      return next;
    });
  };

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectFolder = async () => {
    if (window.electronAPI) {
      const dir = await window.electronAPI.openDirectory();
      if (dir) {
        setWfpPath(dir);
      }
    }
  };

  const handleStart = async () => {
    if (files.length === 0) {
      showToast('请先加载文件', 'error');
      return;
    }

    const filesToProcess = files.filter((f) => f.tag.trim() !== '');
    if (filesToProcess.length === 0) {
      showToast('请至少为一个文件设置 tag', 'error');
      return;
    }

    const unconfiguredTags = [...new Set(filesToProcess.map((f) => f.tag.trim()))]
      .filter((tagName) => !savedTags.some((t) => t.name === tagName));
    if (unconfiguredTags.length > 0) {
      showToast(`以下 tag 未配置目标路径: ${unconfiguredTags.join(', ')}，请先在 Tag 管理中创建`, 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/flows/${flowId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: filesToProcess }),
      });
      const data = await res.json();
      if (data.success) {
        setIsRunning(true);
        subscribe(flowId);
        clearLogs();
        showToast(`开始处理 ${filesToProcess.length} 个文件`, 'success');
      } else {
        showToast(data.error || '启动失败', 'error');
      }
    } catch (err) {
      showToast('启动失败: ' + (err as Error).message, 'error');
    }
  };

  const handleStop = async () => {
    try {
      await fetch(`${API_BASE}/flows/${flowId}/stop`, { method: 'POST' });
      setIsRunning(false);
    } catch (err) {
      console.error('停止失败:', err);
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'tags':
        return <TagManagement isDark={isDark} />;
      case 'settings':
        return <SettingsPage />;
      case 'workspace':
      default:
        return (
          <>
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
                <label style={{ fontSize: '13px', color: isDark ? '#9ca3af' : '#6b7280', whiteSpace: 'nowrap' }}>源文件目录:</label>
                <input
                  type="text"
                  value={wfpPath}
                  onChange={(e) => setWfpPath(e.target.value)}
                  style={isDark ? headerInputStyleDark : headerInputStyleLight}
                />
                {window.electronAPI && (
                  <button onClick={handleSelectFolder} style={btnStyle}>选择...</button>
                )}
                <button onClick={handleLoad} style={{ ...btnStyle, background: '#4f46e5' }}>加载</button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleStart}
                  disabled={isRunning || files.length === 0}
                  style={{ ...btnStyle, background: isRunning ? '#059669' : '#10b981' }}
                >
                  {isRunning ? '运行中' : '启动'}
                </button>
                <button
                  onClick={handleStop}
                  disabled={!isRunning}
                  style={{ ...btnStyle, background: '#ef4444' }}
                >
                  停止
                </button>
              </div>
            </header>

            <StatsDashboard
              total={files.length}
              tagged={files.filter((f) => f.tag.trim() !== '').length}
              untagged={files.filter((f) => f.tag.trim() === '').length}
              invalid={0}
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
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span>待处理文件 ({files.length})</span>
                  {files.some((f) => f.tag.trim() !== '') && (
                    <span style={{ fontSize: '11px', fontWeight: 400, color: isDark ? '#6b7280' : '#9ca3af' }}>
                      目标路径由 tag 配置决定
                    </span>
                  )}
                </div>
                <FileList
                  files={files}
                  onTagChange={handleTagChange}
                  onRemove={handleRemove}
                  savedTags={savedTags}
                  getTargetPathForTag={getTargetPathForTag}
                  isDark={isDark}
                />
              </div>

              <div style={{ width: '400px', display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, background: isDark ? '#111827' : '#f9fafb' }}>
                <LogTerminal logs={logs} connected={connected} isDark={isDark} />
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: isDark ? '#0f172a' : '#f9fafb' }}>
      <Toast isDark={isDark} />
      <Sidebar activePage={activePage} onNavigate={setActivePage} isDark={isDark} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {renderPage()}
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
  background: '#4b5563',
  whiteSpace: 'nowrap',
};

const headerInputStyleDark: React.CSSProperties = {
  flex: 1,
  background: '#374151',
  border: '1px solid #4b5563',
  borderRadius: '4px',
  padding: '6px 10px',
  color: 'white',
  fontSize: '13px',
};

const headerInputStyleLight: React.CSSProperties = {
  flex: 1,
  background: '#f9fafb',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  padding: '6px 10px',
  color: '#111827',
  fontSize: '13px',
};
