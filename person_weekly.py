#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""人员维度周报：计算每人主导/参与的项目工作量、完成情况与评价。
作为 pm_server.py 的扩展模块挂载，提供 /api/report/person-weekly 接口。
"""
from datetime import datetime, timedelta

RATING_LABELS = {
    'insufficient': '不足',
    'normal': '正常',
    'excellent': '优秀',
    'outstanding': '卓越',
}
RATING_ORDER = ['卓越', '优秀', '正常', '不足']
# 评价分值权重（用于算综合评价分）
RATING_SCORE = {'卓越': 100, '优秀': 85, '正常': 70, '不足': 50}


def _week_range(offset=0):
    """返回 (start, end, label)。offset=0 本周，-1 上周。"""
    today = datetime.now()
    monday = today - timedelta(days=today.weekday())
    monday = monday + timedelta(weeks=offset)
    sunday = monday + timedelta(days=6)
    return (monday.strftime('%Y-%m-%d'), sunday.strftime('%Y-%m-%d'),
            f"{monday.strftime('%Y-%m-%d')} ~ {sunday.strftime('%Y-%m-%d')}")


def build_person_weekly(cursor, offset=0):
    """核心计算：每人主导项目 / 参与项目 / 工作量 / 完成情况 / 评价。"""
    start, end, period = _week_range(offset)
    today_str = datetime.now().strftime('%Y-%m-%d')

    # ── 1. 本周完成的任务（含负责人、项目、评价）────────────────────────
    cursor.execute('''
        SELECT t.id, t.name, t.status, t.progress, t.priority, t.due_date,
               t.completed_date, t.rating, t.assignee_id, t.project_id,
               pj.name AS project_name, pj.progress AS project_progress,
               per.name AS assignee_name
        FROM task t
        LEFT JOIN project pj ON t.project_id = pj.id
        LEFT JOIN person per ON t.assignee_id = per.id
        WHERE t.completed_date >= ? AND t.completed_date <= ?
          AND t.status != 'cancelled'
          AND pj.status NOT IN ('archived','cancelled')
          AND COALESCE(pj.confidential, 0) = 0
        ORDER BY t.completed_date DESC
    ''', (start, end))
    completed_tasks = [dict(r) for r in cursor.fetchall()]

    # ── 2. 本周在办任务（进行中/待办）────────────────────────────────
    cursor.execute('''
        SELECT t.id, t.name, t.status, t.progress, t.priority, t.due_date,
               t.assignee_id, t.project_id, pj.name AS project_name,
               pj.progress AS project_progress, per.name AS assignee_name
        FROM task t
        LEFT JOIN project pj ON t.project_id = pj.id
        LEFT JOIN person per ON t.assignee_id = per.id
        WHERE t.status IN ('in_progress','pending')
          AND pj.status NOT IN ('archived','cancelled')
          AND COALESCE(pj.confidential, 0) = 0
    ''')
    active_tasks = [dict(r) for r in cursor.fetchall()]

    # ── 3. 本周参与的任务（task_participant）───────────────────────────
    cursor.execute('''
        SELECT tp.id AS tp_id, tp.person_id, tp.role, t.id AS task_id,
               t.name, t.status, t.progress, t.priority, t.due_date,
               t.completed_date, t.rating, t.assignee_id, t.project_id,
               pj.name AS project_name, pj.progress AS project_progress,
               per.name AS assignee_name, pp.name AS participant_name
        FROM task_participant tp
        JOIN task t ON tp.task_id = t.id
        LEFT JOIN project pj ON t.project_id = pj.id
        LEFT JOIN person per ON t.assignee_id = per.id
        LEFT JOIN person pp ON tp.person_id = pp.id
        WHERE t.status != 'cancelled'
          AND pj.status NOT IN ('archived','cancelled')
          AND COALESCE(pj.confidential, 0) = 0
          AND (t.completed_date >= ? AND t.completed_date <= ?
               OR t.status IN ('in_progress','pending'))
    ''', (start, end))
    participant_rows = [dict(r) for r in cursor.fetchall()]

    # ── 4. 主导的项目（project.owner_id = 本人）────────────────────────
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

    # ── 5. 项目任务总量（用于算项目内本人贡献占比）──────────────────────
    cursor.execute('''
        SELECT project_id,
               COUNT(*) AS total_tasks,
               SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS done_tasks
        FROM task
        WHERE status != 'cancelled'
        GROUP BY project_id
    ''')
    project_task_totals = {r['project_id']: dict(r) for r in cursor.fetchall()}

    # ── 6. 绩效评价（performance 表，取最近一期）───────────────────────
    cursor.execute('''
        SELECT pf.person_id, pf.score, pf.grade, pf.comment,
               pf.period_type, pf.year, pf.period
        FROM performance pf
        WHERE pf.id IN (
            SELECT MAX(id) FROM performance GROUP BY person_id, period_type
        )
    ''')
    perf_map = {}
    for r in cursor.fetchall():
        row = dict(r)
        perf_map[row['person_id']] = row

    # ── 7. 组织信息（全部在职人员，做基线，避免"没数据的人"消失）────────
    cursor.execute('''
        SELECT id, name, role, position, line, department, status
        FROM person
        WHERE status = 'active'
    ''')
    all_persons = [dict(r) for r in cursor.fetchall()]

    # ══════════ 归集 ══════════
    people = {}

    def blank():
        return {
            'task_count': 0, 'completed_count': 0, 'in_progress_count': 0,
            'pending_count': 0, 'overdue_count': 0, 'risk_count': 0,
            'total_progress_sum': 0,
            'lead_task_count': 0, 'lead_completed': 0,
            'participate_task_count': 0, 'participate_completed': 0,
            'participate_in_progress': 0,
            'owned_projects': [], 'joined_projects': {},
            'rating_detail': {}, 'rating_total': 0, 'rating_score_sum': 0,
            'completed_tasks': [], 'overdue_tasks': [], 'risk_tasks': [],
            'projects': {},
        }

    for p in all_persons:
        people[p['id']] = dict(blank(), **{
            'person_id': p['id'], 'name': p['name'], 'role': p['role'] or '',
            'position': p['position'] or '', 'line': p['line'] or '',
            'department': p['department'] or '',
        })

    def P(pid):
        return people.get(pid)

    def touch_project(person, pj, role):
        """登记项目归属：role = 'lead' 主导 / 'join' 参与"""
        if not person or not pj:
            return
        key = pj['project_id']
        ent = person['projects'].get(key)
        if not ent:
            ent = {'project_id': key, 'project_name': pj['project_name'],
                   'project_progress': pj.get('project_progress'),
                   'role': role, 'task_count': 0, 'completed': 0}
            person['projects'][key] = ent
        # 主导优先（主导 > 参与）
        if role == 'lead':
            ent['role'] = 'lead'
        elif ent['role'] != 'lead':
            ent['role'] = 'join'

    # 7.1 主导项目 + 项目内负责的任务
    for pj in owned_projects:
        pid = pj['owner_id']
        person = P(pid)
        if not person:
            continue
        total = project_task_totals.get(pj['project_id'], {})
        person['owned_projects'].append({
            'project_id': pj['project_id'],
            'project_name': pj['project_name'],
            'project_progress': pj['progress'],
            'project_status': pj['status'],
            'start_date': pj['start_date'],
            'due_date': pj['target_end_date'],
            'project_total_tasks': total.get('total_tasks', 0),
            'project_done_tasks': total.get('done_tasks', 0),
        })
        touch_project(person, {
            'project_id': pj['project_id'], 'project_name': pj['project_name'],
            'project_progress': pj['progress'],
        }, 'lead')

    # 7.2 负责人任务（本周完成 + 本周在办）
    for t in completed_tasks:
        person = P(t['assignee_id'])
        if not person:
            continue
        person['task_count'] += 1
        person['completed_count'] += 1
        person['lead_task_count'] += 1
        person['lead_completed'] += 1
        person['completed_tasks'].append(t)
        # 评价
        label = RATING_LABELS.get(t['rating'])
        if label:
            person['rating_detail'][label] = person['rating_detail'].get(label, 0) + 1
            person['rating_total'] += 1
            person['rating_score_sum'] += RATING_SCORE.get(label, 70)
        touch_project(person, t, 'lead')
        ent = person['projects'].get(t['project_id'])
        if ent:
            ent['task_count'] += 1
            ent['completed'] += 1

    for t in active_tasks:
        person = P(t['assignee_id'])
        if not person:
            continue
        person['task_count'] += 1
        person['lead_task_count'] += 1
        if t['status'] == 'in_progress':
            person['in_progress_count'] += 1
        else:
            person['pending_count'] += 1
        person['total_progress_sum'] += (t['progress'] or 0)
        overdue = bool(t['due_date'] and t['due_date'] < today_str)
        if overdue:
            person['overdue_count'] += 1
            person['overdue_tasks'].append(t)
        risk = (t['progress'] or 0) < 50 and bool(t['due_date']) and t['due_date'] <= (
            datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
        if risk:
            person['risk_count'] += 1
            person['risk_tasks'].append(t)
        touch_project(person, t, 'lead')
        ent = person['projects'].get(t['project_id'])
        if ent:
            ent['task_count'] += 1

    # 7.3 参与的任务（task_participant）——与本人负责的任务去重
    for r in participant_rows:
        pid = r['person_id']
        person = P(pid)
        if not person:
            continue
        # 本人就是负责人的那条，已在上面统计过，跳过避免重复计数
        if r['assignee_id'] == pid:
            continue
        person['participate_task_count'] += 1
        if r['status'] == 'completed':
            person['participate_completed'] += 1
            label = RATING_LABELS.get(r['rating'])
            if label:
                person['rating_detail'][label] = person['rating_detail'].get(label, 0) + 1
                person['rating_total'] += 1
                person['rating_score_sum'] += RATING_SCORE.get(label, 70)
        elif r['status'] == 'in_progress':
            person['participate_in_progress'] += 1
        touch_project(person, r, 'join')
        ent = person['projects'].get(r['project_id'])
        if ent:
            ent['task_count'] += 1
            if r['status'] == 'completed':
                ent['completed'] += 1

    # ══════════ 汇总指标 ══════════
    result = []
    for person in people.values():
        total = person['task_count']
        done = person['completed_count']
        rate = round(done / total * 100, 1) if total else 0
        # 综合工作量分：完成 10 分 + 在办 3 分 + 待办 1 分 + 参与 2 分
        workload_score = (done * 10 + person['in_progress_count'] * 3
                          + person['pending_count'] * 1
                          + person['participate_task_count'] * 2)
        avg_rating = (round(person['rating_score_sum'] / person['rating_total'], 1)
                      if person['rating_total'] else None)
        projects = list(person['projects'].values())
        projects.sort(key=lambda x: (0 if x['role'] == 'lead' else 1, -x['task_count']))
        lead_projects = [p for p in projects if p['role'] == 'lead']
        join_projects = [p for p in projects if p['role'] == 'join']

        perf = perf_map.get(person['person_id'])
        result.append({
            'person_id': person['person_id'],
            'name': person['name'],
            'role': person['role'],
            'position': person['position'],
            'line': person['line'],
            'department': person['department'],
            # 工作量
            'task_count': total,
            'completed_count': done,
            'in_progress_count': person['in_progress_count'],
            'pending_count': person['pending_count'],
            'overdue_count': person['overdue_count'],
            'risk_count': person['risk_count'],
            'participate_task_count': person['participate_task_count'],
            'participate_completed': person['participate_completed'],
            'participate_in_progress': person['participate_in_progress'],
            'lead_task_count': person['lead_task_count'],
            'workload_score': workload_score,
            'avg_progress': (round(person['total_progress_sum'] / (
                person['in_progress_count'] + person['pending_count']), 1)
                if (person['in_progress_count'] + person['pending_count']) else 0),
            # 完成情况
            'completion_rate': rate,
            # 评价
            'rating_detail': person['rating_detail'],
            'rating_total': person['rating_total'],
            'avg_rating': avg_rating,
            'unrated_count': max(0, done - person['rating_total']),
            'performance': perf,
            # 项目
            'lead_projects': lead_projects,
            'join_projects': join_projects,
            'owned_projects': person['owned_projects'],
            'project_count': len(projects),
            'projects': projects,
            # 明细
            'completed_task_list': [
                {'id': t['id'], 'name': t['name'], 'project_name': t['project_name'],
                 'completed_date': t['completed_date'],
                 'rating': RATING_LABELS.get(t['rating'], '')}
                for t in person['completed_tasks'][:20]
            ],
            'overdue_task_list': [
                {'id': t['id'], 'name': t['name'], 'project_name': t['project_name'],
                 'due_date': t['due_date'], 'progress': t['progress']}
                for t in person['overdue_tasks'][:10]
            ],
        })

    # 排序：有工作量在前，再按完成数
    result.sort(key=lambda x: (-x['workload_score'], -x['completed_count'], x['name']))

    # 汇总
    summary = {
        'total_people': len(result),
        'active_people': len([r for r in result if r['workload_score'] > 0]),
        'lead_people': len([r for r in result if r['owned_projects']]),
        'total_lead_projects': len(owned_projects),
        'total_completed': len(completed_tasks),
        'total_active': len(active_tasks),
        'total_participate': len([r for r in participant_rows if r['assignee_id'] != r['person_id']]),
        'total_overdue': len([r for r in result if r['overdue_count']]),
        'total_rated': sum(r['rating_total'] for r in result),
    }
    rating_dist = {}
    for r in result:
        for k, v in r['rating_detail'].items():
            rating_dist[k] = rating_dist.get(k, 0) + v

    return {
        'period': period,
        'start_date': start,
        'end_date': end,
        'summary': summary,
        'rating_distribution': rating_dist,
        'persons': result,
    }
