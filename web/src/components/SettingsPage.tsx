import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import SelectDropdown from './SelectDropdown';
import InputNumber from './InputNumber';
import { setToastDuration } from './Toast';
import { type ViewMode } from './FileList';

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
      background: 'var(--bg-base)',
      overflow: 'hidden',
    }}>
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
          设置
        </h2>
        <p style={{
          margin: '4px 0 0',
          fontSize: '12px',
          color: 'var(--text-muted)',
          letterSpacing: '-0.01em',
        }}>
          应用配置与偏好设置
        </p>
      </div>

      <div style={{
        flex: 1,
        padding: '24px',
        overflowY: 'auto',
      }}>
        <div style={{
          maxWidth: '680px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}>
          <SettingSection title="外观">
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
          </SettingSection>

          <SettingSection title='通用设置'>
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
          </SettingSection>

          <SettingSection title="工作台设置">
            <ExpandableSettingsTile icon={<FolderIcon />} title="源文件目录" description="设置工作台模式下待处理的视频文件所在目录">
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
                    <button onClick={handleSelectWorkspaceSource} className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '12px' }}>选择...</button>
                  )}
                </div>
              </SettingsSubItem>
            </ExpandableSettingsTile>
          </SettingSection>

          <SettingSection title="搜刮设置">
            <ExpandableSettingsTile icon={<FolderSearchIcon />} title="搜刮文件夹" description="设置搜刮模式下递归扫描的源目录路径与深度">
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
                    <button onClick={handleSelectScrapeSource} className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '12px' }}>选择...</button>
                  )}
                </div>
              </SettingsSubItem>
            </ExpandableSettingsTile>
            <ExpandableSettingsTile icon={<FolderExportIcon />} title="导出文件夹" description="设置搜刮模式下文件移动的目标输出目录">
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
                    <button onClick={handleSelectScrapeExport} className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '12px' }}>选择...</button>
                  )}
                </div>
              </SettingsSubItem>
            </ExpandableSettingsTile>
            <SettingsTile icon={<LayersIcon />} title="搜刮深度" description="递归搜索子文件夹的层级深度（0-4）">
              <InputNumber
                value={scrapeDepth}
                onChange={saveScrapeDepth}
                min={0}
                max={4}
              />
            </SettingsTile>
          </SettingSection>

          <SettingSection title="高级设置">
            <SettingsTile icon={<TerminalIcon />} title="调试日志输出" description="开启后显示完整的处理过程日志，关闭后仅显示开始和完成状态">
              <ToggleSwitch checked={debugLogEnabled} onChange={handleDebugLogChange} />
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
            <ExpandableSettingsTile icon={<EyeIcon />} title="显示完整文件路径" description="控制工作台和搜刮界面是否显示文件的完整绝对路径">
              <SettingsSubItem label="工作台界面">
                <ToggleSwitch checked={workspaceShowFullPath} onChange={onWorkspaceShowFullPathChange} />
              </SettingsSubItem>
              <SettingsSubItemDivider />
              <SettingsSubItem label="搜刮界面">
                <ToggleSwitch checked={scrapeShowFullPath} onChange={onScrapeShowFullPathChange} />
              </SettingsSubItem>
            </ExpandableSettingsTile>
          </SettingSection>

          <SettingSection title="FFmpeg 设置">
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
            <ExpandableSettingsTile
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
                    <button onClick={handleSelectFfmpegBin} className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '12px' }}>选择...</button>
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
            </ExpandableSettingsTile>

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
          </SettingSection>

          <SettingSection title="关于">
            <ExpandableSettingsTile icon={<InfoIcon />} title="SVFP文件处理" description="当前软件版本信息与项目仓库地址" badge={version?.version ?? '-'}>
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
            </ExpandableSettingsTile>
          </SettingSection>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 图标组件 — 每个设置项行块使用独立的 SVG 图标
// ═══════════════════════════════════════════════════

function IconWrapper({ children, size = 24 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function ThemeIcon() {
  return <IconWrapper>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a10 10 0 0 1 0 20" />
    <path d="M12 2a10 10 0 0 0 0 20" />
  </IconWrapper>;
}

function ViewIcon() {
  return <IconWrapper>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </IconWrapper>;
}

function BellIcon() {
  return <IconWrapper>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </IconWrapper>;
}

function TagAutoIcon() {
  return <IconWrapper>
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
    <path d="M7 7h.01" />
  </IconWrapper>;
}

function FolderIcon() {
  return <IconWrapper>
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
  </IconWrapper>;
}

function FolderSearchIcon() {
  return <IconWrapper>
    <circle cx="17" cy="17" r="3" />
    <path d="M10.7 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v4.1" />
    <path d="m21 21-1.5-1.5" />
  </IconWrapper>;
}

function FolderExportIcon() {
  return <IconWrapper>
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    <path d="M12 10v6" />
    <path d="m9 13 3-3 3 3" />
  </IconWrapper>;
}

function LayersIcon() {
  return <IconWrapper>
    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
    <line x1="12" y1="22" x2="12" y2="15.5" />
    <polyline points="22 8.5 12 15.5 2 8.5" />
  </IconWrapper>;
}

function TerminalIcon() {
  return <IconWrapper>
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </IconWrapper>;
}

function CpuIcon() {
  return <IconWrapper>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="14" x2="4" y2="14" />
  </IconWrapper>;
}

function GaugeIcon() {
  return <IconWrapper>
    <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10" />
    <path d="m12 12 4-7" />
    <path d="M3 18h18" />
  </IconWrapper>;
}

function EyeIcon() {
  return <IconWrapper>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </IconWrapper>;
}

function ImageIcon() {
  return <IconWrapper>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="m21 15-5-5L5 21" />
  </IconWrapper>;
}

function GridIcon() {
  return <IconWrapper>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </IconWrapper>;
}

function FolderCodeIcon() {
  return <IconWrapper>
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    <polyline points="10 13 7 16 10 19" />
    <polyline points="17 13 14 16 17 19" />
  </IconWrapper>;
}

function InfoIcon() {
  return <IconWrapper>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </IconWrapper>;
}

// ═══════════════════════════════════════════════════
// 辅助组件 — 设置分组与行块
// ═══════════════════════════════════════════════════

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="settings-section-title">{title}</div>
      <div className="settings-card-body">{children}</div>
    </div>
  );
}

function SettingsTile({ icon, title, description, children }: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="settings-tile">
      <div className="settings-tile-left">
        <div className="settings-tile-icon">{icon}</div>
        <div className="settings-tile-info">
          <div className="settings-tile-title">{title}</div>
          {description && <div className="settings-tile-desc">{description}</div>}
        </div>
      </div>
      <div className="settings-tile-right">{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 可展开行块 — 容纳两层及以上设置项
// ═══════════════════════════════════════════════════

function ExpandableSettingsTile({ icon, title, description, badge, defaultExpanded = false, children }: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={`settings-expandable-tile${expanded ? ' expanded' : ''}`}>
      <div className="settings-expandable-header" onClick={() => setExpanded(!expanded)}>
        <div className="settings-tile-left">
          <div className="settings-tile-icon">{icon}</div>
          <div className="settings-tile-info">
            <div className="settings-tile-title">{title}</div>
            {description && <div className="settings-tile-desc">{description}</div>}
          </div>
        </div>
        <div className="settings-expandable-header-right">
          {badge}
          <div className={`settings-expand-arrow${expanded ? ' expanded' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 16 16">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
      <div className="settings-expandable-body">
        <div className="settings-expandable-body-inner">
          {children}
        </div>
      </div>
    </div>
  );
}

function SettingsSubItem({ label, children }: {
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="settings-sub-item">
      <span className="settings-sub-item-label">{label}</span>
      {children ? (
        <div className="settings-sub-item-right">{children}</div>
      ) : (
        <span className="settings-sub-item-value">-</span>
      )}
    </div>
  );
}

function SettingsSubItemDivider() {
  return <div className="settings-sub-item-divider" />;
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: '46px',
        height: '26px',
        borderRadius: '13px',
        border: 'none',
        cursor: 'pointer',
        background: checked ? 'var(--accent)' : 'var(--bg-surface-3)',
        position: 'relative',
        transition: 'background 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        padding: 0,
        flexShrink: 0,
      }}
    >
      <div style={{
        width: '22px',
        height: '22px',
        borderRadius: '50%',
        background: '#fff',
        position: 'absolute',
        top: '2px',
        left: checked ? '22px' : '2px',
        transition: 'left 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}
