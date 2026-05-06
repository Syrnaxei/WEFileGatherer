import { contextBridge, ipcRenderer } from 'electron';

/**
 * Electron Preload 脚本
 * 安全地暴露主进程 API 到渲染进程
 */

contextBridge.exposeInMainWorld('electronAPI', {
  // 文件对话框
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),

  // 数据库统计
  getStats: (flowId?: string) => ipcRenderer.invoke('db:getStats', flowId),

  // 错误文件列表
  getErrors: (flowId?: string) => ipcRenderer.invoke('db:getErrors', flowId),

  // 丢弃文件
  discardFile: (traceId: string) => ipcRenderer.invoke('db:discard', traceId),

  // 崩溃恢复报告
  checkRecovery: () => ipcRenderer.invoke('recovery:check'),
});

// TypeScript 类型声明（供前端使用）
declare global {
  interface Window {
    electronAPI: {
      openDirectory: () => Promise<string | null>;
      getStats: (flowId?: string) => Promise<Record<string, number>>;
      getErrors: (flowId?: string) => Promise<any[]>;
      discardFile: (traceId: string) => Promise<{ success: boolean }>;
      checkRecovery: () => Promise<{
        total: number;
        running: any[];
        pending: any[];
        warnings: string[];
      }>;
    };
  }
}
