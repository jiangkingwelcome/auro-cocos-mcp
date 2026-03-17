// ---------------------------------------------------------------------------
// 统一错误处理工具模块
// 提供错误分类、日志记录和安全忽略机制
// ---------------------------------------------------------------------------

const LOG_PREFIX = '[Aura]';

/**
 * 错误类别枚举
 */
export enum ErrorCategory {
  /** 序列化/反序列化失败（如 JSON.parse、JSON.stringify） */
  SERIALIZATION = 'SERIALIZATION',
  /** 属性赋值失败（如组件属性不存在或只读） */
  PROPERTY_ASSIGN = 'PROPERTY_ASSIGN',
  /** 资源操作失败（如目录创建、资源查询） */
  ASSET_OPERATION = 'ASSET_OPERATION',
  /** 引擎 API 调用失败（如 Quat.toEuler、tryCompile） */
  ENGINE_API = 'ENGINE_API',
  /** 类型检查/反射失败（如 instanceof 检查） */
  REFLECTION = 'REFLECTION',
  /** 编辑器消息/IPC 通信失败 */
  EDITOR_IPC = 'EDITOR_IPC',
  /** 配置/设置加载失败 */
  CONFIG = 'CONFIG',
  /** 其他/未分类 */
  UNKNOWN = 'UNKNOWN',
}

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,
  WARN = 1,
  ERROR = 2,
  SILENT = 3,
}

let currentLogLevel: LogLevel = LogLevel.DEBUG;

export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

/**
 * 从 catch 参数中提取错误消息
 */
function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try { return JSON.stringify(err); } catch { return String(err); }
}

/**
 * 记录被安全忽略的错误（替代静默 catch）
 * 用于那些预期可能失败且失败不影响主流程的操作
 */
export function logIgnored(category: ErrorCategory, context: string, err?: unknown): void {
  if (currentLogLevel > LogLevel.DEBUG) return;
  const msg = err !== undefined ? `${context}: ${extractMessage(err)}` : context;
  console.debug(`${LOG_PREFIX} [${category}] 已忽略: ${msg}`);
}

/**
 * 记录警告级别的错误
 * 用于可恢复但值得注意的问题
 */
export function logWarn(category: ErrorCategory, context: string, err?: unknown): void {
  if (currentLogLevel > LogLevel.WARN) return;
  const msg = err !== undefined ? `${context}: ${extractMessage(err)}` : context;
  console.warn(`${LOG_PREFIX} [${category}] ${msg}`);
}

/**
 * 记录错误级别的错误
 */
export function logError(category: ErrorCategory, context: string, err?: unknown): void {
  if (currentLogLevel > LogLevel.ERROR) return;
  const msg = err !== undefined ? `${context}: ${extractMessage(err)}` : context;
  console.error(`${LOG_PREFIX} [${category}] ${msg}`);
}

/**
 * 安全执行：捕获异常并记录，返回 fallback 值
 * 适用于「失败不影响主逻辑」的操作
 */
export function safeExec<T>(
  category: ErrorCategory,
  context: string,
  fn: () => T,
  fallback: T,
): T {
  try {
    return fn();
  } catch (err) {
    logIgnored(category, context, err);
    return fallback;
  }
}

/**
 * 安全执行异步操作
 */
export async function safeExecAsync<T>(
  category: ErrorCategory,
  context: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    logIgnored(category, context, err);
    return fallback;
  }
}

/**
 * 安全设置属性：尝试赋值，失败时记录并跳过
 * 返回成功赋值的 key 列表
 */
export function safeSetProperties(
  target: Record<string, unknown>,
  props: Record<string, unknown>,
  context: string,
): { applied: string[]; skipped: string[] } {
  const applied: string[] = [];
  const skipped: string[] = [];
  for (const [key, val] of Object.entries(props)) {
    try {
      target[key] = val;
      applied.push(key);
    } catch (err) {
      logIgnored(ErrorCategory.PROPERTY_ASSIGN, `${context}: 属性 "${key}" 赋值失败`, err);
      skipped.push(key);
    }
  }
  return { applied, skipped };
}

/**
 * 安全 JSON 序列化
 */
export function safeStringify(value: unknown, fallback?: string): string {
  try {
    return JSON.stringify(value);
  } catch {
    return fallback ?? String(value);
  }
}

/**
 * 安全 JSON 克隆（深拷贝）
 * 失败时返回 String(value)
 */
export function safeJsonClone(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}
