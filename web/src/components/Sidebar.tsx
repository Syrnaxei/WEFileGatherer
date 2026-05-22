import { useState, useEffect } from 'react';

export type PageKey = 'workspace' | 'scrape' | 'tags' | 'settings';

interface SidebarProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  isDark: boolean;
}

function WorkspaceIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="m18.492 2.33 3.179 3.179a2.25 2.25 0 0 1 0 3.182l-2.584 2.584A2.25 2.25 0 0 1 21 13.5v5.25A2.25 2.25 0 0 1 18.75 21H5.25A2.25 2.25 0 0 1 3 18.75V5.25A2.25 2.25 0 0 1 5.25 3h5.25a2.25 2.25 0 0 1 2.225 1.915L15.31 2.33a2.25 2.25 0 0 1 3.182 0ZM4.5 18.75c0 .414.336.75.75.75l5.999-.001.001-6.75H4.5v6Zm8.249.749h6.001a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75h-6.001v6.75Zm-2.249-15H5.25a.75.75 0 0 0-.75.75v6h6.75v-6a.75.75 0 0 0-.75-.75Zm2.25 4.81v1.94h1.94l-1.94-1.94Zm3.62-5.918-3.178 3.178a.75.75 0 0 0 0 1.061l3.179 3.179a.75.75 0 0 0 1.06 0l3.18-3.179a.75.75 0 0 0 0-1.06l-3.18-3.18a.75.75 0 0 0-1.06 0Z" />
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.75 2A2.25 2.25 0 0 1 22 4.25v5.462a3.25 3.25 0 0 1-.952 2.298l-8.5 8.503a3.255 3.255 0 0 1-4.597.001L3.489 16.06a3.25 3.25 0 0 1-.003-4.596l8.5-8.51A3.25 3.25 0 0 1 14.284 2h5.465Zm0 1.5h-5.465c-.465 0-.91.185-1.239.513l-8.512 8.523a1.75 1.75 0 0 0 .015 2.462l4.461 4.454a1.755 1.755 0 0 0 2.477 0l8.5-8.503a1.75 1.75 0 0 0 .513-1.237V4.25a.75.75 0 0 0-.75-.75ZM17 5.502a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
    </svg>
  );
}

function SettingsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.012 2.25c.734.008 1.465.093 2.182.253a.75.75 0 0 1 .582.649l.17 1.527a1.384 1.384 0 0 0 1.927 1.116l1.401-.615a.75.75 0 0 1 .85.174 9.792 9.792 0 0 1 2.204 3.792.75.75 0 0 1-.271.825l-1.242.916a1.381 1.381 0 0 0 0 2.226l1.243.915a.75.75 0 0 1 .272.826 9.797 9.797 0 0 1-2.204 3.792.75.75 0 0 1-.848.175l-1.407-.617a1.38 1.38 0 0 0-1.926 1.114l-.169 1.526a.75.75 0 0 1-.572.647 9.518 9.518 0 0 1-4.406 0 .75.75 0 0 1-.572-.647l-.168-1.524a1.382 1.382 0 0 0-1.926-1.11l-1.406.616a.75.75 0 0 1-.849-.175 9.798 9.798 0 0 1-2.204-3.796.75.75 0 0 1 .272-.826l1.243-.916a1.38 1.38 0 0 0 0-2.226l-1.243-.914a.75.75 0 0 1-.271-.826 9.793 9.793 0 0 1 2.204-3.792.75.75 0 0 1 .85-.174l1.4.615a1.387 1.387 0 0 0 1.93-1.118l.17-1.526a.75.75 0 0 1 .583-.65c.717-.159 1.45-.243 2.201-.252Zm0 1.5a9.135 9.135 0 0 0-1.354.117l-.109.977A2.886 2.886 0 0 1 6.525 7.17l-.898-.394a8.293 8.293 0 0 0-1.348 2.317l.798.587a2.881 2.881 0 0 1 0 4.643l-.799.588c.32.842.776 1.626 1.348 2.322l.905-.397a2.882 2.882 0 0 1 4.017 2.318l.11.984c.889.15 1.798.15 2.687 0l.11-.984a2.881 2.881 0 0 1 4.018-2.322l.905.396a8.296 8.296 0 0 0 1.347-2.318l-.798-.588a2.881 2.881 0 0 1 0-4.643l.796-.587a8.293 8.293 0 0 0-1.348-2.317l-.896.393a2.884 2.884 0 0 1-4.023-2.324l-.11-.976a8.988 8.988 0 0 0-1.333-.117ZM12 8.25a3.75 3.75 0 1 1 0 7.5 3.75 3.75 0 0 1 0-7.5Zm0 1.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
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
  const [userPref, setUserPref] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const collapsed = windowWidth <= 800 ? true : userPref;

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const iconSize = 20;
  const activeIndex = navItems.findIndex((item) => item.key === activePage);

  const expandedWidth = 280;
  const collapsedWidth = 60;
  const currentWidth = collapsed ? collapsedWidth : expandedWidth;

  const buttonHeight = 40;
  const marginY = 2;
  const marginX = 10;
  const barHeight = 24;
  const barWidth = 3;
  const buttonRadius = '4px';

  const toggleTotalH = buttonHeight + 2 * marginY;

  const activeBarTop =
    toggleTotalH +
    marginY +
    activeIndex * (buttonHeight + 2 * marginY) +
    (buttonHeight - barHeight) / 2;

  return (
    <nav style={{
      width: `${currentWidth}px`,
      minWidth: `${currentWidth}px`,
      background: 'var(--bg-surface-1)',
      borderRight: '1px solid var(--border-default)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      flexShrink: 0,
      position: 'relative',
      overflow: 'hidden',
      transition: `width var(--duration-normal) var(--ease-out), min-width var(--duration-normal) var(--ease-out)`,
    }}>
      <button
        onClick={() => setUserPref(!userPref)}
        title={collapsed ? '展开侧边栏' : '收起侧边栏'}
        style={{
          width: collapsed ? `${buttonHeight}px` : `calc(100% - ${2 * marginX}px)`,
          height: `${buttonHeight}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          border: 'none',
          borderRadius: '0',
          cursor: 'pointer',
          background: 'transparent',
          color: 'var(--text-muted)',
          padding: 0,
          paddingLeft: collapsed ? '0' : '16px',
          margin: collapsed ? `${marginY}px auto` : `${marginY}px ${marginX}px`,
          flexShrink: 0,
          transition: `color var(--duration-fast) var(--ease-out), width var(--duration-normal) var(--ease-out), margin var(--duration-normal) var(--ease-out), padding var(--duration-normal) var(--ease-out), justify-content var(--duration-normal) var(--ease-out)`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-muted)';
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="20" height="20" fill="currentColor">
          <path d="M64.1 194v89.6h896.1V194H64.1z m0 358.4h896.1v-89.6H64.1v89.6z m0 268.9h896.1v-89.6H64.1v89.6z" />
        </svg>
      </button>

      <div style={{
        position: 'absolute',
        left: '9px',
        top: `${activeBarTop}px`,
        width: `${barWidth}px`,
        height: `${barHeight}px`,
        background: 'var(--accent)',
        borderRadius: '3px',
        transition: `top var(--duration-normal) var(--ease-out)`,
      }} />

      {navItems.map((item) => {
        const isActive = activePage === item.key;
        const IconComponent = iconMap[item.key];

        return (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            title={collapsed ? item.label : undefined}
            style={{
              width: collapsed ? `${buttonHeight}px` : `calc(100% - ${2 * marginX}px)`,
              height: `${buttonHeight}px`,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? '0' : '10px',
              paddingLeft: collapsed ? '0' : '16px',
              paddingRight: '0',
              margin: collapsed ? `${marginY}px auto` : `${marginY}px ${marginX}px`,
              border: 'none',
              borderRadius: buttonRadius,
              cursor: 'pointer',
              background: isActive ? 'var(--bg-surface-3)' : 'transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: isActive ? 600 : 400,
              fontFamily: 'var(--font-ui)',
              flexShrink: 0,
              transition: `background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out), width var(--duration-normal) var(--ease-out), margin var(--duration-normal) var(--ease-out), padding var(--duration-normal) var(--ease-out), justify-content var(--duration-normal) var(--ease-out)`,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
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
            <IconComponent size={iconSize} />
            {!collapsed && (
              <span style={{
                lineHeight: 1,
                letterSpacing: '-0.01em',
                opacity: 1,
                transition: `opacity var(--duration-normal) var(--ease-out)`,
              }}>
                {item.label}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}