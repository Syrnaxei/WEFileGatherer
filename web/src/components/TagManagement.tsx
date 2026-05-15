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
                    <button
                      onClick={() => handleUpdate(tag.id)}
                      className="btn btn-outline"
                      style={{ padding: '4px 6px', fontSize: '12px', lineHeight: 0 }}
                      title="保存"
                    >
                      <svg width="14" height="14" viewBox="0 0 1024 1024" style={{ fill: 'currentColor', pointerEvents: 'none' }}>
                        <path d="M682.666667 597.333333H341.333333v256h341.333334v-256z m-17.664-426.666666H341.333333v128h298.666667a42.666667 42.666667 0 0 1 0 85.333333H298.666667a42.666667 42.666667 0 0 1-42.666667-42.666667V170.666667H213.333333a42.666667 42.666667 0 0 0-42.666666 42.666666v597.333334a42.666667 42.666667 0 0 0 42.666666 42.666666h42.666667v-298.666666a42.666667 42.666667 0 0 1 37.674667-42.368L298.666667 512h426.666666a42.666667 42.666667 0 0 1 42.666667 42.666667v298.666666h42.666667a42.666667 42.666667 0 0 0 42.666666-42.666666V358.997333L665.002667 170.666667zM682.666667 85.333333c11.306667 0 22.186667 4.48 30.165333 12.501334l213.333333 213.333333A42.538667 42.538667 0 0 1 938.666667 341.333333v469.333334a128 128 0 0 1-128 128H213.333333a128 128 0 0 1-128-128V213.333333a128 128 0 0 1 128-128h469.333334z" />
                      </svg>
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="btn btn-outline"
                      style={{ padding: '4px 6px', fontSize: '12px', lineHeight: 0 }}
                      title="取消"
                    >
                      <svg width="14" height="14" viewBox="0 0 1024 1024" style={{ fill: 'currentColor', pointerEvents: 'none' }}>
                        <path d="M632.117978 513.833356l361.805812 361.735298a85.462608 85.462608 0 1 1-121.001515 120.789974L511.116463 634.552816 146.913186 998.756094a86.026718 86.026718 0 0 1-121.706652-121.706652L389.480325 512.775651 27.674513 150.969839A85.392095 85.392095 0 0 1 148.393973 30.250379L510.199785 392.056191l366.671258-366.671258a86.026718 86.026718 0 0 1 121.706652 121.706652z" />
                      </svg>
                    </button>
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
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em', minHeight: '34px', display: 'flex', alignItems: 'center' }}>
                    {tag.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--accent)', fontFamily: 'var(--font-mono)', minHeight: '34px', display: 'flex', alignItems: 'center' }}>
                    {tag.target_path}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', minHeight: '34px', display: 'flex', alignItems: 'center' }}>
                    {tag.description || '-'}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <button
                      onClick={() => startEdit(tag)}
                      className="btn btn-outline"
                      style={{ padding: '4px 6px', fontSize: '12px', lineHeight: 0 }}
                      title="编辑"
                    >
                      <svg width="15" height="15" viewBox="0 0 1024 1024" style={{ fill: 'currentColor', pointerEvents: 'none' }}>
                        <path d="M469.333333 128a42.666667 42.666667 0 0 1 0 85.333333H213.333333v597.333334h597.333334v-256l0.298666-4.992A42.666667 42.666667 0 0 1 896 554.666667v256a85.333333 85.333333 0 0 1-85.333333 85.333333H213.333333a85.333333 85.333333 0 0 1-85.333333-85.333333V213.333333a85.333333 85.333333 0 0 1 85.333333-85.333333z m414.72 12.501333a42.666667 42.666667 0 0 1 0 60.330667L491.861333 593.066667a42.666667 42.666667 0 0 1-60.330666-60.330667l392.192-392.192a42.666667 42.666667 0 0 1 60.330666 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id, tag.name)}
                      className="btn btn-outline"
                      style={{ padding: '4px 6px', fontSize: '12px', lineHeight: 0, color: 'var(--error)' }}
                      title="删除"
                    >
                      <svg width="15" height="15" viewBox="0 0 1024 1024" style={{ fill: 'currentColor', pointerEvents: 'none' }}>
                        <path d="M576.416 736V383.871c0-17.814 14.521-32.256 32.434-32.256 17.912 0 32.433 14.442 32.433 32.256V736c0 17.815-14.52 32.256-32.433 32.256S576.416 753.814 576.416 736z m-193.7 0V383.871c0-17.814 14.522-32.256 32.434-32.256 17.913 0 32.434 14.442 32.434 32.256V736c0 17.815-14.521 32.256-32.434 32.256-17.912 0-32.433-14.441-32.433-32.256z m548.666-512.063H770.116v-64.064c0-52.774-42.885-95.625-95.949-95.872H350.734c-25.645-0.12-50.28 9.929-68.456 27.921-18.176 17.993-28.394 42.446-28.394 67.95v64.065H92.618C76.295 225.86 64 239.622 64 255.969c0 16.346 12.295 30.108 28.618 32.032h838.764C947.705 286.077 960 272.315 960 255.969c0-16.347-12.295-30.11-28.618-32.032zM318.3 159.873c0.482-17.539 14.794-31.574 32.434-31.808h323.433a31.17 31.17 0 0 1 22.597 9.206 30.82 30.82 0 0 1 8.936 22.602v64.064H318.3v-64.064z m418.932 800.126H286.768c-25.645 0.12-50.28-9.929-68.456-27.921-18.176-17.993-28.394-42.446-28.394-67.95V383.871a31.271 31.271 0 0 1 9.232-22.626 31.623 31.623 0 0 1 22.751-9.182 32.076 32.076 0 0 1 22.907 9.157 31.721 31.721 0 0 1 9.526 22.651v480.255c0.482 17.539 14.794 31.574 32.434 31.808h450.464c17.64-0.234 31.952-14.27 32.434-31.808v-478.91c1.933-16.234 15.771-28.462 32.208-28.462 16.436 0 30.274 12.228 32.208 28.461v478.911c0 25.505-10.218 49.958-28.394 67.95-18.176 17.993-42.811 28.041-68.456 27.922z" />
                      </svg>
                    </button>
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
