import { memo } from 'react';
import { Handle, Position } from 'reactflow';

interface MoverNodeProps {
  data: {
    label: string;
    config?: {
      targetPathTemplate?: string;
      overwrite?: boolean;
    };
  };
}

const MoverNodeCard = memo(({ data }: MoverNodeProps) => {
  const config = data.config ?? {};
  return (
    <div style={{
      padding: '10px 12px',
      borderRadius: 'var(--radius-md)',
      border: '1.5px solid var(--warning)',
      background: 'var(--bg-surface-1)',
      minWidth: '180px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: 'var(--warning)', width: 8, height: 8 }} />
      <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--warning)', fontSize: '13px', letterSpacing: '-0.01em' }}>
        📤 {data.label}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>
        <div style={{ wordBreak: 'break-all' }}>
          {config.targetPathTemplate || '未设置'}
        </div>
        <div>Overwrite: {config.overwrite ? '是' : '否'}</div>
      </div>
    </div>
  );
});

export default MoverNodeCard;
