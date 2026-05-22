interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export default function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <div>
      <div className="settings-section-title">{title}</div>
      <div className="settings-card-body">{children}</div>
    </div>
  );
}
