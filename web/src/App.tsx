import { useState, useEffect, useCallback } from 'react';
import FileList, { type FileItem, type ViewMode } from './components/FileList';
import LogTerminal from './components/LogTerminal';
import StatsDashboard from './components/StatsDashboard';
import Toast, { showToast } from './components/Toast';
import Sidebar, { type PageKey } from './components/Sidebar';
import TagManagement from './components/TagManagement';
import SettingsPage from './components/SettingsPage';
import ScrapePage from './components/ScrapePage';
import { useSocket } from './hooks/useSocket';
import { useProbePolling } from './hooks/useProbePolling';
import { useTheme } from './contexts/ThemeContext';

const API_BASE = 'http://localhost:3000/api';

export interface SavedTag {
  id: number;
  name: string;
  target_path: string;
  description: string;
}

export interface ScrapeFileItem {
  id: string;
  fileName: string;
  filePath: string;
  status?: 'pending' | 'completed' | 'failed';
  fileSize?: number;
  duration?: number;
  bitrate?: number;
  videoHash?: string;
  probePending?: boolean;
}

export default function App() {
  const { isDark } = useTheme();
  const [activePage, setActivePage] = useState<PageKey>('workspace');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [wfpPath, setWfpPathState] = useState('./wfp');
  const [flowId] = useState('flow-batch');
  const [isRunning, setIsRunning] = useState(false);
  const [savedTags, setSavedTags] = useState<SavedTag[]>([]);
  const [processedCount, setProcessedCount] = useState(0);

  const [scrapeFiles, setScrapeFiles] = useState<ScrapeFileItem[]>([]);
  const [scrapeIsRunning, setScrapeIsRunning] = useState(false);
  const [scrapeSourceDir, setScrapeSourceDir] = useState('');
  const [scrapeExportDir, setScrapeExportDir] = useState('');
  const [scrapeDepth, setScrapeDepth] = useState(1);
  const [scrapeProcessedCount, setScrapeProcessedCount] = useState(0);
  const [debugLogEnabled, setDebugLogEnabled] = useState(false);
  const [showFullPathOptions, setShowFullPathOptions] = useState(true);
  const [workspaceShowFullPath, setWorkspaceShowFullPath] = useState(true);
  const [scrapeShowFullPath, setScrapeShowFullPath] = useState(true);
  const [thumbnailCount, setThumbnailCount] = useState(3);
  const [fileListViewMode, setFileListViewMode] = useState<ViewMode>('list');
  const [ffmpegAvailable, setFfmpegAvailable] = useState(true);

  const effectiveWorkspaceShowFullPath = showFullPathOptions && workspaceShowFullPath;
  const effectiveScrapeShowFullPath = showFullPathOptions && scrapeShowFullPath;

  useProbePolling(files, setFiles);
  useProbePolling(scrapeFiles, setScrapeFiles);

  const { logs, connected, completedCount, completedIds, failedIds, subscribe, clearLogs } = useSocket(flowId);
  const scrapeSocket = useSocket('scrape-flow');

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

    fetch(`${API_BASE}/settings/debugLog`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value !== null) {
          setDebugLogEnabled(data.value === 'true');
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/settings/showFullPathOptions`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value !== null) {
          setShowFullPathOptions(data.value !== 'false');
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/settings/workspaceShowFullPath`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value !== null) {
          setWorkspaceShowFullPath(data.value !== 'false');
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/settings/scrapeShowFullPath`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value !== null) {
          setScrapeShowFullPath(data.value !== 'false');
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/settings/thumbnailCount`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value !== null && data.value !== undefined) {
          const v = parseInt(data.value, 10);
          if (!isNaN(v) && v >= 1 && v <= 5) setThumbnailCount(v);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/settings/fileListViewMode`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value) {
          setFileListViewMode(data.value === 'list' ? 'list' : 'thumbnail');
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/ffmpeg/status`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setFfmpegAvailable(data.available);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isRunning && completedCount > 0) {
      const filesToProcess = files.filter((f) => f.tag.trim() !== '');
      if (completedCount >= filesToProcess.length) {
        setIsRunning(false);
        showToast('所有文件处理完成', 'success');
      }
      setProcessedCount(completedCount);
    }
  }, [completedCount, isRunning, files]);

  useEffect(() => {
    if (completedIds.size > 0 || failedIds.size > 0) {
      setFiles((prev) =>
        prev.map((f) => {
          if (completedIds.has(f.id)) {
            return { ...f, status: 'completed' as const };
          }
          if (failedIds.has(f.id)) {
            return { ...f, status: 'failed' as const };
          }
          return f;
        })
      );
    }
  }, [completedIds, failedIds]);

  useEffect(() => {
    if (activePage === 'workspace') {
      fetch(`${API_BASE}/settings/sourceDir`)
        .then((r) => r.json())
        .then((data) => { if (data.success && data.value) setWfpPathState(data.value); })
        .catch(() => {});
    }
    fetch(`${API_BASE}/settings/scrapeSourceDir`)
      .then((r) => r.json())
      .then((data) => { if (data.success && data.value) setScrapeSourceDir(data.value); })
      .catch(() => {});
    fetch(`${API_BASE}/settings/scrapeExportDir`)
      .then((r) => r.json())
      .then((data) => { if (data.success && data.value) setScrapeExportDir(data.value); })
      .catch(() => {});
    fetch(`${API_BASE}/settings/scrapeDepth`)
      .then((r) => r.json())
      .then((data) => { if (data.success && data.value) setScrapeDepth(parseInt(data.value, 10) || 1); })
      .catch(() => {});
  }, [activePage]);

  useEffect(() => {
    if (scrapeIsRunning && scrapeSocket.completedCount > 0 && scrapeSocket.completedCount >= scrapeFiles.length) {
      setScrapeIsRunning(false);
      showToast('所有文件处理完成', 'success');
    }
    setScrapeProcessedCount(scrapeSocket.completedCount);
  }, [scrapeSocket.completedCount, scrapeIsRunning, scrapeFiles.length]);

  useEffect(() => {
    if (scrapeSocket.completedIds.size > 0 || scrapeSocket.failedIds.size > 0) {
      setScrapeFiles((prev) =>
        prev.map((f) => {
          if (scrapeSocket.completedIds.has(f.id)) return { ...f, status: 'completed' as const };
          if (scrapeSocket.failedIds.has(f.id)) return { ...f, status: 'failed' as const };
          return f;
        })
      );
    }
  }, [scrapeSocket.completedIds, scrapeSocket.failedIds]);

  const getTargetPathForTag = (tagName: string): string => {
    const tag = savedTags.find((t) => t.name === tagName);
    return tag ? tag.target_path : '';
  };

  const handleLoad = async () => {
    try {
      const res = await fetch(`${API_BASE}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory: wfpPath, viewMode: fileListViewMode }),
      });
      const data = await res.json();
      if (data.success) {
        const mapped = data.files.map((f: any) => ({
          ...f,
          fileSize: f.fileSize || undefined,
          duration: f.duration || undefined,
          bitrate: f.bitrate || undefined,
          probePending: true,
        }));
        setFiles(mapped);
        if(data.files.length !== 0) {
          showToast(`已加载 ${data.files.length} 个视频文件`, 'success');
        } else {
          showToast('未找到匹配文件');
        }
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
        setProcessedCount(0);
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

  const handleScrapeLoad = async () => {
    if (!scrapeSourceDir.trim()) {
      showToast('请先在设置中配置搜刮文件夹', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/scrape/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory: scrapeSourceDir, depth: scrapeDepth }),
      });
      const data = await res.json();
      if (data.success) {
        const mapped = data.files.map((f: any) => ({
          ...f,
          status: 'pending' as const,
          fileSize: f.fileSize || undefined,
          duration: f.duration || undefined,
          bitrate: f.bitrate || undefined,
          probePending: true,
        }));
        setScrapeFiles(mapped);
        if(data.files.length !== 0) {
          showToast(`已加载 ${data.files.length} 个视频文件`, 'success');
        } else {
          showToast('未找到匹配文件');
        }
      } else {
        showToast(data.error || '加载失败', 'error');
      }
    } catch (err) {
      showToast('加载失败: ' + (err as Error).message, 'error');
    }
  };

  const handleScrapeRemove = useCallback((index: number) => {
    setScrapeFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleScrapeStart = async () => {
    if (scrapeFiles.length === 0) {
      showToast('请先加载文件', 'error');
      return;
    }
    if (!scrapeExportDir.trim()) {
      showToast('请先在设置中配置导出文件夹', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/scrape/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: scrapeFiles, exportDir: scrapeExportDir }),
      });
      const data = await res.json();
      if (data.success) {
        setScrapeIsRunning(true);
        setScrapeProcessedCount(0);
        scrapeSocket.subscribe('scrape-flow');
        scrapeSocket.clearLogs();
        showToast(`开始处理 ${scrapeFiles.length} 个文件`, 'success');
      } else {
        showToast(data.error || '启动失败', 'error');
      }
    } catch (err) {
      showToast('启动失败: ' + (err as Error).message, 'error');
    }
  };

  const handleScrapeStop = async () => {
    try {
      await fetch(`${API_BASE}/scrape/stop`, { method: 'POST' });
      setScrapeIsRunning(false);
    } catch (err) {
      console.error('停止失败:', err);
    }
  };

  const handleShowFullPathOptionsChange = (value: boolean) => {
    setShowFullPathOptions(value);
    fetch(`${API_BASE}/settings/showFullPathOptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: String(value) }),
    }).catch(() => {});
  };

  const handleWorkspaceShowFullPathChange = (value: boolean) => {
    setWorkspaceShowFullPath(value);
    fetch(`${API_BASE}/settings/workspaceShowFullPath`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: String(value) }),
    }).catch(() => {});
  };

  const handleScrapeShowFullPathChange = (value: boolean) => {
    setScrapeShowFullPath(value);
    fetch(`${API_BASE}/settings/scrapeShowFullPath`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: String(value) }),
    }).catch(() => {});
  };

  const handleThumbnailCountChange = (value: number) => {
    setThumbnailCount(value);
    fetch(`${API_BASE}/settings/thumbnailCount`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: String(value) }),
    }).catch(() => {});
  };

  const handleFileListViewModeChange = (mode: ViewMode) => {
    setFileListViewMode(mode);
    fetch(`${API_BASE}/settings/fileListViewMode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: mode }),
    }).catch(() => {});
  };

  const renderPage = () => {
    switch (activePage) {
      case 'tags':
        return <TagManagement isDark={isDark} />;
      case 'settings':
        return <SettingsPage
          showFullPathOptions={showFullPathOptions}
          onShowFullPathOptionsChange={handleShowFullPathOptionsChange}
          workspaceShowFullPath={workspaceShowFullPath}
          onWorkspaceShowFullPathChange={handleWorkspaceShowFullPathChange}
          scrapeShowFullPath={scrapeShowFullPath}
          onScrapeShowFullPathChange={handleScrapeShowFullPathChange}
          thumbnailCount={thumbnailCount}
          onThumbnailCountChange={handleThumbnailCountChange}
          fileListViewMode={fileListViewMode}
          onFileListViewModeChange={handleFileListViewModeChange}
          ffmpegAvailable={ffmpegAvailable}
          onFfmpegAvailableChange={setFfmpegAvailable}
        />;
      case 'scrape':
        return (
          <ScrapePage
            isDark={isDark}
            files={scrapeFiles}
            isRunning={scrapeIsRunning}
            scrapeSourceDir={scrapeSourceDir}
            scrapeExportDir={scrapeExportDir}
            scrapeDepth={scrapeDepth}
            processedCount={scrapeProcessedCount}
            failedCount={scrapeSocket.failedIds.size}
            logs={scrapeSocket.logs}
            connected={scrapeSocket.connected}
            debugLogEnabled={debugLogEnabled}
            scrapeShowFullPath={effectiveScrapeShowFullPath}
            thumbnailCount={thumbnailCount}
            onLoad={handleScrapeLoad}
            onStart={handleScrapeStart}
            onStop={handleScrapeStop}
            onRemove={handleScrapeRemove}
          />
        );
      case 'workspace':
      default:
        return (
          <>
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
                工作台
              </h2>
              <p style={{
                margin: '4px 0 0',
                fontSize: '12px',
                color: 'var(--text-muted)',
                letterSpacing: '-0.01em',
              }}>
                批量处理视频文件，为文件设置 Tag 并移动到目标目录
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
              gap: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                <span style={{
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  源目录: {wfpPath || '未设置'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button onClick={handleLoad} className="btn btn-primary">加载</button>
                <button
                  onClick={handleStart}
                  disabled={isRunning || files.length === 0}
                  className="btn btn-success"
                >
                  {isRunning ? '运行中' : '启动'}
                </button>
                <button
                  onClick={handleStop}
                  disabled={!isRunning}
                  className="btn btn-danger"
                >
                  停止
                </button>
              </div>
            </header>

            <StatsDashboard
              total={files.length}
              tagged={files.filter((f) => f.tag.trim() !== '').length}
              untagged={files.filter((f) => f.tag.trim() === '').length}
              processed={processedCount}
              invalid={0}
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
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span>待处理文件 ({files.length})</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {files.some((f) => f.tag.trim() !== '') && (
                      <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>
                        目标路径由 tag 配置决定
                      </span>
                    )}
                  </div>
                </div>
                <FileList
                  files={files}
                  onTagChange={handleTagChange}
                  onRemove={handleRemove}
                  savedTags={savedTags}
                  getTargetPathForTag={getTargetPathForTag}
                  isDark={isDark}
                  isRunning={isRunning}
                  showFullPath={effectiveWorkspaceShowFullPath}
                  baseDir={wfpPath}
                  thumbnailCount={thumbnailCount}
                  viewMode={fileListViewMode}
                  ffmpegAvailable={ffmpegAvailable}
                />
              </div>

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
            </div>
          </>
        );
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'var(--bg-base)',
      color: 'var(--text-primary)',
    }}>
      <Toast isDark={isDark} />
      <Sidebar activePage={activePage} onNavigate={setActivePage} isDark={isDark} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div
          key={activePage}
          className="animate-fade-in-up"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
