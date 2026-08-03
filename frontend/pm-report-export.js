// 项目报告导出模块 v4 - pm-report-export.js
// v4: 时间维度选择、内容板块选择、甘特图时间轴自适应、PDF紧凑排版

const PM_REPORT_EXPORT = {
    styles: {
        classic: { name: '经典商务', headerBg: '#1a365d', headerColor: '#fff', accent: '#667eea', bg: '#fff' },
        modern: { name: '现代彩色', headerBg: '#2d3436', headerColor: '#fff', accent: '#e17055', bg: '#f8f9ff' },
        minimal: { name: '极简线框', headerBg: '#333', headerColor: '#fff', accent: '#999', bg: '#fff' }
    },

    async loadDeps() {
        if (window.html2canvas && window.jspdf) return;
        const load = (src) => new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
            const s = document.createElement('script'); s.src = src;
            s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
        });
        await load('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        await load('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    },

    async loadProjectData(projectId) {
        try {
            const res = await authFetch(`${API}/projects/${projectId}`);
            if (!res) { alert('请先登录'); return null; }
            const data = await res.json();
            if (!data.success) { alert('加载项目失败: ' + (data.error || '')); return null; }
            return data.project;
        } catch (e) {
            console.error('loadProjectData error:', e);
            alert('加载项目数据出错: ' + e.message);
            return null;
        }
    },

    _ensureStartDate(task, projectCreatedAt) {
        if (task.start_date) return task;  // 已设置开始日期（点击"开始"按钮）
        const t = Object.assign({}, task);
        // 未设置开始日期：使用项目创建时间
        if (projectCreatedAt) {
            t.start_date = projectCreatedAt.split('T')[0];
        } else if (t.created_at) {
            t.start_date = t.created_at.split('T')[0];
        }
        return t;
    },

    // ========== 计算甘特图时间范围 ==========
    _getTimeRange(opts) {
        const val = (opts && opts.timeRange) || 'month';
        const now = new Date();
        let start, end, granularity;
        if (val === 'week') {
            start = new Date(now); start.setDate(now.getDate() - now.getDay());
            end = new Date(start); end.setDate(start.getDate() + 6);
            granularity = 'day';
        } else if (val === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            granularity = 'day';
        } else if (val === 'quarter') {
            const q = Math.floor(now.getMonth() / 3);
            start = new Date(now.getFullYear(), q * 3, 1);
            end = new Date(now.getFullYear(), q * 3 + 3, 0);
            granularity = 'week';
        } else if (val === 'year') {
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
            granularity = 'month';
        } else { // custom
            const sv = (opts && opts.startDate) || '';
            const ev = (opts && opts.endDate) || '';
            start = new Date(sv || now);
            end = new Date(ev || new Date(now.getTime() + 30 * 86400000));
            const spanDays = Math.ceil((end - start) / 86400000);
            granularity = spanDays <= 45 ? 'day' : spanDays <= 180 ? 'week' : 'month';
        }
        return { start, end, granularity };
    },

    // ========== 报告头 ==========
    _buildHeader(project, styleName, opts) {
        const s = this.styles[styleName] || this.styles.classic;
        const now = new Date().toLocaleDateString('zh-CN');
        const tasks = project.tasks || [];
        const issues = project.issues || [];
        const statusMap = { pending: '⏳ 待处理', in_progress: '🔄 进行中', completed: '✅ 已完成', cancelled: '❌ 已中止', delayed: '⚠️ 延期' };
        const total = tasks.length;
        const done = tasks.filter(t => t.status === 'completed').length;
        const doing = tasks.filter(t => t.status === 'in_progress').length;
        const todo = tasks.filter(t => t.status === 'pending').length;
        const openIss = issues.filter(i => i.status !== 'resolved' && i.status !== 'closed').length;
        const timeLabels = { week: '本周', month: '本月', quarter: '本季度', year: '本年度', custom: '自定义' };
        const tr = (opts && opts.timeRange) || 'month';
        const trLabel = timeLabels[tr] || '本月';
        const range = this._getTimeRange(opts);
        const rangeStr = range.start.toLocaleDateString('zh-CN') + ' ~ ' + range.end.toLocaleDateString('zh-CN');

        return `<div style="background:${s.headerBg};color:${s.headerColor};padding:30px 40px;">
            <h1 style="font-size:28px;margin:0 0 5px 0;">${project.name}</h1>
            <div style="font-size:14px;opacity:0.8;">项目报告 · ${now} · ${statusMap[project.status] || project.status}</div>
            <div style="font-size:12px;opacity:0.6;margin-top:4px;">📅 甘特图时间维度：${trLabel}（${rangeStr}）</div>
            <div style="display:flex;gap:15px;margin-top:15px;flex-wrap:wrap;">
                <div style="background:rgba(255,255,255,0.15);padding:8px 16px;border-radius:6px;">📊 总进度 ${project.progress || 0}%</div>
                <div style="background:rgba(255,255,255,0.15);padding:8px 16px;border-radius:6px;">📋 任务 ${total}个</div>
                <div style="background:rgba(255,255,255,0.15);padding:8px 16px;border-radius:6px;">✅ 完成 ${done}个</div>
                <div style="background:rgba(255,255,255,0.15);padding:8px 16px;border-radius:6px;">🔄 进行中 ${doing}个</div>
                <div style="background:rgba(255,255,255,0.15);padding:8px 16px;border-radius:6px;">⏳ 待处理 ${todo}个</div>
                <div style="background:rgba(255,255,255,0.15);padding:8px 16px;border-radius:6px;">⚠️ 未解决问题 ${openIss}个</div>
            </div></div>`;
    },

    // ========== 任务清单（含完成情况说明） ==========
    _buildTaskList(project) {
        const tasks = (project.tasks || []).map(t => this._ensureStartDate(t, project.created_at));
        const statusMap = { pending: '⏳ 待处理', in_progress: '🔄 进行中', completed: '✅ 已完成', cancelled: '❌ 已中止', delayed: '⚠️ 延期' };
        const priorityMap = { critical: '🔴 紧急', high: '🟠 高', medium: '🟡 中', low: '🟢 低' };

        let html = `<div class="report-section" style="margin-bottom:30px;">
            <h2 style="font-size:20px;font-weight:600;border-bottom:3px solid #667eea;padding-bottom:10px;margin-bottom:15px;">📋 任务清单 (${tasks.length}个)</h2>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="background:#f0f4ff;">
                <th style="padding:10px 6px;text-align:left;border-bottom:2px solid #ddd;white-space:nowrap;">#</th>
                <th style="padding:10px 6px;text-align:left;border-bottom:2px solid #ddd;">任务名称</th>
                <th style="padding:10px 6px;text-align:left;border-bottom:2px solid #ddd;white-space:nowrap;">负责人</th>
                <th style="padding:10px 6px;text-align:left;border-bottom:2px solid #ddd;white-space:nowrap;">状态</th>
                <th style="padding:10px 6px;text-align:left;border-bottom:2px solid #ddd;white-space:nowrap;">进度</th>
                <th style="padding:10px 6px;text-align:left;border-bottom:2px solid #ddd;white-space:nowrap;">开始</th>
                <th style="padding:10px 6px;text-align:left;border-bottom:2px solid #ddd;white-space:nowrap;">截止</th>
                <th style="padding:10px 6px;text-align:left;border-bottom:2px solid #ddd;">完成情况说明</th>
            </tr></thead><tbody>`;

        tasks.forEach((t, i) => {
            const bg = i % 2 === 0 ? '#fff' : '#fafafa';
            // 完成情况说明：notes > description > 完成日期
            let note = '';
            if (t.notes && t.notes.trim()) note = t.notes.trim();
            else if (t.description && t.description.trim()) note = t.description.trim();
            if (t.status === 'completed' && t.completed_date) {
                note = (note ? note + ' | ' : '') + '完成于 ' + t.completed_date;
            }
            if (!note) note = '-';

            html += `<tr style="background:${bg};">
                <td style="padding:8px 6px;border-bottom:1px solid #eee;">${i+1}</td>
                <td style="padding:8px 6px;border-bottom:1px solid #eee;font-weight:500;">${t.name}${t.priority === 'critical' || t.priority === 'high' ? ' ' + (priorityMap[t.priority]||'') : ''}</td>
                <td style="padding:8px 6px;border-bottom:1px solid #eee;">${t.assignee_name || '-'}</td>
                <td style="padding:8px 6px;border-bottom:1px solid #eee;">${statusMap[t.status] || t.status}</td>
                <td style="padding:8px 6px;border-bottom:1px solid #eee;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <div style="flex:1;height:10px;background:#e0e0e0;border-radius:5px;overflow:hidden;">
                            <div style="width:${t.progress||0}%;height:100%;background:${t.progress>=80?'#4caf50':t.progress>=50?'#ff9800':'#667eea'};border-radius:5px;"></div>
                        </div><span style="font-size:11px;">${t.progress||0}%</span>
                    </div></td>
                <td style="padding:8px 6px;border-bottom:1px solid #eee;">${t.start_date || '-'}</td>
                <td style="padding:8px 6px;border-bottom:1px solid #eee;">${t.due_date || '-'}</td>
                <td style="padding:8px 6px;border-bottom:1px solid #eee;font-size:12px;color:#555;max-width:250px;word-break:break-all;">${note}</td>
            </tr>`;
        });
        html += '</tbody></table></div>';
        return html;
    },

    // ========== 看板视图（复用kanban-export.js） ==========
    _buildKanban(project, styleKey) {
        if (typeof generateKanbanHTML === 'function') {
            try {
                const _origF = typeof filteredTasks !== 'undefined' ? filteredTasks : null;
                const _origA = typeof allTasks !== 'undefined' ? allTasks : null;
                const _origP = typeof projectsList !== 'undefined' ? projectsList : null;
                window.filteredTasks = project.tasks || [];
                window.allTasks = project.tasks || [];
                window.projectsList = [{ name: project.name, id: project.id }];
                const kanbanHtml = generateKanbanHTML(styleKey || 'classic', 'landscape');
                if (_origF) window.filteredTasks = _origF;
                if (_origA) window.allTasks = _origA;
                if (_origP) window.projectsList = _origP;
                return `<div class="report-section" style="margin-bottom:30px;"><h2 style="font-size:20px;font-weight:600;border-bottom:3px solid #667eea;padding-bottom:10px;margin-bottom:15px;">📌 看板视图</h2>${kanbanHtml}</div>`;
            } catch (e) { console.warn('复用kanban-export失败:', e); }
        }
        return this._buildKanbanFallback(project);
    },

    _buildKanbanFallback(project) {
        const tasks = project.tasks || [];
        const groups = { pending: [], in_progress: [], completed: [] };
        tasks.forEach(t => { if (groups[t.status]) groups[t.status].push(t); else groups.pending.push(t); });
        const labels = { pending: '⏳ 待处理', in_progress: '🔄 进行中', completed: '✅ 已完成' };
        const colors = { pending: '#fff8e1', in_progress: '#e3f2fd', completed: '#e8f5e9' };
        let html = `<div class="report-section" style="margin-bottom:30px;"><h2 style="font-size:20px;font-weight:600;border-bottom:3px solid #667eea;padding-bottom:10px;margin-bottom:15px;">📌 看板视图</h2><div style="display:flex;gap:16px;">`;
        ['pending','in_progress','completed'].forEach(key => {
            const gt = groups[key];
            html += `<div style="flex:1;min-width:0;"><div style="background:${colors[key]};padding:10px;font-weight:600;text-align:center;border-radius:8px 8px 0 0;border:1px solid #e0e0e0;">${labels[key]} (${gt.length})</div>`;
            gt.forEach(t => {
                html += `<div style="padding:12px;margin:6px 0;border-radius:6px;border:1px solid #e0e0e0;font-size:13px;">
                    <div style="font-weight:500;margin-bottom:4px;">${t.name}</div>
                    <div style="color:#888;font-size:11px;">${t.assignee_name||'-'} · ${t.progress||0}%</div>
                    <div style="height:8px;background:#e0e0e0;border-radius:4px;margin-top:6px;overflow:hidden;">
                        <div style="width:${t.progress||0}%;height:100%;background:#667eea;border-radius:4px;"></div>
                    </div></div>`;
            });
            if (!gt.length) html += '<div style="padding:12px;text-align:center;color:#999;font-size:13px;">暂无</div>';
            html += '</div>';
        });
        html += '</div></div>';
        return html;
    },

    // ========== 甘特图（复用gantt-export.js 或 内置时间轴） ==========
    _buildGantt(project, styleKey, opts) {
        // 尝试复用gantt-export.js
        if (typeof generateGanttExport === 'function') {
            try {
                // 设置gantt-export的时间范围（如果它支持）
                const timeRadio = document.querySelector('input[name="export-time"]');
                const origTimeVal = timeRadio ? timeRadio.value : null;
                const origStartDate = document.getElementById('export-start-date')?.value || '';
                const origEndDate = document.getElementById('export-end-date')?.value || '';
                
                const tr = (opts && opts.timeRange) || 'month';
                // 同步时间维度到gantt-export的radio
                const targetRadio = document.querySelector(`input[name="export-time"][value="${tr}"]`);
                if (targetRadio) targetRadio.checked = true;
                // 触发gantt-export的时间切换回调
                if (typeof onExportTimeChange === 'function') onExportTimeChange(tr);
                // 设置自定义日期
                if (tr === 'custom' && opts) {
                    const sd = document.getElementById('export-start-date');
                    const ed = document.getElementById('export-end-date');
                    if (sd && opts.startDate) sd.value = opts.startDate;
                    if (ed && opts.endDate) ed.value = opts.endDate;
                }
                // 设置风格
                const styleSelect = document.getElementById('export-style');
                const origStyle = styleSelect ? styleSelect.value : null;
                if (styleSelect) styleSelect.value = styleKey || 'classic';
                
                const ganttHtml = generateGanttExport(styleKey || 'classic');
                
                // 恢复原始值
                if (origTimeVal) {
                    const origRadio = document.querySelector(`input[name="export-time"][value="${origTimeVal}"]`);
                    if (origRadio) origRadio.checked = true;
                }
                if (styleSelect && origStyle) styleSelect.value = origStyle;
                
                return `<div class="report-section" style="margin-bottom:30px;"><h2 style="font-size:20px;font-weight:600;border-bottom:3px solid #667eea;padding-bottom:10px;margin-bottom:15px;">📅 甘特图</h2>${ganttHtml}</div>`;
            } catch (e) { console.warn('复用gantt-export失败:', e); }
        }
        return this._buildGanttFallback(project, opts);
    },

    _buildGanttFallback(project, opts) {
        const tasks = (project.tasks || []).map(t => this._ensureStartDate(t, project.created_at));
        const phases = project.phases || [];
        const range = this._getTimeRange(opts);
        const rangeStart = range.start;
        const rangeEnd = range.end;
        const granularity = range.granularity;
        const totalDays = Math.max((rangeEnd - rangeStart) / 86400000, 1);

        // 构建时间轴刻度
        const timeLabels = [];
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        if (granularity === 'day') {
            const c = new Date(rangeStart);
            while (c <= rangeEnd) {
                const ds = c.toISOString().split('T')[0];
                timeLabels.push({ date: ds, label: (c.getMonth()+1)+'/'+c.getDate(), isWeekend: c.getDay()===0||c.getDay()===6, isToday: ds===todayStr });
                c.setDate(c.getDate() + 1);
            }
        } else if (granularity === 'week') {
            const c = new Date(rangeStart);
            c.setDate(c.getDate() - ((c.getDay() + 6) % 7)); // 对齐周一
            while (c <= rangeEnd) {
                const ws = new Date(c);
                const we = new Date(c); we.setDate(c.getDate() + 6);
                timeLabels.push({ date: ws.toISOString().split('T')[0], label: (ws.getMonth()+1)+'/'+ws.getDate()+'-'+(we.getMonth()+1)+'/'+we.getDate(), isWeekend: false, isToday: ws <= now && now <= we });
                c.setDate(c.getDate() + 7);
            }
        } else {
            const c = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
            while (c <= rangeEnd) {
                timeLabels.push({ date: c.toISOString().split('T')[0], label: c.getFullYear()+'/'+(c.getMonth()+1), isWeekend: false, isToday: c.getMonth()===now.getMonth() && c.getFullYear()===now.getFullYear() });
                c.setMonth(c.getMonth() + 1);
            }
        }
        if (!timeLabels.length) return '<div class="report-section" style="margin-bottom:30px;"><h2 style="font-size:20px;font-weight:600;border-bottom:3px solid #667eea;padding-bottom:10px;margin-bottom:15px;">📅 甘特图</h2><p style="color:#999">无日期数据</p></div>';

        const colCount = timeLabels.length;
        const colWidth = 100 / colCount;
        const statusColor = (st) => st === 'completed' ? '#4caf50' : st === 'in_progress' ? '#2196f3' : st === 'delayed' ? '#f44336' : '#9e9e9e';

        // 时间轴头
        let headerHtml = '<div style="display:flex;">';
        headerHtml += '<div style="width:140px;min-width:140px;font-size:11px;font-weight:600;color:#666;padding:4px 0;border-bottom:2px solid #ddd;">任务</div>';
        timeLabels.forEach(tl => {
            const bg = tl.isToday ? '#e3f2fd' : tl.isWeekend ? '#fafafa' : '#fff';
            const fw = tl.isToday ? 'font-weight:700;color:#1565c0;' : '';
            headerHtml += `<div style="flex:1;min-width:0;font-size:${colCount>20?8:colCount>10?9:10}px;text-align:center;padding:4px 1px;background:${bg};border-bottom:2px solid #ddd;border-left:1px solid #f0f0f0;${fw}">${tl.label}</div>`;
        });
        headerHtml += '</div>';

        // 甘特条
        let barsHtml = '';
        // 阶段
        phases.forEach(p => {
            if (p.start_date && p.end_date) {
                const ps = new Date(Math.max(new Date(p.start_date), rangeStart));
                const pe = new Date(Math.min(new Date(p.end_date), rangeEnd));
                if (ps > rangeEnd || pe < rangeStart) return;
                const leftPct = Math.max((ps - rangeStart) / 86400000 / totalDays * 100, 0);
                const widthPct = Math.max((pe - ps) / 86400000 / totalDays * 100, 0.5);
                barsHtml += `<div style="display:flex;align-items:center;border-bottom:1px solid #f5f5f5;"><div style="width:140px;min-width:140px;font-size:11px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:2px 0;" title="${p.name}">📁 ${p.name}</div><div style="flex:1;position:relative;height:20px;background:#fafafa;"><div style="position:absolute;height:100%;left:${leftPct}%;width:${widthPct}%;background:#999;border-radius:3px;opacity:0.5;color:#fff;font-size:9px;display:flex;align-items:center;justify-content:center;overflow:hidden;">${p.name}</div></div></div>`;
            }
        });
        // 任务
        tasks.forEach(t => {
            if (t.start_date && t.due_date) {
                const ts = new Date(Math.max(new Date(t.start_date), rangeStart));
                const te = new Date(Math.min(new Date(t.due_date), rangeEnd));
                if (ts > rangeEnd || te < rangeStart) return;
                const leftPct = Math.max((ts - rangeStart) / 86400000 / totalDays * 100, 0);
                const widthPct = Math.max((te - ts) / 86400000 / totalDays * 100, 0.5);
                const barColor = statusColor(t.status);
                const nameTag = (t.priority === 'critical' || t.priority === 'high') ? '🔴 ' : '';
                barsHtml += `<div style="display:flex;align-items:center;border-bottom:1px solid #f5f5f5;"><div style="width:140px;min-width:140px;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:2px 0;" title="${t.name}">${nameTag}${t.name}</div><div style="flex:1;position:relative;height:20px;background:#fafafa;"><div style="position:absolute;height:100%;left:${leftPct}%;width:${widthPct}%;background:${barColor};border-radius:3px;color:#fff;font-size:9px;display:flex;align-items:center;justify-content:center;overflow:hidden;">${t.progress||0}%</div></div></div>`;
            }
        });

        // 今天标线
        const todayPct = (now - rangeStart) / 86400000 / totalDays * 100;
        const todayLine = (todayPct >= 0 && todayPct <= 100) ? `<div style="position:absolute;left:calc(140px + ${todayPct}% * (100% - 140px) / 100);top:0;bottom:0;width:2px;background:#f44336;opacity:0.6;z-index:1;"></div>` : '';

        const timeDesc = { day: '按天', week: '按周', month: '按月' }[granularity] || '';
        return `<div class="report-section" style="margin-bottom:30px;"><h2 style="font-size:20px;font-weight:600;border-bottom:3px solid #667eea;padding-bottom:10px;margin-bottom:15px;">📅 甘特图 <span style="font-size:13px;font-weight:400;color:#888;">（${timeDesc}视图）</span></h2><div style="overflow-x:auto;position:relative;">${todayLine}${headerHtml}${barsHtml}</div></div>`;
    },

    // ========== 问题清单 ==========
    _buildIssues(project) {
        const issues = project.issues || [];
        const severityMap = { critical: '🔴 严重', high: '🟠 高', medium: '🟡 中', low: '🟢 低' };
        const statusMap = { open: '🔴 打开', in_progress: '🔄 处理中', resolved: '✅ 已解决', closed: '🔒 已关闭' };
        const sevColors = { critical: '#ffebee', high: '#fff3e0', medium: '#fff8e1', low: '#e8f5e9' };
        let html = `<div class="report-section" style="margin-bottom:30px;"><h2 style="font-size:20px;font-weight:600;border-bottom:3px solid #667eea;padding-bottom:10px;margin-bottom:15px;">⚠️ 问题清单 (${issues.length}个)</h2>`;
        if (!issues.length) {
            html += '<p style="color:#999;padding:15px;">暂无问题 ✨</p>';
        } else {
            html += `<table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead><tr style="background:#f0f4ff;">
                    <th style="padding:10px 8px;text-align:left;border-bottom:2px solid #ddd;">#</th>
                    <th style="padding:10px 8px;text-align:left;border-bottom:2px solid #ddd;">标题</th>
                    <th style="padding:10px 8px;text-align:left;border-bottom:2px solid #ddd;">严重程度</th>
                    <th style="padding:10px 8px;text-align:left;border-bottom:2px solid #ddd;">状态</th>
                    <th style="padding:10px 8px;text-align:left;border-bottom:2px solid #ddd;">负责人</th>
                    <th style="padding:10px 8px;text-align:left;border-bottom:2px solid #ddd;">描述</th>
                </tr></thead><tbody>`;
            issues.forEach((iss, i) => {
                const bg = sevColors[iss.severity] || '#fff';
                html += `<tr style="background:${bg};">
                    <td style="padding:8px;border-bottom:1px solid #eee;">${i+1}</td>
                    <td style="padding:8px;border-bottom:1px solid #eee;font-weight:500;">${iss.title}</td>
                    <td style="padding:8px;border-bottom:1px solid #eee;">${severityMap[iss.severity] || iss.severity}</td>
                    <td style="padding:8px;border-bottom:1px solid #eee;">${statusMap[iss.status] || iss.status}</td>
                    <td style="padding:8px;border-bottom:1px solid #eee;">${iss.assignee_name || '-'}</td>
                    <td style="padding:8px;border-bottom:1px solid #eee;">${iss.description || '-'}</td>
                </tr>`;
            });
            html += '</tbody></table>';
        }
        html += '</div>';
        return html;
    },

    _buildFooter() {
        const now = new Date().toLocaleDateString('zh-CN');
        return `<div style="text-align:center;font-size:12px;color:#999;padding:20px 40px;border-top:1px solid #eee;margin-top:20px;">由项目管理系统自动生成 · ${now}</div>`;
    },

    // ========== 组装完整报告HTML ==========
    generateReport(project, styleName, opts) {
        const s = this.styles[styleName] || this.styles.classic;
        const sec = (opts && opts.sections) || { tasks: true, kanban: true, gantt: true, issues: true };
        let html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>${project.name} - 项目报告</title>
            <style>* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', sans-serif; color: #333; }</style>
            </head><body style="background:${s.bg};">`;
        html += this._buildHeader(project, styleName, opts);
        html += '<div style="padding:30px 40px;">';
        if (sec.tasks) html += this._buildTaskList(project);
        if (sec.kanban) html += this._buildKanban(project, styleName);
        if (sec.gantt) html += this._buildGantt(project, styleName, opts);
        if (sec.issues) html += this._buildIssues(project);
        html += this._buildFooter();
        html += '</div></body></html>';
        return html;
    },

    // ========== HTML导出 ==========
    exportHTML(project, styleName, opts) {
        const html = this.generateReport(project, styleName, opts);
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
        a.href = url; a.download = `${project.name}_项目报告_${dateStr}.html`;
        a.click(); URL.revokeObjectURL(url);
    },

    // ========== PDF导出：分板块渲染 + 正确分页 ==========
    async exportPDF(project, styleName, opts) {
        // 显示加载提示
        const loadingEl = document.createElement('div');
        loadingEl.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99999;';
        loadingEl.innerHTML = '<div style="background:white;padding:30px 50px;border-radius:12px;font-size:16px;box-shadow:0 4px 20px rgba(0,0,0,0.3);">📄 正在生成PDF报告，请稍候...</div>';
        document.body.appendChild(loadingEl);

        try {
            await this.loadDeps();
            const s = this.styles[styleName] || this.styles.classic;
            const sec = (opts && opts.sections) || { tasks: true, kanban: true, gantt: true, issues: true };

            // 分板块渲染，按sections配置决定包含哪些板块
            const sections = [
                { name: '报告头', html: this._buildHeader(project, styleName, opts) },
            ];
            if (sec.tasks) sections.push({ name: '任务清单', html: this._buildTaskList(project) });
            if (sec.kanban) sections.push({ name: '看板视图', html: this._buildKanban(project, styleName) });
            if (sec.gantt) sections.push({ name: '甘特图', html: this._buildGantt(project, styleName, opts) });
            if (sec.issues) sections.push({ name: '问题清单', html: this._buildIssues(project) });
            sections.push({ name: '页脚', html: this._buildFooter() });

            const RENDER_WIDTH = 800;
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pdfPageW = pdf.internal.pageSize.getWidth();
            const pdfPageH = pdf.internal.pageSize.getHeight();
            const margin = 5;
            const contentW = pdfPageW - margin * 2;
            const contentH = pdfPageH - margin * 2;
            let isFirstPage = true;

            for (const section of sections) {
                if (!section.html || !section.html.trim()) continue;

                // 创建隐藏容器渲染当前板块
                const container = document.createElement('div');
                container.style.cssText = `position:fixed;left:-9999px;top:0;width:${RENDER_WIDTH}px;background:${s.bg};`;
                // 报告头不加padding，其他板块加
                if (section.name !== '报告头' && section.name !== '页脚') {
                    container.innerHTML = `<div style="padding:0 40px;">${section.html}</div>`;
                } else {
                    container.innerHTML = section.html;
                }
                document.body.appendChild(container);

                await new Promise(r => setTimeout(r, 300));

                try {
                    const canvas = await html2canvas(container, {
                        scale: 1.5, useCORS: true, allowTaint: true,
                        backgroundColor: '#ffffff',
                        width: RENDER_WIDTH, windowWidth: RENDER_WIDTH,
                        logging: false, imageTimeout: 0
                    });

                    if (canvas.width === 0 || canvas.height === 0) {
                        document.body.removeChild(container);
                        continue;
                    }

                    // 计算图片在PDF中的尺寸
                    const imgW = contentW;
                    const imgH = canvas.height * imgW / canvas.width;

                    if (imgH <= contentH) {
                        // 板块可以放在一页内
                        if (!isFirstPage) pdf.addPage();
                        pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', margin, margin, imgW, imgH);
                        isFirstPage = false;
                    } else {
                        // 板块需要跨页：按A4页面高度切割
                        const scale = canvas.width / imgW; // px per mm
                        const pagePxH = contentH * scale; // 每页可放多少像素高度
                        const totalSlices = Math.ceil(canvas.height / pagePxH);

                        for (let i = 0; i < totalSlices; i++) {
                            if (!isFirstPage) pdf.addPage();

                            const srcY = i * pagePxH;
                            const srcH = Math.min(pagePxH, canvas.height - srcY);
                            const destH = srcH / scale;

                            // 创建当前切片的canvas
                            const sliceCanvas = document.createElement('canvas');
                            sliceCanvas.width = canvas.width;
                            sliceCanvas.height = srcH;
                            const ctx = sliceCanvas.getContext('2d');
                            ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

                            pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 1.0), 'JPEG', margin, margin, imgW, destH);
                            isFirstPage = false;
                        }
                    }
                } catch (e) {
                    console.warn(`渲染板块"${section.name}"失败:`, e);
                }
                document.body.removeChild(container);
            }

            const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
            pdf.save(`${project.name}_项目报告_${dateStr}.pdf`);
        } finally {
            document.body.removeChild(loadingEl);
        }
    },

    /**
     * 通用HTML转PDF导出（用于周报/月报）
     * @param {string} htmlContent - 完整的HTML内容
     * @param {string} filename - 输出文件名
     */
    async htmlToPDF(htmlContent, filename) {
        await this.loadDeps();
        if (!window.html2canvas || !window.jspdf) {
            alert('PDF导出库加载失败，请检查网络连接后重试');
            return;
        }

        const loadingEl = document.createElement('div');
        loadingEl.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000';
        loadingEl.innerHTML = '<div style="background:white;padding:30px;border-radius:12px;text-align:center"><div style="font-size:24px">📄</div><div>正在生成PDF...</div></div>';
        document.body.appendChild(loadingEl);

        try {
            // 创建隐藏容器渲染HTML
            const container = document.createElement('div');
            container.style.cssText = 'position:absolute;left:-9999px;top:0;width:900px;background:white;padding:30px;';
            document.body.appendChild(container);

            // 使用shadow DOM避免样式冲突
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'width:840px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#333;';
            container.appendChild(wrapper);

            // 提取body内容
            const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
            const styleMatch = htmlContent.match(/<style[^>]*>([\s\S]*)<\/style>/gi);
            if (styleMatch) {
                const styleEl = document.createElement('style');
                styleEl.textContent = styleMatch.map(s => s.replace(/<\/?style[^>]*>/gi, '')).join('\n');
                wrapper.appendChild(styleEl);
            }
            if (bodyMatch) {
                wrapper.innerHTML += bodyMatch[1];
            } else {
                wrapper.innerHTML = htmlContent;
            }

            // 等待渲染
            await new Promise(r => setTimeout(r, 800));

            const canvas = await html2canvas(wrapper, {
                scale: 1.5, useCORS: true, logging: false,
                width: 840, backgroundColor: '#ffffff'
            });

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageW = 210, pageH = 297, margin = 10;
            const imgW = pageW - margin * 2;
            const imgH = canvas.height * imgW / canvas.width;
            const maxH = pageH - margin * 2;
            let y = 0;

            while (y < imgH) {
                const sliceH = Math.min(maxH, imgH - y);
                const srcY = y * canvas.width / imgW;
                const srcH = sliceH * canvas.width / imgW;

                if (y > 0) pdf.addPage();
                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = canvas.width;
                sliceCanvas.height = Math.max(1, Math.round(srcH));
                const ctx = sliceCanvas.getContext('2d');
                ctx.drawImage(canvas, 0, Math.round(srcY), canvas.width, Math.round(srcH), 0, 0, canvas.width, Math.round(srcH));
                pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 1.0), 'JPEG', margin, margin, imgW, sliceH);
                y += maxH;
            }
            pdf.save(filename);
        } catch (e) {
            console.error('PDF导出失败:', e);
            alert('PDF导出失败: ' + e.message);
        } finally {
            // 清理临时元素
            document.querySelectorAll('[style*="left:-9999px"]').forEach(el => el.remove());
            document.body.removeChild(loadingEl);
        }
    }
};
