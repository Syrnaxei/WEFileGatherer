import { memo } from 'react';
import { Handle, Position } from 'reactflow';

interface TaggerNodeProps {
  data: {
    label: string;
    config?: {
      rules?: Array<{ type: string; params?: Record<string, string> }>;
    };
  };
}

const TaggerNodeCard = memo(({ data }: TaggerNodeProps) => {
  const rules = data.config?.rules ?? [];
  return (
    <div style={{
      padding: '10px 12px',
      borderRadius: 'var(--radius-md)',
      border: '1.5px solid var(--success)',
      background: 'var(--bg-surface-1)',
      minWidth: '180px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: 'var(--success)', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: 'var(--success)', width: 8, height: 8 }} />
      <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--success)', fontSize: '13px', letterSpacing: '-0.01em' }}>
        🏷️ {data.label}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>
        {rules.length === 0 ? (
          <div>无规则</div>
        ) : (
          rules.map((r, i) => (
            <div key={i}>• {r.type}</div>
          ))
        )}
      </div>
    </div>
  );
});

export default TaggerNodeCard;
