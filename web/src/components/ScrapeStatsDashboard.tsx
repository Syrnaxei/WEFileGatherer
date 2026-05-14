interface ScrapeStatsDashboardProps {
  total: number;
  processed: number;
  failed: number;
  isDark: boolean;
}

export default function ScrapeStatsDashboard({ total, processed, failed }: ScrapeStatsDashboardProps) {
  const cards = [
    { label: '总计', value: total, color: 'var(--warning)' },
    { label: '已处理', value: processed, color: 'var(--success)' },
    { label: '失败', value: failed, color: 'var(--error)' },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      padding: '14px 20px',
      background: 'var(--bg-surface-1)',
      borderBottom: '1px solid var(--border-default)',
    }}>
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            flex: 1,
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center',
          }}
        >
          <div style={{
            fontSize: '26px',
            fontWeight: 700,
            color: card.color,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}>
            {card.value}
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            marginTop: '5px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}>
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}
