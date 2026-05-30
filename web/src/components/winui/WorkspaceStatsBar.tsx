import React from 'react';
import { PlayIcon, PauseIcon } from './SettingsIcons';
import { ArrowSyncIcon } from '../FluentIcons';

/**
 * WorkspaceStatsBar — 工作台融合统计摘要栏
 * 左侧显示文件统计指标，右侧放置图标操作按钮
 */

interface WorkspaceStatsBarProps {
  /** 文件总数 */
  total: number;
  /** 已标记数量（可选，不传则不显示） */
  tagged?: number;
  /** 已处理数量 */
  processed: number;
  /** 失败数量 */
  failed: number;
  /** 是否正在运行 */
  isRunning: boolean;
  /** 加载按钮回调 */
  onLoad: () => void;
  /** 启动按钮回调 */
  onStart: () => void;
  /** 停止按钮回调 */
  onStop: () => void;
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
}: WorkspaceStatsBarProps) {
  const pending = Math.max(0, total - processed - failed);

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
      alignItems: 'center',
      gap: '20px',
      padding: '10px 20px',
      background: 'rgba(37,37,54,0.42)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      WebkitBackdropFilter: 'blur(16px)',
      backdropFilter: 'blur(16px)',
      userSelect: 'none',
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
          onClick={onLoad}
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
          onClick={onStart}
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
          onClick={onStop}
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
  );
}
