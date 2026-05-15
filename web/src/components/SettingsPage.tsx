import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import SelectDropdown from './SelectDropdown';
import { setToastDuration } from './Toast';

const API_BASE = 'http://localhost:3000/api';

interface VersionInfo {
  appName: string;
  appShortName: string;
  version: string;
  buildDate: string;
  githubUrl: string;
}

interface SettingsPageProps {
  showFullPathOptions: boolean;
  onShowFullPathOptionsChange: (value: boolean) => void;
  workspaceShowFullPath: boolean;
  onWorkspaceShowFullPathChange: (value: boolean) => void;
  scrapeShowFullPath: boolean;
  onScrapeShowFullPathChange: (value: boolean) => void;
}

export default function SettingsPage({
  showFullPathOptions,
  onShowFullPathOptionsChange,
  workspaceShowFullPath,
  onWorkspaceShowFullPathChange,
  scrapeShowFullPath,
  onScrapeShowFullPathChange,
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
          maxWidth: '640px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <SettingCard title="外观">
            <SettingRow label="选择外观模式" description="浅色、深色或跟随系统设置">
              <SelectDropdown
                options={[
                  { value: 'light', label: '浅色' },
                  { value: 'dark', label: '深色' },
                  { value: 'system', label: '跟随系统' },
                ]}
                value={mode}
                onChange={(v) => setMode(v as 'light' | 'dark' | 'system')}
              />
            </SettingRow>
          </SettingCard>

          <SettingCard title='通用设置'>
            <SettingRow label='通知持续时间' description='设置右下角通知持续显示时间（0-30s）'>
              <input
                type="number"
                min={0}
                max={30}
                value={toastDuration}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= 0 && v <= 30) saveToastDuration(v);
                }}
                className="input"
                style={{ width: '64px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
              />
            </SettingRow>
          </SettingCard>

          <SettingCard title="Tag 管理">
            <SettingRow label="Tag 名称自动填充" description="选择目标路径后自动使用文件夹名称填充 Tag 名称">
              <ToggleSwitch checked={autoFillTagName} onChange={handleAutoFillChange} />
            </SettingRow>
          </SettingCard>

          <SettingCard title="工作台设置">
            <div>
              <label style={labelStyle}>源文件目录</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={workspaceSourceDir}
                  onChange={(e) => saveWorkspaceSourceDir(e.target.value)}
                  placeholder="选择或输入源文件目录..."
                  className="input input-mono"
                />
                {window.electronAPI && (
                  <button onClick={handleSelectWorkspaceSource} className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '12px' }}>选择...</button>
                )}
              </div>
            </div>
          </SettingCard>

          <SettingCard title="搜刮设置">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>搜刮文件夹</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={scrapeSourceDir}
                    onChange={(e) => saveScrapeSourceDir(e.target.value)}
                    placeholder="选择或输入搜刮源目录..."
                    className="input input-mono"
                  />
                  {window.electronAPI && (
                    <button onClick={handleSelectScrapeSource} className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '12px' }}>选择...</button>
                  )}
                </div>
              </div>
              <div>
                <label style={labelStyle}>导出文件夹</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={scrapeExportDir}
                    onChange={(e) => saveScrapeExportDir(e.target.value)}
                    placeholder="选择或输入导出目标目录..."
                    className="input input-mono"
                  />
                  {window.electronAPI && (
                    <button onClick={handleSelectScrapeExport} className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '12px' }}>选择...</button>
                  )}
                </div>
              </div>
              <SettingRow label="搜刮深度" description="递归搜索子文件夹的层级深度（0-4）">
                <input
                  type="number"
                  min={0}
                  max={4}
                  value={scrapeDepth}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v >= 0 && v <= 4) saveScrapeDepth(v);
                  }}
                  className="input"
                  style={{ width: '64px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                />
              </SettingRow>
            </div>
          </SettingCard>

          <SettingCard title="高级设置">
            <SettingRow label="调试日志输出" description="开启后显示完整的处理过程日志，关闭后仅显示开始和完成状态">
              <ToggleSwitch checked={debugLogEnabled} onChange={handleDebugLogChange} />
            </SettingRow>
            <SettingRow label="文件处理模式" description="并行模式可同时处理多个文件，FIFO 模式按顺序逐个处理">
              <SelectDropdown
                options={[
                  { value: 'parallel', label: '并行模式' },
                  { value: 'fifo', label: 'FIFO 模式' },
                ]}
                value={processingMode}
                onChange={saveProcessingMode}
              />
            </SettingRow>
            {processingMode === 'parallel' && (
              <div style={{
                paddingLeft: '16px',
                borderLeft: '2px solid var(--border-default)',
                marginTop: '6px',
                animation: 'fade-in 200ms ease',
              }}>
                <SettingRow label="并发数 (Concurrency)" description="同时处理的文件数量上限（1-5）">
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={concurrency}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v) && v >= 1 && v <= 5) saveConcurrency(v);
                    }}
                    className="input"
                    style={{ width: '64px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                  />
                </SettingRow>
              </div>
            )}
            <SettingRow label="显示完整文件路径" description="开启后可分别控制工作台和搜刮界面的路径显示方式">
              <ToggleSwitch checked={showFullPathOptions} onChange={onShowFullPathOptionsChange} />
            </SettingRow>
            {showFullPathOptions && (
              <div style={{
                paddingLeft: '16px',
                borderLeft: '2px solid var(--border-default)',
                marginTop: '6px',
              }}>
                <SettingRow label="工作台界面" description="关闭时文件路径将相对于源文件目录显示">
                  <ToggleSwitch checked={workspaceShowFullPath} onChange={onWorkspaceShowFullPathChange} />
                </SettingRow>
                <SettingRow label="搜刮界面" description="关闭时文件路径将相对于搜刮目录显示">
                  <ToggleSwitch checked={scrapeShowFullPath} onChange={onScrapeShowFullPathChange} />
                </SettingRow>
              </div>
            )}
          </SettingCard>

          <SettingCard title="关于">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <AboutRow label="应用名称" value={version?.appName ?? 'SVFP'} />
              <AboutRow label="版本号" value={version?.version ?? '-'} />
              <AboutRow label="Github" value={version?.githubUrl ?? '-'} />
              <AboutRow label="构建日期" value={version?.buildDate ?? '-'} />
            </div>
          </SettingCard>
        </div>
      </div>
    </div>
  );
}

function SettingCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="card-header">{title}</div>
      <div className="card-body">{children}</div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 0',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{label}</span>
        {description && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '-0.01em' }}>{description}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function AboutRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 0',
    }}>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, letterSpacing: '-0.01em' }}>{value}</span>
    </div>
  );
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

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--text-primary)',
  display: 'block',
  marginBottom: '5px',
  letterSpacing: '-0.01em',
};
