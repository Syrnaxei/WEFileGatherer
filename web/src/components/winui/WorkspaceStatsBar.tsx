import React, { useState } from 'react';
import { PlayIcon, PauseIcon } from './SettingsIcons';
import { ArrowSyncIcon } from '../FluentIcons';

/**
 * WorkspaceStatsBar — 工作台融合统计摘要栏
 * 左侧显示文件统计指标，右侧放置图标操作按钮
 */

interface WorkspaceStatsBarProps {
  total: number;
  tagged?: number;
  processed: number;
  failed: number;
  isRunning: boolean;
  onLoad: () => void;
  onStart: () => void;
  onStop: () => void;
  /** 是否启用毛玻璃效果 */
  glassEnabled?: boolean;
  /** 毛玻璃模糊值（px），默认 16 */
  glassBlur?: number;
  /** 展开后显示的路径信息 */
  pathInfo?: React.ReactNode;
}

export default function WorkspaceStatsBar({
  total,
  tagged,
  processed,
  failed,
  isRunning,
  onLoad,
  onStart,
  onStop,
  glassEnabled = true,
  glassBlur = 16,
}: WorkspaceStatsBarProps) {
  const pending = Math.max(0, total - processed - failed);

  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handlePanelClick = () => {
    setExpanded((prev) => !prev);
  };

  const btnBase: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 150ms ease',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      padding: '10px 20px',
      background: glassEnabled ? 'rgba(37,37,54,0.42)' : 'var(--bg-surface-1)',
      borderRadius: 'var(--radius-lg)',
      border: glassEnabled ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border-default)',
      boxShadow: glassEnabled ? '0 8px 32px rgba(0,0,0,0.35)' : 'var(--shadow-md)',
      WebkitBackdropFilter: glassEnabled ? `blur(${glassBlur}px)` : undefined,
      backdropFilter: glassEnabled ? `blur(${glassBlur}px)` : undefined,
      userSelect: 'none',
      cursor: 'pointer',
      filter: hovered && !isRunning ? 'brightness(1.08)' : 'none',
      transition: 'filter 150ms ease',
    }}
    onClick={handlePanelClick}
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}
    >
      {/* 主行：统计指标 + 操作按钮 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        width: '100%',
      }}>
        {/* 待处理主指标 */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--accent)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '-0.02em',
          }}>
            {total}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            个文件待处理
          </span>
        </div>

        {/* 分隔线 */}
        <div style={{
          width: '1px',
          height: '22px',
          background: 'var(--border-default)',
          flexShrink: 0,
        }} />

        {/* 统计指标 */}
        <div style={{ display: 'flex', gap: '18px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
          {tagged !== undefined && (
            <span style={{ color: 'var(--text-muted)' }}>
              已标记 <b style={{ color: 'var(--info)', fontWeight: 600 }}>{tagged}</b>
            </span>
          )}
          <span style={{ color: 'var(--text-muted)' }}>
            已处理 <b style={{ color: 'var(--success)', fontWeight: 600 }}>{processed}</b>
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            失败 <b style={{ color: 'var(--error)', fontWeight: 600 }}>{failed}</b>
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            待处理 <b style={{ color: 'var(--accent)', fontWeight: 600 }}>{pending}</b>
          </span>
        </div>

        {/* 弹性空间 */}
        <div style={{ flex: 1 }} />

        {/* 操作按钮组 */}
        <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
          <button
            title="加载文件"
            aria-label="加载文件"
            style={{
              ...btnBase,
              color: 'var(--accent)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onLoad();
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-muted)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <ArrowSyncIcon size={20} />
          </button>

          <button
            title="启动处理"
            aria-label="启动处理"
            disabled={isRunning || total === 0}
            style={{
              ...btnBase,
              color: 'var(--success)',
              opacity: isRunning || total === 0 ? 0.4 : 1,
              cursor: isRunning || total === 0 ? 'not-allowed' : 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onStart();
            }}
            onMouseEnter={(e) => {
              if (!isRunning && total > 0) {
                e.currentTarget.style.background = 'var(--success-muted)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <PlayIcon size={20} />
          </button>

          <button
            title="暂停处理"
            aria-label="暂停处理"
            disabled={!isRunning}
            style={{
              ...btnBase,
              color: 'var(--error)',
              opacity: !isRunning ? 0.4 : 1,
              cursor: !isRunning ? 'not-allowed' : 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onStop();
            }}
            onMouseEnter={(e) => {
              if (isRunning) {
                e.currentTarget.style.background = 'var(--error-muted)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <PauseIcon size={20} />
          </button>
        </div>
      </div>

      {/* 展开面板 — 路径信息 */}
      {pathInfo && (
        <div style={{
          maxHeight: expanded ? '80px' : '0px',
          opacity: expanded ? 1 : 0,
          overflow: 'hidden',
          borderTop: expanded ? '1px solid var(--border-default)' : '1px solid transparent',
          marginTop: expanded ? '10px' : '0px',
          transition: 'max-height 300ms ease, opacity 250ms ease, margin-top 300ms ease, border-top 300ms ease',
          width: '100%',
        }}>
          <div style={{
            padding: '6px 0 2px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent)',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            userSelect: 'text',
          }}>
            {pathInfo}
          </div>
        </div>
      )}
    </div>
  );
}
