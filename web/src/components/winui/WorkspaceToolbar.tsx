import { useState } from 'react';

/** 工具栏项定义 */
export interface ToolbarItem {
  /** 唯一标识 */
  id: string;
  /** 图标组件 */
  icon: React.FC<{ size?: number }>;
  /** 标签文字 */
  label: string;
  /** 点击回调 */
  onClick: () => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否激活/选中状态 */
  active?: boolean;
}

/** 工具栏项注册配置（不含运行时状态） */
export interface ToolbarItemConfig {
  id: string;
  icon: React.FC<{ size?: number }>;
  label: string;
}

/**
 * ToolbarFactory — 工具栏项工厂
 * 通过注册/注销方式维护工具栏内容，解耦工具项定义与运行时状态
 */
class ToolbarFactory {
  private registry = new Map<string, ToolbarItemConfig>();

  /** 注册工具项 */
  register(config: ToolbarItemConfig): void {
    this.registry.set(config.id, config);
  }

  /** 注销工具项 */
  unregister(id: string): void {
    this.registry.delete(id);
  }

  /** 获取所有已注册的工具项配置 */
  getAll(): ToolbarItemConfig[] {
    return Array.from(this.registry.values());
  }

  /** 获取指定工具项配置 */
  get(id: string): ToolbarItemConfig | undefined {
    return this.registry.get(id);
  }
}

/** 全局工具栏工厂实例 */
export const toolbarFactory = new ToolbarFactory();

/* ── Fluent 图标（来自 public/fluenticons，使用 currentColor 适配主题） ── */

/** 全选图标 — TaskListLtr */
function SelectAllIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
      <path d="M6.78 4.78a.75.75 0 0 0-1.06-1.06L3.75 5.69l-.47-.47a.75.75 0 0 0-1.06 1.06l1 1a.75.75 0 0 0 1.06 0l2.5-2.5Zm14.47 13.227H9.75l-.102.007a.75.75 0 0 0 .102 1.493h11.5l.102-.007a.75.75 0 0 0-.102-1.493Zm0-6.507H9.75l-.102.007A.75.75 0 0 0 9.75 13h11.5l.102-.007a.75.75 0 0 0-.102-1.493Zm0-6.5H9.75l-.102.007A.75.75 0 0 0 9.75 6.5h11.5l.102-.007A.75.75 0 0 0 21.25 5ZM6.78 17.78a.75.75 0 1 0-1.06-1.06l-1.97 1.97-.47-.47a.75.75 0 0 0-1.06 1.06l1 1a.75.75 0 0 0 1.06 0l2.5-2.5Zm0-7.56a.75.75 0 0 1 0 1.06l-2.5 2.5a.75.75 0 0 1-1.06 0l-1-1a.75.75 0 1 1 1.06-1.06l.47.47 1.97-1.97a.75.75 0 0 1 1.06 0Z" fill="currentColor" />
    </svg>
  );
}

/** 删除图标 — Delete (垃圾桶) */
function DeleteSelectedIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
      <path d="M12 1.75a3.25 3.25 0 0 1 3.245 3.066L15.25 5h5.25a.75.75 0 0 1 .102 1.493L20.5 6.5h-.796l-1.28 13.02a2.75 2.75 0 0 1-2.561 2.474l-.176.006H8.313a2.75 2.75 0 0 1-2.714-2.307l-.023-.174L4.295 6.5H3.5a.75.75 0 0 1-.743-.648L2.75 5.75a.75.75 0 0 1 .648-.743L3.5 5h5.25A3.25 3.25 0 0 1 12 1.75Zm6.197 4.75H5.802l1.267 12.872a1.25 1.25 0 0 0 1.117 1.122l.127.006h7.374c.6 0 1.109-.425 1.225-1.002l.02-.126L18.196 6.5ZM13.75 9.25a.75.75 0 0 1 .743.648L14.5 10v7a.75.75 0 0 1-1.493.102L13 17v-7a.75.75 0 0 1 .75-.75Zm-3.5 0a.75.75 0 0 1 .743.648L11 10v7a.75.75 0 0 1-1.493.102L9.5 17v-7a.75.75 0 0 1 .75-.75Zm1.75-6a1.75 1.75 0 0 0-1.744 1.606L10.25 5h3.5A1.75 1.75 0 0 0 12 3.25Z" fill="currentColor" />
    </svg>
  );
}

/* ── 注册默认工具项 ── */

toolbarFactory.register({
  id: 'select-all',
  icon: SelectAllIcon,
  label: '全选',
});

toolbarFactory.register({
  id: 'delete-selected',
  icon: DeleteSelectedIcon,
  label: '删除选中',
});

/** 工具栏组件 Props */
interface WorkspaceToolbarProps {
  /** 选中数量，用于部分工具项的禁用判断 */
  selectedCount: number;
  /** 总文件数 */
  totalCount: number;
  /** 全选/全不选回调 */
  onSelectAll: () => void;
  /** 删除选中项回调 */
  onDeleteSelected: () => void;
  /** 是否正在运行 */
  isRunning?: boolean;
}

/**
 * WorkspaceToolbar — 工作台工具栏
 * 横置侧边栏风格，通过工厂注册方式维护工具项
 */
export default function WorkspaceToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeleteSelected,
  isRunning,
}: WorkspaceToolbarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // 从工厂获取已注册的工具项配置，绑定运行时状态和回调
  const allSelected = totalCount > 0 && selectedCount === totalCount;
  const items: ToolbarItem[] = toolbarFactory.getAll().map((config) => {
    let disabled = false;
    let active = false;
    let onClick = () => {};

    switch (config.id) {
      case 'select-all':
        active = allSelected;
        onClick = onSelectAll;
        break;
      case 'delete-selected':
        disabled = !!isRunning;
        onClick = onDeleteSelected;
        break;
      default:
        break;
    }

    return { ...config, disabled, active, onClick };
  });

  // 紧凑尺寸参数（原侧边栏参数缩小 20%）
  const buttonSize = 32;
  const marginX = 2;
  const marginY = 6;
  const iconSize = 16;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      background: 'var(--bg-surface-1)',
      flexShrink: 0,
      height: `${buttonSize + 2 * marginY}px`,
      padding: `0 12px`,
    }}>
      {items.map((item) => {
        const IconComponent = item.icon;
        const isHovered = hoveredId === item.id;

        return (
          <button
            key={item.id}
            onClick={item.onClick}
            disabled={item.disabled}
            title={item.label}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              width: `${buttonSize}px`,
              height: `${buttonSize}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              borderRadius: '4px',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              background: item.active
                ? 'var(--bg-surface-3)'
                : isHovered && !item.disabled
                  ? 'var(--bg-surface-3)'
                  : 'transparent',
              color: item.active
                ? 'var(--text-primary)'
                : item.disabled
                  ? 'var(--text-disabled)'
                  : isHovered
                    ? 'var(--text-secondary)'
                    : 'var(--text-muted)',
              margin: `0 ${marginX}px`,
              padding: 0,
              flexShrink: 0,
              transition: 'background 150ms ease, color 150ms ease',
              opacity: item.disabled ? 0.4 : 1,
            }}
          >
            <IconComponent size={iconSize} />
          </button>
        );
      })}
    </div>
  );
}
