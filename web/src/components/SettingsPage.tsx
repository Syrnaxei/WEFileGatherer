import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const API_BASE = 'http://localhost:3000/api';

interface VersionInfo {
  appName: string;
  appShortName: string;
  version: string;
  buildDate: string;
  githubUrl: string;
}

export default function SettingsPage() {
  const { isDark, setTheme } = useTheme();
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [autoFillTagName, setAutoFillTagName] = useState(false);
  const [debugLogEnabled, setDebugLogEnabled] = useState(false);
  const [scrapeSourceDir, setScrapeSourceDir] = useState('');
  const [scrapeExportDir, setScrapeExportDir] = useState('');
  const [scrapeDepth, setScrapeDepth] = useState(1);

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
      background: isDark ? '#111827' : '#f3f4f6',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px 24px',
        background: isDark ? '#1f2937' : '#ffffff',
        borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
      }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: isDark ? '#e5e7eb' : '#111827' }}>
          设置
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: isDark ? '#6b7280' : '#6b7280' }}>
          应用配置与偏好设置
        </p>
      </div>

      <div style={{
        flex: 1,
        padding: '24px',
        overflowY: 'auto',
      }}>
        <div style={{
          maxWidth: '600px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <SettingCard title="外观" isDark={isDark}>
            <SettingRow label="夜间模式" isDark={isDark}>
              <ToggleSwitch checked={isDark} onChange={(v) => setTheme(v ? 'dark' : 'light')} />
            </SettingRow>
          </SettingCard>

          <SettingCard title="Tag 管理" isDark={isDark}>
            <SettingRow label="Tag 名称自动填充" description="选择目标路径后自动使用文件夹名称填充 Tag 名称" isDark={isDark}>
              <ToggleSwitch checked={autoFillTagName} onChange={handleAutoFillChange} />
            </SettingRow>
          </SettingCard>

          <SettingCard title="搜刮设置" isDark={isDark}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', color: isDark ? '#d1d5db' : '#374151', display: 'block', marginBottom: '4px' }}>搜刮文件夹</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={scrapeSourceDir}
                    onChange={(e) => saveScrapeSourceDir(e.target.value)}
                    placeholder="选择或输入搜刮源目录..."
                    style={isDark ? inputStyleDark : inputStyleLight}
                  />
                  {window.electronAPI && (
                    <button onClick={handleSelectScrapeSource} style={smallBtnStyle}>选择...</button>
                  )}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: isDark ? '#d1d5db' : '#374151', display: 'block', marginBottom: '4px' }}>导出文件夹</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={scrapeExportDir}
                    onChange={(e) => saveScrapeExportDir(e.target.value)}
                    placeholder="选择或输入导出目标目录..."
                    style={isDark ? inputStyleDark : inputStyleLight}
                  />
                  {window.electronAPI && (
                    <button onClick={handleSelectScrapeExport} style={smallBtnStyle}>选择...</button>
                  )}
                </div>
              </div>
              <SettingRow label="搜刮深度" description="递归搜索子文件夹的层级深度（0-4）" isDark={isDark}>
                <input
                  type="number"
                  min={0}
                  max={4}
                  value={scrapeDepth}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v >= 0 && v <= 4) saveScrapeDepth(v);
                  }}
                  style={{
                    width: '60px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
                    background: isDark ? '#374151' : '#f9fafb',
                    color: isDark ? '#e5e7eb' : '#111827',
                    fontSize: '14px',
                    textAlign: 'center',
                  }}
                />
              </SettingRow>
            </div>
          </SettingCard>

          <SettingCard title="高级设置" isDark={isDark}>
            <SettingRow label="调试日志输出" description="开启后显示完整的处理过程日志，关闭后仅显示开始和完成状态，重启生效" isDark={isDark}>
              <ToggleSwitch checked={debugLogEnabled} onChange={handleDebugLogChange} />
            </SettingRow>
          </SettingCard>

          <SettingCard title="关于" isDark={isDark}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <AboutRow label="应用名称" value={version?.appName ?? 'SVFP'} isDark={isDark} />
              <AboutRow label="版本号" value={version?.version ?? '-'} isDark={isDark} />
              <AboutRow label="Github" value={version?.githubUrl ?? '-'} isDark={isDark} />
              <AboutRow label="构建日期" value={version?.buildDate ?? '-'} isDark={isDark} />
            </div>
          </SettingCard>
        </div>
      </div>
    </div>
  );
}

function SettingCard({ title, children, isDark }: { title: string; children: React.ReactNode; isDark: boolean }) {
  return (
    <div style={{
      background: isDark ? '#1f2937' : '#ffffff',
      borderRadius: '8px',
      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
        fontSize: '14px',
        fontWeight: 600,
        color: isDark ? '#e5e7eb' : '#111827',
      }}>
        {title}
      </div>
      <div style={{ padding: '12px 16px' }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, description, children, isDark }: { label: string; description?: string; children: React.ReactNode; isDark: boolean }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 0',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontSize: '14px', color: isDark ? '#d1d5db' : '#374151' }}>{label}</span>
        {description && (
          <span style={{ fontSize: '12px', color: isDark ? '#6b7280' : '#9ca3af' }}>{description}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function AboutRow({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 0',
    }}>
      <span style={{ fontSize: '14px', color: isDark ? '#9ca3af' : '#6b7280' }}>{label}</span>
      <span style={{ fontSize: '14px', color: isDark ? '#e5e7eb' : '#111827', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        background: checked ? '#4f46e5' : '#4b5563',
        position: 'relative',
        transition: 'background 0.2s',
        padding: 0,
      }}
    >
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: '#fff',
        position: 'absolute',
        top: '2px',
        left: checked ? '22px' : '2px',
        transition: 'left 0.2s',
      }} />
    </button>
  );
}

const inputStyleDark: React.CSSProperties = {
  flex: 1,
  background: '#374151',
  border: '1px solid #4b5563',
  borderRadius: '4px',
  padding: '6px 10px',
  color: '#e5e7eb',
  fontSize: '13px',
};

const inputStyleLight: React.CSSProperties = {
  flex: 1,
  background: '#f9fafb',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  padding: '6px 10px',
  color: '#111827',
  fontSize: '13px',
};

const smallBtnStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '4px',
  border: 'none',
  color: 'white',
  fontSize: '13px',
  cursor: 'pointer',
  background: '#4b5563',
  whiteSpace: 'nowrap',
};
