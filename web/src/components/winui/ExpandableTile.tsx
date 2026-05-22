import { useState } from 'react';

interface ExpandableTileProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  defaultExpanded?: boolean;
  headerRightExtra?: React.ReactNode;
  children: React.ReactNode;
  forceExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

export default function ExpandableTile({
  icon,
  title,
  description,
  badge,
  defaultExpanded = false,
  headerRightExtra,
  children,
  forceExpanded,
  onExpandChange,
}: ExpandableTileProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isControlled = forceExpanded !== undefined;
  const isExpanded = isControlled ? forceExpanded : expanded;

  const handleToggle = () => {
    if (!isControlled) {
      const next = !expanded;
      setExpanded(next);
      onExpandChange?.(next);
    } else {
      onExpandChange?.(!forceExpanded);
    }
  };

  return (
    <div className={`settings-expandable-tile${isExpanded ? ' expanded' : ''}`}>
      <div
        className="settings-expandable-header"
        onClick={handleToggle}
        style={isControlled && !onExpandChange ? { cursor: 'default' } : undefined}
      >
        <div className="settings-tile-left">
          <div className="settings-tile-icon">{icon}</div>
          <div className="settings-tile-info">
            <div className="settings-tile-title">{title}</div>
            {description && <div className="settings-tile-desc">{description}</div>}
          </div>
        </div>
        <div className="settings-expandable-header-right">
          {headerRightExtra}
          {badge}
          <div className={`settings-expand-arrow${isExpanded ? ' expanded' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 16 16">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
      <div className="settings-expandable-body" style={isControlled ? { gridTemplateRows: isExpanded ? '1fr' : '0fr' } : undefined}>
        <div className="settings-expandable-body-inner">
          {children}
        </div>
      </div>
    </div>
  );
}
