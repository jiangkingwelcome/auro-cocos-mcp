import fs from 'fs';
import path from 'path';
import os from 'os';
import { ErrorCategory, logIgnored, logError } from './error-utils';

const REGISTRY_FILE = path.join(os.homedir(), '.aura-ports.json');

/**
 * 更新端口注册表：记录当前项目的 MCP 服务端口和 Token。
 * 同时清理已退出进程的僵尸条目。
 */
export function updateRegistry(port: number, token: string): void {
  try {
    const projectPath = Editor.Project?.path || process.cwd();
    let registry: Record<string, unknown> = {};
    if (fs.existsSync(REGISTRY_FILE)) {
      try {
        registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'));
      } catch (_e) { }
    }

    // Clean up dead processes
    for (const key in registry) {
      const entry = registry[key] as Record<string, unknown> | undefined;
      const pid = entry?.pid as number | undefined;
      if (pid) {
        try {
          process.kill(pid, 0);
        } catch (_e) {
          delete registry[key];
        }
      }
    }

    const projectName = Editor.Project?.name || path.basename(projectPath);

    registry[projectPath] = {
      name: projectName,
      port,
      token,
      pid: process.pid,
      timestamp: Date.now(),
    };
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2), 'utf-8');
  } catch (e) {
    logError(ErrorCategory.CONFIG, '更新端口注册表失败', e);
  }
}

/**
 * 从端口注册表中移除当前项目的条目。
 * 仅在 PID 匹配当前进程时才执行移除，防止误删其他实例的条目。
 */
export function removeRegistry(): void {
  try {
    const projectPath = Editor.Project?.path || process.cwd();
    let registry: Record<string, unknown> = {};
    if (fs.existsSync(REGISTRY_FILE)) {
      try {
        registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'));
      } catch (e) { logIgnored(ErrorCategory.CONFIG, '移除注册表时解析 JSON 失败', e); }
    }

    const entry = registry[projectPath] as Record<string, unknown> | undefined;
    if (entry && entry.pid === process.pid) {
      delete registry[projectPath];
      fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2), 'utf-8');
    }
  } catch (e) {
    logError(ErrorCategory.CONFIG, '移除端口注册表失败', e);
  }
}
