/**
 * IPC 兼容性诊断工具
 * 
 * 在 Cocos 3.8.x 编辑器中运行此脚本，可输出所有 scene 模块 IPC 的可用性
 * 
 * 使用方法：
 * 1. 打开 Cocos 3.8.x 编辑器
 * 2. 在 Developer → Console 中执行：
 *    await Editor.Message.request('scene', 'query-scene')
 * 
 * 或者在扩展的 console 中执行此脚本
 */

// 需要测试的 scene 模块 IPC 消息列表
const SCENE_MESSAGES = [
  // 场景操作
  'save-scene', 'undo', 'redo', 'soft-reload', 'query-dirty',
  // Undo 系统
  'snapshot', 'snapshot-abort', 'begin-recording', 'end-recording', 'cancel-recording',
  // 节点操作
  'set-property', 'reset-property', 'remove-node', 'create-node', 'duplicate-node',
  'set-parent', 'create-component', 'remove-component',
  // 剪贴板
  'copy-node', 'paste-node', 'cut-node',
  // 数组操作
  'move-array-element', 'remove-array-element',
  // 组件方法
  'execute-component-method',
  // 预制操作
  'create-prefab', 'apply-prefab', 'restore-prefab',
  // 预览控制
  'editor-preview-set-play',
  // Gizmo
  'change-gizmo-tool', 'query-gizmo-tool-name',
  'change-gizmo-pivot', 'query-gizmo-pivot',
  'change-gizmo-coordinate', 'query-gizmo-coordinate',
  // 视图
  'change-is2D', 'query-is2D',
  'set-grid-visible', 'query-is-grid-visible',
  'set-icon-gizmo-3d', 'query-is-icon-gizmo-3d',
  'set-icon-gizmo-size', 'query-icon-gizmo-size',
  // 相机对齐
  'align-with-view', 'align-view-with-node',
  'focus-camera',
  // 查询
  'query-is-ready', 'query-node', 'query-component', 'query-node-tree',
  'query-nodes-by-asset-uuid', 'query-classes', 'query-component-has-script',
  'execute-scene-script',
];

// 需要测试的 asset-db 模块 IPC 消息列表
const ASSET_DB_MESSAGES = [
  'query-assets',
  'query-asset-info',
  'save-asset',
  'create-asset',
  'delete-asset',
  'open-asset',
  'move-asset',
  'import-asset',
  'refresh-asset',
  'query-url',
  'query-uuid',
  'copy-asset',
  'query-asset-meta',
  'save-asset-meta',
  'reimport-asset',
  'query-asset-dependencies',
];

// 需要测试的 builder 模块 IPC 消息列表
const BUILDER_MESSAGES = [
  'open',
  'start-build',
  'query-build-options',
];

// 需要测试的 selection 模块 IPC 消息列表
const SELECTION_MESSAGES = [
  'clear',
];

// 需要测试的 editor 模块 IPC 消息列表
const EDITOR_MESSAGES = [
  'config-get',
  'config-set',
];

/**
 * 测试单个 IPC 消息是否可用
 */
async function testIpc(module: string, message: string): Promise<{ available: boolean; error?: string }> {
  try {
    const result = await Editor.Message.request(module, message);
    return { available: true, result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { available: false, error: msg };
  }
}

/**
 * 测试所有消息并输出结果
 */
async function diagnoseIpc(): Promise<void> {
  console.log('========== IPC 兼容性诊断 ==========');
  console.log(`Cocos 版本: ${Editor.App.version}`);
  console.log(`时间: ${new Date().toISOString()}`);
  console.log('');
  
  const results: Record<string, Record<string, { available: boolean; error?: string }>> = {};
  
  // 测试 scene 模块
  console.log('>>> 测试 scene 模块...');
  results.scene = {};
  for (const msg of SCENE_MESSAGES) {
    const result = await testIpc('scene', msg);
    results.scene[msg] = result;
    console.log(`  ${result.available ? '✓' : '✗'} scene.${msg}`);
    if (!result.available) {
      console.log(`      错误: ${result.error}`);
    }
  }
  
  // 测试 asset-db 模块
  console.log('\n>>> 测试 asset-db 模块...');
  results.assetDb = {};
  for (const msg of ASSET_DB_MESSAGES) {
    const result = await testIpc('asset-db', msg);
    results.assetDb[msg] = result;
    console.log(`  ${result.available ? '✓' : '✗'} asset-db.${msg}`);
    if (!result.available) {
      console.log(`      错误: ${result.error}`);
    }
  }
  
  // 测试 builder 模块
  console.log('\n>>> 测试 builder 模块...');
  results.builder = {};
  for (const msg of BUILDER_MESSAGES) {
    const result = await testIpc('builder', msg);
    results.builder[msg] = result;
    console.log(`  ${result.available ? '✓' : '✗'} builder.${msg}`);
    if (!result.available) {
      console.log(`      错误: ${result.error}`);
    }
  }
  
  // 测试 selection 模块
  console.log('\n>>> 测试 selection 模块...');
  results.selection = {};
  for (const msg of SELECTION_MESSAGES) {
    const result = await testIpc('selection', msg);
    results.selection[msg] = result;
    console.log(`  ${result.available ? '✓' : '✗'} selection.${msg}`);
    if (!result.available) {
      console.log(`      错误: ${result.error}`);
    }
  }
  
  // 测试 editor 模块
  console.log('\n>>> 测试 editor 模块...');
  results.editor = {};
  for (const msg of EDITOR_MESSAGES) {
    const result = await testIpc('editor', msg);
    results.editor[msg] = result;
    console.log(`  ${result.available ? '✓' : '✗'} editor.${msg}`);
    if (!result.available) {
      console.log(`      错误: ${result.error}`);
    }
  }
  
  // 输出 JSON 格式结果，方便复制
  console.log('\n========== JSON 结果 ==========');
  console.log(JSON.stringify(results, null, 2));
  
  // 总结
  console.log('\n========== 总结 ==========');
  const allUnavailable: string[] = [];
  for (const [module, msgs] of Object.entries(results)) {
    for (const [msg, result] of Object.entries(msgs)) {
      if (!result.available) {
        allUnavailable.push(`${module}.${msg}`);
      }
    }
  }
  
  if (allUnavailable.length === 0) {
    console.log('✓ 所有 IPC 消息均可用');
  } else {
    console.log(`✗ 以下 ${allUnavailable.length} 个 IPC 消息不可用:`);
    allUnavailable.forEach(m => console.log(`  - ${m}`));
  }
}

// 执行诊断
diagnoseIpc();
