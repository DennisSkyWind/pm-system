// 甘特图导出模块 - 6种风格 + 5种时间维度
function showExportModal() {
    document.getElementById('export-modal').classList.add('show');
    onExportTimeChange();
    previewExportStyle();
}
function hideExportModal() { document.getElementById('export-modal').classList.remove('show'); }

function onExportTimeChange() {
    const val = document.querySelector('input[name="export-time"]:checked').value;
    const custom = document.getElementById('custom-date-range');
    custom.style.display = val === 'custom' ? 'grid' : 'none';
    
    // 设置默认自定义日期
    if (val === 'custom') {
        const now = new Date();
        if (!document.getElementById('export-start-date').value) {
            document.getElementById('export-start-date').value = now.toISOString().split('T')[0];
            const end = new Date(now); end.setMonth(end.getMonth() + 1);
            document.getElementById('export-end-date').value = end.toISOString().split('T')[0];
        }
    }
    
    // 更新提示信息
    const info = document.getElementById('export-info');
    const tips = {
        week: '📅 本周视图：按天显示，适合查看近期任务安排',
        month: '📆 本月视图：按天显示，适合月度进度跟踪',
        quarter: '📊 本季度视图：按周显示，适合季度规划审视',
        year: '🗓️ 本年度视图：按月显示，适合年度全景概览',
        custom: '✏️ 自定义范围：根据时间跨度自动选择合适的粒度'
    };
    info.textContent = '💡 ' + (tips[val] || '');
}

function previewExportStyle() {
    const style = document.getElementById('export-style').value;
    const samples = {
        classic: '<div style="background:#fff;padding:10px;"><div style="display:flex;gap:4px;margin-bottom:8px;"><div style="width:40px;height:8px;background:#1565c0;border-radius:2px;"></div><div style="width:60px;height:8px;background:#42a5f5;border-radius:2px;"></div></div><div style="font-size:11px;color:#666;">🎨 经典商务 · 白底蓝色条</div></div>',
        modern: '<div style="background:#fff;padding:10px;"><div style="display:flex;gap:4px;margin-bottom:8px;"><div style="width:40px;height:8px;background:linear-gradient(90deg,#ff6b6b,#ee5a24);border-radius:4px;"></div><div style="width:60px;height:8px;background:linear-gradient(90deg,#667eea,#764ba2);border-radius:4px;"></div></div><div style="font-size:11px;color:#666;">🌈 现代彩色 · 渐变配色</div></div>',
        dark: '<div style="background:#1a1a2e;padding:10px;border-radius:4px;"><div style="display:flex;gap:4px;margin-bottom:8px;"><div style="width:40px;height:8px;background:#00d2ff;border-radius:2px;"></div><div style="width:60px;height:8px;background:#7c4dff;border-radius:2px;"></div></div><div style="font-size:11px;color:#aaa;">🌙 深色主题 · 暗底亮色条</div></div>',
        minimal: '<div style="background:#fff;padding:10px;"><div style="display:flex;gap:4px;margin-bottom:8px;"><div style="width:40px;height:8px;border:1px solid #333;"></div><div style="width:60px;height:8px;background:#333;"></div></div><div style="font-size:11px;color:#666;">✏️ 极简线框 · 黑白线条</div></div>',
        gantt: '<div style="background:#fff;padding:10px;"><div style="display:flex;gap:4px;margin-bottom:8px;"><div style="width:40px;height:8px;background:#0d47a1;"></div><div style="width:60px;height:8px;background:#1976d2;"></div></div><div style="font-size:11px;color:#666;">📊 甘特图专业 · 标准PM风格</div></div>',
        timeline: '<div style="background:#fff;padding:10px;"><div style="border-left:3px solid #667eea;padding-left:12px;margin-bottom:8px;"><div style="font-size:10px;color:#667eea;">5/25</div><div style="background:#e8eaf6;padding:4px 8px;border-radius:4px;font-size:10px;">任务A</div></div><div style="font-size:11px;color:#666;">🗓️ 时间轴 · 垂直卡片式</div></div>'
    };
    document.getElementById('export-preview').innerHTML = samples[style] || '';
}

// ========== 风格配色 ==========
const THEMES = {
    classic: {bg:'#fff',hBg:'#f0f4f8',hC:'#333',bp:'#9e9e9e',bip:'#1565c0',bc:'#2e7d32',bd:'#c62828',ms:'#7b1fa2',tl:'#f44336',f:'Arial',rb:'#e0e0e0',wb:'#f5f5f5',tb:'#fff3e0',br:'2px',pBg:'#e3f2fd',pC:'#1565c0',tC:'#333',bH:18,bFC:'#fff',pi:'📁'},
    modern: {bg:'#fff',hBg:'#667eea',hC:'#fff',bp:'#bdc3c7',bip:'#ff9800',bc:'#4caf50',bd:'#f44336',ms:'#9c27b0',tl:'#ff5722',f:'Segoe UI',rb:'#eee',wb:'#fafafa',tb:'#fff3e0',br:'10px',pBg:'#e8eaf6',pC:'#667eea',tC:'#333',bH:18,bFC:'#fff',pi:'📁'},
    dark: {bg:'#1a1a2e',hBg:'#16213e',hC:'#e0e0e0',bp:'#546e7a',bip:'#00d2ff',bc:'#00e676',bd:'#ff5252',ms:'#ea80fc',tl:'#ff5252',f:'Segoe UI',rb:'#2a2a4a',wb:'#1e1e3e',tb:'#2a2a4a',br:'4px',pBg:'#1e3a5f',pC:'#00d2ff',tC:'#e0e0e0',bH:18,bFC:'#fff',pi:'📂'},
    minimal: {bg:'#fff',hBg:'#f9f9f9',hC:'#333',bp:'transparent',bip:'#333',bc:'#333',bd:'#999',ms:'#333',tl:'#f44336',f:'Courier New',rb:'#ddd',wb:'#fafafa',tb:'#fff3e0',br:'0px',pBg:'#f5f5f5',pC:'#333',tC:'#333',bH:16,bFC:'#fff',pi:'▸'},
    gantt: {bg:'#fff',hBg:'#0d47a1',hC:'#fff',bp:'#90caf9',bip:'#1976d2',bc:'#2e7d32',bd:'#c62828',ms:'#ff6f00',tl:'#f44336',f:'Arial',rb:'#e0e0e0',wb:'#e8eaf6',tb:'#fff3e0',br:'0px',pBg:'#e3f2fd',pC:'#0d47a1',tC:'#0d47a1',bH:16,bFC:'#fff',pi:'■'},
    timeline: {bg:'#fff',hBg:'#667eea',hC:'#fff',bp:'#e0e0e0',bip:'#667eea',bc:'#4caf50',bd:'#f44336',ms:'#9c27b0',tl:'#f44336',f:'Segoe UI',rb:'#eee',wb:'#fafafa',tb:'#fff3e0',br:'6px',pBg:'#f3e5f5',pC:'#7b1fa2',tC:'#333',bH:18,bFC:'#fff',pi:'●'}
};

function barColor(status, isDelayed, S) {
    if (isDelayed) return S.bd;
    if (status === 'completed') return S.bc;
    if (status === 'in_progress') return S.bip;
    return S.bp;
}

// ========== 时间范围计算 ==========
function getExportTimeRange() {
    const val = document.querySelector('input[name="export-time"]:checked').value;
    const now = new Date();
    let start, end, granularity; // granularity: 'day'|'week'|'month'
    
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
        const sv = document.getElementById('export-start-date').value;
        const ev = document.getElementById('export-end-date').value;
        start = new Date(sv || now);
        end = new Date(ev || new Date(now.getTime() + 30*86400000));
        // 根据跨度自动选粒度
        const spanDays = Math.ceil((end - start) / 86400000);
        granularity = spanDays <= 45 ? 'day' : spanDays <= 180 ? 'week' : 'month';
    }
    return { start, end, granularity };
}

// ========== 生成日期头 ==========
function buildDateHeaders(rangeStart, rangeEnd, granularity) {
    const headers = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    if (granularity === 'day') {
        const c = new Date(rangeStart);
        while (c <= rangeEnd) {
            const ds = c.toISOString().split('T')[0];
            headers.push({ date: ds, label: `${c.getMonth()+1}/${c.getDate()}`, isWeekend: c.getDay()===0||c.getDay()===6, isToday: ds===todayStr });
            c.setDate(c.getDate() + 1);
        }
    } else if (granularity === 'week') {
        // 按周聚合，显示"5/26-6/1"格式
        const c = new Date(rangeStart);
        // 对齐到周一
        c.setDate(c.getDate() - ((c.getDay() + 6) % 7));
        while (c <= rangeEnd) {
            const weekStart = new Date(c);
            const weekEnd = new Date(c); weekEnd.setDate(c.getDate() + 6);
            const label = `${weekStart.getMonth()+1}/${weekStart.getDate()}-${weekEnd.getMonth()+1}/${weekEnd.getDate()}`;
            const midDate = new Date(c); midDate.setDate(c.getDate() + 3);
            const ds = midDate.toISOString().split('T')[0];
            headers.push({ date: ds, label, isWeekend: false, isToday: weekStart <= now && now <= weekEnd, weekStart, weekEnd });
            c.setDate(c.getDate() + 7);
        }
    } else { // month
        const c = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
        while (c <= rangeEnd) {
            const ds = c.toISOString().split('T')[0];
            const label = `${c.getFullYear()}/${c.getMonth()+1}月`;
            const isToday = c.getMonth() === now.getMonth() && c.getFullYear() === now.getFullYear();
            headers.push({ date: ds, label, isWeekend: false, isToday });
            c.setMonth(c.getMonth() + 1);
        }
    }
    return headers;
}

// ========== 时间粒度对应的列宽 ==========
function getColumnWidth(granularity) {
    if (granularity === 'day') return 28;
    if (granularity === 'week') return 60;
    return 80; // month
}

// ========== 主生成函数 ==========
function generateGanttExport(style) {
    const tasks = window._ganttTasks || [];
    const phases = window._ganttPhases || [];
    const projects = window._ganttProjects || [];
    const displayMode = document.getElementById('display-mode').value;
    const S = THEMES[style] || THEMES.classic;
    const isTimeline = (style === 'timeline');
    
    const { start: rangeStart, end: rangeEnd, granularity } = getExportTimeRange();
    const headers = buildDateHeaders(rangeStart, rangeEnd, granularity);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const PX = getColumnWidth(granularity);
    const leftW = 200;
    const chartWidth = headers.length * PX;

    // ========== 时间轴风格 ==========
    if (isTimeline) {
        let items = [];
        if (displayMode !== 'phases') items = items.concat(tasks.map(t => ({...t, _type:'task'})));
        if (displayMode !== 'tasks') items = items.concat(phases.map(p => ({...p, _type:'phase'})));
        items.sort((a,b) => {
            const da = a.due_date || a.target_end_date || a.start_date || '9';
            const db = b.due_date || b.target_end_date || b.start_date || '9';
            return da.localeCompare(db);
        });
        const statusLabel = {pending:'待处理',in_progress:'进行中',completed:'已完成',cancelled:'已中止'};
        const timeLabel = {week:'本周',month:'本月',quarter:'本季度',year:'本年度',custom:'自定义'};
        const timeVal = document.querySelector('input[name="export-time"]:checked').value;
        let html = `<div style="font-family:${S.f};background:${S.bg};padding:30px;width:900px;">`;
        html += `<div style="text-align:center;margin-bottom:24px;"><h2 style="color:${S.tC};margin:0;">项目甘特图 - 时间轴视图</h2><p style="color:#888;font-size:13px;margin-top:6px;">${timeLabel[timeVal]} · ${rangeStart.toISOString().split('T')[0]} ~ ${rangeEnd.toISOString().split('T')[0]} · 导出：${now.toLocaleString('zh-CN')}</p></div>`;
        items.forEach(item => {
            const dateStr = item.due_date || item.target_end_date || item.start_date || '-';
            const isPhase = item._type === 'phase';
            const borderColor = isPhase ? S.pC : barColor(item.status, item.due_date && item.due_date < todayStr && item.status !== 'completed', S);
            const bgColor = isPhase ? S.pBg : (item.status === 'completed' ? '#f1f8e9' : item.status === 'in_progress' ? '#fff3e0' : '#f5f5f5');
            const name = item.name || item.title || '-';
            const status = statusLabel[item.status] || item.status || '';
            html += `<div style="border-left:4px solid ${borderColor};padding:10px 16px;margin-bottom:12px;background:${bgColor};border-radius:0 ${S.br} ${S.br} 0;">`;
            html += `<div style="font-size:11px;color:${borderColor};margin-bottom:4px;">📅 ${dateStr}</div>`;
            html += `<div style="font-size:14px;font-weight:600;color:${S.tC};">${isPhase ? S.pi+' ' : ''}${name}</div>`;
            if (!isPhase) html += `<div style="font-size:12px;color:#888;margin-top:3px;">${status}${item.assignee_name ? ' · '+item.assignee_name : ''}${item.progress ? ' · '+item.progress+'%' : ''}</div>`;
            if (isPhase) html += `<div style="font-size:12px;color:#888;margin-top:3px;">${item.progress||0}% 完成</div>`;
            html += `</div>`;
        });
        html += '</div>';
        return html;
    }

    // ========== 标准甘特图布局 ==========
    let items = [];
    if (projects.length > 1) {
        projects.forEach(proj => {
            const pTasks = displayMode !== 'phases' ? tasks.filter(t => t.project_id === proj.id) : [];
            const pPhases = displayMode !== 'tasks' ? phases.filter(p => p.project_id === proj.id) : [];
            items.push({type:'header', name:proj.name, count: pTasks.length});
            pPhases.forEach(p => items.push({type:'phase', ...p}));
            pTasks.forEach(t => items.push({type:'task', project_name:proj.name, ...t}));
        });
    } else {
        if (displayMode !== 'tasks') phases.forEach(p => items.push({type:'phase', ...p}));
        if (displayMode !== 'phases') tasks.forEach(t => items.push({type:'task', ...t}));
    }

    const statusLabel = {pending:'待处理',in_progress:'进行中',completed:'已完成',cancelled:'已中止'};
    const timeLabel = {week:'本周',month:'本月',quarter:'本季度',year:'本年度',custom:'自定义'};
    const timeVal = document.querySelector('input[name="export-time"]:checked').value;

    let html = `<div style="font-family:${S.f};background:${S.bg};padding:30px;width:${leftW + chartWidth + 80}px;">`;
    // 标题
    html += `<div style="text-align:center;margin-bottom:20px;"><h2 style="color:${S.tC};margin:0;">项目甘特图</h2><p style="color:#888;font-size:13px;margin-top:6px;">${timeLabel[timeVal]} · ${rangeStart.toISOString().split('T')[0]} ~ ${rangeEnd.toISOString().split('T')[0]} · ${granularity==='day'?'按天':granularity==='week'?'按周':'按月'} · 导出：${now.toLocaleString('zh-CN')}</p></div>`;
    // 表格
    html += `<div style="border:1px solid ${S.rb};border-radius:${S.br};overflow:hidden;">`;
    // 表头
    html += `<div style="display:flex;background:${S.hBg};color:${S.hC};font-weight:bold;font-size:12px;">`;
    html += `<div style="width:${leftW}px;padding:10px;border-right:1px solid ${S.rb};">任务/阶段</div>`;
    html += `<div style="display:flex;flex:1;overflow:hidden;">`;
    headers.forEach(h => {
        const bg = h.isToday ? S.tb : (h.isWeekend ? S.wb : 'transparent');
        const fw = h.isToday ? 'bold' : 'normal';
        html += `<div style="min-width:${PX}px;text-align:center;padding:10px 2px;background:${bg};font-weight:${fw};font-size:${granularity==='month'?'11px':'10px'};white-space:nowrap;">${h.label}</div>`;
    });
    html += `</div></div>`;

    // 数据行
    items.forEach(item => {
        if (item.type === 'header') {
            html += `<div style="display:flex;background:${S.pBg};color:${S.pC};font-weight:bold;font-size:13px;border-top:1px solid ${S.rb};border-bottom:1px solid ${S.rb};">`;
            html += `<div style="width:${leftW}px;padding:10px;border-right:1px solid ${S.rb};">${S.pi} ${item.name} <span style="font-weight:normal;font-size:11px;">(${item.count}个任务)</span></div>`;
            html += `<div style="flex:1;"></div></div>`;
        } else {
            const name = item.name || '-';
            const isDelayed = item.due_date && item.due_date < todayStr && item.status !== 'completed';
            const color = barColor(item.status, isDelayed, S);
            const startDate = item.created_at ? item.created_at.split(' ')[0] : null;
            const endDate = item.due_date || item.target_end_date;
            
            // 根据粒度计算位置
            let leftPos = 0, barWidth = PX;
            if (granularity === 'day') {
                if (startDate) { const diff = Math.floor((new Date(startDate) - rangeStart) / 86400000); leftPos = Math.max(0, diff * PX); }
                if (endDate && startDate) { const dur = Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000) + 1; barWidth = Math.max(PX/2, dur * PX); }
            } else if (granularity === 'week') {
                if (startDate) { const diff = Math.floor((new Date(startDate) - rangeStart) / (7*86400000)); leftPos = Math.max(0, diff * PX); }
                if (endDate && startDate) { const dur = Math.ceil((new Date(endDate) - new Date(startDate)) / (7*86400000)) + 1; barWidth = Math.max(PX/2, dur * PX); }
            } else { // month
                if (startDate) { const monthsDiff = (new Date(startDate).getFullYear()-rangeStart.getFullYear())*12 + new Date(startDate).getMonth()-rangeStart.getMonth(); leftPos = Math.max(0, monthsDiff * PX); }
                if (endDate && startDate) { const monthsDur = (new Date(endDate).getFullYear()-new Date(startDate).getFullYear())*12 + new Date(endDate).getMonth()-new Date(startDate).getMonth() + 1; barWidth = Math.max(PX/2, monthsDur * PX); }
            }

            const isPhase = item.type === 'phase';
            const rowBg = isPhase ? S.pBg : 'transparent';
            const nameColor = isPhase ? S.pC : S.tC;
            const statusIcon = item.status === 'completed' ? '✅' : item.status === 'in_progress' ? '⏳' : '⏸️';
            const progress = item.progress || 0;

            html += `<div style="display:flex;border-bottom:1px solid ${S.rb};background:${rowBg};">`;
            html += `<div style="width:${leftW}px;padding:8px 10px;border-right:1px solid ${S.rb};display:flex;align-items:center;gap:6px;font-size:12px;">`;
            html += `<span>${statusIcon}</span><span style="color:${nameColor};font-weight:${isPhase?'600':'400'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${isPhase?S.pi+' ':''}${name}</span>`;
            html += `</div>`;
            html += `<div style="flex:1;position:relative;min-height:34px;overflow:hidden;">`;
            
            // 周末/今日背景
            headers.forEach((h,i) => {
                if (h.isWeekend) html += `<div style="position:absolute;top:0;bottom:0;left:${i*PX}px;width:${PX}px;background:${S.wb};opacity:0.5;"></div>`;
                if (h.isToday) html += `<div style="position:absolute;top:0;bottom:0;left:${i*PX}px;width:${PX}px;background:${S.tb};opacity:0.6;"></div>`;
            });
            
            // 今日线（仅day粒度）
            if (granularity === 'day') {
                const todayOff = Math.floor((now - rangeStart) / 86400000) * PX;
                if (todayOff >= 0 && todayOff <= chartWidth) {
                    html += `<div style="position:absolute;top:0;bottom:0;left:${todayOff}px;width:2px;background:${S.tl};z-index:5;"></div>`;
                }
            } else if (granularity === 'week') {
                const weeksFromStart = Math.floor((now - rangeStart) / (7*86400000));
                const todayOff = weeksFromStart * PX;
                if (todayOff >= 0 && todayOff <= chartWidth) {
                    html += `<div style="position:absolute;top:0;bottom:0;left:${todayOff}px;width:2px;background:${S.tl};z-index:5;"></div>`;
                }
            } else {
                const monthsFromStart = (now.getFullYear()-rangeStart.getFullYear())*12 + now.getMonth()-rangeStart.getMonth();
                const todayOff = monthsFromStart * PX;
                if (todayOff >= 0 && todayOff <= chartWidth) {
                    html += `<div style="position:absolute;top:0;bottom:0;left:${todayOff}px;width:2px;background:${S.tl};z-index:5;"></div>`;
                }
            }
            
            // 任务条
            const borderStyle = isPhase ? `border:2px solid ${S.pC}` : '';
            html += `<div style="position:absolute;top:7px;left:${leftPos}px;height:${S.bH}px;width:${barWidth}px;background:${color};border-radius:${S.br};display:flex;align-items:center;justify-content:center;font-size:10px;color:${S.bFC};${borderStyle};overflow:hidden;white-space:nowrap;">`;
            if (progress > 0 && !isPhase) {
                html += `<div style="position:absolute;left:0;top:0;bottom:0;width:${progress}%;background:rgba(255,255,255,0.2);border-radius:${S.br};"></div>`;
            }
            html += `${progress}%`;
            html += `</div>`;
            
            // 里程碑
            if (endDate && granularity === 'day') {
                const msOff = Math.floor((new Date(endDate) - rangeStart) / 86400000) * PX + PX/2;
                html += `<div style="position:absolute;top:${7+S.bH/2-5}px;left:${msOff}px;width:10px;height:10px;background:${S.ms};border-radius:50%;transform:translateX(-50%);z-index:6;"></div>`;
            }
            
            html += `</div></div>`;
        }
    });
    html += `</div>`;
    
    // 图例
    html += `<div style="display:flex;gap:20px;margin-top:15px;font-size:11px;color:#888;flex-wrap:wrap;">`;
    html += `<span><span style="display:inline-block;width:12px;height:8px;background:${S.bp};border-radius:2px;vertical-align:middle;"></span> 待处理</span>`;
    html += `<span><span style="display:inline-block;width:12px;height:8px;background:${S.bip};border-radius:2px;vertical-align:middle;"></span> 进行中</span>`;
    html += `<span><span style="display:inline-block;width:12px;height:8px;background:${S.bc};border-radius:2px;vertical-align:middle;"></span> 已完成</span>`;
    html += `<span><span style="display:inline-block;width:12px;height:8px;background:${S.bd};border-radius:2px;vertical-align:middle;"></span> 已延期</span>`;
    html += `<span><span style="display:inline-block;width:8px;height:8px;background:${S.ms};border-radius:50%;vertical-align:middle;"></span> 里程碑</span>`;
    html += `</div></div>`;
    return html;
}

// ========== 执行导出 ==========
async function doExport() {
    const style = document.getElementById('export-style').value;
    const format = document.getElementById('export-format').value;
    
    window._ganttTasks = window._ganttTasks || [];
    window._ganttPhases = window._ganttPhases || [];
    window._ganttProjects = window._ganttProjects || [];
    
    const exportHTML = generateGanttExport(style);
    
    // 创建临时容器
    const container = document.createElement('div');
    container.innerHTML = exportHTML;
    container.style.cssText = 'position:absolute;left:-9999px;top:0;';
    document.body.appendChild(container);
    
    // 加载html2canvas
    if (typeof html2canvas === 'undefined') {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        document.head.appendChild(s);
        await new Promise(r => s.onload = r);
    }
    
    try {
        const canvas = await html2canvas(container, {scale:2, backgroundColor:null, useCORS:true});
        document.body.removeChild(container);
        
        if (format === 'png') {
            const link = document.createElement('a');
            link.download = `甘特图_${style}_${new Date().toISOString().slice(0,10)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } else {
            if (typeof jspdf === 'undefined') {
                const s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
                document.head.appendChild(s);
                await new Promise(r => s.onload = r);
            }
            const {jsPDF} = window.jspdf;
            const pdf = new jsPDF('l', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = (canvas.height * pdfW) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 10, pdfW, Math.min(pdfH, 180));
            pdf.save(`甘特图_${style}_${new Date().toISOString().slice(0,10)}.pdf`);
        }
        hideExportModal();
        alert('✅ 导出完成！');
    } catch(e) {
        document.body.removeChild(container);
        alert('❌ 导出失败: ' + e.message);
        console.error(e);
    }
}