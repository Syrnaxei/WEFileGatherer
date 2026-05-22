interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div style={{
      padding: '20px 24px',
      background: 'var(--settings-header-bg)',
    }}>
      <h2 style={{
        margin: 0,
        fontSize: '18px',
        fontWeight: 700,
        color: 'var(--text-primary)',
        letterSpacing: '-0.02em',
      }}>
        {title}
      </h2>
      {description && (
        <p style={{
          margin: '4px 0 0',
          fontSize: '12px',
          color: 'var(--text-muted)',
          letterSpacing: '-0.01em',
        }}>
          {description}
        </p>
      )}
    </div>
  );
}
