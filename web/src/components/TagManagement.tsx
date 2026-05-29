import { useEffect, useState, useCallback, useRef } from 'react';
import { showToast } from './Toast';
import { FluentTagIcon, FolderAddIcon } from './FluentIcons';
import {
  PageHeader,
  SettingsSection,
  ExpandableTile,
  SettingsSubItem,
  SettingsSubItemDivider,
  FolderSelectButton,
  TagCard,
} from './winui';

interface TagItem {
  id: number;
  name: string;
  target_path: string;
  description: string;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

const API_BASE = 'http://localhost:3000/api';

interface TagManagementProps {
  isDark: boolean;
}

function getFolderNameFromPath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const trimmed = normalized.replace(/\/$/, '');
  const lastSlash = trimmed.lastIndexOf('/');
  return lastSlash >= 0 ? trimmed.slice(lastSlash + 1) : trimmed;
}

export default function TagManagement({ isDark: _isDark }: TagManagementProps) {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editTargetPath, setEditTargetPath] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [newName, setNewName] = useState('');
  const [newTargetPath, setNewTargetPath] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [autoFillEnabled, setAutoFillEnabled] = useState(false);
  const [createExpanded, setCreateExpanded] = useState(false);

  const tagsRef = useRef(tags);
  tagsRef.current = tags;

  const dragRef = useRef({ index: -1, overIndex: -1, startY: 0, offsetY: 0, itemHeight: 0 });
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const [transitionDisabled, setTransitionDisabled] = useState(false);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/tags`);
      const data = await res.json();
      if (data.success) {
        setTags(data.tags);
      }
    } catch {
      showToast('获取 tag 列表失败', 'error');
    }
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/settings/autoFillTagName`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value !== null) {
          setAutoFillEnabled(data.value === 'true');
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleCreate = async () => {
    if (!newName.trim()) {
      showToast('请输入 tag 名称', 'error');
      return;
    }
    if (!newTargetPath.trim()) {
      showToast('请通过"添加文件夹"按钮选择目标路径', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), targetPath: newTargetPath.trim(), description: newDesc.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewName('');
        setNewTargetPath('');
        setNewDesc('');
        setCreateExpanded(false);
        showToast(`Tag "${newName.trim()}" 创建成功`, 'success');
        fetchTags();
      } else {
        showToast(data.error || '创建失败', 'error');
      }
    } catch {
      showToast('创建 tag 失败', 'error');
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) {
      showToast('tag 名称不能为空', 'error');
      return;
    }
    if (!editTargetPath.trim()) {
      showToast('目标路径不能为空', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/tags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), targetPath: editTargetPath.trim(), description: editDesc.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingId(null);
        showToast('Tag 更新成功', 'success');
        fetchTags();
      } else {
        showToast(data.error || '更新失败', 'error');
      }
    } catch {
      showToast('更新 tag 失败', 'error');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    try {
      const res = await fetch(`${API_BASE}/tags/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`Tag "${name}" 已删除`, 'success');
        fetchTags();
      } else {
        showToast(data.error || '删除失败', 'error');
      }
    } catch {
      showToast('删除 tag 失败', 'error');
    }
  };

  const startEdit = (tag: TagItem) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditTargetPath(tag.target_path);
    setEditDesc(tag.description);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditTargetPath('');
    setEditDesc('');
  };

  const handleDragMouseDown = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const row = (e.currentTarget as HTMLElement).closest('.tag-row-wrapper') as HTMLElement;
    if (!row) return;
    const rect = row.getBoundingClientRect();
    dragRef.current = { index, overIndex: index, startY: e.clientY, offsetY: 0, itemHeight: rect.height };
    setDragIndex(index);
    setDragOverIndex(index);
    setDragY(0);
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    if (dragIndex === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const d = dragRef.current;
      d.offsetY = e.clientY - d.startY;
      setDragY(d.offsetY);

      const h = d.itemHeight || 48;
      const len = tagsRef.current.length;
      let target = d.index;

      if (d.offsetY > h / 2) {
        target = Math.min(len - 1, d.index + Math.floor((d.offsetY + h / 2) / h));
      } else if (d.offsetY < -h / 2) {
        target = Math.max(0, d.index + Math.ceil((d.offsetY - h / 2) / h));
      }

      if (target !== d.overIndex) {
        d.overIndex = target;
        setDragOverIndex(target);
      }
    };

    const handleMouseUp = async () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      const d = dragRef.current;
      const from = d.index;
      const to = d.overIndex;

      setTransitionDisabled(true);
      setDragIndex(null);
      setDragOverIndex(null);
      setDragY(0);

      if (from !== to) {
        const currentTags = tagsRef.current;
        const newTags = [...currentTags];
        const [moved] = newTags.splice(from, 1);
        newTags.splice(to, 0, moved);
        setTags(newTags);

        try {
          await fetch(`${API_BASE}/tags/reorder`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderedIds: newTags.map((t) => t.id) }),
          });
        } catch {
          showToast('排序保存失败', 'error');
        }
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionDisabled(false);
        });
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragIndex]);

  const getItemStyle = (index: number): React.CSSProperties => {
    if (dragIndex === null) {
      if (transitionDisabled) {
        return { transition: 'none' };
      }
      return { transition: 'transform 250ms cubic-bezier(0.65, 0, 0.35, 1)' };
    }

    const h = dragRef.current.itemHeight || 48;
    const isDragging = index === dragIndex;

    if (isDragging) {
      return {
        transform: `translateY(${dragY}px)`,
        zIndex: 1000,
        opacity: 0.92,
        boxShadow: 'var(--shadow-lg)',
        transition: 'none',
        position: 'relative',
        borderRadius: '4px',
      };
    }

    if (dragOverIndex! > dragIndex) {
      if (index > dragIndex && index <= dragOverIndex!) {
        return {
          transform: `translateY(-${h}px)`,
          transition: 'transform 250ms cubic-bezier(0.65, 0, 0.35, 1)',
        };
      }
    } else if (dragOverIndex! < dragIndex) {
      if (index >= dragOverIndex! && index < dragIndex) {
        return {
          transform: `translateY(${h}px)`,
          transition: 'transform 250ms cubic-bezier(0.65, 0, 0.35, 1)',
        };
      }
    }

    return { transition: 'transform 250ms cubic-bezier(0.65, 0, 0.35, 1)' };
  };

  const handleAddFolderClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.electronAPI) return;

    const dir = await window.electronAPI.openDirectory();
    if (!dir) return;

    setNewTargetPath(dir);

    if (!createExpanded) {
      const tagName = newName.trim() || getFolderNameFromPath(dir);
      try {
        const res = await fetch(`${API_BASE}/tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tagName, targetPath: dir, description: newDesc.trim() }),
        });
        const data = await res.json();
        if (data.success) {
          setNewName('');
          setNewTargetPath('');
          setNewDesc('');
          showToast(`Tag "${tagName}" 创建成功`, 'success');
          fetchTags();
        } else {
          showToast(data.error || '创建失败', 'error');
          setCreateExpanded(true);
        }
      } catch {
        showToast('创建 tag 失败', 'error');
        setCreateExpanded(true);
      }
    } else {
      if (autoFillEnabled && !newName.trim()) {
        setNewName(getFolderNameFromPath(dir));
      }
    }
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--settings-page-bg)',
      overflow: 'hidden',
      userSelect: 'none',
    }}>
      <PageHeader title="Tag 管理" description="管理输出文件夹别名及其目标路径，文件将根据 tag 移动到对应的目标目录" />

      <div style={{
        flex: 1,
        padding: '24px',
        overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}>
          <SettingsSection title="新建 Tag">
            <ExpandableTile
              icon={<FluentTagIcon size={24} />}
              title="新建 Tag"
              description='点击"添加文件夹"选择目标目录'
              forceExpanded={createExpanded}
              onExpandChange={(v) => setCreateExpanded(v)}
              headerRightExtra={
                window.electronAPI ? (
                  <FolderSelectButton onClick={handleAddFolderClick} text="添加文件夹" icon={<FolderAddIcon size={18} />} />
                ) : undefined
              }
            >
              <SettingsSubItem label="名称 *">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="例如: movie"
                  className="input"
                  style={{ width: '260px', fontSize: '13px' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                />
              </SettingsSubItem>
              <SettingsSubItemDivider />
              <SettingsSubItem label="文件夹路径 *">
                <input
                  type="text"
                  value={newTargetPath}
                  onChange={(e) => setNewTargetPath(e.target.value)}
                  placeholder="D:/Videos/Movies"
                  className="input input-mono"
                  style={{ width: '260px', fontSize: '12px' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                />
              </SettingsSubItem>
              <SettingsSubItemDivider />
              <SettingsSubItem label="描述">
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="可选"
                  className="input"
                  style={{ width: '260px', fontSize: '13px' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                />
              </SettingsSubItem>
              <SettingsSubItemDivider />
              <div style={{
                padding: '10px 16px 10px 52px',
                display: 'flex',
                justifyContent: 'flex-end',
              }}>
                <button onClick={handleCreate} className="btn btn-primary" style={{ padding: '6px 20px' }}>
                  创建
                </button>
              </div>
            </ExpandableTile>
          </SettingsSection>

          <SettingsSection title={`已有 Tag (${tags.length})`}>
            {tags.length === 0 && (
              <div style={{
                padding: '48px 20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '13px',
              }}>
                暂无 tag，请在上方创建
              </div>
            )}

            {tags.map((tag, index) => {
              const isEditing = editingId === tag.id;

              return (
                <div
                  key={tag.id}
                  className="tag-row-wrapper"
                  style={getItemStyle(index)}
                >
                  {isEditing ? (
                    <ExpandableTile
                      icon={<FluentTagIcon size={24} />}
                      title={`编辑: ${editName || tag.name}`}
                      forceExpanded={true}
                      badge={
                        <span className="badge" style={{
                          background: 'var(--accent-muted)',
                          color: 'var(--accent)',
                          fontSize: '11px',
                        }}>
                          编辑中
                        </span>
                      }
                    >
                      <SettingsSubItem label="名称">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="input"
                          style={{ width: '260px', fontSize: '13px' }}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(tag.id); if (e.key === 'Escape') cancelEdit(); }}
                        />
                      </SettingsSubItem>
                      <SettingsSubItemDivider />
                      <SettingsSubItem label="目标路径">
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            value={editTargetPath}
                            onChange={(e) => setEditTargetPath(e.target.value)}
                            className="input input-mono"
                            style={{ width: '220px', fontSize: '12px' }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(tag.id); if (e.key === 'Escape') cancelEdit(); }}
                          />
                          {window.electronAPI && (
                            <FolderSelectButton
                              text="链接文件夹"
                              icon={<FolderAddIcon size={18} />}
                              onClick={() => {
                                (async () => {
                                  const dir = await window.electronAPI!.openDirectory();
                                  if (dir) {
                                    setEditTargetPath(dir);
                                    if (autoFillEnabled && !editName.trim()) {
                                      setEditName(getFolderNameFromPath(dir));
                                    }
                                  }
                                })();
                              }}
                            />
                          )}
                        </div>
                      </SettingsSubItem>
                      <SettingsSubItemDivider />
                      <SettingsSubItem label="描述">
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="input"
                          style={{ width: '260px', fontSize: '13px' }}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(tag.id); if (e.key === 'Escape') cancelEdit(); }}
                        />
                      </SettingsSubItem>
                      <SettingsSubItemDivider />
                      <div style={{
                        padding: '10px 16px 10px 52px',
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'flex-end',
                      }}>
                        <button
                          onClick={cancelEdit}
                          className="btn btn-ghost"
                          style={{ padding: '6px 14px', fontSize: '12px' }}
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleUpdate(tag.id)}
                          className="btn btn-primary"
                          style={{ padding: '6px 14px', fontSize: '12px' }}
                        >
                          保存
                        </button>
                      </div>
                    </ExpandableTile>
                  ) : (
                    <TagCard
                      name={tag.name}
                      targetPath={tag.target_path}
                      description={tag.description || undefined}
                      icon={<FluentTagIcon size={24} />}
                      isDragging={dragIndex === index}
                      onDragStart={(e) => handleDragMouseDown(index, e)}
                      onEdit={() => startEdit(tag)}
                      onDelete={() => handleDelete(tag.id, tag.name)}
                    />
                  )}
                </div>
              );
            })}
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}
