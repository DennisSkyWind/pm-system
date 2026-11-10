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

# ★ 2026-11-10 改为正则规则：
#   原先这里硬编码了「待脱敏的真实值」本身，等于把敏感值留在公开仓库里。
#   现全部改为「按结构匹配、不含任何真实值」的正则 —— 规则更通用，也不再自曝。
import re
import re as _re

REGEX_SENSITIVE = [
    # 钉钉真实 user_id
    (_re.compile(r"os\.environ\.get\('PM_TARGET_USER',\s*'[^']*'\)"),
     "os.environ.get('PM_TARGET_USER', 'YOUR_DINGTALK_USER_ID')"),
    # API 目录里写死的真实登录口令
    (_re.compile(r'("username"\s*:\s*"[^"]*",\s*"password"\s*:\s*)"[^"]*"'),
     r'\1"changeme"'),
    # 硬编码本地路径（开源版改走环境变量）
    (_re.compile(r"FRONTEND_DIR = '[^']*'"),
     "FRONTEND_DIR = os.environ.get('PM_FRONTEND_DIR', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend'))"),
    (_re.compile(r"DB_PATH = '[^']*pm\.db'"),
     "DB_PATH = os.environ.get('PM_DB_PATH', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'pm.db'))"),
    (_re.compile(r"MEMOS_SCRIPT = '[^']*'"),
     "MEMOS_SCRIPT = os.environ.get('MEMOS_SCRIPT', '')"),
    (_re.compile(r"UPLOAD_DIR = '[^']*'"),
     "UPLOAD_DIR = os.environ.get('PM_UPLOAD_DIR', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'attachments'))"),
]

# ★ 内部署名/部门名等「非固定格式」的敏感值放在私有映射文件里，
#   公开仓库只保留占位符 —— 规则本身也不自曝真实值。
#   私有文件路径可用 PM_PRIVATE_MAP 指定；文件不存在则跳过这类规则。
def _load_private_map():
    import json as _json
    p = os.environ.get('PM_PRIVATE_MAP',
                       os.path.join(os.path.dirname(os.path.abspath(__file__)), 'private_map.json'))
    if not os.path.isfile(p):
        return {}
    try:
        with open(p, 'r', encoding='utf-8') as f:
            return _json.load(f)
    except Exception:
        return {}


for _k, _v in _load_private_map().items():
    REGEX_SENSITIVE.append((_re.compile(re.escape(_k)), 'XX公司'))



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
    for pat, new in REGEX_SENSITIVE:
        content, n = pat.subn(new, content)
        changed += n

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

    # 复核：只检查本脚本负责的旧串是否已消失。
    # 注意：'pm2026' 还可能出现在 os.environ.get('PM_DEFAULT_PASSWORD', 'pm2026')，
    # 那一处由 sync-to-github.sh 里的 sed 单独处理，不归本脚本管，误报会掩盖真问题。
    # 复核：规则已改为「按结构匹配」，替换后的目标串仍会匹配同一正则，
    # 因此不能再用「原串是否消失」来判断 —— 改为检查通用泄漏特征。
    leaks = []
    if '/home/' in content and '.copaw' in content:
        leaks.append('本地绝对路径 /home/.../.copaw')
    if re.search(r"\.openclaw/workspace", content):
        leaks.append('工作区路径 .openclaw/workspace')
    if leaks:
        print(f'❌ 脱敏后仍残留: {leaks}')
        return 1
    print(f'✅ 后端脱敏完成（替换 {changed} 处），本脚本负责项无残留')
    return 0


if __name__ == '__main__':
    sys.exit(main())
