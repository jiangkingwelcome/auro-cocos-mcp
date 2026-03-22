#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {
    bridgeUrl: process.env.BRIDGE_URL || 'http://127.0.0.1:7779',
    preset: 'bridge',
    nodeName: '',
    timeoutMs: 20000,
    sceneUrl: '',
    openFirstScene: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];
    if (key === '--bridge-url' && next) {
      args.bridgeUrl = next;
      i += 1;
    } else if (key === '--preset' && next) {
      args.preset = next;
      i += 1;
    } else if (key === '--node-name' && next) {
      args.nodeName = next;
      i += 1;
    } else if (key === '--timeout-ms' && next) {
      args.timeoutMs = Number(next) || args.timeoutMs;
      i += 1;
    } else if (key === '--scene-url' && next) {
      args.sceneUrl = next;
      i += 1;
    } else if (key === '--open-first-scene') {
      args.openFirstScene = true;
    }
  }

  return args;
}

function logStep(message) {
  console.log(`[smoke] ${message}`);
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${url}`);
  }
  return await res.json();
}

function readLocalToken() {
  const tokenPath = path.join(repoRoot, '.mcp-token');
  if (!fs.existsSync(tokenPath)) {
    return '';
  }
  return fs.readFileSync(tokenPath, 'utf8').trim();
}

async function getToken(bridgeUrl) {
  const local = readLocalToken();
  if (local) {
    return local;
  }

  const info = await fetchJson(`${bridgeUrl}/api/mcp/connection-info`);
  return String(info.token || '');
}

async function callTool(bridgeUrl, token, tool, input) {
  const payload = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: tool,
      arguments: input,
    },
  };

  const res = await fetchJson(`${bridgeUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MCP-Token': token,
    },
    body: JSON.stringify(payload),
  });

  if (res.error) {
    throw new Error(res.error.message || JSON.stringify(res.error));
  }

  const text = res.result?.content?.[0]?.text;
  if (typeof text !== 'string') {
    return res.result ?? res;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function isNoSceneError(result) {
  const message = typeof result?.error === 'string' ? result.error : '';
  return message.includes('没有打开的场景') || message.includes('场景未加载');
}

async function ensureBridge(bridgeUrl, token) {
  const status = await fetchJson(`${bridgeUrl}/api/status`);
  const connection = await fetchJson(`${bridgeUrl}/api/mcp/connection-info`);
  const bridgeStatus = await callTool(bridgeUrl, token, 'bridge_status', {});

  if (!status.ok && !status.running) {
    throw new Error('bridge status returned not running');
  }
  if (!connection.endpoint) {
    throw new Error('missing MCP endpoint from connection-info');
  }
  if (!bridgeStatus.connected) {
    throw new Error('bridge_status.connected is false');
  }

  logStep(`bridge online at ${connection.endpoint}`);
  return { status, connection, bridgeStatus };
}

async function ensureSceneReady(bridgeUrl, token, args) {
  let tree = await callTool(bridgeUrl, token, 'scene_query', { action: 'tree' });
  if (!tree?.error) {
    return tree;
  }

  if (!isNoSceneError(tree)) {
    throw new Error(`scene_query tree failed: ${JSON.stringify(tree)}`);
  }

  let sceneUrl = args.sceneUrl;
  if (!sceneUrl && args.openFirstScene) {
    const scenes = await callTool(bridgeUrl, token, 'scene_query', { action: 'list_all_scenes' });
    const first = Array.isArray(scenes?.scenes) ? scenes.scenes[0] : null;
    sceneUrl = first?.url || '';
  }

  if (!sceneUrl) {
    throw new Error('no scene is open; pass --scene-url or --open-first-scene');
  }

  logStep(`opening scene: ${sceneUrl}`);
  const opened = await callTool(bridgeUrl, token, 'editor_action', { action: 'open_scene', url: sceneUrl });
  if (opened?.error) {
    throw new Error(`open_scene failed: ${JSON.stringify(opened)}`);
  }

  const deadline = Date.now() + args.timeoutMs;
  while (Date.now() < deadline) {
    tree = await callTool(bridgeUrl, token, 'scene_query', { action: 'tree' });
    if (!tree?.error) {
      return tree;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`scene did not become ready after opening: ${sceneUrl}`);
}

async function runSceneBasic(bridgeUrl, token, args) {
  const tree = await ensureSceneReady(bridgeUrl, token, args);
  logStep(`scene tree ready: ${tree.name || tree.uuid || 'ok'}`);
}

async function runMaterialNode(bridgeUrl, token, nodeName) {
  if (!nodeName) {
    throw new Error('material-node preset requires --node-name');
  }
  const found = await callTool(bridgeUrl, token, 'scene_query', {
    action: 'find_nodes_by_name',
    name: nodeName,
  });
  const node = found?.nodes?.[0];
  if (!node?.uuid) {
    throw new Error(`node not found: ${nodeName}`);
  }
  const info = await callTool(bridgeUrl, token, 'scene_query', {
    action: 'get_material_info',
    uuid: node.uuid,
  });
  if (!info?.renderers?.length) {
    throw new Error(`material info empty for node: ${nodeName}`);
  }
  logStep(`material node ready: ${nodeName}`);
}

async function runAnimationNode(bridgeUrl, token, nodeName) {
  if (!nodeName) {
    throw new Error('animation-node preset requires --node-name');
  }
  const found = await callTool(bridgeUrl, token, 'scene_query', {
    action: 'find_nodes_by_name',
    name: nodeName,
  });
  const node = found?.nodes?.[0];
  if (!node?.uuid) {
    throw new Error(`node not found: ${nodeName}`);
  }
  const info = await callTool(bridgeUrl, token, 'scene_query', {
    action: 'get_animation_state',
    uuid: node.uuid,
  });
  if (info?.error) {
    throw new Error(`get_animation_state failed: ${info.error}`);
  }
  logStep(`animation node ready: ${nodeName}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = await getToken(args.bridgeUrl);

  if (!token) {
    throw new Error('missing MCP token');
  }

  await ensureBridge(args.bridgeUrl, token);

  switch (args.preset) {
    case 'bridge':
      break;
    case 'scene-basic':
      await runSceneBasic(args.bridgeUrl, token, args);
      break;
    case 'material-node':
      await runSceneBasic(args.bridgeUrl, token, args);
      await runMaterialNode(args.bridgeUrl, token, args.nodeName);
      break;
    case 'animation-node':
      await runSceneBasic(args.bridgeUrl, token, args);
      await runAnimationNode(args.bridgeUrl, token, args.nodeName);
      break;
    default:
      throw new Error(`unknown preset: ${args.preset}`);
  }

  logStep(`preset passed: ${args.preset}`);
}

main().catch((error) => {
  console.error(`[smoke] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
