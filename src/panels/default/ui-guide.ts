// @ts-nocheck

export function mountVueGuide(targetEl) {
  const root = document.createElement('div');
  root.className = 'mcp-tab-content flex-column';
  root.id = 'tabGuide';
  root.innerHTML = `
    <div class="control-header">
      <h3 data-i18n="guide.title">交互指南</h3>
      <p data-i18n="guide.desc">建议使用如下对话模式驱动引擎工作。</p>
    </div>
    <div class="guide-steps">
      <div class="guide-step">
        <div class="step-number">1</div>
        <div class="step-content">
          <div class="step-title" data-i18n="guide.step1_title">确认服务连通性</div>
          <div class="step-desc" data-i18n="guide.step1_desc">在 IDE 中检查 MCP Status，或提问 &quot;请测试一下 Cocos 桥接状态&quot;。</div>
        </div>
      </div>
      <div class="guide-step">
        <div class="step-number">2</div>
        <div class="step-content">
          <div class="step-title" data-i18n="guide.step2_title">选定操作目标</div>
          <div class="step-desc" data-i18n="guide.step2_desc">若要修改现有节点，请先在层级树选中，再对 AI 说 &quot;把当前选中的节点...&quot;。</div>
        </div>
      </div>
      <div class="guide-step">
        <div class="step-number">3</div>
        <div class="step-content">
          <div class="step-title" data-i18n="guide.step3_title">检查执行结果</div>
          <div class="step-desc" data-i18n="guide.step3_desc">AI 拥有读写双向能力，修改后编辑器内实时刷新，效果不对可说 &quot;撤销刚才的修改&quot;。</div>
        </div>
      </div>
    </div>
    <div class="divider"></div>
    <div class="control-header"><h3 data-i18n="guide.examples_title">示例提示词</h3></div>
    <div class="prompt-list">
      <button class="prompt-card"><span class="prompt-tag" data-i18n="guide.tag_scene">场景查询</span><div class="prompt-text" data-i18n="guide.prompt1">帮我分析当前场景的根节点结构，列出所有 Canvas 下的子节点。</div><div class="prompt-copy">⎘</div></button>
      <button class="prompt-card"><span class="prompt-tag" data-i18n="guide.tag_create">实例创建</span><div class="prompt-text" data-i18n="guide.prompt2">在当前选中的节点下，创建一个名为 “LoginButton” 的按钮，并添加 Widget 居中。</div><div class="prompt-copy">⎘</div></button>
    </div>
    <div class="info-box guide-tips">
      <div class="tips-title" data-i18n="guide.tips_title">开发建议</div>
      <ul class="tips-list">
        <li data-i18n="guide.tip1">尽量遵循单指令单操作，避免一条对话发布多个复杂引擎改动。</li>
        <li data-i18n="guide.tip2">若 AI 提示组件未导入，请先确保项目中已存在继承自 cc.Component 的脚本。</li>
      </ul>
    </div>
  `;
  targetEl.replaceChildren(root);
  return { unmount() { targetEl.replaceChildren(); } };
}
