import React from 'react';
import { DragHandle, ActionButton, EditIcon, DeleteIcon } from './index';

interface TagCardProps {
  name: string;
  targetPath: string;
  description?: string;
  icon: React.ReactNode;
  isDragging?: boolean;
  onDragStart: (e: React.MouseEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TagCard({
  name,
  targetPath,
  description,
  icon,
  isDragging,
  onDragStart,
  onEdit,
  onDelete,
}: TagCardProps) {
  return (
    <div className="settings-tile" style={{
      cursor: 'default',
      background: isDragging ? 'var(--settings-tile-hover-bg)' : undefined,
    }}>
      <div className="settings-tile-left">
        <DragHandle onMouseDown={onDragStart} />
        <div className="settings-tile-icon">{icon}</div>
        <div className="settings-tile-info">
          <div className="settings-tile-title">{name}</div>
          <div style={{
            fontSize: '12px',
            color: 'var(--accent)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '-0.01em',
            lineHeight: '1.4',
          }}>
            {targetPath}
          </div>
          {description && (
            <div style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              letterSpacing: '-0.01em',
              lineHeight: '1.4',
            }}>
              {description}
            </div>
          )}
        </div>
      </div>
      <div className="settings-tile-right">
        <div style={{ display: 'flex', gap: '8px' }}>
          <ActionButton onClick={onEdit} title="编辑">
            <EditIcon />
          </ActionButton>
          <ActionButton onClick={onDelete} title="删除" variant="danger">
            <DeleteIcon />
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
