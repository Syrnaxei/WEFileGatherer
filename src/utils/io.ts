import * as fs from 'fs/promises';
import * as path from 'path';
import { IFileContext } from '../core/context';

/**
 * 安全移动文件
 * 1. 自动递归创建目标目录
 * 2. 优先使用 fs.rename（原子操作）
 * 3. 若跨磁盘分区（EXDEV），降级为 fs.copyFile + fs.unlink
 *
 * @param src 源文件路径
 * @param dest 目标文件路径
 */
export async function safeMoveFile(src: string, dest: string): Promise<void> {
  // 确保目标目录存在
  await fs.mkdir(path.dirname(dest), { recursive: true });

  try {
    // 尝试原子重命名（同设备最快）
    await fs.rename(src, dest);
    console.log(`[safeMoveFile] Renamed (atomic): ${src} -> ${dest}`);
  } catch (err: any) {
    if (err.code === 'EXDEV') {
      // 跨磁盘分区，降级为 copy + unlink
      console.log(`[safeMoveFile] Cross-device detected, using copy+unlink: ${src} -> ${dest}`);
      await fs.copyFile(src, dest);
      await fs.unlink(src);
      console.log(`[safeMoveFile] Copied and unlinked: ${src} -> ${dest}`);
    } else {
      throw err;
    }
  }
}

/**
 * 解析目标路径模板
 * 将模板中的占位符替换为 IFileContext 中的实际值
 *
 * 支持的占位符：
 * - {filename}        : 当前文件名（不含路径）
 * - {originalFilename}: 原始文件名
 * - {ext}             : 当前文件扩展名
 * - {tag}             : 第一个标签
 * - {tag[n]}          : 第 n 个标签（从 0 开始）
 * - {metadata.xxx}    : 从 metadata 中取值（xxx 为键名）
 * - {YYYY}            : 当前年份
 * - {MM}              : 当前月份（补零）
 * - {DD}              : 当前日期（补零）
 *
 * @param template 路径模板，如 "/output/{tag}/{filename}"
 * @param ctx 文件流转上下文
 * @returns 解析后的绝对路径
 */
export function resolveTemplate(template: string, ctx: IFileContext): string {
  const now = new Date();

  return template.replace(/\{([^{}]+)\}/g, (match, inner: string) => {
    const key = inner.trim();

    // 支持 tag[n] 语法
    const tagIndexMatch = key.match(/^tag\[(\d+)\]$/);
    if (tagIndexMatch) {
      const idx = parseInt(tagIndexMatch[1], 10);
      return ctx.tags[idx] ?? '';
    }

    // 支持 metadata.xxx 语法
    const metadataMatch = key.match(/^metadata\.(.+)$/);
    if (metadataMatch) {
      const metaKey = metadataMatch[1];
      const val = ctx.metadata[metaKey];
      return val !== undefined ? String(val) : '';
    }

    switch (key) {
      case 'filename':
        return path.basename(ctx.currentPath);
      case 'originalFilename':
        return ctx.originalFileName;
      case 'ext':
        return path.extname(ctx.currentPath);
      case 'tag':
        return ctx.tags[0] ?? '';
      case 'YYYY':
        return now.getFullYear().toString();
      case 'MM':
        return String(now.getMonth() + 1).padStart(2, '0');
      case 'DD':
        return String(now.getDate()).padStart(2, '0');
      default:
        return match;
    }
  });
}
