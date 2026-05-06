/**
 * Electron IPC API 类型声明
 * 与 src/electron/preload.ts 中 exposeInMainWorld 的定义对齐
 */

export {};

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
