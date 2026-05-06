import { memo } from 'react';
import { Handle, Position } from 'reactflow';

interface WatcherNodeProps {
  data: {
    label: string;
    config?: {
      watchPath?: string;
      filePattern?: string;
    };
  };
}

const WatcherNodeCard = memo(({ data }: WatcherNodeProps) => {
  const config = data.config ?? {};
  return (
    <div style={{
      padding: '10px',
      borderRadius: '8px',
      border: '2px solid #4f46e5',
      background: '#eef2ff',
      minWidth: '180px',
    }}>
      <Handle type="source" position={Position.Right} style={{ background: '#4f46e5' }} />
      <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#4f46e5' }}>
        📁 {data.label}
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>
        <div>Path: {config.watchPath || '未设置'}</div>
        <div>Pattern: {config.filePattern || '*'}</div>
      </div>
    </div>
  );
});

export default WatcherNodeCard;
