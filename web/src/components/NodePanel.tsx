import React from 'react';

const nodeTypes = [
  { type: 'watcher', label: 'Watcher', color: 'var(--accent)', icon: '📁' },
  { type: 'tagger', label: 'Tagger', color: 'var(--success)', icon: '🏷️' },
  { type: 'mover', label: 'Mover', color: 'var(--warning)', icon: '📤' },
];

export default function NodePanel() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside style={{
      width: '200px',
      background: 'var(--bg-surface-1)',
      borderRight: '1px solid var(--border-default)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      <h3 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
        节点面板
      </h3>
      <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
        拖拽节点到画布
      </p>
      {nodeTypes.map((nt) => (
        <div
          key={nt.type}
          draggable
          onDragStart={(e) => onDragStart(e, nt.type)}
          style={{
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            border: `1.5px solid ${nt.color}`,
            background: 'var(--bg-surface-2)',
            cursor: 'grab',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            letterSpacing: '-0.01em',
          }}
        >
          <span>{nt.icon}</span>
          <span style={{ color: nt.color }}>{nt.label}</span>
        </div>
      ))}
    </aside>
  );
}
