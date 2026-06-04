// 任务看板导出模块 - 5种风格 + PNG/PDF导出
// 依赖: html2canvas, jsPDF (动态加载)

// ========== 动态加载依赖 ==========
async function loadExportDeps() {
    if (window.html2canvas && window.jspdf) return;
    
    const loadScript = (src) => new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
    
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
}

// ========== 5种导出风格 ==========
const KANBAN_STYLES = {
    classic: {
        name: '🏢 经典商务',
        desc: '蓝白配色，专业简洁',
        bg: '#ffffff',
        headerBg: '#1a365d',
        headerColor: '#ffffff',
        columnBg: { pending: '#fff8e1', in_progress: '#e3f2fd', completed: '#e8f5e9' },
        columnHeader: { pending: '#f57c00', in_progress: '#1565c0', completed: '#2e7d32' },
        cardBg: '#ffffff',
        cardBorder: '#e0e0e0',
        cardShadow: '0 2px 6px rgba(0,0,0,0.08)',
        titleColor: '#1a365d',
        metaColor: '#666666',
        progressBg: '#e0e0e0'
    },
    modern: {
        name: '🎨 现代彩色',
        desc: '渐变色彩，活力十足',
        bg: '#f8f9ff',
        headerBg: 'linear-gradient(135deg, #667eea, #764ba2)',
        headerColor: '#ffffff',
        columnBg: { pending: '#fff3f3', in_progress: '#f0f4ff', completed: '#f0fff4' },
        columnHeader: { pending: '#e53e3e', in_progress: '#667eea', completed: '#38a169' },
        cardBg: '#ffffff',
        cardBorder: 'transparent',
        cardShadow: '0 4px 12px rgba(0,0,0,0.08)',
        titleColor: '#2d3748',
        metaColor: '#718096',
        progressBg: '#edf2f7'
    },
    dark: {
        name: '🌙 深色主题',
        desc: '暗色背景，护眼舒适',
        bg: '#1a1a2e',
        headerBg: '#16213e',
        headerColor: '#e94560',
        columnBg: { pending: '#1f1f3a', in_progress: '#1f2a3a', completed: '#1a2f1a' },
        columnHeader: { pending: '#ff6b6b', in_progress: '#4ecdc4', completed: '#6bcb77' },
        cardBg: '#252545',
        cardBorder: '#333355',
        cardShadow: '0 2px 8px rgba(0,0,0,0.3)',
        titleColor: '#e2e8f0',
        metaColor: '#a0aec0',
        progressBg: '#2d3748'
    },
    minimal: {
        name: '✏️ 极简线框',
        desc: '黑白线条，极简主义',
        bg: '#ffffff',
        headerBg: '#000000',
        headerColor: '#ffffff',
        columnBg: { pending: '#fafafa', in_progress: '#fafafa', completed: '#fafafa' },
        columnHeader: { pending: '#333333', in_progress: '#333333', completed: '#333333' },
        cardBg: '#ffffff',
        cardBorder: '#cccccc',
        cardShadow: 'none',
        titleColor: '#111111',
        metaColor: '#888888',
        progressBg: '#eeeeee'
    },
    kanban_pro: {
        name: '📊 看板专业',
        desc: '多列泳道，专业看板风格',
        bg: '#f4f5f7',
        headerBg: '#0065ff',
        headerColor: '#ffffff',
        columnBg: { pending: '#ebecf0', in_progress: '#ebecf0', completed: '#ebecf0' },
        columnHeader: { pending: '#de350b', in_progress: '#0065ff', completed: '#00875a' },
        cardBg: '#ffffff',
        cardBorder: 'transparent',
        cardShadow: '0 1px 2px rgba(0,0,0,0.1)',
        titleColor: '#172b4d',
        metaColor: '#5e6c84',
        progressBg: '#dfe1e6'
    }
};

// ========== 获取看板数据 ==========
function getKanbanExportData() {
    const today = new Date().toISOString().split('T')[0];
    const columns = { pending: [], in_progress: [], completed: [] };
    const statusNames = { pending: '📋 待处理', in_progress: '🔄 进行中', completed: '✅ 已完成' };
    
    const tasks = (typeof filteredTasks !== 'undefined' && filteredTasks.length > 0) ? filteredTasks : (typeof allTasks !== 'undefined' ? allTasks : []);
    
    tasks.forEach(t => {
        const status = t.status || 'pending';
        if (columns[status]) {
            columns[status].push(t);
        } else {
            columns['pending'].push(t);
        }
    });
    
    // 获取项目名
    const projectName = (typeof projectsList !== 'undefined' && projectsList.length > 0) 
        ? projectsList[0].name : '全部项目';
    
    return { columns, statusNames, today, projectName, taskCount: tasks.length };
}

// ========== 生成导出HTML ==========
function generateKanbanHTML(styleKey, format) {
    const style = KANBAN_STYLES[styleKey];
    const data = getKanbanExportData();
    const isHeaderGradient = style.headerBg.includes('gradient');
    
    const priorityIcons = { high: '🔴', medium: '🟡', low: '🟢' };
    const priorityNames = { high: '高', medium: '中', low: '低' };
    const statusIcons = { pending: '📋', in_progress: '🔄', completed: '✅' };
    
    // 计算各列宽度
    const colWidth = Math.floor((format === 'landscape' ? 1120 : 760) / 3);
    
    let html = `<div style="background:${style.bg};padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;width:${format === 'landscape' ? 1200 : 800}px;">
        
        <!-- 标题栏 -->
        <div style="background:${style.headerBg};color:${style.headerColor};padding:24px 32px;${isHeaderGradient ? 'background-image:' + style.headerBg + ';' : ''}">
            <div style="font-size:24px;font-weight:700;margin-bottom:4px;">📌 任务看板</div>
            <div style="font-size:14px;opacity:0.85;">${data.projectName} | ${data.taskCount}个任务 | 导出日期: ${data.today}</div>
        </div>
        
        <!-- 看板列 -->
        <div style="display:flex;gap:16px;padding:20px;align-items:flex-start;">`;
    
    Object.keys(data.columns).forEach(status => {
        const tasks = data.columns[status];
        const colHeaderColor = typeof style.columnHeader === 'object' ? style.columnHeader[status] : style.columnHeader;
        const colBg = typeof style.columnBg === 'object' ? style.columnBg[status] : style.columnBg;
        
        html += `<div style="flex:1;min-width:${colWidth}px;background:${colBg};border-radius:12px;padding:16px;">
            
            <!-- 列头 -->
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:3px solid ${colHeaderColor};">
                <div style="font-size:16px;font-weight:700;color:${colHeaderColor};">
                    ${statusIcons[status] || ''} ${data.statusNames[status]}
                </div>
                <div style="background:${colHeaderColor};color:#fff;padding:2px 12px;border-radius:12px;font-size:13px;font-weight:600;">
                    ${tasks.length}
                </div>
            </div>`;
        
        // 任务卡片
        tasks.forEach(t => {
            const progressColor = (t.progress || 0) >= 80 ? '#4caf50' : (t.progress || 0) >= 50 ? '#ff9800' : '#667eea';
            const isOverdue = t.due_date && t.due_date < data.today && t.status !== 'completed';
            const priorityColor = { high: '#f44336', medium: '#ff9800', low: '#4caf50' }[t.priority] || '#999';
            
            html += `<div style="background:${style.cardBg};border:1px solid ${style.cardBorder};border-left:4px solid ${priorityColor};border-radius:8px;padding:14px;margin-bottom:10px;box-shadow:${style.cardShadow};">
                <div style="font-size:14px;font-weight:600;color:${style.titleColor};margin-bottom:8px;line-height:1.4;">${t.name || '未命名'}</div>
                
                <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:12px;color:${style.metaColor};margin-bottom:10px;">
                    ${t.assignee_name ? `<span>👤 ${t.assignee_name}</span>` : ''}
                    ${t.due_date ? `<span style="${isOverdue ? 'color:#f44336;font-weight:600;' : ''}">📅 ${t.due_date}${isOverdue ? ' ⚠️' : ''}</span>` : ''}
                    <span>${priorityIcons[t.priority] || ''} ${priorityNames[t.priority] || ''}</span>
                </div>
                
                <!-- 进度条 -->
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="flex:1;height:6px;background:${style.progressBg};border-radius:3px;overflow:hidden;">
                        <div style="height:100%;width:${t.progress || 0}%;background:${progressColor};border-radius:3px;"></div>
                    </div>
                    <span style="font-size:11px;color:${style.metaColor};font-weight:600;">${t.progress || 0}%</span>
                </div>
            </div>`;
        });
        
        if (tasks.length === 0) {
            html += `<div style="text-align:center;padding:30px 10px;color:${style.metaColor};font-size:13px;opacity:0.6;">暂无任务</div>`;
        }
        
        html += `</div>`;
    });
    
    html += `</div>
        
        <!-- 页脚 -->
        <div style="padding:12px 32px;border-top:1px solid ${style.cardBorder};display:flex;justify-content:space-between;font-size:11px;color:${style.metaColor};">
            <span>PM系统 · 任务看板导出</span>
            <span>${data.today}</span>
        </div>
    </div>`;
    
    return html;
}

// ========== 导出弹窗 ==========
function showKanbanExportModal() {
    // 移除旧弹窗
    const old = document.getElementById('kanban-export-modal');
    if (old) old.remove();
    
    const modal = document.createElement('div');
    modal.id = 'kanban-export-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';
    
    let styleCards = '';
    Object.keys(KANBAN_STYLES).forEach(key => {
        const s = KANBAN_STYLES[key];
        const isGradient = s.headerBg.includes('gradient');
        const previewBg = isGradient ? '#667eea' : s.headerBg;
        const previewCol = typeof s.columnBg === 'object' ? s.columnBg.in_progress : s.columnBg;
        styleCards += `<div onclick="selectKanbanStyle('${key}')" class="ke-style-card" data-style="${key}" style="cursor:pointer;border:3px solid transparent;border-radius:12px;padding:12px;text-align:center;transition:all 0.2s;background:${s.bg};">
            <div style="height:8px;background:${previewBg};border-radius:4px;margin-bottom:8px;"></div>
            <div style="display:flex;gap:4px;margin-bottom:8px;">
                <div style="flex:1;height:24px;background:${previewCol};border-radius:4px;"></div>
                <div style="flex:1;height:24px;background:${previewCol};border-radius:4px;"></div>
                <div style="flex:1;height:24px;background:${previewCol};border-radius:4px;"></div>
            </div>
            <div style="font-size:14px;font-weight:600;color:#333;">${s.name}</div>
            <div style="font-size:11px;color:#888;margin-top:2px;">${s.desc}</div>
        </div>`;
    });
    
    modal.innerHTML = `<div style="background:white;border-radius:16px;padding:30px;max-width:680px;width:90%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <h2 style="margin:0;font-size:20px;">📤 导出看板</h2>
            <button onclick="document.getElementById('kanban-export-modal').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#999;">✕</button>
        </div>
        
        <div style="margin-bottom:20px;">
            <label style="font-size:14px;font-weight:600;margin-bottom:10px;display:block;">选择风格</label>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
                ${styleCards}
            </div>
        </div>
        
        <div style="margin-bottom:20px;">
            <label style="font-size:14px;font-weight:600;margin-bottom:10px;display:block;">页面方向</label>
            <div style="display:flex;gap:12px;">
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:8px 16px;border:2px solid #e0e0e0;border-radius:8px;">
                    <input type="radio" name="kanban-format" value="landscape" checked> 📐 横向（推荐）
                </label>
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:8px 16px;border:2px solid #e0e0e0;border-radius:8px;">
                    <input type="radio" name="kanban-format" value="portrait"> 📄 纵向
                </label>
            </div>
        </div>
        
        <div style="margin-bottom:20px;">
            <label style="font-size:14px;font-weight:600;margin-bottom:10px;display:block;">导出格式</label>
            <div style="display:flex;gap:12px;">
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:8px 16px;border:2px solid #e0e0e0;border-radius:8px;">
                    <input type="radio" name="kanban-type" value="png" checked> 🖼️ PNG 图片
                </label>
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:8px 16px;border:2px solid #e0e0e0;border-radius:8px;">
                    <input type="radio" name="kanban-type" value="pdf"> 📑 PDF 文档
                </label>
            </div>
        </div>
        
        <div style="display:flex;gap:12px;justify-content:flex-end;">
            <button onclick="document.getElementById('kanban-export-modal').remove()" style="padding:10px 24px;border:1px solid #ddd;border-radius:8px;background:white;cursor:pointer;font-size:14px;">取消</button>
            <button onclick="doKanbanExport()" style="padding:10px 24px;background:#667eea;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;">📥 导出</button>
        </div>
    </div>`;
    
    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    // 默认选中第一个风格
    selectKanbanStyle('classic');
}

let _selectedKanbanStyle = 'classic';

function selectKanbanStyle(styleKey) {
    _selectedKanbanStyle = styleKey;
    document.querySelectorAll('.ke-style-card').forEach(el => {
        const isSelected = el.dataset.style === styleKey;
        el.style.borderColor = isSelected ? '#667eea' : 'transparent';
        el.style.transform = isSelected ? 'scale(1.05)' : 'scale(1)';
    });
}

// ========== 执行导出 ==========
async function doKanbanExport() {
    const format = document.querySelector('input[name="kanban-format"]:checked')?.value || 'landscape';
    const type = document.querySelector('input[name="kanban-type"]:checked')?.value || 'png';
    const styleKey = _selectedKanbanStyle;
    
    // 关闭弹窗
    document.getElementById('kanban-export-modal')?.remove();
    
    // 显示进度
    const progress = document.createElement('div');
    progress.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:30px 40px;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.2);z-index:10001;text-align:center;';
    progress.innerHTML = '<div style="font-size:18px;margin-bottom:10px;">⏳ 正在生成导出...</div><div style="color:#888;font-size:13px;">请稍候</div>';
    document.body.appendChild(progress);
    
    try {
        await loadExportDeps();
        
        // 创建临时容器
        const container = document.createElement('div');
        container.style.cssText = 'position:absolute;left:-9999px;top:0;';
        document.body.appendChild(container);
        
        container.innerHTML = generateKanbanHTML(styleKey, format);
        
        // 等待渲染
        await new Promise(r => setTimeout(r, 300));
        
        const canvas = await html2canvas(container.firstElementChild, {
            scale: 2,
            useCORS: true,
            backgroundColor: null
        });
        
        document.body.removeChild(container);
        
        if (type === 'png') {
            // 下载PNG
            const link = document.createElement('a');
            link.download = `看板导出_${KANBAN_STYLES[styleKey].name}_${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } else {
            // 下载PDF
            const { jsPDF } = window.jspdf;
            const pdfWidth = format === 'landscape' ? 420 : 297;
            const pdfHeight = format === 'landscape' ? 297 : 420;
            const pdf = new jsPDF({ orientation: format, unit: 'mm', format: 'a3' });
            
            const imgData = canvas.toDataURL('image/png');
            const imgRatio = canvas.width / canvas.height;
            let imgW = pdfWidth - 20;
            let imgH = imgW / imgRatio;
            if (imgH > pdfHeight - 20) {
                imgH = pdfHeight - 20;
                imgW = imgH * imgRatio;
            }
            
            pdf.addImage(imgData, 'PNG', 10, 10, imgW, imgH);
            pdf.save(`看板导出_${KANBAN_STYLES[styleKey].name}_${new Date().toISOString().split('T')[0]}.pdf`);
        }
        
        progress.innerHTML = '<div style="font-size:18px;margin-bottom:10px;">✅ 导出成功！</div><div style="color:#888;font-size:13px;">文件已开始下载</div>';
        setTimeout(() => progress.remove(), 1500);
        
    } catch (e) {
        console.error('看板导出失败:', e);
        progress.innerHTML = `<div style="font-size:18px;margin-bottom:10px;">❌ 导出失败</div><div style="color:#888;font-size:13px;">${e.message}</div>`;
        setTimeout(() => progress.remove(), 3000);
    }
}
