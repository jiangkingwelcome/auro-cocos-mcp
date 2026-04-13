const fs = require('fs');
const path = require('path');

// 读取 HTML 文件
const htmlPath = path.join(__dirname, 'docs', 'ACTION_CAPABILITIES.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

// 提取 TC 对象的内容
const tcMatch = htmlContent.match(/const TC=\{([\s\S]*?)\};/);
if (!tcMatch) {
  console.error('无法找到 TC 对象');
  process.exit(1);
}

// 使用 eval 解析（在受控环境中）
const tcCode = `({${tcMatch[1]}})`;
const TC = eval(tcCode);

// 转换为测试用例数组
const testCases = [];
let caseId = 1;

for (const [toolName, toolData] of Object.entries(TC)) {
  for (const [actionName, cases] of Object.entries(toolData)) {
    if (Array.isArray(cases)) {
      cases.forEach((testCase) => {
        testCases.push({
          id: caseId++,
          tool: toolName,
          action: actionName,
          title: testCase.t,
          input: testCase.i,
          expected: testCase.e,
          note: testCase.n || ''
        });
      });
    }
  }
}

// 输出为 JSON
const outputPath = path.join(__dirname, 'test-cases.json');
fs.writeFileSync(outputPath, JSON.stringify(testCases, null, 2), 'utf-8');

console.log(`✓ 提取了 ${testCases.length} 个测试用例`);
console.log(`✓ 已保存到: ${outputPath}`);
