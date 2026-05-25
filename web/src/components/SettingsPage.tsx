import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import SelectDropdown from './SelectDropdown';
import InputNumber from './InputNumber';
import { setToastDuration } from './Toast';
import { type ViewMode } from './FileList';
import { FolderLinkIcon } from './FluentIcons';
import {
  PageHeader,
  SettingsSection,
  SettingsTile,
  ExpandableTile,
  SettingsSubItem,
  SettingsSubItemDivider,
  ToggleSwitch,
  FolderSelectButton,
  ThemeIcon,
  ViewIcon,
  ConflictIcon,
  BellIcon,
  TagAutoIcon,
  FolderIcon,
  FolderSearchIcon,
  FolderExportIcon,
  LayersIcon,
  TerminalIcon,
  MonitorIcon,
  CpuIcon,
  GaugeIcon,
  EyeIcon,
  ImageIcon,
  GridIcon,
  FolderCodeIcon,
  InfoIcon,
} from './winui';

const API_BASE = 'http://localhost:3000/api';

interface VersionInfo {
  appName: string;
  appShortName: string;
  version: string;
  buildDate: string;
  githubUrl: string;
}

interface FfmpegInfo {
  available: boolean;
  version?: string;
  path?: string;
  error?: string;
}

interface SettingsPageProps {
  workspaceShowFullPath: boolean;
  onWorkspaceShowFullPathChange: (value: boolean) => void;
  scrapeShowFullPath: boolean;
  onScrapeShowFullPathChange: (value: boolean) => void;
  thumbnailCount: number;
  onThumbnailCountChange: (value: number) => void;
  fileListViewMode: ViewMode;
  onFileListViewModeChange: (value: ViewMode) => void;
  ffmpegAvailable: boolean;
  onFfmpegAvailableChange: (value: boolean) => void;
  showLogTerminal: boolean;
  onShowLogTerminalChange: (value: boolean) => void;
  conflictResolution: 'overwrite' | 'skip' | 'cancel';
  onConflictResolutionChange: (value: 'overwrite' | 'skip' | 'cancel') => void;
}

export default function SettingsPage({
  workspaceShowFullPath,
  onWorkspaceShowFullPathChange,
  scrapeShowFullPath,
  onScrapeShowFullPathChange,
  thumbnailCount,
  onThumbnailCountChange,
  fileListViewMode,
  onFileListViewModeChange,
  //ffmpegAvailable,
  onFfmpegAvailableChange,
  showLogTerminal,
  onShowLogTerminalChange,
  conflictResolution,
  onConflictResolutionChange,
}: SettingsPageProps) {
  const { mode, setMode } = useTheme();
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [autoFillTagName, setAutoFillTagName] = useState(false);
  const [debugLogEnabled, setDebugLogEnabled] = useState(false);
  const [workspaceSourceDir, setWorkspaceSourceDir] = useState('');
  const [scrapeSourceDir, setScrapeSourceDir] = useState('');
  const [scrapeExportDir, setScrapeExportDir] = useState('');
  const [scrapeDepth, setScrapeDepth] = useState(1);
  const [processingMode, setProcessingMode] = useState('parallel');
  const [concurrency, setConcurrency] = useState(5);
  const [toastDuration, setToastDurationState] = useState(5);
  const [ffmpegBinPath, setFfmpegBinPath] = useState('');
  const [ffmpegDetecting, setFfmpegDetecting] = useState(false);
  const [ffmpegDetectResult, setFfmpegDetectResult] = useState<FfmpegInfo | null>(null);
  const [cacheSize, setCacheSize] = useState<number | null>(null);
  const [clearingCache, setClearingCache] = useState(false);
  const [thumbnailQuality, setThumbnailQuality] = useState('medium');

  useEffect(() => {
    fetch(`${API_BASE}/version`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setVersion(data);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/settings/autoFillTagName`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value !== null) {
          setAutoFillTagName(data.value === 'true');
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

    fetch(`${API_BASE}/settings/sourceDir`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value) {
          setWorkspaceSourceDir(data.value);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/settings/scrapeSourceDir`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value) {
          setScrapeSourceDir(data.value);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/settings/scrapeExportDir`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value) {
          setScrapeExportDir(data.value);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/settings/scrapeDepth`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value) {
          setScrapeDepth(parseInt(data.value, 10) || 1);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/settings/processingMode`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value) {
          setProcessingMode(data.value);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/settings/concurrency`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value) {
          const v = parseInt(data.value, 10);
          if (!isNaN(v) && v >= 1 && v <= 5) {
            setConcurrency(v);
          }
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/settings/toastDuration`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value !== null && data.value !== undefined) {
          const v = parseInt(data.value, 10);
          if (!isNaN(v) && v >= 0 && v <= 30) {
            setToastDurationState(v);
            setToastDuration(v);
          }
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/settings/ffmpegBinPath`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value) {
          setFfmpegBinPath(data.value);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/ffmpeg/status`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setFfmpegDetectResult({
            available: data.available,
            version: data.version,
            path: data.path,
          });
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/ffmpeg/cache-size`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCacheSize(data.size);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/settings/thumbnailQuality`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value) {
          setThumbnailQuality(data.value);
        }
      })
      .catch(() => {});
  }, []);

  const handleAutoFillChange = (value: boolean) => {
    setAutoFillTagName(value);
    fetch(`${API_BASE}/settings/autoFillTagName`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: String(value) }),
    }).catch(() => {});
  };

  const handleDebugLogChange = (value: boolean) => {
    setDebugLogEnabled(value);
    fetch(`${API_BASE}/settings/debugLog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: String(value) }),
    }).catch(() => {});
  };

  const saveWorkspaceSourceDir = (value: string) => {
    setWorkspaceSourceDir(value);
    fetch(`${API_BASE}/settings/sourceDir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    }).catch(() => {});
  };

  const handleSelectWorkspaceSource = async () => {
    if (window.electronAPI) {
      const dir = await window.electronAPI.openDirectory();
      if (dir) saveWorkspaceSourceDir(dir);
    }
  };

  const saveScrapeSourceDir = (value: string) => {
    setScrapeSourceDir(value);
    fetch(`${API_BASE}/settings/scrapeSourceDir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    }).catch(() => {});
  };

  const saveScrapeExportDir = (value: string) => {
    setScrapeExportDir(value);
    fetch(`${API_BASE}/settings/scrapeExportDir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    }).catch(() => {});
  };

  const saveScrapeDepth = (value: number) => {
    setScrapeDepth(value);
    fetch(`${API_BASE}/settings/scrapeDepth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: String(value) }),
    }).catch(() => {});
  };

  const saveProcessingMode = (value: string) => {
    setProcessingMode(value);
    fetch(`${API_BASE}/settings/processingMode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    }).catch(() => {});
  };

  const saveConcurrency = (value: number) => {
    setConcurrency(value);
    fetch(`${API_BASE}/settings/concurrency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: String(value) }),
    }).catch(() => {});
  };

  const saveToastDuration = (value: number) => {
    setToastDurationState(value);
    setToastDuration(value);
    fetch(`${API_BASE}/settings/toastDuration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: String(value) }),
    }).catch(() => {});
  };

  const handleSelectScrapeSource = async () => {
    if (window.electronAPI) {
      const dir = await window.electronAPI.openDirectory();
      if (dir) saveScrapeSourceDir(dir);
    }
  };

  const handleSelectScrapeExport = async () => {
    if (window.electronAPI) {
      const dir = await window.electronAPI.openDirectory();
      if (dir) saveScrapeExportDir(dir);
    }
  };

  const handleSelectFfmpegBin = async () => {
    if (window.electronAPI) {
      const dir = await window.electronAPI.openDirectory();
      if (dir) setFfmpegBinPath(dir);
    }
  };

  const handleDetectFfmpeg = async () => {
    if (!ffmpegBinPath.trim()) return;
    setFfmpegDetecting(true);
    setFfmpegDetectResult(null);
    try {
      const res = await fetch(`${API_BASE}/ffmpeg/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ binPath: ffmpegBinPath.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setFfmpegDetectResult({
          available: data.available,
          version: data.version,
          path: data.path,
        });
        onFfmpegAvailableChange(data.available);
      } else {
        setFfmpegDetectResult({
          available: false,
          version: undefined,
          path: undefined,
          error: data.error || '检测失败',
        });
      }
    } catch (err: any) {
      console.error('[FFmpeg detect] fetch error:', err);
      setFfmpegDetectResult({
        available: false,
        version: undefined,
        path: undefined,
        error: `请求失败: ${err.message || '网络错误'}`,
      });
    } finally {
      setFfmpegDetecting(false);
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      const res = await fetch(`${API_BASE}/ffmpeg/clear-cache`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setCacheSize(0);
      }
    } catch {} finally {
      setClearingCache(false);
    }
  };

  const saveThumbnailQuality = (value: string) => {
    setThumbnailQuality(value);
    fetch(`${API_BASE}/settings/thumbnailQuality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    }).catch(() => {});
  };

  const formatCacheSize = (bytes: number | null): string => {
    if (bytes === null || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
      <PageHeader title="设置" description="应用配置与偏好设置" />

      <div style={{
        flex: 1,
        padding: '24px',
        overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}>
          <SettingsSection title="外观">
            <SettingsTile icon={<ThemeIcon />} title="选择外观模式" description="浅色、深色或跟随系统设置">
              <SelectDropdown
                options={[
                  { value: 'light', label: '浅色' },
                  { value: 'dark', label: '深色' },
                  { value: 'system', label: '跟随系统' },
                ]}
                value={mode}
                onChange={(v) => setMode(v as 'light' | 'dark' | 'system')}
              />
            </SettingsTile>
            <SettingsTile icon={<ViewIcon />} title="文件列表视图" description="选择文件列表的默认显示方式">
              <SelectDropdown
                options={[
                  { value: 'list', label: '列表视图' },
                  { value: 'thumbnail', label: '缩略图视图（beta）' },
                ]}
                value={fileListViewMode}
                onChange={(v) => onFileListViewModeChange(v as ViewMode)}
              />
            </SettingsTile>
          </SettingsSection>

          <SettingsSection title='通用设置'>
            <SettingsTile icon={<ConflictIcon />} title="文件冲突处理" description="目标路径存在同名文件时的处理方式">
              <SelectDropdown
                options={[
                  { value: 'overwrite', label: '覆盖' },
                  { value: 'skip', label: '跳过' },
                  { value: 'cancel', label: '取消' },
                ]}
                value={conflictResolution}
                onChange={(v) => onConflictResolutionChange(v as 'overwrite' | 'skip' | 'cancel')}
              />
            </SettingsTile>
            <SettingsTile icon={<BellIcon />} title='通知持续时间' description='设置右下角通知持续显示时间（0-30s）'>
              <InputNumber
                value={toastDuration}
                onChange={saveToastDuration}
                min={0}
                max={30}
                unit="秒"
              />
            </SettingsTile>
            <SettingsTile icon={<TagAutoIcon />} title="Tag 名称自动填充" description="选择目标路径后自动使用文件夹名称填充 Tag 名称">
              <ToggleSwitch checked={autoFillTagName} onChange={handleAutoFillChange} />
            </SettingsTile>
          </SettingsSection>

          <SettingsSection title="工作台设置">
            <ExpandableTile icon={<FolderIcon />} title="源文件目录" description="设置工作台模式下待处理的视频文件所在目录">
              <SettingsSubItem label="文件夹路径">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={workspaceSourceDir}
                    onChange={(e) => saveWorkspaceSourceDir(e.target.value)}
                    placeholder="选择或输入源文件目录..."
                    className="input input-mono"
                    style={{ width: '260px' }}
                  />
                  {window.electronAPI && (
                    <FolderSelectButton onClick={handleSelectWorkspaceSource} text="连接文件夹" icon={<FolderLinkIcon size={18} />} />
                  )}
                </div>
              </SettingsSubItem>
            </ExpandableTile>
          </SettingsSection>

          <SettingsSection title="搜刮设置">
            <ExpandableTile icon={<FolderSearchIcon />} title="搜刮文件夹" description="设置搜刮模式下递归扫描的源目录路径与深度">
              <SettingsSubItem label="源目录">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={scrapeSourceDir}
                    onChange={(e) => saveScrapeSourceDir(e.target.value)}
                    placeholder="选择或输入搜刮源目录..."
                    className="input input-mono"
                    style={{ width: '260px' }}
                  />
                  {window.electronAPI && (
                    <FolderSelectButton onClick={handleSelectScrapeSource} text="连接文件夹" icon={<FolderLinkIcon size={18} />} />
                  )}
                </div>
              </SettingsSubItem>
            </ExpandableTile>
            <ExpandableTile icon={<FolderExportIcon />} title="导出文件夹" description="设置搜刮模式下文件移动的目标输出目录">
              <SettingsSubItem label="目标目录">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={scrapeExportDir}
                    onChange={(e) => saveScrapeExportDir(e.target.value)}
                    placeholder="选择或输入导出目标目录..."
                    className="input input-mono"
                    style={{ width: '260px' }}
                  />
                  {window.electronAPI && (
                    <FolderSelectButton onClick={handleSelectScrapeExport} text="连接文件夹" icon={<FolderLinkIcon size={18} />} />
                  )}
                </div>
              </SettingsSubItem>
            </ExpandableTile>
            <SettingsTile icon={<LayersIcon />} title="搜刮深度" description="递归搜索子文件夹的层级深度（0-4）">
              <InputNumber
                value={scrapeDepth}
                onChange={saveScrapeDepth}
                min={0}
                max={4}
              />
            </SettingsTile>
          </SettingsSection>

          <SettingsSection title="高级设置">
            <SettingsTile icon={<TerminalIcon />} title="调试日志输出" description="开启后显示完整的处理过程日志，关闭后仅显示开始和完成状态">
              <ToggleSwitch checked={debugLogEnabled} onChange={handleDebugLogChange} />
            </SettingsTile>
            <SettingsTile icon={<MonitorIcon />} title="日志显示" description="控制前端页面中日志终端窗口的显示与隐藏">
              <ToggleSwitch checked={showLogTerminal} onChange={onShowLogTerminalChange} />
            </SettingsTile>
            <SettingsTile icon={<CpuIcon />} title="文件处理模式" description="并行模式可同时处理多个文件，FIFO 模式按顺序逐个处理">
              <SelectDropdown
                options={[
                  { value: 'parallel', label: '并行模式' },
                  { value: 'fifo', label: 'FIFO 模式（beta）' },
                ]}
                value={processingMode}
                onChange={saveProcessingMode}
              />
            </SettingsTile>
            {processingMode === 'parallel' && (
              <SettingsTile icon={<GaugeIcon />} title="并发数 (Concurrency)" description="同时处理的文件数量上限（1-5）">
                <InputNumber
                  value={concurrency}
                  onChange={saveConcurrency}
                  min={1}
                  max={5}
                />
              </SettingsTile>
            )}
            <ExpandableTile icon={<EyeIcon />} title="显示完整文件路径" description="控制工作台和搜刮界面是否显示文件的完整绝对路径">
              <SettingsSubItem label="工作台界面">
                <ToggleSwitch checked={workspaceShowFullPath} onChange={onWorkspaceShowFullPathChange} />
              </SettingsSubItem>
              <SettingsSubItemDivider />
              <SettingsSubItem label="搜刮界面">
                <ToggleSwitch checked={scrapeShowFullPath} onChange={onScrapeShowFullPathChange} />
              </SettingsSubItem>
            </ExpandableTile>
          </SettingsSection>

          <SettingsSection title="FFmpeg 设置">
            <SettingsTile icon={<ImageIcon />} title="缩略图质量" description="控制生成缩略图的 JPEG 质量，质量越高文件越大">
              <SelectDropdown
                options={[
                  { value: 'low', label: '低质量' },
                  { value: 'medium', label: '中质量' },
                  { value: 'high', label: '高质量' },
                ]}
                value={thumbnailQuality}
                onChange={(v) => saveThumbnailQuality(v as string)}
              />
            </SettingsTile>
            <SettingsTile icon={<GridIcon />} title="缩略图数量" description="每个视频文件生成的缩略图数量（1-5），数量越多预览越详细">
              <InputNumber
                value={thumbnailCount}
                onChange={onThumbnailCountChange}
                min={1}
                max={5}
                unit="张"
              />
            </SettingsTile>
            <ExpandableTile
              icon={<FolderCodeIcon />}
              title="FFmpeg 文件夹"
              description="配置 FFmpeg 可执行文件路径，用于视频缩略图生成与媒体信息解析"
              badge={ffmpegDetectResult
                ? (ffmpegDetectResult.available
                  ? <span className="badge badge-success">已连接</span>
                  : <span className="badge badge-error">未连接</span>)
                : undefined}
            >
              <SettingsSubItem label="Bin 路径">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={ffmpegBinPath}
                    onChange={(e) => {
                      setFfmpegBinPath(e.target.value);
                    }}
                    placeholder="如未自动获取请填写bin文件夹路径"
                    className="input input-mono"
                    style={{ width: '240px' }}
                  />
                  {window.electronAPI && (
                    <FolderSelectButton onClick={handleSelectFfmpegBin} text="连接文件夹" icon={<FolderLinkIcon size={18} />} />
                  )}
                  <button
                    onClick={handleDetectFfmpeg}
                    disabled={!ffmpegBinPath.trim() || ffmpegDetecting}
                    className="btn btn-primary"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    {ffmpegDetecting ? '检测中...' : '检测'}
                  </button>
                </div>
              </SettingsSubItem>

              {ffmpegDetectResult && ffmpegDetectResult.available && (
                <>
                  <SettingsSubItemDivider />
                  <div style={{
                    padding: '10px 16px 10px 52px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>版本</span>
                      <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{ffmpegDetectResult.version || '未知'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', flexShrink: 0 }}>路径</span>
                      <span style={{
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-secondary)',
                        maxWidth: '280px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginLeft: '12px',
                      }}>
                        {ffmpegDetectResult.path || '未知'}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {ffmpegDetectResult && !ffmpegDetectResult.available && (
                <>
                  <SettingsSubItemDivider />
                  <div style={{
                    padding: '10px 16px 10px 52px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                      {ffmpegDetectResult.error
                        ? ffmpegDetectResult.error
                        : '在指定路径中未找到 ffmpeg.exe，请确认路径是否正确。'}
                    </p>
                  </div>
                </>
              )}

              {!ffmpegDetectResult && (
                <p style={{ margin: 0, padding: '8px 16px 4px 52px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  请输入 ffmpeg.exe 所在的文件夹路径，然后点击"检测"按钮验证。
                </p>
              )}
            </ExpandableTile>

            <SettingsTile icon={<ImageIcon />} title="缩略图缓存" description="清除已生成的缩略图缓存文件">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                }}>
                  {formatCacheSize(cacheSize)}
                </span>
                <button
                  onClick={handleClearCache}
                  disabled={clearingCache || cacheSize === 0}
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                >
                  {clearingCache ? '清除中...' : '清除缓存'}
                </button>
              </div>
            </SettingsTile>
          </SettingsSection>

          <SettingsSection title="关于">
            <ExpandableTile icon={<InfoIcon />} title="WE File Gatherer" description="Made with love by Syrnaxei" badge={version?.version ?? '-'}>
              <SettingsSubItem label="版本号">
                <span className="settings-sub-item-value">{version?.version ?? '-'}</span>
              </SettingsSubItem>
              <SettingsSubItemDivider />
              <SettingsSubItem label="Github">
                <span className="settings-sub-item-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{version?.githubUrl ?? '-'}</span>
              </SettingsSubItem>
              <SettingsSubItemDivider />
              <SettingsSubItem label="构建日期">
                <span className="settings-sub-item-value">{version?.buildDate ?? '-'}</span>
              </SettingsSubItem>
            </ExpandableTile>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}
