import { useTheme } from '../contexts/ThemeContext';

export default function SettingsPage() {
  const { isDark, setTheme } = useTheme();

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

          <SettingCard title="关于" isDark={isDark}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <AboutRow label="应用名称" value="SVFP" isDark={isDark} />
              <AboutRow label="版本号" value="1.0.0" isDark={isDark} />
              <AboutRow label="构建日期" value="2026-05-06" isDark={isDark} />
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

function SettingRow({ label, children, isDark }: { label: string; children: React.ReactNode; isDark: boolean }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 0',
    }}>
      <span style={{ fontSize: '14px', color: isDark ? '#d1d5db' : '#374151' }}>{label}</span>
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
