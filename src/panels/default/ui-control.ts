// @ts-nocheck

function createButton(id, className, text) {
  const btn = document.createElement('button');
  btn.id = id;
  btn.className = className;
  btn.textContent = text;
  return btn;
}

export function mountVueControl(targetEl) {
  const root = document.createElement('div');
  root.className = 'mcp-tab-content flex-column';
  root.id = 'tabControl';

  const header = document.createElement('div');
  header.className = 'control-header';
  const title = document.createElement('h3');
  title.setAttribute('data-i18n', 'ctrl.title');
  title.textContent = '服务管理';
  const subtitle = document.createElement('p');
  subtitle.innerHTML = '<span data-i18n="ctrl.current_status_prefix">当前服务状态：</span><span id="ctrlStatusLabel" style="color:#f14c4c;font-weight:600;" data-i18n="ctrl.stopped">已停止</span>';
  header.appendChild(title);
  header.appendChild(subtitle);

  const grid = document.createElement('div');
  grid.className = 'button-grid';
  grid.appendChild(createButton('startBtn', 'btn btn-success', '▶ 启动服务'));
  grid.appendChild(createButton('stopBtn', 'btn btn-danger', '■ 停止服务'));

  const restart = createButton('restartBtn', 'btn btn-holo-btn full-width', '↻ 重启服务');

  const divider = document.createElement('div');
  divider.className = 'divider';

  const toolsHeader = document.createElement('div');
  toolsHeader.className = 'control-header';
  const toolsTitle = document.createElement('h3');
  toolsTitle.setAttribute('data-i18n', 'ctrl.tools_title');
  toolsTitle.textContent = '工具模块配置';
  const toolsDesc = document.createElement('p');
  toolsDesc.setAttribute('data-i18n', 'ctrl.tools_desc');
  toolsDesc.textContent = '关闭的工具 AI 将完全无法感知，实时生效。';
  toolsHeader.appendChild(toolsTitle);
  toolsHeader.appendChild(toolsDesc);

  const toolList = document.createElement('div');
  toolList.id = 'toolToggleList';
  toolList.className = 'tool-toggle-list';

  root.appendChild(header);
  root.appendChild(grid);
  root.appendChild(restart);
  root.appendChild(divider);
  root.appendChild(toolsHeader);
  root.appendChild(toolList);
  targetEl.replaceChildren(root);

  return {
    unmount() {
      targetEl.replaceChildren();
    },
  };
}
