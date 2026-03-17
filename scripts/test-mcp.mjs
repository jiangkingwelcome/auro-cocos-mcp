import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tokenFile = join(__dirname, '.mcp-token');
const token = existsSync(tokenFile) ? readFileSync(tokenFile, 'utf8').trim() : '';

const mcpPath = join(__dirname, 'stdio-shim', 'mcp-stdio-shim.cjs');

// Spawn the MCP stdio shim
const mcpProcess = spawn('node', [mcpPath], {
    env: { ...process.env, COCOS_MCP_TOKEN: token },
    stdio: ['pipe', 'pipe', 'inherit']
});

let messageId = 1;
const pendingRequests = new Map();

mcpProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const parsed = JSON.parse(line);
            if (parsed.id && pendingRequests.has(parsed.id)) {
                const { resolve } = pendingRequests.get(parsed.id);
                resolve(parsed);
                pendingRequests.delete(parsed.id);
            }
        } catch (e) {
            // Ignore non-JSON output
        }
    }
});

function sendRequest(method, params = {}) {
    return new Promise((resolve) => {
        const id = messageId++;
        const request = {
            jsonrpc: '2.0',
            id,
            method,
            params,
        };
        pendingRequests.set(id, { resolve });
        const payload = JSON.stringify(request) + '\n';
        mcpProcess.stdin.write(payload);
    });
}

async function runTests() {
    console.log('Initializing MCP Server...');
    await sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
    });
    await sendRequest('notifications/initialized');
    console.log('MCP Server Initialized.\n');

    console.log('------------------------------------------------');
    console.log('T1: Testing create_prefab_atomic');
    let res1 = await sendRequest('tools/call', {
        name: 'create_prefab_atomic',
        arguments: {
            prefabPath: 'db://assets/prefabs/TestHero.prefab',
            nodeName: 'TestHero',
            components: [{ type: 'Sprite' }]
        }
    });
    console.log(JSON.stringify(res1.result, null, 2));

    console.log('\n------------------------------------------------');
    console.log('T2: Testing import_and_apply_texture');
    let res2 = await sendRequest('tools/call', {
        name: 'import_and_apply_texture',
        arguments: {
            sourcePath: 'C:/Windows/Web/Wallpaper/Windows/img0.jpg', // Dummy path for testing
            targetUrl: 'db://assets/textures/bg.jpg'
        }
    });
    console.log(JSON.stringify(res2.result, null, 2));

    console.log('\n------------------------------------------------');
    console.log('T3: Testing setup_ui_layout');
    let res3 = await sendRequest('tools/call', {
        name: 'setup_ui_layout',
        arguments: {
            parentUuid: 'canvas-uuid', // We might get an error if canvas doesn't exist, but we just verify MCP routes it
            rootName: 'TestList',
            itemCount: 2
        }
    });
    console.log(JSON.stringify(res3.result, null, 2));

    console.log('\n------------------------------------------------');
    console.log('T4: Testing create_tween_animation_atomic');
    let res4 = await sendRequest('tools/call', {
        name: 'create_tween_animation_atomic',
        arguments: {
            nodeUuid: 'hero-uuid',
            duration: 1,
            tracks: [
                { property: 'position', keyframes: [{ time: 0, value: { x: 0, y: 0, z: 0 } }, { time: 1, value: { x: 100, y: 0, z: 0 } }] }
            ]
        }
    });
    console.log(JSON.stringify(res4.result, null, 2));

    console.log('\n------------------------------------------------');
    console.log('T5: Testing auto_fit_physics_collider');
    let res5 = await sendRequest('tools/call', {
        name: 'auto_fit_physics_collider',
        arguments: {
            nodeUuid: 'sprite-uuid'
        }
    });
    console.log(JSON.stringify(res5.result, null, 2));

    mcpProcess.kill();
    console.log('\nAll MCP tests finished.');
}

runTests().catch(console.error);
