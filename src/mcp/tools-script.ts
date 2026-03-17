import { z } from 'zod';
import type { LocalToolServer } from './local-tool-server';
import type { BridgeToolContext } from './tools-shared';
import { toInputSchema, errorMessage } from './tools-shared';

const ALLOWED_MACRO_METHODS = new Set([
  'getSceneTree', 'getAllNodesList', 'getSceneStats', 'getNodeDetail',
  'findNodeByPath', 'getNodeComponents', 'setNodePosition', 'setNodeRotation',
  'setNodeScale', 'setNodeName', 'setNodeActive', 'createChildNode',
  'destroyNode', 'reparentNode', 'addComponent', 'removeComponent',
  'setComponentProperty', 'dispatchQuery', 'dispatchOperation', 'dispatchEngineAction',
]);

export function registerScriptTools(server: LocalToolServer, ctx: BridgeToolContext): void {
  const { bridgePost, sceneMethod, text } = ctx;

  server.tool(
    'execute_script',
    `Execute arbitrary scene-script methods in the Cocos Creator scene context.
Use this as an ESCAPE HATCH when the other tools (scene_query, scene_operation, asset_operation, editor_action) do not cover your needs.
The method runs inside the editor scene process with full access to the engine API (cc.*, nodes, components).

Parameters:
- method(REQUIRED): Name of the scene-script method to call. Common methods: "dispatchQuery", "dispatchOperation", "createChildNode", "setNodePosition".
- args(optional): Array of arguments to pass to the method. Each element is a positional argument.

WARNING: This tool has NO validation. Prefer using the specific tools (scene_query, scene_operation) when possible.

Returns: The raw return value from the scene method, JSON-serialized. On error: {error:"message"}.
Prerequisites: The method must be exposed by scene.ts (see listMethods for available methods). For dispatchQuery/dispatchOperation, args is [{action:"...", ...params}].`,
    toInputSchema({
      method: z.string().describe(
        'Scene-script method name to call. REQUIRED. Must be a valid method exposed by the scene script. ' +
        'Common methods: "dispatchQuery", "dispatchOperation", "dispatchEngineAction", ' +
        '"createChildNode", "setNodePosition", "setNodeRotation", "setNodeScale", ' +
        '"addComponent", "removeComponent", "setComponentProperty", "destroyNode".'
      ),
      args: z.array(z.unknown()).optional().describe(
        'Arguments array to pass to the method. Each element is a positional argument. ' +
        'Example for dispatchQuery: [{"action": "tree"}]. Example for setNodePosition: ["uuid-here", 100, 200, 0].'
      ),
    }),
    async (params) => {
      try {
        const p = params as Record<string, unknown>;
        const methodText = typeof p.method === 'string' ? p.method : '';
        const forwardedArgs = Array.isArray(p.args) ? p.args : [];
        return text(await sceneMethod(methodText, forwardedArgs));
      } catch (err: unknown) {
        return text({ tool: 'execute_script', error: errorMessage(err) }, true);
      }
    },
  );

  server.tool(
    'register_custom_macro',
    `Register a named macro that chains existing scene methods. The macro calls a pre-defined scene method with given arguments.
Arbitrary code execution is NOT allowed — only whitelisted scene methods can be used.

Parameters:
- name(REQUIRED): Unique tool name (alphanumeric & underscores only). The macro will be registered as "macro_{name}".
- description(REQUIRED): Clear human-readable description of what the macro does.
- sceneMethodName(REQUIRED): Name of an existing whitelisted scene method to call.

Allowed methods: ${[...ALLOWED_MACRO_METHODS].join(', ')}`,
    toInputSchema({
      name: z.string().regex(/^[a-zA-Z0-9_]+$/).describe(
        'Unique macro name (alphanumeric & underscores only). REQUIRED. The tool will be registered as "macro_{name}". Example: "quick_sprite_setup".'
      ),
      description: z.string().describe(
        'Clear description of what this macro does. REQUIRED. Will be shown to AI clients as the tool description.'
      ),
      sceneMethodName: z.string().describe(
        'Name of an existing whitelisted scene method to call. REQUIRED. ' +
        `Must be one of: ${[...ALLOWED_MACRO_METHODS].join(', ')}.`
      ),
    }),
    async (params) => {
      const p = params as Record<string, unknown>;
      try {
        const methodName = String(p.sceneMethodName || '');
        if (!ALLOWED_MACRO_METHODS.has(methodName)) {
          return text({
            error: `方法 "${methodName}" 不在允许列表中。`,
            allowedMethods: [...ALLOWED_MACRO_METHODS],
          }, true);
        }

        const safeName = `macro_${p.name}`;

        server.tool(
          safeName,
          `[Macro] ${p.description}`,
          toInputSchema({ args: z.array(z.unknown()).optional().describe('Arguments to pass to the underlying scene method.') }),
          async (macroParams) => {
            const callArgs = Array.isArray((macroParams as Record<string, unknown>).args)
              ? (macroParams as Record<string, unknown>).args as unknown[]
              : [];
            try {
              return text(await sceneMethod(methodName, callArgs));
            } catch (e: unknown) {
              return text({ error: errorMessage(e) }, true);
            }
          }
        );

        await bridgePost('/api/console/log', { text: `[MCP] 宏注册成功: ${safeName} → ${methodName}` });

        return text({
          success: true,
          message: `Macro ${safeName} registered, calling scene method: ${methodName}`,
        });
      } catch (err: unknown) {
        return text({ error: errorMessage(err) }, true);
      }
    },
  );
}
