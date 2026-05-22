import { useEffect, useState, useCallback, useRef } from 'react';
import { showToast } from './Toast';
import { FluentTagIcon, FolderAddIcon } from './FluentIcons';

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

  // 添加文件夹 — 折叠状态直接创建，展开状态填充表单
  const handleAddFolderClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.electronAPI) return;

    const dir = await window.electronAPI.openDirectory();
    if (!dir) return;

    setNewTargetPath(dir);

    if (!createExpanded) {
      // 折叠状态：使用文件夹名作为 tag 名称，直接创建
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
      // 展开状态：自动填充名称，等待手动点击"创建"
      if (autoFillEnabled && !newName.trim()) {
        setNewName(getFolderNameFromPath(dir));
      }
    }
  };

  // 文件夹选择按钮 — 统一复用组件，用于已有 tag 编辑
  const FolderSelectBtn = ({
    onClick,
    text = '选择...',
  }: {
    onClick: (e: React.MouseEvent) => void;
    text?: string;
  }) => (
    <button
      onClick={onClick}
      className="btn-folder-select"
    >
      <FolderAddIcon size={18} />
      {text}
    </button>
  );

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--settings-page-bg)',
      overflow: 'hidden',
      userSelect: 'none',
    }}>
      {/* 页面头部 — 与设置页面一致的标题栏 */}
      <div style={{
        padding: '20px 24px',
        background: 'var(--settings-header-bg)',
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

      {/* 可滚动内容区 */}
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
          {/* ═══════════════════════════════════════════
              新建 Tag — 可收起/展开卡片
              折叠状态点击"添加文件夹"快捷创建
              展开后可编辑名称、文件夹路径、描述后手动创建
          ═══════════════════════════════════════════ */}
          <div>
            <div className="settings-section-title">新建 Tag</div>
            <div className="settings-card-body">
              <div className={`settings-expandable-tile${createExpanded ? ' expanded' : ''}`}>
                {/* 卡片头部 — 始终可见 */}
                <div
                  className="settings-expandable-header"
                  onClick={() => setCreateExpanded(!createExpanded)}
                >
                  <div className="settings-tile-left">
                    <div className="settings-tile-icon">
                      <FluentTagIcon size={24} />
                    </div>
                    <div className="settings-tile-info">
                      <div className="settings-tile-title">新建 Tag</div>
                      <div className="settings-tile-desc">
                        点击"添加文件夹"选择目标目录
                      </div>
                    </div>
                  </div>
                  <div className="settings-expandable-header-right">
                    {window.electronAPI && (
                      <button
                        className="btn-folder-select"
                        onClick={handleAddFolderClick}
                      >
                        <FolderAddIcon size={18} />
                        添加文件夹
                      </button>
                    )}
                    <div className={`settings-expand-arrow${createExpanded ? ' expanded' : ''}`}>
                      <svg width="14" height="14" viewBox="0 0 16 16">
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 展开体部 — 名称 / 文件夹路径 / 描述 + 创建按钮 */}
                <div className="settings-expandable-body">
                  <div className="settings-expandable-body-inner">
                    <div className="settings-sub-item">
                      <span className="settings-sub-item-label">名称 *</span>
                      <div className="settings-sub-item-right">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="例如: movie"
                          className="input"
                          style={{ width: '260px', fontSize: '13px' }}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                        />
                      </div>
                    </div>

                    <div className="settings-sub-item-divider" />

                    <div className="settings-sub-item">
                      <span className="settings-sub-item-label">文件夹路径 *</span>
                      <div className="settings-sub-item-right">
                        <input
                          type="text"
                          value={newTargetPath}
                          onChange={(e) => setNewTargetPath(e.target.value)}
                          placeholder="D:/Videos/Movies"
                          className="input input-mono"
                          style={{ width: '260px', fontSize: '12px' }}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                        />
                      </div>
                    </div>

                    <div className="settings-sub-item-divider" />

                    <div className="settings-sub-item">
                      <span className="settings-sub-item-label">描述</span>
                      <div className="settings-sub-item-right">
                        <input
                          type="text"
                          value={newDesc}
                          onChange={(e) => setNewDesc(e.target.value)}
                          placeholder="可选"
                          className="input"
                          style={{ width: '260px', fontSize: '13px' }}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                        />
                      </div>
                    </div>

                    <div className="settings-sub-item-divider" />

                    <div style={{
                      padding: '10px 16px 10px 52px',
                      display: 'flex',
                      justifyContent: 'flex-end',
                    }}>
                      <button onClick={handleCreate} className="btn btn-primary" style={{ padding: '6px 20px' }}>
                        创建
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════
              已有 Tag 列表
          ═══════════════════════════════════════════ */}
          <div>
            <div className="settings-section-title">已有 Tag ({tags.length})</div>
            <div className="settings-card-body">
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
                      /* ═══════════════ 编辑模式 ═══════════════ */
                      <div className="settings-expandable-tile expanded">
                        <div className="settings-expandable-header" style={{ cursor: 'default' }}>
                          <div className="settings-tile-left">
                            <div className="settings-tile-icon">
                              <FluentTagIcon size={24} />
                            </div>
                            <div className="settings-tile-info">
                              <div className="settings-tile-title">
                                编辑: {editName || tag.name}
                              </div>
                            </div>
                          </div>
                          <div className="settings-expandable-header-right">
                            <span className="badge" style={{
                              background: 'var(--accent-muted)',
                              color: 'var(--accent)',
                              fontSize: '11px',
                            }}>
                              编辑中
                            </span>
                          </div>
                        </div>
                        <div className="settings-expandable-body" style={{ gridTemplateRows: '1fr' }}>
                          <div className="settings-expandable-body-inner">
                            <div className="settings-sub-item">
                              <span className="settings-sub-item-label">名称</span>
                              <div className="settings-sub-item-right">
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="input"
                                  style={{ width: '260px', fontSize: '13px' }}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(tag.id); if (e.key === 'Escape') cancelEdit(); }}
                                />
                              </div>
                            </div>
                            <div className="settings-sub-item-divider" />
                            <div className="settings-sub-item">
                              <span className="settings-sub-item-label">目标路径</span>
                              <div className="settings-sub-item-right">
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
                                    <FolderSelectBtn
                                      text="选择..."
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
                              </div>
                            </div>
                            <div className="settings-sub-item-divider" />
                            <div className="settings-sub-item">
                              <span className="settings-sub-item-label">描述</span>
                              <div className="settings-sub-item-right">
                                <input
                                  type="text"
                                  value={editDesc}
                                  onChange={(e) => setEditDesc(e.target.value)}
                                  className="input"
                                  style={{ width: '260px', fontSize: '13px' }}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(tag.id); if (e.key === 'Escape') cancelEdit(); }}
                                />
                              </div>
                            </div>
                            <div className="settings-sub-item-divider" />
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
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ═══════════════ 查看模式 ═══════════════ */
                      <div className="settings-tile" style={{
                        cursor: 'default',
                        background: dragIndex === index ? 'var(--settings-tile-hover-bg)' : undefined,
                      }}>
                        <div className="settings-tile-left">
                          {/* 拖拽手柄 */}
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
                            onMouseDown={(e) => handleDragMouseDown(index, e)}
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

                          {/* Tag 图标 */}
                          <div className="settings-tile-icon">
                            <FluentTagIcon size={24} />
                          </div>

                          {/* Tag 信息 */}
                          <div className="settings-tile-info">
                            <div className="settings-tile-title">{tag.name}</div>
                            <div style={{
                              fontSize: '12px',
                              color: 'var(--accent)',
                              fontFamily: 'var(--font-mono)',
                              letterSpacing: '-0.01em',
                              lineHeight: '1.4',
                            }}>
                              {tag.target_path}
                            </div>
                            {tag.description && (
                              <div style={{
                                fontSize: '13px',
                                color: 'var(--text-muted)',
                                letterSpacing: '-0.01em',
                                lineHeight: '1.4',
                              }}>
                                {tag.description}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="settings-tile-right">
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => startEdit(tag)}
                              className="btn btn-outline"
                              style={{ padding: '6px 10px', fontSize: '12px', lineHeight: 0 }}
                              title="编辑"
                            >
                              <svg width="15" height="15" viewBox="0 0 1024 1024" style={{ fill: 'currentColor', pointerEvents: 'none' }}>
                                <path d="M469.333333 128a42.666667 42.666667 0 0 1 0 85.333333H213.333333v597.333334h597.333334v-256l0.298666-4.992A42.666667 42.666667 0 0 1 896 554.666667v256a85.333333 85.333333 0 0 1-85.333333 85.333333H213.333333a85.333333 85.333333 0 0 1-85.333333-85.333333V213.333333a85.333333 85.333333 0 0 1 85.333333-85.333333z m414.72 12.501333a42.666667 42.666667 0 0 1 0 60.330667L491.861333 593.066667a42.666667 42.666667 0 0 1-60.330666-60.330667l392.192-392.192a42.666667 42.666667 0 0 1 60.330666 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(tag.id, tag.name)}
                              className="btn btn-outline"
                              style={{ padding: '6px 10px', fontSize: '12px', lineHeight: 0, color: 'var(--error)' }}
                              title="删除"
                            >
                              <svg width="15" height="15" viewBox="0 0 1024 1024" style={{ fill: 'currentColor', pointerEvents: 'none' }}>
                                <path d="M576.416 736V383.871c0-17.814 14.521-32.256 32.434-32.256 17.912 0 32.433 14.442 32.433 32.256V736c0 17.815-14.52 32.256-32.433 32.256S576.416 753.814 576.416 736z m-193.7 0V383.871c0-17.814 14.522-32.256 32.434-32.256 17.913 0 32.434 14.442 32.434 32.256V736c0 17.815-14.521 32.256-32.434 32.256-17.912 0-32.433-14.441-32.433-32.256z m548.666-512.063H770.116v-64.064c0-52.774-42.885-95.625-95.949-95.872H350.734c-25.645-0.12-50.28 9.929-68.456 27.921-18.176 17.993-28.394 42.446-28.394 67.95v64.065H92.618C76.295 225.86 64 239.622 64 255.969c0 16.346 12.295 30.108 28.618 32.032h838.764C947.705 286.077 960 272.315 960 255.969c0-16.347-12.295-30.11-28.618-32.032zM318.3 159.873c0.482-17.539 14.794-31.574 32.434-31.808h323.433a31.17 31.17 0 0 1 22.597 9.206 30.82 30.82 0 0 1 8.936 22.602v64.064H318.3v-64.064z m418.932 800.126H286.768c-25.645 0.12-50.28-9.929-68.456-27.921-18.176-17.993-28.394-42.446-28.394-67.95V383.871a31.271 31.271 0 0 1 9.232-22.626 31.623 31.623 0 0 1 22.751-9.182 32.076 32.076 0 0 1 22.907 9.157 31.721 31.721 0 0 1 9.526 22.651v480.255c0.482 17.539 14.794 31.574 32.434 31.808h450.464c17.64-0.234 31.952-14.27 32.434-31.808v-478.91c1.933-16.234 15.771-28.462 32.208-28.462 16.436 0 30.274 12.228 32.208 28.461v478.911c0 25.505-10.218 49.958-28.394 67.95-18.176 17.993-42.811 28.041-68.456 27.922z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
