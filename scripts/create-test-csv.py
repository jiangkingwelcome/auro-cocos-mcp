import json
import csv

# 读取测试用例数据
with open('test-cases.json', 'r', encoding='utf-8') as f:
    test_cases = json.load(f)

# 创建 CSV
with open('test-cases.csv', 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.writer(f)

    # 写入表头
    writer.writerow([
        '测试ID',
        '工具名称',
        'Action名称',
        '测试标题',
        '输入参数(JSON)',
        '期望结果',
        '备注',
        '测试状态',
        '实际结果',
        '测试人员',
        '测试日期'
    ])

    # 写入数据
    for case in test_cases:
        input_json = json.dumps(case['input'], ensure_ascii=False)

        writer.writerow([
            case['id'],
            case['tool'],
            case['action'],
            case['title'],
            input_json,
            case['expected'],
            case['note'],
            '',  # 测试状态（待填写）
            '',  # 实际结果（待填写）
            '',  # 测试人员（待填写）
            ''   # 测试日期（待填写）
        ])

print(f'[OK] 已创建 CSV 测试表格: test-cases.csv')
