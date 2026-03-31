import json

# 读取测试用例数据
with open('test-cases.json', 'r', encoding='utf-8') as f:
    test_cases = json.load(f)

# 按工具和 Action 分组
grouped = {}
for case in test_cases:
    tool = case['tool']
    action = case['action']
    if tool not in grouped:
        grouped[tool] = {}
    if action not in grouped[tool]:
        grouped[tool][action] = []
    grouped[tool][action].append(case)

# 生成 Markdown
md_content = []
md_content.append('# Cocos MCP Bridge - 测试用例清单\n')
md_content.append(f'> 共 {len(test_cases)} 个测试用例\n')
md_content.append('---\n')

# 工具名称映射
tool_names = {
    'bridge_status': '🔌 Bridge 状态',
    'scene_query': '🔍 场景查询',
    'scene_operation': '⚙️ 场景操作',
    'asset_operation': '📦 资源操作',
    'editor_control': '🎮 编辑器控制',
    'project_management': '📁 项目管理'
}

for tool, actions in grouped.items():
    tool_display = tool_names.get(tool, tool)
    md_content.append(f'\n## {tool_display}\n')

    for action, cases in actions.items():
        md_content.append(f'\n### `{action}`\n')

        for case in cases:
            md_content.append(f'\n#### 测试 #{case["id"]}: {case["title"]}\n')

            # 输入参数
            md_content.append('**输入参数:**\n')
            md_content.append('```json\n')
            md_content.append(json.dumps(case['input'], ensure_ascii=False, indent=2))
            md_content.append('\n```\n')

            # 期望结果
            md_content.append(f'**期望结果:** {case["expected"]}\n')

            # 备注
            if case['note']:
                md_content.append(f'**备注:** {case["note"]}\n')

            # 前置条件（可选）
            if case.get('prerequisites'):
                md_content.append(f'**前置条件:** {case["prerequisites"]}\n')
            if case.get('setupSteps'):
                md_content.append('**建议前置步骤（MCP）:**\n```json\n')
                md_content.append(json.dumps(case['setupSteps'], ensure_ascii=False, indent=2))
                md_content.append('\n```\n')

            if case.get('needsRetest'):
                rr = case.get('retestReason') or ''
                md_content.append(f'**需复测:** 是 — {rr}\n')

            # 人工测试结论（可选，与 tests/test-cases.csv 等同步维护）
            if case.get('manualVerification'):
                md_content.append(f'**人工测试结果:** {case["manualVerification"]}\n')

            md_content.append('---\n')

# 保存 Markdown
with open('TEST_CASES.md', 'w', encoding='utf-8') as f:
    f.write(''.join(md_content))

print(f'[OK] 已创建 Markdown 测试文档: TEST_CASES.md')
