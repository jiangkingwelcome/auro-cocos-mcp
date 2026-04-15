import shutil, os, zipfile, json

src = 'E:/gitproject/cocos/auro-cocos-mcp'
dst = 'E:/gitproject/cocos/auro-cocos-mcp/dist-plugin-release/aura-for-cocos'
rel = 'E:/gitproject/cocos/auro-cocos-mcp/dist-plugin-release'
baidu = 'E:/BaiduSyncdisk/aura-for-cocos'

# Clean dist-plugin-release
if os.path.exists(rel):
    shutil.rmtree(rel)

os.makedirs(dst + '/dist/panels/default/i18n', exist_ok=True)

# Copy dist files
shutil.copy(src + '/dist-release/package.json', dst + '/package.json')
for f in ['main.js', 'core.js', 'scene.js']:
    shutil.copy(src + '/dist-release/' + f, dst + '/dist/' + f)

shutil.copy(src + '/dist-release/panels/default/index.js', dst + '/dist/panels/default/index.js')
shutil.copytree(src + '/dist-release/panels/default/i18n', dst + '/dist/panels/default/i18n', dirs_exist_ok=True)
shutil.copytree(src + '/dist-release/stdio-shim', dst + '/stdio-shim', dirs_exist_ok=True)
shutil.copytree(src + '/mcp-config-templates', dst + '/mcp-config-templates', dirs_exist_ok=True)
shutil.copytree(src + '/docs', dst + '/docs', dirs_exist_ok=True)
shutil.copy(src + '/LICENSE', dst + '/LICENSE')
shutil.copy(src + '/README.md', dst + '/README.md')
os.makedirs(dst + '/native', exist_ok=True)
shutil.copy(src + '/native/index.js', dst + '/native/index.js')

# Get version
with open(dst + '/package.json', encoding='utf-8') as f2:
    ver = json.load(f2).get('version', 'unknown')

# Zip
zip_path = rel + '/aura-for-cocos-v' + ver + '-release.zip'
sep = os.sep
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(dst):
        for file in files:
            full = os.path.join(root, file)
            rel_path = os.path.relpath(full, dst)
            arcname = 'aura-for-cocos/' + rel_path.replace(sep, '/')
            zf.write(full, arcname)

# Sync to Baidu
if os.path.exists(baidu):
    shutil.rmtree(baidu)
shutil.copytree(dst, baidu)

total = sum(len(f) for _, _, f in os.walk(dst))
print(f'version: {ver}')
print(f'zip: {zip_path}')
print(f'files: {total}')
print(f'synced to: {baidu}')
print('done')
