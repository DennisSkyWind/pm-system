#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""人员维度周报：计算每人本周主导/参与的项目工作量、完成情况与评价。

★ 核心口径（2026-11-10 修订）：周报只反映"本周"。
  - 本周有动作 = completed_date 在本周 OR updated_at 在本周 OR created_at 在本周
  - 「我主导的任务」「我参与的任务」两个明细区块只列本周有动作的任务
  - 统计口径（本周完成/本周推进/本周新增/完成率）全部基于本周
  - 「当前在手」单独标注，明确是存量负荷，不混入本周产出
  - 绩效评分（performance 月度考核）不在周报呈现
"""
import re
from datetime import datetime, timedelta

RATING_LABELS = {
    'insufficient': '不足',
    'normal': '正常',
    'excellent': '优秀',
    'outstanding': '卓越',
}
RATING_ORDER = ['卓越', '优秀', '正常', '不足']
RATING_SCORE = {'卓越': 100, '优秀': 85, '正常': 70, '不足': 50}

_DATE_PAT = re.compile(r'(\d{4})-(\d{2})-(\d{2})')


def _date_of(value):
    """从 TIMESTAMP/DATE 字段里取出 YYYY-MM-DD。
    ★ 兼容两种实际格式：'2026-11-09T09:02:04.216544' 与 '2026-11-09 01:01:53'
    """
    if not value:
        return None
    m = _DATE_PAT.search(str(value))
    return m.group(0) if m else None


def _week_range(offset=0):
    """返回 (start, end, label)。offset=0 本周，-1 上周。"""
    today = datetime.now()
    monday = today - timedelta(days=today.weekday())
    monday = monday + timedelta(weeks=offset)
    sunday = monday + timedelta(days=6)
    return (monday.strftime('%Y-%m-%d'), sunday.strftime('%Y-%m-%d'),
            f"{monday.strftime('%Y-%m-%d')} ~ {sunday.strftime('%Y-%m-%d')}")


def _blank():
    return {
        'week_done': 0, 'week_progressed': 0, 'week_new': 0, 'week_active': 0,
        'overdue_week': 0, 'risk_week': 0,
        'participate_week': 0, 'participate_done_week': 0, 'participate_progressed_week': 0,
        'rating_detail': {}, 'rating_total': 0, 'rating_score_sum': 0,
        'lead_tasks': [], 'participate_tasks': [],
        'projects': {},
    }


def build_person_weekly(cursor, offset=0):
    """核心计算：本周每人主导/参与的项目工作量、完成情况与评价。"""
    start, end, period = _week_range(offset)
    today_str = datetime.now().strftime('%Y-%m-%d')
    soon_str = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')

    # ── 1. 取全部未归档项目的任务（过滤保密项目）────────────────────
    cursor.execute('''
        SELECT t.id, t.name, t.status, t.progress, t.priority, t.due_date,
               t.start_date, t.completed_date, t.created_at, t.updated_at,
               t.rating, t.assignee_id, t.project_id,
               pj.name AS project_name, pj.progress AS project_progress,
               pj.owner_id AS project_owner_id,
               per.name AS assignee_name
        FROM task t
        LEFT JOIN project pj ON t.project_id = pj.id
        LEFT JOIN person per ON t.assignee_id = per.id
        WHERE t.status != 'cancelled'
          AND pj.status NOT IN ('archived','cancelled')
          AND COALESCE(pj.confidential, 0) = 0
    ''')
    all_tasks = [dict(r) for r in cursor.fetchall()]

    # ── 2. 取参与关系 ────────────────────────────────────────────────
    cursor.execute('''
        SELECT tp.id AS tp_id, tp.person_id, tp.role, t.id AS task_id,
               t.name, t.status, t.progress, t.priority, t.due_date,
               t.start_date, t.completed_date, t.created_at, t.updated_at,
               t.rating, t.assignee_id, t.project_id,
               pj.name AS project_name, pj.progress AS project_progress,
               pj.owner_id AS project_owner_id,
               per.name AS assignee_name, pp.name AS participant_name
        FROM task_participant tp
        JOIN task t ON tp.task_id = t.id
        LEFT JOIN project pj ON t.project_id = pj.id
        LEFT JOIN person per ON t.assignee_id = per.id
        LEFT JOIN person pp ON tp.person_id = pp.id
        WHERE t.status != 'cancelled'
          AND pj.status NOT IN ('archived','cancelled')
          AND COALESCE(pj.confidential, 0) = 0
    ''')
    participant_rows = [dict(r) for r in cursor.fetchall()]

    # ── 3. 主导的项目 ────────────────────────────────────────────────
    cursor.execute('''
        SELECT pj.id AS project_id, pj.name AS project_name, pj.progress,
               pj.status, pj.start_date, pj.target_end_date, pj.owner_id,
               per.name AS owner_name
        FROM project pj
        LEFT JOIN person per ON pj.owner_id = per.id
        WHERE pj.status NOT IN ('archived','cancelled')
          AND COALESCE(pj.confidential, 0) = 0
    ''')
    owned_projects = [dict(r) for r in cursor.fetchall()]

    # ── 4. 项目任务总量 ──────────────────────────────────────────────
    cursor.execute('''
        SELECT project_id, COUNT(*) AS total_tasks,
               SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS done_tasks
        FROM task WHERE status != 'cancelled' GROUP BY project_id
    ''')
    project_task_totals = {r['project_id']: dict(r) for r in cursor.fetchall()}

    # ── 5. 在职人员 ──────────────────────────────────────────────────
    cursor.execute("SELECT id, name, role, position, line, department, status FROM person WHERE status='active'")
    all_persons = [dict(r) for r in cursor.fetchall()]

    people = {}
    for p in all_persons:
        people[p['id']] = dict(_blank(), **{
            'person_id': p['id'], 'name': p['name'], 'role': p['role'] or '',
            'position': p['position'] or '', 'line': p['line'] or '',
            'department': p['department'] or '',
        })

    def P(pid):
        return people.get(pid)

    def touch_project(person, t, role):
        if not person or not t:
            return
        pid = t.get('project_id')
        ent = person['projects'].get(pid)
        if not ent:
            ent = {'project_id': pid, 'project_name': t.get('project_name'),
                   'project_progress': t.get('project_progress'),
                   'role': role, 'task_count': 0, 'completed': 0}
            person['projects'][pid] = ent
        if role == 'lead':
            ent['role'] = 'lead'
        elif ent['role'] != 'lead':
            ent['role'] = 'join'

    # ── 6. 判定"本周有动作" ──────────────────────────────────────────
    def week_flags(t):
        """返回 (有动作, 动作类型集合)"""
        kinds = set()
        cd = _date_of(t.get('completed_date'))
        ud = _date_of(t.get('updated_at'))
        ct = _date_of(t.get('created_at'))
        if cd and start <= cd <= end:
            kinds.add('done')
        if ud and start <= ud <= end:
            kinds.add('progressed')
        if ct and start <= ct <= end:
            kinds.add('new')
        return bool(kinds), kinds

    # 6.1 本人主导（作为负责人）的任务
    for t in all_tasks:
        person = P(t.get('assignee_id'))
        if not person:
            continue
        active, kinds = week_flags(t)
        if not active:
            continue
        person['week_active'] += 1
        if 'done' in kinds:
            person['week_done'] += 1
            label = RATING_LABELS.get(t.get('rating'))
            if label:
                person['rating_detail'][label] = person['rating_detail'].get(label, 0) + 1
                person['rating_total'] += 1
                person['rating_score_sum'] += RATING_SCORE.get(label, 70)
        if 'progressed' in kinds and t.get('status') != 'completed':
            person['week_progressed'] += 1
        if 'new' in kinds and t.get('status') != 'completed':
            person['week_new'] += 1
        overdue = bool(t.get('due_date') and t['due_date'] < today_str)
        if overdue and t.get('status') != 'completed':
            person['overdue_week'] += 1
        if (t.get('progress') or 0) < 50 and t.get('due_date') and t['due_date'] <= soon_str \
                and t.get('status') != 'completed':
            person['risk_week'] += 1

        touch_project(person, t, 'lead')
        ent = person['projects'].get(t.get('project_id'))
        if ent:
            ent['task_count'] += 1
            if t.get('status') == 'completed':
                ent['completed'] += 1

        person['lead_tasks'].append({
            'id': t['id'], 'name': t['name'], 'status': t['status'],
            'progress': t.get('progress'), 'priority': t.get('priority'),
            'due_date': t.get('due_date'), 'completed_date': t.get('completed_date'),
            'project_name': t.get('project_name'), 'project_id': t.get('project_id'),
            'rating': RATING_LABELS.get(t.get('rating'), ''),
            'week_kinds': sorted(kinds),
            'overdue': overdue,
            'is_project_lead': t.get('project_owner_id') == t.get('assignee_id'),
        })

    # 6.2 本人参与的任务（本人不是负责人的那些）
    for r in participant_rows:
        person = P(r.get('person_id'))
        if not person:
            continue
        if r.get('assignee_id') == r.get('person_id'):
            continue  # 本人就是负责人的，已在上面统计
        active, kinds = week_flags(r)
        if not active:
            continue
        person['participate_week'] += 1
        if 'done' in kinds:
            person['participate_done_week'] += 1
            label = RATING_LABELS.get(r.get('rating'))
            if label:
                person['rating_detail'][label] = person['rating_detail'].get(label, 0) + 1
                person['rating_total'] += 1
                person['rating_score_sum'] += RATING_SCORE.get(label, 70)
        if 'progressed' in kinds and r.get('status') != 'completed':
            person['participate_progressed_week'] += 1
        touch_project(person, r, 'join')
        ent = person['projects'].get(r.get('project_id'))
        if ent:
            ent['task_count'] += 1
            if r.get('status') == 'completed':
                ent['completed'] += 1
        person['participate_tasks'].append({
            'id': r['task_id'], 'name': r['name'], 'status': r['status'],
            'progress': r.get('progress'), 'priority': r.get('priority'),
            'due_date': r.get('due_date'), 'completed_date': r.get('completed_date'),
            'project_name': r.get('project_name'), 'project_id': r.get('project_id'),
            'rating': RATING_LABELS.get(r.get('rating'), ''),
            'week_kinds': sorted(kinds),
            'role': r.get('role'), 'assignee_name': r.get('assignee_name'),
            'overdue': bool(r.get('due_date') and r['due_date'] < today_str),
            'is_project_lead': r.get('project_owner_id') == r.get('person_id'),
        })

    # ── 7. 汇总 ──────────────────────────────────────────────────────
    result = []
    for person in people.values():
        week_active = person['week_active']
        done = person['week_done']
        rate = round(done / week_active * 100, 1) if week_active else 0
        workload_score = (done * 10 + person['week_progressed'] * 3
                          + person['week_new'] * 2 + person['participate_week'] * 2)
        avg_rating = (round(person['rating_score_sum'] / person['rating_total'], 1)
                      if person['rating_total'] else None)
        projects = list(person['projects'].values())
        projects.sort(key=lambda x: (0 if x['role'] == 'lead' else 1, -x['task_count']))
        lead_projects = [p for p in projects if p['role'] == 'lead']
        join_projects = [p for p in projects if p['role'] == 'join']

        result.append({
            'person_id': person['person_id'],
            'name': person['name'],
            'role': person['role'],
            'position': person['position'],
            'line': person['line'],
            'department': person['department'],
            # ── 本周口径 ──
            'week_active': week_active,
            'week_done': done,
            'week_progressed': person['week_progressed'],
            'week_new': person['week_new'],
            'completion_rate': rate,
            'overdue_week': person['overdue_week'],
            'risk_week': person['risk_week'],
            'participate_week': person['participate_week'],
            'participate_done_week': person['participate_done_week'],
            'participate_progressed_week': person['participate_progressed_week'],
            'workload_score': workload_score,
            # ── 评价 ──
            'rating_detail': person['rating_detail'],
            'rating_total': person['rating_total'],
            'avg_rating': avg_rating,
            'unrated_count': max(0, done - person['rating_total']),
            # ── 项目 ──
            'owned_projects': [dict(op, project_total_tasks=project_task_totals.get(
                op['project_id'], {}).get('total_tasks', 0),
                project_done_tasks=project_task_totals.get(
                    op['project_id'], {}).get('done_tasks', 0))
                for op in owned_projects if op['owner_id'] == person['person_id']],
            'lead_projects': lead_projects,
            'join_projects': join_projects,
            'project_count': len(projects),
            'projects': projects,
            # ── 明细（只含本周有动作的任务）──
            'lead_task_list': sorted(person['lead_tasks'],
                                     key=lambda x: (x['completed_date'] or '', x['id']),
                                     reverse=True),
            'participate_task_list': sorted(person['participate_tasks'],
                                            key=lambda x: (x['completed_date'] or '', x['id']),
                                            reverse=True),
        })

    result.sort(key=lambda x: (-x['workload_score'], -x['week_done'], x['name']))

    summary = {
        'total_people': len(result),
        'active_people': len([r for r in result if r['week_active'] > 0]),
        'lead_people': len([r for r in result if r['owned_projects']]),
        'total_lead_projects': len(owned_projects),
        'week_done': sum(r['week_done'] for r in result),
        'week_progressed': sum(r['week_progressed'] for r in result),
        'week_new': sum(r['week_new'] for r in result),
        'week_active': sum(r['week_active'] for r in result),
        'participate_week': sum(r['participate_week'] for r in result),
        'week_overdue': sum(r['overdue_week'] for r in result),
        'week_rated': sum(r['rating_total'] for r in result),
    }
    rating_dist = {}
    for r in result:
        for k, v in r['rating_detail'].items():
            rating_dist[k] = rating_dist.get(k, 0) + v

    return {
        'period': period,
        'start_date': start,
        'end_date': end,
        'scope': '本周',
        'summary': summary,
        'rating_distribution': rating_dist,
        'persons': result,
    }
