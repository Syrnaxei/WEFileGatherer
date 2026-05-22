interface SettingsTileProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export default function SettingsTile({ icon, title, description, children, style }: SettingsTileProps) {
  return (
    <div className="settings-tile" style={style}>
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
