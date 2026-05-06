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
      padding: '10px',
      borderRadius: '8px',
      border: '2px solid #d97706',
      background: '#fffbeb',
      minWidth: '180px',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: '#d97706' }} />
      <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#d97706' }}>
        📤 {data.label}
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>
        <div style={{ wordBreak: 'break-all' }}>
          {config.targetPathTemplate || '未设置'}
        </div>
        <div>Overwrite: {config.overwrite ? '是' : '否'}</div>
      </div>
    </div>
  );
});

export default MoverNodeCard;
