interface StatsDashboardProps {
  total: number;
  tagged: number;
  untagged: number;
  processed: number;
  invalid: number;
  isDark: boolean;
}

export default function StatsDashboard({ total, tagged, untagged, processed, invalid }: StatsDashboardProps) {
  const cards = [
    { label: '待处理', value: untagged, color: 'var(--accent)' },
    { label: '已标记', value: tagged, color: 'var(--info)' },
    { label: '总计', value: total, color: 'var(--warning)' },
    { label: '已处理', value: processed, color: 'var(--success)' },
    { label: '失败', value: invalid, color: 'var(--error)' },
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
            transition: 'border-color 150ms ease',
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
