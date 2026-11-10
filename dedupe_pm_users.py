#!/usr/bin/env python3
"""
PM 系统 · pm_user 重复账号清理脚本
========================================
问题：create_users_from_persons() 只按 username 去重，撞名时自动加数字后缀，
      加上服务器每次启动都会调用它，导致同一批 45 名员工被反复建号。
      从 2026-05-22 累积 127 次 → pm_user 5603 行（真实在册仅 45 人）。

策略：
  · 每个 person_id 只保留 1 个账号
      优先保留「登录过」的（last_login 非空）→ 其次保留「最早创建」的
  · 其余账号删除
  · notification.user_id 指向 pm_user.id → 删除前重映射到保留账号
      （task / task_participant / operation_log / attendance / performance
        都用 person_id，不受影响）

用法：
  python3 dedupe_pm_users.py --dry-run   # 只预览，不改数据（默认）
  python3 dedupe_pm_users.py --apply      # 实际执行（会先自动备份）
"""
import argparse
import os
import shutil
import sqlite3
import sys
from datetime import datetime

DB_PATH = os.environ.get('PM_DB_PATH', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'pm.db'))
BACKUP_DIR = os.path.dirname(DB_PATH)


def hash_password(pw):
    """与 pm_server.py 保持一致的口令散列"""
    import hashlib
    return hashlib.sha256(pw.encode()).hexdigest()


def pick_keep_ids(cur):
    """每个 person_id 选一个保留账号：登录过的优先，其次最早创建的。
    ★ 同时剔除「孤儿账号」——person_id 指向 person 表里已不存在的人员（人员已删除但账号残留）。"""
    rows = cur.execute(
        "SELECT u.id, u.person_id FROM pm_user u "
        "WHERE EXISTS (SELECT 1 FROM person p WHERE p.id = u.person_id) "
        "ORDER BY (u.last_login IS NULL), u.id ASC"
    ).fetchall()
    keep, seen = set(), set()
    for uid, pid in rows:
        if pid in seen:
            continue
        seen.add(pid)
        keep.add(uid)
    return keep, rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true', help='只预览（默认）')
    ap.add_argument('--apply', action='store_true', help='实际执行')
    args = ap.parse_args()
    apply = args.apply and not args.dry_run

    if not os.path.exists(DB_PATH):
        print(f'✗ 找不到数据库 {DB_PATH}')
        return 1

    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    total = cur.execute('SELECT COUNT(*) FROM pm_user').fetchone()[0]
    persons = cur.execute('SELECT COUNT(*) FROM person').fetchone()[0]
    active = cur.execute("SELECT COUNT(*) FROM person WHERE status='active'").fetchone()[0]
    keep, _ = pick_keep_ids(cur)
    all_ids = set(r[0] for r in cur.execute('SELECT id FROM pm_user'))
    to_delete = sorted(all_ids - keep)

    # 孤儿账号：person_id 指向 person 表里已不存在的人员
    orphan = cur.execute(
        "SELECT u.id, u.username, u.person_id FROM pm_user u "
        "WHERE NOT EXISTS (SELECT 1 FROM person p WHERE p.id = u.person_id)"
    ).fetchall()
    # 没有账号的人员（需补建）
    no_account = cur.execute(
        "SELECT p.id, p.name FROM person p "
        "WHERE NOT EXISTS (SELECT 1 FROM pm_user u WHERE u.person_id = p.id)"
    ).fetchall()

    # 重映射：被删账号 id → 该 person 保留的账号 id
    # ★ 孤儿账号（person_id 在 person 表中不存在）没有可映射目标 —— 其通知一并删除
    keep_by_person = {}
    for r in cur.execute('SELECT id, person_id FROM pm_user'):
        if r['id'] in keep:
            keep_by_person[r['person_id']] = r['id']
    remap = {}
    orphan_ids = set(r['id'] for r in orphan)
    for r in cur.execute('SELECT id, person_id FROM pm_user'):
        if r['id'] in to_delete:
            if r['id'] in orphan_ids:
                continue          # 孤儿账号：无映射目标
            remap[r['id']] = keep_by_person.get(r['person_id'])

    notif_total = cur.execute('SELECT COUNT(*) FROM notification').fetchone()[0]
    notif_affected = cur.execute(
        "SELECT COUNT(*) FROM notification WHERE user_id IN (%s)"
        % ','.join(str(i) for i in to_delete) if to_delete else "SELECT 0"
    ).fetchone()[0]

    logged_in = cur.execute(
        'SELECT id, username FROM pm_user WHERE last_login IS NOT NULL'
    ).fetchall()

    print('══ pm_user 去重清理预览 ══')
    print(f'  数据库      : {DB_PATH}')
    print(f'  当前账号数  : {total}')
    print(f'  在册员工    : {persons} 人（active {active} 人）')
    print(f'  目标账号数  : {len(keep)} 人（每人 1 个）')
    print(f'  将删除账号  : {len(to_delete)}')
    print(f'    ├ 重复账号: {len(to_delete) - len(orphan)}')
    print(f'    └ 孤儿账号: {len(orphan)}  '
          + ', '.join(f"{r['username']}(id={r['id']},person={r['person_id']})" for r in orphan))
    print(f'  需补建账号  : {len(no_account)} 人'
          + ('  ' + ', '.join(r['name'] for r in no_account) if no_account else ''))
    print(f'  通知需重映射: {notif_affected} / {notif_total} 条')
    print(f'  登录过的账号（全部保留）: '
          + ', '.join(f"{r['username']}(id={r['id']})" for r in logged_in))
    if keep:
        sample = cur.execute(
            'SELECT username FROM pm_user WHERE id IN (%s) ORDER BY id LIMIT 10'
            % ','.join(str(i) for i in sorted(keep))
        ).fetchall()
        print('  保留账号示例: ' + ', '.join(r[0] for r in sample))
        # 保留账号的密码 hash 是否统一（= 能否用同一默认密码登录）
        hs = cur.execute(
            'SELECT DISTINCT password_hash FROM pm_user WHERE id IN (%s)'
            % ','.join(str(i) for i in sorted(keep))
        ).fetchall()
        print(f'  保留账号密码种类: {len(hs)} 种'
              + ('（统一，可用同一默认密码登录）' if len(hs) == 1 else '（不统一，需逐个重置）'))

    if not apply:
        print('\n★ 这是干跑（--dry-run），数据未改动。确认无误后执行：')
        print(f'   python3 {os.path.basename(__file__)} --apply')
        conn.close()
        return 0

    ts = datetime.now().strftime('%Y%m%d_%H%M%S')
    bak = os.path.join(BACKUP_DIR, f'pm.db.bak_before_user_dedup_{ts}')
    shutil.copy2(DB_PATH, bak)
    print(f'\n✓ 已备份: {bak}')

    if notif_affected:
        remap_items = [(remap[old], old) for old in remap if remap.get(old)]
        cur.executemany(
            'UPDATE notification SET user_id=? WHERE user_id=?',
            remap_items
        )
        print(f'✓ 已重映射 {len(remap_items)} 条 notification.user_id')
        # 孤儿账号指向的通知：其接收人已不存在 → 随账号一并删除
        orphan_notif = cur.execute(
            'SELECT COUNT(*) FROM notification WHERE user_id IN (%s)'
            % ','.join(str(r['id']) for r in orphan)
        ).fetchone()[0] if orphan else 0
        if orphan_notif:
            cur.execute('DELETE FROM notification WHERE user_id IN (%s)'
                        % ','.join(str(r['id']) for r in orphan))
            print(f'✓ 已删除 {orphan_notif} 条孤儿账号通知')

    # 补建缺失账号（保证每个人员都有账号）
    if no_account:
        try:
            from pypinyin import lazy_pinyin, Style
            def gen_username(name, used):
                base = ''.join(lazy_pinyin(name, style=Style.FIRST_LETTER)).lower()
                if base not in used:
                    return base
                i = 1
                while f'{base}{i}' in used:
                    i += 1
                return f'{base}{i}'
        except ImportError:
            gen_username = None
        if gen_username:
            used = set(r[0] for r in cur.execute('SELECT username FROM pm_user'))
            pw_hash = hash_password(os.environ.get('PM_DEFAULT_PASSWORD', 'pm2026'))
            for p in no_account:
                un = gen_username(p['name'], used)
                used.add(un)
                cur.execute(
                    'INSERT INTO pm_user (person_id, username, password_hash, role) '
                    "VALUES (?, ?, ?, 'user')",
                    (p['id'], un, pw_hash)
                )
                print(f'✓ 补建账号: {un} -> {p["name"]}')
        else:
            print('★ 缺少 pypinyin，无法自动补建账号，请手动处理')

    if to_delete:
        chunk = 900
        for i in range(0, len(to_delete), chunk):
            part = to_delete[i:i + chunk]
            cur.execute('DELETE FROM pm_user WHERE id IN (%s)'
                        % ','.join(str(x) for x in part))
    conn.commit()

    after = cur.execute('SELECT COUNT(*) FROM pm_user').fetchone()[0]
    print(f'✓ 清理完成：{total} → {after}（删除 {total - after}）')
    dup = cur.execute(
        'SELECT COUNT(*) FROM (SELECT person_id FROM pm_user GROUP BY person_id HAVING COUNT(*)>1)'
    ).fetchone()[0]
    print(f'✓ 重复 person_id 组数: {dup}（应为 0）')
    conn.close()
    return 0


if __name__ == '__main__':
    sys.exit(main())
