interface ScrapeStatsDashboardProps {
  total: number;
  processed: number;
  failed: number;
  isDark: boolean;
}

export default function ScrapeStatsDashboard({ total, processed, failed, isDark }: ScrapeStatsDashboardProps) {
  const cards = [
    { label: '总计', value: total, color: '#f59e0b' },
    { label: '已处理', value: processed, color: '#10b981' },
    { label: '失败', value: failed, color: '#ef4444' },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      padding: '12px 16px',
      background: isDark ? '#1f2937' : '#ffffff',
      borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
    }}>
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '8px',
            background: card.color + '15',
            border: `1px solid ${card.color}40`,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: card.color }}>
            {card.value}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}