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
      padding: '10px 12px',
      borderRadius: 'var(--radius-md)',
      border: '1.5px solid var(--accent)',
      background: 'var(--bg-surface-1)',
      minWidth: '180px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <Handle type="source" position={Position.Right} style={{ background: 'var(--accent)', width: 8, height: 8 }} />
      <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--accent)', fontSize: '13px', letterSpacing: '-0.01em' }}>
        📁 {data.label}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>
        <div>Path: {config.watchPath || '未设置'}</div>
        <div>Pattern: {config.filePattern || '*'}</div>
      </div>
    </div>
  );
});

export default WatcherNodeCard;
