import { useEffect, useState, useCallback, useRef } from 'react';
import { showToast } from './Toast';

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
      showToast('请输入目标路径', 'error');
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
    const row = (e.currentTarget as HTMLElement).closest('.tag-row') as HTMLElement;
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

      const h = d.itemHeight || 40;
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

    const h = dragRef.current.itemHeight || 40;
    const isDragging = index === dragIndex;

    if (isDragging) {
      return {
        transform: `translateY(${dragY}px)`,
        zIndex: 1000,
        opacity: 0.92,
        boxShadow: 'var(--shadow-lg)',
        transition: 'none',
        position: 'relative',
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

  const sectionBg = 'var(--bg-surface-1)';

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-base)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '20px 24px',
        background: sectionBg,
        borderBottom: '1px solid var(--border-default)',
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}>
          Tag 管理
        </h2>
        <p style={{
          margin: '4px 0 0',
          fontSize: '12px',
          color: 'var(--text-muted)',
          letterSpacing: '-0.01em',
        }}>
          管理输出文件夹别名及其目标路径，文件将根据 tag 移动到对应的目标目录
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">新建 Tag</div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ minWidth: '120px', flex: '0.8' }}>
                <label style={labelStyle}>名称 *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="例如: movie"
                  className="input"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                />
              </div>
              <div style={{ minWidth: '200px', flex: '1.5' }}>
                <label style={labelStyle}>目标路径 *</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={newTargetPath}
                    onChange={(e) => setNewTargetPath(e.target.value)}
                    placeholder="例如: D:/Videos/Movies"
                    className="input input-mono"
                    style={{ flex: 1 }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                  />
                  {window.electronAPI && (
                    <button
                      onClick={async () => {
                        const dir = await window.electronAPI.openDirectory();
                        if (dir) {
                          setNewTargetPath(dir);
                          if (autoFillEnabled && !newName.trim()) {
                            setNewName(getFolderNameFromPath(dir));
                          }
                        }
                      }}
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      选择...
                    </button>
                  )}
                </div>
              </div>
              <div style={{ minWidth: '150px', flex: '1' }}>
                <label style={labelStyle}>描述</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="可选"
                  className="input"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                />
              </div>
              <button onClick={handleCreate} className="btn btn-primary">
                创建
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '28px 120px 1fr 150px 100px',
            gap: '12px',
            padding: '12px 20px',
            background: 'var(--bg-surface-2)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            borderBottom: '1px solid var(--border-default)',
          }}>
            <div></div>
            <div>名称</div>
            <div>目标路径</div>
            <div>描述</div>
            <div style={{ textAlign: 'center' }}>操作</div>
          </div>

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

          {tags.map((tag, index) => (
            <div
              key={tag.id}
              className="tag-row"
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 120px 1fr 150px 100px',
                gap: '12px',
                padding: '12px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                alignItems: 'center',
                background: editingId === tag.id
                  ? 'var(--accent-muted)'
                  : dragIndex === index
                    ? 'var(--bg-surface-1)'
                    : 'transparent',
                ...getItemStyle(index),
              }}
            >
              {editingId === tag.id ? (
                <>
                  <div></div>
                  <div>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(tag.id); if (e.key === 'Escape') cancelEdit(); }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      value={editTargetPath}
                      onChange={(e) => setEditTargetPath(e.target.value)}
                      className="input input-mono"
                      style={{ flex: 1 }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(tag.id); if (e.key === 'Escape') cancelEdit(); }}
                    />
                    {window.electronAPI && (
                      <button
                        onClick={async () => {
                          const dir = await window.electronAPI.openDirectory();
                          if (dir) {
                            setEditTargetPath(dir);
                            if (autoFillEnabled && !editName.trim()) {
                              setEditName(getFolderNameFromPath(dir));
                            }
                          }
                        }}
                        className="btn btn-outline"
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                      >
                        选择...
                      </button>
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="input"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(tag.id); if (e.key === 'Escape') cancelEdit(); }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <button onClick={() => handleUpdate(tag.id)} className="btn btn-success" style={{ padding: '4px 12px', fontSize: '12px' }}>保存</button>
                    <button onClick={cancelEdit} className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '12px' }}>取消</button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'grab',
                      padding: '2px',
                      color: 'var(--text-muted)',
                    }}
                    onMouseDown={(e) => handleDragMouseDown(index, e)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 1024 1024"
                      style={{ fill: 'currentColor', pointerEvents: 'none' }}
                    >
                      <path d="M64.1 194v89.6h896.1V194H64.1z m0 358.4h896.1v-89.6H64.1v89.6z m0 268.9h896.1v-89.6H64.1v89.6z" />
                    </svg>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                    {tag.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                    {tag.target_path}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {tag.description || '-'}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <button onClick={() => startEdit(tag)} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }}>编辑</button>
                    <button onClick={() => handleDelete(tag.id, tag.name)} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '12px', color: 'var(--error)' }}>删除</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: 'var(--text-secondary)',
  marginBottom: '5px',
  fontWeight: 500,
  letterSpacing: '-0.01em',
};
