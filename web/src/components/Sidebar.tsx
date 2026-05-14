export type PageKey = 'workspace' | 'scrape' | 'tags' | 'settings';

interface SidebarProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  isDark: boolean;
}

function WorkspaceIcon({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width={size} height={size} fill="currentColor">
      <path d="M910.763 369.664L774.997 505.43a85.333 85.333 0 0 1-120.661 0L518.57 369.664a85.333 85.333 0 0 1 0-120.661l135.766-135.766a85.333 85.333 0 0 1 120.661 0l135.766 135.766a85.333 85.333 0 0 1 0 120.661zM362.667 938.667H170.667a85.333 85.333 0 0 1-85.334-85.334v-192a85.333 85.333 0 0 1 85.334-85.333h192a85.333 85.333 0 0 1 85.333 85.333v192a85.333 85.333 0 0 1-85.333 85.334zm0-448H170.667a85.333 85.333 0 0 1-85.334-85.334v-192a85.333 85.333 0 0 1 85.334-85.333h192a85.333 85.333 0 0 1 85.333 85.333v192a85.333 85.333 0 0 1-85.333 85.334zm256 85.333h192a85.333 85.333 0 0 1 85.333 85.333v192a85.333 85.333 0 0 1-85.333 85.334h-192a85.333 85.333 0 0 1-85.334-85.334v-192a85.333 85.333 0 0 1 85.334-85.333z" />
    </svg>
  );
}

function ScrapeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width={size} height={size} fill="currentColor">
      <path d="M823.893 771.84l-162.56-162.56a267.093 267.093 0 1 0-64 57.6l166.4 165.12a42.667 42.667 0 0 0 60.16 0 42.667 42.667 0 0 0 0-60.16zM264.533 445.013a188.587 188.587 0 1 1 188.587 188.587 189.013 189.013 0 0 1-188.587-188.587z" />
    </svg>
  );
}

function TagIcon({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width={size} height={size} fill="currentColor">
      <path d="M373.333 172.8l388.267 388.267c2.133 2.133 4.267 6.4 4.267 10.667s-2.133 6.4-4.267 10.667l-264.533 264.533c-2.133 2.133-6.4 4.267-10.667 4.267s-6.4-2.133-10.667-4.267L87.467 458.667V187.733c0-4.267 2.133-6.4 4.267-10.667s6.4-4.267 10.667-4.267h270.933zm170.667 0l388.267 388.267c2.133 2.133 4.267 6.4 4.267 10.667s-2.133 6.4-4.267 10.667l-264.533 264.533c-2.133 2.133-6.4 4.267-10.667 4.267s-6.4-2.133-10.667-4.267l-32-32 241.067-243.2L456.533 172.8H544zm-273.067 100.267c-10.667-10.667-25.6-17.067-40.533-17.067s-29.867 6.4-40.533 17.067-17.067 25.6-17.067 40.533 6.4 29.867 17.067 40.533 25.6 17.067 40.533 17.067a58.283 58.283 0 0 0 57.6-57.6c0-14.933-6.4-29.867-17.067-40.533z" />
    </svg>
  );
}

function SettingsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1025 1024" width={size} height={size} fill="currentColor">
      <path d="M1013.464 409.088c0-10.88-7.04-18.24-17.664-21.76-53.44-10.944-96.192-44.224-124.48-95.68a195.776 195.776 0 0 1-17.728-161.728c3.584-7.296 0-18.24-7.04-25.6A470.656 470.656 0 0 0 679.256 1.472c-7.04-3.648-17.664 0-24.768 7.296C618.776 52.864 565.4 74.88 512.024 74.88c-53.44 0-103.296-25.6-142.528-66.112-7.04-7.296-14.144-10.88-24.768-7.296-60.48 25.6-117.44 58.816-167.296 102.976-7.04 3.648-10.56 14.592-7.04 25.6 14.08 55.04 10.56 110.208-17.664 161.664C127.96 339.456 81.624 372.672 28.184 387.2a37.12 37.12 0 0 0-17.664 21.76 508.8 508.8 0 0 0 0 205.888c0 10.88 7.104 18.304 17.728 21.824 53.44 10.88 96.192 44.16 124.48 95.68 29.056 48.448 35.52 107.776 17.728 161.664-3.584 7.296 0 18.24 7.04 25.6a470.528 470.528 0 0 0 167.296 102.912h7.04a26.56 26.56 0 0 0 17.728-7.296c35.712-44.16 89.088-66.048 142.464-66.048 53.44 0 103.296 25.536 142.528 66.048 7.04 7.296 14.144 10.88 24.768 7.296 60.48-25.6 117.44-58.816 167.296-102.976 7.04-3.648 10.56-14.592 7.04-25.536-14.08-55.104-10.56-110.208 17.664-161.664 24.768-47.808 71.104-81.088 124.544-95.68a37.12 37.12 0 0 0 17.664-21.76 508.736 508.736 0 0 0 0-205.888zM512.024 768c-139.264 0-256-114.688-256-256s112.256-256 256-256c139.264 0 256 114.688 256 256s-112.256 256-256 256z" />
      <path d="M512.024 384a128 128 0 1 0 128 128c0-70.208-57.984-128-128-128z" />
    </svg>
  );
}

const iconMap: Record<PageKey, React.FC<{ size?: number }>> = {
  workspace: WorkspaceIcon,
  scrape: ScrapeIcon,
  tags: TagIcon,
  settings: SettingsIcon,
};

const navItems: { key: PageKey; label: string }[] = [
  { key: 'workspace', label: '工作台' },
  { key: 'scrape', label: '搜刮' },
  { key: 'tags', label: 'Tag' },
  { key: 'settings', label: '设置' },
];

export default function Sidebar({ activePage, onNavigate, isDark: _isDark }: SidebarProps) {
  const iconSize = 20;

  return (
    <nav style={{
      width: '60px',
      minWidth: '60px',
      background: 'var(--bg-surface-1)',
      borderRight: '1px solid var(--border-default)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: '16px',
      gap: '2px',
      flexShrink: 0,
    }}>
      {navItems.map((item) => {
        const isActive = activePage === item.key;
        const IconComponent = iconMap[item.key];

        return (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            title={item.label}
            style={{
              width: '42px',
              height: '42px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              background: isActive ? 'var(--accent-muted)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '10px',
              fontWeight: isActive ? 600 : 400,
              fontFamily: 'var(--font-ui)',
              transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                const el = e.currentTarget;
                el.style.background = 'var(--bg-surface-3)';
                el.style.color = 'var(--text-secondary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                const el = e.currentTarget;
                el.style.background = 'transparent';
                el.style.color = 'var(--text-muted)';
              }
            }}
          >
            {isActive && (
              <div style={{
                position: 'absolute',
                left: '-10px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '3px',
                height: '20px',
                background: 'var(--accent)',
                borderRadius: '0 3px 3px 0',
              }} />
            )}
            <IconComponent size={item.key === 'settings' ? 19 : iconSize} />
            <span style={{ lineHeight: 1, letterSpacing: '-0.01em' }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
