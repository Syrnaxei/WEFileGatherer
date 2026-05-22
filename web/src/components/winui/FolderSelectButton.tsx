import React from 'react';
import { FolderAddIcon } from '../FluentIcons';

interface FolderSelectButtonProps {
  onClick: (e: React.MouseEvent) => void;
  text?: string;
  icon?: React.ReactNode;
}

export default function FolderSelectButton({ onClick, text = '选择...', icon }: FolderSelectButtonProps) {
  return (
    <button onClick={onClick} className="btn-folder-select">
      {icon ?? <FolderAddIcon size={18} />}
      {text}
    </button>
  );
}
