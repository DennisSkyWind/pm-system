#!/bin/bash
# PM系统同步到GitHub开源仓库
# 用法: bash sync-to-github.sh "提交说明"

SRC_FE=/home/ubuntu/.openclaw/workspace/pm-system
SRC_BE=/home/ubuntu/.copaw/scripts/pm_server.py
DST=/home/ubuntu/pm-open-source

if [ -z "$1" ]; then
  echo "用法: bash sync-to-github.sh \"提交说明\""
  exit 1
fi

echo "=== 同步PM系统到GitHub ==="

# 1. 同步后端
cp "$SRC_BE" "$DST/pm_server.py"
echo "✅ pm_server.py"

# 2. 同步前端核心文件
for f in index.html projects.html project.html tasks.html gantt.html issues.html persons.html phases.html report.html templates.html reminders.html admin.html settings.html login.html task-pdf-preview.html task-pdf-styles.html auth.js dark-mode.js dark-mode.css common.css mobile.css gantt-export.js kanban-export.js; do
  if [ -f "$SRC_FE/$f" ]; then
    cp "$SRC_FE/$f" "$DST/frontend/$f"
    echo "✅ $f"
  fi
done

# 3. 清理硬编码路径
echo ""
echo "🧹 清理硬编码路径和个人信息..."
cd "$DST"

python3 -c "
import os, re

# 后端路径清理
server = 'pm_server.py'
with open(server, 'r') as f:
    content = f.read()

path_map = {
    \"FRONTEND_DIR = '/home/ubuntu/.openclaw/workspace/pm-system'\": 
        \"FRONTEND_DIR = os.environ.get('PM_FRONTEND_DIR', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend'))\",
    \"DB_PATH = '/home/ubuntu/.copaw/data/pm.db'\": 
        \"DB_PATH = os.environ.get('PM_DB_PATH', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'pm.db'))\",
    \"MEMOS_SCRIPT = '/home/ubuntu/.copaw/scripts/write_to_memos.py'\": 
        \"MEMOS_SCRIPT = os.environ.get('MEMOS_SCRIPT', '')\",
    \"UPLOAD_DIR = '/home/ubuntu/.copaw/data/pm_attachments'\": 
        \"UPLOAD_DIR = os.environ.get('PM_UPLOAD_DIR', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'attachments'))\",
}

for old, new in path_map.items():
    content = content.replace(old, new)

if 'import os' not in content[:500]:
    content = 'import os\n' + content

with open(server, 'w') as f:
    f.write(content)

# 前端个人信息清理
personal_map = {
    '周泓武 → zhw': '张三 → zhangsan',
    '周泓武,admin,老周,zhou@email.com,13800138000': '张三,admin,技术部,zhangsan@example.com,13800138000',
    '陈玲,member,Migo,ling@email.com,13900139000': '李四,member,产品部,lisi@example.com,13900139000',
    '{\"name\": \"周泓武\", \"role\": \"admin\", \"department\": \"老周\"}': '{\"name\": \"张三\", \"role\": \"admin\", \"department\": \"技术部\"}',
    '{\"name\": \"陈玲\", \"role\": \"member\", \"department\": \"Migo\"}': '{\"name\": \"李四\", \"role\": \"member\", \"department\": \"产品部\"}',
    \"author_name: '老周'\": \"author_name: ''\",
}

for root, dirs, files in os.walk('frontend'):
    for fn in files:
        if not fn.endswith(('.html', '.js', '.css')):
            continue
        fp = os.path.join(root, fn)
        with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        changed = False
        for old, new in personal_map.items():
            if old in content:
                content = content.replace(old, new)
                changed = True
        if changed:
            with open(fp, 'w') as f:
                f.write(content)

print('✅ 路径和个人信息已清理')
"

# 4. 检查是否有变更
if git diff --quiet && git diff --cached --quiet; then
  echo "📌 无变更，跳过提交"
  exit 0
fi

# 5. 提交推送
git add -A
git commit -m "$1"
git push origin main

echo ""
echo "✅ 同步完成！已推送到 GitHub"
