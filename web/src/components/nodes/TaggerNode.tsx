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
      padding: '10px',
      borderRadius: '8px',
      border: '2px solid #059669',
      background: '#ecfdf5',
      minWidth: '180px',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: '#059669' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#059669' }} />
      <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#059669' }}>
        🏷️ {data.label}
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>
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
