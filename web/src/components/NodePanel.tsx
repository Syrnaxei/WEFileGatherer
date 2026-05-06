import React from 'react';

const nodeTypes = [
  { type: 'watcher', label: 'Watcher', color: '#4f46e5', icon: '📁' },
  { type: 'tagger', label: 'Tagger', color: '#059669', icon: '🏷️' },
  { type: 'mover', label: 'Mover', color: '#d97706', icon: '📤' },
];

export default function NodePanel() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside style={{
      width: '200px',
      background: '#f9fafb',
      borderRight: '1px solid #e5e7eb',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>
        节点面板
      </h3>
      <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#6b7280' }}>
        拖拽节点到画布
      </p>
      {nodeTypes.map((nt) => (
        <div
          key={nt.type}
          draggable
          onDragStart={(e) => onDragStart(e, nt.type)}
          style={{
            padding: '12px',
            borderRadius: '6px',
            border: `2px solid ${nt.color}`,
            background: 'white',
            cursor: 'grab',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>{nt.icon}</span>
          <span style={{ color: nt.color }}>{nt.label}</span>
        </div>
      ))}
    </aside>
  );
}
