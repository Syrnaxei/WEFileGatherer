interface SettingsSubItemProps {
  label: string;
  children?: React.ReactNode;
}

export default function SettingsSubItem({ label, children }: SettingsSubItemProps) {
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
