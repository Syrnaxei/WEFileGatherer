export type PageKey = 'workspace' | 'tags' | 'settings';

interface SidebarProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  isDark: boolean;
}

const navItems: { key: PageKey; label: string; icon: string }[] = [
  { key: 'workspace', label: '工作台', icon: '⚡' },
  { key: 'tags', label: 'Tag 管理', icon: '🏷' },
  { key: 'settings', label: '设置', icon: '⚙' },
];

export default function Sidebar({ activePage, onNavigate, isDark }: SidebarProps) {
  return (
    <div style={{
      width: '64px',
      background: isDark ? '#0f172a' : '#ffffff',
      borderRight: `1px solid ${isDark ? '#1e293b' : '#e5e7eb'}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: '16px',
      gap: '4px',
      flexShrink: 0,
    }}>
      {navItems.map((item) => {
        const isActive = activePage === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            title={item.label}
            style={{
              width: '48px',
              height: '48px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: isActive ? '#1e40af' : 'transparent',
              color: isActive ? '#e5e7eb' : (isDark ? '#6b7280' : '#9ca3af'),
              fontSize: '18px',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background = isDark ? '#1e293b' : '#f3f4f6';
                (e.currentTarget as HTMLButtonElement).style.color = isDark ? '#9ca3af' : '#6b7280';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = isDark ? '#6b7280' : '#9ca3af';
              }
            }}
          >
            <span>{item.icon}</span>
            <span style={{ fontSize: '9px', lineHeight: 1 }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
