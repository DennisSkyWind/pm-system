#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""PM 系统后端文件脱敏器（2026-11-10 新增）。

★ 为什么需要独立文件：
  sync-to-github.sh 里的脱敏逻辑跑在 `python3 -c "..."` 中，双引号嵌套极易出问题；
  且 personal_map 只作用于 frontend/ 目录，管不到 pm_server.py。
  本脚本专门处理后端文件，独立、可测、无引号转义风险。

用法: python3 sanitize_backend.py <pm_server.py 路径>
"""
import os
import sys

# (旧串, 新串) —— 必须逐字匹配，不要用正则
SENSITIVE = [
    # 钉钉真实 user_id
    ("os.environ.get('PM_TARGET_USER', '周泓武#vQ==')",
     "os.environ.get('PM_TARGET_USER', 'YOUR_DINGTALK_USER_ID')"),
    # API 目录里写死的真实登录口令
    ('"username":"zhw","password":"pm2026"',
     '"username":"zhw","password":"changeme"'),
    # 硬编码本地路径（开源版改走环境变量）
    ("FRONTEND_DIR = '/home/ubuntu/.openclaw/workspace/pm-system'",
     "FRONTEND_DIR = os.environ.get('PM_FRONTEND_DIR', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend'))"),
    ("DB_PATH = '/home/ubuntu/.copaw/data/pm.db'",
     "DB_PATH = os.environ.get('PM_DB_PATH', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'pm.db'))"),
    ("MEMOS_SCRIPT = '/home/ubuntu/.copaw/scripts/write_to_memos.py'",
     "MEMOS_SCRIPT = os.environ.get('MEMOS_SCRIPT', '')"),
    ("UPLOAD_DIR = '/home/ubuntu/.copaw/data/pm_attachments'",
     "UPLOAD_DIR = os.environ.get('PM_UPLOAD_DIR', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'attachments'))"),
]


def main():
    if len(sys.argv) < 2:
        print('用法: python3 sanitize_backend.py <文件>')
        return 1
    path = sys.argv[1]
    if not os.path.isfile(path):
        print(f'⚠️ 文件不存在，跳过: {path}')
        return 0
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = 0
    for old, new in SENSITIVE:
        if old in content:
            content = content.replace(old, new)
            changed += 1

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

    # 复核：只检查本脚本负责的旧串是否已消失。
    # 注意：'pm2026' 还可能出现在 os.environ.get('PM_DEFAULT_PASSWORD', 'pm2026')，
    # 那一处由 sync-to-github.sh 里的 sed 单独处理，不归本脚本管，误报会掩盖真问题。
    leaks = [old for old, _ in SENSITIVE if old in content]
    if leaks:
        print(f'❌ 脱敏后仍残留: {leaks}')
        return 1
    print(f'✅ 后端脱敏完成（替换 {changed} 处），本脚本负责项无残留')
    return 0


if __name__ == '__main__':
    sys.exit(main())
