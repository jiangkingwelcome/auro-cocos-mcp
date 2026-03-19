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
  'new-scene',
  'save-scene', 
  'query-scene',
  'undo',
  'redo',
  
  // 节点操作
  'set-property',
  'remove-node',
  
  // 预制操作
  'create-prefab',
  'create-node-by-prefab',
  'enter-prefab-edit-mode',
  'exit-prefab-edit-mode',
  'apply-prefab',
  'revert-prefab',
  
  // 预览控制
  'pause',
  'stop',
  'step',
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
  'query-dependencies',
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
