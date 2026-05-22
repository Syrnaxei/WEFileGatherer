interface DragHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
}

export default function DragHandle({ onMouseDown }: DragHandleProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        padding: '2px',
        color: 'var(--text-muted)',
        flexShrink: 0,
        marginRight: '4px',
      }}
      onMouseDown={onMouseDown}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        style={{ fill: 'currentColor', pointerEvents: 'none' }}
      >
        <path d="M2.753 18h18.5a.75.75 0 0 1 .102 1.493l-.102.007h-18.5a.75.75 0 0 1-.102-1.493L2.753 18h18.5-18.5Zm0-6.497h18.5a.75.75 0 0 1 .102 1.493l-.102.007h-18.5a.75.75 0 0 1-.102-1.493l.102-.007h18.5-18.5Zm-.001-6.5h18.5a.75.75 0 0 1 .102 1.493l-.102.007h-18.5A.75.75 0 0 1 2.65 5.01l.102-.007h18.5-18.5Z" />
      </svg>
    </div>
  );
}
