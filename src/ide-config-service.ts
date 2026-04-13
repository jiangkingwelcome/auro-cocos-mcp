import fs from 'fs';
import os from 'os';
import path from 'path';
import { exec } from 'child_process';
import { ErrorCategory, logIgnored } from './error-utils';

export const IDE_NAMES = [
  'cursor', 'windsurf', 'claude', 'trae', 'kiro', 'antigravity',
  'gemini-cli', 'codex', 'claude-code', 'codebuddy', 'comate',
] as const;

export type IdeName = (typeof IDE_NAMES)[number];

const TOML_IDES: ReadonlySet<string> = new Set(['codex']);
const CLI_IDES: ReadonlySet<string> = new Set(['claude-code']);

const KNOWN_SERVER_KEYS = ['aura-cocos', 'aura-for-cocos', 'cocos-bridge-ai-mcp', 'cocos-mcp-bridge'] as const;
const CANONICAL_KEY = 'aura-cocos';

type ExecAsyncOptions = {
  encoding?: BufferEncoding;
  timeout?: number;
  stdio?: ['pipe', 'pipe', 'pipe'];
};

type NodeRuntimeDetection = {
  ok: boolean;
  nodeCommand: string;
  message?: string;
};

function execAsync(command: string, options: ExecAsyncOptions = {}): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, options, (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({
        stdout: typeof stdout === 'string' ? stdout : String(stdout ?? ''),
        stderr: typeof stderr === 'string' ? stderr : String(stderr ?? ''),
      });
    });
  });
}

function getAppDataPath(appName: string, fileName: string): string {
  return process.platform === 'win32'
    ? path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), appName, fileName)
    : path.join(os.homedir(), 'Library', 'Application Support', appName, fileName);
}

export function getIdeConfigPath(ide: string): string {
  switch (ide) {
    case 'cursor': return path.join(os.homedir(), '.cursor', 'mcp.json');
    case 'windsurf': return path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json');
    case 'claude': return getAppDataPath('Claude', 'claude_desktop_config.json');
    case 'trae': return getAppDataPath('Trae', 'mcp.json');
    case 'kiro': return path.join(os.homedir(), '.kiro', 'mcp.json');
    case 'antigravity': return path.join(os.homedir(), '.gemini', 'antigravity', 'mcp_config.json');
    case 'gemini-cli': return path.join(os.homedir(), '.gemini', 'settings.json');
    case 'codex': return path.join(os.homedir(), '.codex', 'config.toml');
    case 'claude-code': return '';
    case 'codebuddy': return getAppDataPath('CodeBuddy', 'codebuddy_mcp_settings.json');
    case 'comate': return path.join(os.homedir(), '.baidu-comate', 'mcp.json');
    default: return '';
  }
}

export function hasOurEntry(filePath: string): boolean {
  if (!filePath) return false;
  try {
    if (!fs.existsSync(filePath)) return false;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return raw.includes('aura-cocos') || raw.includes('aura-for-cocos') || raw.includes('cocos-bridge-ai-mcp') || raw.includes('cocos-mcp-bridge');
  } catch (e) {
    logIgnored(ErrorCategory.CONFIG, `检查文件 "${filePath}" 是否包含插件入口失败`, e);
    return false;
  }
}

export async function hasOurEntryAsync(filePath: string): Promise<boolean> {
  if (!filePath) return false;
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    const raw = await fs.promises.readFile(filePath, 'utf-8');
    return raw.includes('aura-cocos') || raw.includes('aura-for-cocos') || raw.includes('cocos-bridge-ai-mcp') || raw.includes('cocos-mcp-bridge');
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err?.code !== 'ENOENT') {
      logIgnored(ErrorCategory.CONFIG, `检查文件 "${filePath}" 是否包含插件入口失败`, e);
    }
    return false;
  }
}

let _claudeCodeCached: boolean | null = null;
let _claudeCodeCacheTs = 0;
const CLAUDE_CODE_CACHE_TTL = 60_000;

function hasClaudeCodeEntry(): boolean {
  const now = Date.now();
  if (_claudeCodeCached !== null && now - _claudeCodeCacheTs < CLAUDE_CODE_CACHE_TTL) {
    return _claudeCodeCached;
  }
  try {
    exec('claude mcp list', { encoding: 'utf-8', timeout: 5000 }, (err: Error | null, stdout: string) => {
      _claudeCodeCached = !err && typeof stdout === 'string' && (stdout.includes('aura-cocos') || stdout.includes('aura-for-cocos'));
      _claudeCodeCacheTs = Date.now();
    });
  } catch {
    _claudeCodeCached = false;
    _claudeCodeCacheTs = now;
  }
  return _claudeCodeCached ?? false;
}

let _configStatusCache: Record<string, boolean> | null = null;
let _configStatusCacheTs = 0;
let _configStatusAsyncPromise: Promise<Record<string, boolean>> | null = null;
const CONFIG_STATUS_CACHE_TTL = 30_000;

export function getConfigStatus(): Record<string, boolean> {
  const now = Date.now();
  if (_configStatusCache && now - _configStatusCacheTs < CONFIG_STATUS_CACHE_TTL) {
    return _configStatusCache;
  }

  const configStatus: Record<string, boolean> = {};
  for (const ide of IDE_NAMES) {
    if (ide === 'claude-code') {
      configStatus[ide] = hasClaudeCodeEntry();
    } else {
      configStatus[ide] = hasOurEntry(getIdeConfigPath(ide));
    }
  }

  _configStatusCache = configStatus;
  _configStatusCacheTs = now;
  return configStatus;
}

export async function getConfigStatusAsync(): Promise<Record<string, boolean>> {
  const now = Date.now();
  if (_configStatusCache && now - _configStatusCacheTs < CONFIG_STATUS_CACHE_TTL) {
    return _configStatusCache;
  }
  if (_configStatusAsyncPromise) {
    return _configStatusAsyncPromise;
  }

  _configStatusAsyncPromise = (async () => {
    const entries = await Promise.all(
      IDE_NAMES.map(async (ide) => {
        if (ide === 'claude-code') return [ide, hasClaudeCodeEntry()] as const;
        return [ide, await hasOurEntryAsync(getIdeConfigPath(ide))] as const;
      }),
    );
    const configStatus = Object.fromEntries(entries) as Record<string, boolean>;
    _configStatusCache = configStatus;
    _configStatusCacheTs = Date.now();
    return configStatus;
  })();

  try {
    return await _configStatusAsyncPromise;
  } finally {
    _configStatusAsyncPromise = null;
  }
}

export function invalidateConfigStatusCache(): void {
  _configStatusCache = null;
  _configStatusCacheTs = 0;
  _configStatusAsyncPromise = null;
  _claudeCodeCached = null;
  _claudeCodeCacheTs = 0;
}

function getShimPath(): string {
  return path.join(__dirname, '..', 'stdio-shim', 'mcp-stdio-shim.cjs').replace(/\\/g, '/');
}

async function detectNodeRuntime(): Promise<NodeRuntimeDetection> {
  const candidates = process.platform === 'win32'
    ? [
      process.env.NODE_EXE,
      path.join(process.env.ProgramFiles || '', 'nodejs', 'node.exe'),
      path.join(process.env['ProgramFiles(x86)'] || '', 'nodejs', 'node.exe'),
      'node',
    ]
    : [process.env.NODE_EXE, '/usr/local/bin/node', '/opt/homebrew/bin/node', 'node'];

  for (const rawCandidate of candidates) {
    const candidate = String(rawCandidate || '').trim();
    if (!candidate) continue;

    if ((candidate.includes('/') || candidate.includes('\\')) && !fs.existsSync(candidate)) {
      continue;
    }

    const escaped = candidate.includes(' ') ? `"${candidate}"` : candidate;
    try {
      const { stdout } = await execAsync(`${escaped} -v`, { encoding: 'utf-8', timeout: 5000 });
      const version = (stdout || '').trim();
      if (version) {
        return {
          ok: true,
          nodeCommand: candidate,
          message: `检测到 Node.js ${version}`,
        };
      }
    } catch {
      // try next candidate
    }
  }

  return {
    ok: false,
    nodeCommand: 'node',
    message: process.platform === 'win32'
      ? '未检测到 Node.js。请先安装 Node.js LTS（建议 v20+），安装后重启 IDE 再重试。可使用命令：winget install OpenJS.NodeJS.LTS'
      : '未检测到 Node.js。请先安装 Node.js LTS（建议 v20+），安装后重启 IDE 再重试。',
  };
}

function writeJsonConfig(configPath: string, targetIDE: string, activePort: number, nodeCommand: string): { success: boolean; message: string; configPath?: string } {
  const dirPath = path.dirname(configPath);
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
    } catch (_e) {
      return { success: false, message: `无法创建目录: ${dirPath}。您是否安装了该应用？` };
    }
  }

  let config: Record<string, unknown> = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (_e) {
      console.warn('[Aura] 旧的配置文件解析失败，将重新生成');
    }
  }

  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  const servers = config.mcpServers as Record<string, unknown>;
  const shimPath = getShimPath();

  for (const key of KNOWN_SERVER_KEYS) {
    if (key !== CANONICAL_KEY) delete servers[key];
  }
  servers[CANONICAL_KEY] = {
    command: nodeCommand,
    args: [shimPath],
    env: {
      COCOS_BRIDGE_PORT: String(activePort),
    },
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

  console.log(`[Aura] 已写入 ${targetIDE} MCP 配置 (stdio 模式): ${configPath}`);
  return {
    success: true,
    message: `配置成功！已写入 ${targetIDE} (stdio 模式):\n${configPath}\n\n请重启该 IDE 以生效。\n\n✅ 使用 stdio 模式，端口变化和 Cocos 重启都能自动适应。`,
    configPath,
  };
}

function writeTomlConfig(configPath: string, targetIDE: string, activePort: number, nodeCommand: string): { success: boolean; message: string; configPath?: string } {
  const dirPath = path.dirname(configPath);
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
    } catch (_e) {
      return { success: false, message: `无法创建目录: ${dirPath}。您是否安装了该应用？` };
    }
  }

  let existing = '';
  if (fs.existsSync(configPath)) {
    try {
      existing = fs.readFileSync(configPath, 'utf-8');
    } catch (_e) {
      console.warn('[Aura] 旧的配置文件读取失败，将追加配置');
    }
  }

  const shimPath = getShimPath();
  const sectionHeader = '[mcp_servers.aura-cocos]';

  if (existing.includes(sectionHeader)) {
    const sectionRegex = /\[mcp_servers\.aura-cocos\][\s\S]*?(?=\n\[|$)/;
    const escapedNodeCommand = nodeCommand.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const newSection =
      `${sectionHeader}\n` +
      `command = "${escapedNodeCommand}"\n` +
      `args = ["${shimPath}"]\n` +
      `\n` +
      `[mcp_servers.aura-cocos.env]\n` +
      `COCOS_BRIDGE_PORT = "${activePort}"\n`;
    existing = existing.replace(sectionRegex, newSection);
  } else {
    const escapedNodeCommand = nodeCommand.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const newSection =
      `\n${sectionHeader}\n` +
      `command = "${escapedNodeCommand}"\n` +
      `args = ["${shimPath}"]\n` +
      `\n` +
      `[mcp_servers.aura-cocos.env]\n` +
      `COCOS_BRIDGE_PORT = "${activePort}"\n`;
    existing += newSection;
  }

  fs.writeFileSync(configPath, existing, 'utf-8');

  console.log(`[Aura] 已写入 ${targetIDE} MCP 配置 (TOML stdio 模式): ${configPath}`);
  return {
    success: true,
    message: `配置成功！已写入 ${targetIDE} (TOML stdio 模式):\n${configPath}\n\n请重启该 IDE 以生效。\n\n✅ 使用 stdio 模式，端口变化和 Cocos 重启都能自动适应。`,
    configPath,
  };
}

async function configureClaudeCode(activePort: number, nodeCommand: string): Promise<{ success: boolean; message: string }> {
  const shimPath = getShimPath();
  const escapedNodeCommand = nodeCommand.includes(' ') ? `"${nodeCommand}"` : nodeCommand;
  try {
    try {
      await execAsync('claude mcp remove --scope user aura-cocos', { encoding: 'utf-8', timeout: 10000, stdio: ['pipe', 'pipe', 'pipe'] });
    } catch { /* may not exist yet */ }

    await execAsync(
      `claude mcp add --scope user aura-cocos -e COCOS_BRIDGE_PORT=${activePort} -- ${escapedNodeCommand} "${shimPath}"`,
      { encoding: 'utf-8', timeout: 10000, stdio: ['pipe', 'pipe', 'pipe'] },
    );

    console.log('[Aura] 已通过 claude mcp add 注册 Claude Code MCP 配置');
    return {
      success: true,
      message: `配置成功！已通过 claude mcp add 注册到 Claude Code。\n\n下次启动 Claude Code 时将自动加载。\n\n✅ 使用 stdio 模式，端口变化和 Cocos 重启都能自动适应。`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      success: false,
      message: `Claude Code 配置失败。请确保已安装 Claude Code CLI (npm install -g @anthropic-ai/claude-code)。\n\n错误: ${msg}`,
    };
  }
}

export async function removeIDE(targetIDE: string): Promise<{ success: boolean; message: string }> {
  if (CLI_IDES.has(targetIDE)) {
    try {
      for (const key of KNOWN_SERVER_KEYS) {
        try {
          await execAsync(`claude mcp remove --scope user ${key}`, { encoding: 'utf-8', timeout: 10000, stdio: ['pipe', 'pipe', 'pipe'] });
        } catch { /* may not exist */ }
      }
      console.log('[Aura] 已通过 claude mcp remove 移除 Claude Code MCP 配置');
      invalidateConfigStatusCache();
      return { success: true, message: '已成功移除 Claude Code 配置。' };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, message: `移除失败: ${msg}` };
    }
  }

  if (TOML_IDES.has(targetIDE)) {
    const configPath = getIdeConfigPath(targetIDE);
    if (!configPath || !fs.existsSync(configPath)) {
      return { success: false, message: '未找到配置文件，无需移除。' };
    }
    try {
      let content = fs.readFileSync(configPath, 'utf-8');
      let found = false;
      for (const key of KNOWN_SERVER_KEYS) {
        const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`\\n?\\[mcp_servers\\.${escaped}\\][\\s\\S]*?(?=\\n\\[|$)`);
        if (re.test(content)) {
          content = content.replace(re, '');
          found = true;
        }
      }
      if (!found) {
        return { success: false, message: '配置文件中未找到 Aura 相关条目。' };
      }
      fs.writeFileSync(configPath, content, 'utf-8');
      console.log(`[Aura] 已从 ${targetIDE} TOML 配置中移除 Aura 条目`);
      invalidateConfigStatusCache();
      return { success: true, message: `已成功移除 ${targetIDE} 配置，请重启 IDE 生效。` };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, message: `移除失败: ${msg}` };
    }
  }

  // JSON IDE
  const configPath = getIdeConfigPath(targetIDE);
  if (!configPath || !fs.existsSync(configPath)) {
    return { success: false, message: '未找到配置文件，无需移除。' };
  }
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
    const servers = config.mcpServers as Record<string, unknown> | undefined;
    if (!servers) {
      return { success: false, message: '配置文件中未找到 mcpServers。' };
    }
    const removed: string[] = [];
    for (const key of KNOWN_SERVER_KEYS) {
      if (servers[key]) {
        delete servers[key];
        removed.push(key);
      }
    }
    if (removed.length === 0) {
      return { success: false, message: '配置文件中未找到 Aura 相关条目。' };
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    console.log(`[Aura] 已从 ${targetIDE} JSON 配置中移除: ${removed.join(', ')}`);
    invalidateConfigStatusCache();
    return { success: true, message: `已成功移除 ${targetIDE} 配置，请重启 IDE 生效。` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, message: `移除失败: ${msg}` };
  }
}

export async function configureIDE(targetIDE: string, activePort: number, isRunning: boolean): Promise<{ success: boolean; message: string; configPath?: string }> {
  if (!isRunning || !activePort) {
    return { success: false, message: '服务未启动，请先启动 Aura 服务' };
  }

  const nodeRuntime = CLI_IDES.has(targetIDE)
    ? {
        ok: true,
        nodeCommand: process.env.NODE_EXE?.trim() || 'node',
        message: '',
      }
    : await detectNodeRuntime();
  if (!nodeRuntime.ok) {
    return {
      success: false,
      message: `${nodeRuntime.message || '未检测到 Node.js'}\n\n安装完成后，请重启目标 IDE，再点击“注入配置”。`,
    };
  }

  let result;
  if (CLI_IDES.has(targetIDE)) {
    result = await configureClaudeCode(activePort, nodeRuntime.nodeCommand);
  } else {
    const configPath = getIdeConfigPath(targetIDE);
    if (!configPath) {
      return { success: false, message: `不支持的 IDE: ${targetIDE}` };
    }

    result = TOML_IDES.has(targetIDE)
      ? writeTomlConfig(configPath, targetIDE, activePort, nodeRuntime.nodeCommand)
      : writeJsonConfig(configPath, targetIDE, activePort, nodeRuntime.nodeCommand);
  }

  if (result.success) {
    const detectMsg = nodeRuntime.message ? `\n\n${nodeRuntime.message}` : '';
    result.message = `${result.message}${detectMsg}`;
    invalidateConfigStatusCache();
  }
  return result;
}
