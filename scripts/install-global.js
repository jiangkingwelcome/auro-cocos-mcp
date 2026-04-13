#!/usr/bin/env node
/**
 * Aura - 项目级安装/注册脚本
 *
 * 用法:
 *   npm run install:global                             # 交互式输入项目路径
 *   npm run install:global -- --project "D:/MyGame"    # 指定项目路径
 *   npm run install:global -- --project "D:/MyGame" --project "D:/MyGame2"  # 一次注册多个项目
 *
 * 本脚本将在目标 Cocos Creator 项目的 extensions/ 目录下创建一个
 * 指向本插件源码的 Junction/Symlink，使得插件无需复制即可在目标项目中使用。
 *
 * 注意: Cocos Creator 3.7+ 不再扫描全局 ~/.CocosCreator/extensions/ 目录，
 *       只认项目级别的 {project}/extensions/ 目录。
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// ===================== 配置 =====================
const EXTENSION_NAME = 'aura-for-cocos';

// 插件源码目录 (即本脚本所在仓库的根目录)
const PLUGIN_SOURCE_DIR = path.resolve(__dirname, '..');

// ===================== 工具函数 =====================

function log(msg) {
    console.log(`[信息] ${msg}`);
}

function success(msg) {
    console.log(`[成功] ${msg}`);
}

function warn(msg) {
    console.warn(`[警告] ${msg}`);
}

function error(msg) {
    console.error(`[错误] ${msg}`);
}

/**
 * 验证是否为合法的 Cocos Creator 项目目录
 */
function isCocosProject(projectPath) {
    // Cocos Creator 项目必须有 assets 目录和 package.json
    const hasAssets = fs.existsSync(path.join(projectPath, 'assets'));
    const hasPackageJson = fs.existsSync(path.join(projectPath, 'package.json'));
    // 进一步验证: 检查是否存在 settings 或 .creator 目录
    const hasSettings = fs.existsSync(path.join(projectPath, 'settings'));
    const hasCreatorDir = fs.existsSync(path.join(projectPath, '.creator'));
    return hasAssets && hasPackageJson && (hasSettings || hasCreatorDir);
}

/**
 * 验证插件源码目录是否完整
 */
function validatePluginSource() {
    const mainJs = path.join(PLUGIN_SOURCE_DIR, 'dist', 'main.js');
    const packageJson = path.join(PLUGIN_SOURCE_DIR, 'package.json');

    if (!fs.existsSync(packageJson)) {
        error('找不到 package.json，请确认脚本位于正确的目录中。');
        process.exit(1);
    }

    if (!fs.existsSync(mainJs)) {
        warn('未检测到编译产物 (dist/main.js)，正在尝试自动构建...');
        try {
            execSync('npm run build', { cwd: PLUGIN_SOURCE_DIR, stdio: 'inherit' });
            success('自动构建完成！');
        } catch {
            error('自动构建失败！请先手动执行: npm run build');
            process.exit(1);
        }
    }
}

/**
 * 在目标项目中创建插件软链接
 */
function installToProject(projectPath) {
    const resolvedPath = path.resolve(projectPath);

    // 验证目标是否为 Cocos 项目
    if (!isCocosProject(resolvedPath)) {
        error(`"${resolvedPath}" 不是一个有效的 Cocos Creator 项目目录。`);
        error('有效的 Cocos 项目应包含 assets/ 目录、package.json 以及 settings/ 或 .creator/ 目录。');
        return false;
    }

    const extensionsDir = path.join(resolvedPath, 'extensions');
    const targetLink = path.join(extensionsDir, EXTENSION_NAME);

    // 确保 extensions 目录存在
    if (!fs.existsSync(extensionsDir)) {
        fs.mkdirSync(extensionsDir, { recursive: true });
        log(`已创建 extensions 目录: ${extensionsDir}`);
    }

    // 如果已存在，先清理
    if (fs.existsSync(targetLink)) {
        const stat = fs.lstatSync(targetLink);
        if (stat.isSymbolicLink() || stat.isDirectory()) {
            log('发现已存在旧版桥接插件，正在清理...');
            if (process.platform === 'win32') {
                // Windows Junction 使用 rmdir 删除
                try {
                    execSync(`cmd /c rmdir "${targetLink}"`, { stdio: 'pipe' });
                } catch {
                    // 如果 rmdir 失败，可能是普通目录
                    fs.rmSync(targetLink, { recursive: true, force: true });
                }
            } else {
                fs.rmSync(targetLink, { recursive: true, force: true });
            }
        }
    }

    // 创建软链接
    try {
        if (process.platform === 'win32') {
            // Windows: 使用 CMD 的 mklink /J（不需要管理员权限）
            execSync(`cmd /c mklink /J "${targetLink}" "${PLUGIN_SOURCE_DIR}"`, { stdio: 'pipe' });
        } else {
            // macOS/Linux: 使用原生 symlink
            fs.symlinkSync(PLUGIN_SOURCE_DIR, targetLink, 'dir');
        }
        success(`已将插件链接到项目: ${resolvedPath}`);
        return true;
    } catch (e) {
        error(`创建软链接失败: ${e.message}`);
        return false;
    }
}

/**
 * 交互式读取项目路径
 */
function askProjectPath() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        console.log('');
        console.log('请输入你的 Cocos Creator 项目路径（可以拖拽文件夹到终端窗口）:');
        rl.question('> ', (answer) => {
            rl.close();
            // 去除引号和空白
            resolve(answer.trim().replace(/^["']|["']$/g, ''));
        });
    });
}

// ===================== 主流程 =====================

async function main() {
    console.log('');
    console.log('====== Aura 安装/注册脚本 ======');
    console.log('');

    log(`插件源码目录: ${PLUGIN_SOURCE_DIR}`);

    // 1. 验证插件源码完整性
    validatePluginSource();

    // 2. 解析命令行参数中的项目路径
    const args = process.argv.slice(2);
    const projectPaths = [];
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--project' && i + 1 < args.length) {
            projectPaths.push(args[i + 1]);
            i++;
        }
    }

    // 3. 如果没有通过参数指定项目路径，进入交互模式
    if (projectPaths.length === 0) {
        const inputPath = await askProjectPath();
        if (!inputPath) {
            error('未输入项目路径，操作已取消。');
            process.exit(1);
        }
        projectPaths.push(inputPath);
    }

    // 4. 逐个安装
    let successCount = 0;
    for (const p of projectPaths) {
        console.log('');
        log(`正在安装到: ${p}`);
        if (installToProject(p)) {
            successCount++;
        }
    }

    // 5. 打印结果
    console.log('');
    if (successCount > 0) {
        console.log('======================================================');
        console.log(`✅ 安装完成！成功为 ${successCount} 个项目注册了 Aura。`);
        console.log('======================================================');
        console.log('');
        console.log('👉 接下来该怎么做？');
        console.log('1. 打开对应的 Cocos Creator 项目 (建议 >= 3.4.2)。');
        console.log('2. 插件会自动加载，如果在顶部菜单栏看到:');
        console.log('   [Aura] 菜单，说明安装成功！');
        console.log('3. 桥接服务将随编辑器自动启动，AI 会自动发现并连接。');
        console.log('');
    } else {
        console.log('❌ 所有项目安装均失败，请检查路径是否正确。');
    }
}

main().catch((e) => {
    error(`脚本执行异常: ${e.message}`);
    process.exit(1);
});
