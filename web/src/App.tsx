import { useState, useEffect, useCallback } from 'react';
import { type FileItem } from './components/FileList';
import WorkspacePage from './components/WorkspacePage';
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
  status?: 'pending' | 'processing' | 'completed' | 'failed';
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
  const [workspaceShowFullPath, setWorkspaceShowFullPath] = useState(true);
  const [scrapeShowFullPath, setScrapeShowFullPath] = useState(true);
  const [thumbnailCount, setThumbnailCount] = useState(3);
  const [ffmpegAvailable, setFfmpegAvailable] = useState(true);
  const [showLogTerminal, setShowLogTerminal] = useState(true);
  const [conflictResolution, setConflictResolution] = useState<'overwrite' | 'skip' | 'cancel'>('overwrite');
  const [statsBarGlassEnabled, setStatsBarGlassEnabled] = useState(true);
  const [statsBarGlassBlur, setStatsBarGlassBlur] = useState(16);

  const effectiveWorkspaceShowFullPath = workspaceShowFullPath;
  const effectiveScrapeShowFullPath = scrapeShowFullPath;

  useProbePolling(files, setFiles);
  useProbePolling(scrapeFiles, setScrapeFiles);

  const { logs, connected, completedCount, completedIds, failedIds, processingIds, subscribe, clearLogs } = useSocket(flowId);
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

    fetch(`${API_BASE}/settings/showLog`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value !== null) {
          setShowLogTerminal(data.value !== 'false');
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/settings/conflictResolution`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value) {
          const v = data.value;
          if (v === 'overwrite' || v === 'skip' || v === 'cancel') {
            setConflictResolution(v);
          }
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

    fetch(`${API_BASE}/settings/statsBarGlassEnabled`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value !== null) {
          setStatsBarGlassEnabled(data.value !== 'false');
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/settings/statsBarGlassBlur`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value !== null && data.value !== undefined) {
          const v = parseInt(data.value, 10);
          if (!isNaN(v) && v >= 4 && v <= 40) setStatsBarGlassBlur(v);
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
    if (completedIds.size > 0 || failedIds.size > 0 || processingIds.size > 0) {
      setFiles((prev) =>
        prev.map((f) => {
          if (completedIds.has(f.id)) {
            return { ...f, status: 'completed' as const };
          }
          if (failedIds.has(f.id)) {
            return { ...f, status: 'failed' as const };
          }
          if (processingIds.has(f.id)) {
            return { ...f, status: 'processing' as const };
          }
          return f;
        })
      );
    }
  }, [completedIds, failedIds, processingIds]);

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
    if (scrapeSocket.completedIds.size > 0 || scrapeSocket.failedIds.size > 0 || scrapeSocket.processingIds.size > 0) {
      setScrapeFiles((prev) =>
        prev.map((f) => {
          if (scrapeSocket.completedIds.has(f.id)) return { ...f, status: 'completed' as const };
          if (scrapeSocket.failedIds.has(f.id)) return { ...f, status: 'failed' as const };
          if (scrapeSocket.processingIds.has(f.id)) return { ...f, status: 'processing' as const };
          return f;
        })
      );
    }
  }, [scrapeSocket.completedIds, scrapeSocket.failedIds, scrapeSocket.processingIds]);

  const getTargetPathForTag = (tagName: string): string => {
    const tag = savedTags.find((t) => t.name === tagName);
    return tag ? tag.target_path : '';
  };

  const handleLoad = async () => {
    // 重置上一轮处理统计，避免残留计数影响新加载的文件
    setProcessedCount(0);
    clearLogs();

    try {
      // 不传 existingHashes，获取目录下全部文件列表，用于对比和清理
      const res = await fetch(`${API_BASE}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory: wfpPath, viewMode: 'thumbnail' }),
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

        // 构建目录中存在的 videoHash 集合
        const dirHashSet = new Set<string>(
          mapped.map((f: FileItem) => f.videoHash).filter((h): h is string => !!h)
        );

        // 移除 filelist 中目录已不存在的文件（文件已被移走或删除）
        const currentFiles = files.filter(
          (f) => !f.videoHash || dirHashSet.has(f.videoHash)
        );

        // 当前已有文件的 videoHash 集合，用于跳过重复
        const existingHashSet = new Set<string>(
          currentFiles.map((f) => f.videoHash).filter((h): h is string => !!h)
        );

        // 仅添加目录中新增的文件
        const newFiles = mapped.filter(
          (f: FileItem) => !f.videoHash || !existingHashSet.has(f.videoHash)
        );

        setFiles([...currentFiles, ...newFiles]);

        // 统计被移除的文件数量，提示用户
        const removedCount = files.length - currentFiles.length;
        if (newFiles.length > 0 && removedCount > 0) {
          showToast(`已加载 ${newFiles.length} 个新文件，移除 ${removedCount} 个已不存在文件`, 'success');
        } else if (newFiles.length > 0) {
          showToast(`已加载 ${newFiles.length} 个新文件`, 'success');
        } else if (removedCount > 0) {
          showToast(`已移除 ${removedCount} 个已不存在文件`, 'info');
        } else if (mapped.length === 0) {
          showToast('无匹配文件', 'info');
        } else {
          showToast('无新文件', 'info');
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
        if (res.status === 409 && data.conflicts) {
          showToast(`文件冲突: ${data.conflicts.join(', ')} 已存在于目标路径`, 'error');
        } else {
          showToast(data.error || '启动失败', 'error');
        }
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
    // 重置上一轮处理统计，避免残留计数影响新加载的文件
    setScrapeProcessedCount(0);
    scrapeSocket.clearLogs();

    try {
      // 不传 existingHashes，获取目录下全部文件列表，用于对比和清理
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

        // 构建目录中存在的 videoHash 集合
        const dirHashSet = new Set<string>(
          mapped.map((f: ScrapeFileItem) => f.videoHash).filter((h): h is string => !!h)
        );

        // 移除 filelist 中目录已不存在的文件（文件已被移走或删除）
        const currentFiles = scrapeFiles.filter(
          (f) => !f.videoHash || dirHashSet.has(f.videoHash)
        );

        // 当前已有文件的 videoHash 集合，用于跳过重复
        const existingHashSet = new Set<string>(
          currentFiles.map((f) => f.videoHash).filter((h): h is string => !!h)
        );

        // 仅添加目录中新增的文件
        const newFiles = mapped.filter(
          (f: ScrapeFileItem) => !f.videoHash || !existingHashSet.has(f.videoHash)
        );

        setScrapeFiles([...currentFiles, ...newFiles]);

        // 统计被移除的文件数量，提示用户
        const removedCount = scrapeFiles.length - currentFiles.length;
        if (newFiles.length > 0 && removedCount > 0) {
          showToast(`已加载 ${newFiles.length} 个新文件，移除 ${removedCount} 个已不存在文件`, 'success');
        } else if (newFiles.length > 0) {
          showToast(`已加载 ${newFiles.length} 个新文件`, 'success');
        } else if (removedCount > 0) {
          showToast(`已移除 ${removedCount} 个已不存在文件`, 'info');
        } else if (mapped.length === 0) {
          showToast('无匹配文件', 'info');
        } else {
          showToast('无新文件', 'info');
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
        if (res.status === 409 && data.conflicts) {
          showToast(`文件冲突: ${data.conflicts.join(', ')} 已存在于目标路径`, 'error');
        } else {
          showToast(data.error || '启动失败', 'error');
        }
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

  const handleShowLogTerminalChange = (value: boolean) => {
    setShowLogTerminal(value);
    fetch(`${API_BASE}/settings/showLog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: String(value) }),
    }).catch(() => {});
  };

  const handleConflictResolutionChange = (value: 'overwrite' | 'skip' | 'cancel') => {
    setConflictResolution(value);
    fetch(`${API_BASE}/settings/conflictResolution`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    }).catch(() => {});
  };

  const handleStatsBarGlassEnabledChange = (value: boolean) => {
    setStatsBarGlassEnabled(value);
    fetch(`${API_BASE}/settings/statsBarGlassEnabled`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: String(value) }),
    }).catch(() => {});
  };

  const handleStatsBarGlassBlurChange = (value: number) => {
    setStatsBarGlassBlur(value);
    fetch(`${API_BASE}/settings/statsBarGlassBlur`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: String(value) }),
    }).catch(() => {});
  };

  const renderPage = () => {
    switch (activePage) {
      case 'tags':
        return <TagManagement isDark={isDark} />;
      case 'settings':
        return <SettingsPage
          workspaceShowFullPath={workspaceShowFullPath}
          onWorkspaceShowFullPathChange={handleWorkspaceShowFullPathChange}
          scrapeShowFullPath={scrapeShowFullPath}
          onScrapeShowFullPathChange={handleScrapeShowFullPathChange}
          thumbnailCount={thumbnailCount}
          onThumbnailCountChange={handleThumbnailCountChange}
          ffmpegAvailable={ffmpegAvailable}
          onFfmpegAvailableChange={setFfmpegAvailable}
          showLogTerminal={showLogTerminal}
          onShowLogTerminalChange={handleShowLogTerminalChange}
          conflictResolution={conflictResolution}
          onConflictResolutionChange={handleConflictResolutionChange}
          statsBarGlassEnabled={statsBarGlassEnabled}
          onStatsBarGlassEnabledChange={handleStatsBarGlassEnabledChange}
          statsBarGlassBlur={statsBarGlassBlur}
          onStatsBarGlassBlurChange={handleStatsBarGlassBlurChange}
        />;
      case 'scrape':
        return (
          <ScrapePage
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
            showLogTerminal={showLogTerminal}
            statsBarGlassEnabled={statsBarGlassEnabled}
            statsBarGlassBlur={statsBarGlassBlur}
            onLoad={handleScrapeLoad}
            onStart={handleScrapeStart}
            onStop={handleScrapeStop}
            onRemove={handleScrapeRemove}
          />
        );
      case 'workspace':
      default:
        return (
          <WorkspacePage
            files={files}
            onLoad={handleLoad}
            onStart={handleStart}
            onStop={handleStop}
            onTagChange={handleTagChange}
            onRemove={handleRemove}
            savedTags={savedTags}
            getTargetPathForTag={getTargetPathForTag}
            wfpPath={wfpPath}
            isRunning={isRunning}
            processedCount={processedCount}
            failedCount={failedIds.size}
            showFullPath={effectiveWorkspaceShowFullPath}
            thumbnailCount={thumbnailCount}
            showLogTerminal={showLogTerminal}
            ffmpegAvailable={ffmpegAvailable}
            isDark={isDark}
            logs={logs}
            connected={connected}
            debugLogEnabled={debugLogEnabled}
            statsBarGlassEnabled={statsBarGlassEnabled}
            statsBarGlassBlur={statsBarGlassBlur}
          />
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
