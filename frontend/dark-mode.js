/* PM系统主题切换 - 四套主题
 *
 * 经典亮色  theme-classic
 * 经典暗色  body.dark
 * 科技大屏  theme-tech      （深蓝星云 + 青色辉光）
 * 企业MIS   theme-enterprise （蓝渐变顶栏 + 深蓝侧栏 + 白底表格）
 *
 * 偏好存 localStorage，跨页面保持。
 */
(function () {
    const KEY = 'pm_theme';
    const ORDER = ['classic', 'dark', 'tech', 'enterprise'];
    const ICONS = { classic: '☀️', dark: '🌙', tech: '🚀', enterprise: '🏢' };
    const LABELS = { classic: '经典亮色', dark: '经典暗色', tech: '科技大屏', enterprise: '企业MIS' };

    /** 读取已保存的主题 */
    function saved() {
        try { return localStorage.getItem(KEY); } catch (e) { return null; }
    }

    /** 兼容旧的 pm_dark_mode */
    function legacy() {
        try { return localStorage.getItem('pm_dark_mode') === 'true' ? 'dark' : null; } catch (e) { return null; }
    }

    function current() {
        const s = saved() || legacy();
        return ORDER.indexOf(s) >= 0 ? s : 'classic';
    }

    /** 应用主题 */
    function apply(theme) {
        if (ORDER.indexOf(theme) < 0) theme = 'classic';

        const b = document.body;
        if (!b) return;

        b.classList.remove('dark', 'theme-tech', 'theme-enterprise');
        // 标记页面是否带导航栏（登录页/工具页没有 nav，企业风不该画侧栏）
        b.classList.toggle('has-nav', !!document.querySelector('header, nav'));
        if (theme === 'dark') b.classList.add('dark');
        if (theme === 'tech') b.classList.add('theme-tech');
        if (theme === 'enterprise') b.classList.add('theme-enterprise');

        try {
            localStorage.setItem(KEY, theme);
            // 同步旧键，避免老逻辑干扰
            localStorage.setItem('pm_dark_mode', theme === 'dark' ? 'true' : 'false');
        } catch (e) {}

        // 同步所有切换按钮的显示
        document.querySelectorAll('.theme-switch-btn').forEach(btn => {
            const t = btn.dataset.theme;
            btn.textContent = ICONS[t] || '';
            btn.title = '当前：' + (LABELS[t] || t) + '（点击切换）';
        });

        // 通知页面图表等 JS 重新按新主题渲染
        document.dispatchEvent(new CustomEvent('pm-theme-change', { detail: { theme } }));
    }

    /** 循环切到下一个主题 */
    window.cycleTheme = function () {
        const next = ORDER[(ORDER.indexOf(current()) + 1) % ORDER.length];
        apply(next);
        return next;
    };

    window.setTheme = apply;
    window.getTheme = current;

    /** 旧接口兼容：保留 toggleDarkMode，行为改为在亮/暗之间切 */
    window.toggleDarkMode = function () {
        const c = current();
        apply(c === 'dark' ? 'classic' : 'dark');
    };

    /** 主题切换按钮：点击展开选项 */
    window.showThemePicker = function () {
        const old = document.getElementById('theme-picker');
        if (old) { old.remove(); return; }

        const box = document.createElement('div');
        box.id = 'theme-picker';
        box.style.cssText = 'position:fixed;top:60px;right:16px;z-index:99999;background:#fff;' +
            'border:1px solid #ddd;border-radius:8px;box-shadow:0 8px 28px rgba(0,0,0,.18);padding:6px;min-width:132px;';

        ORDER.forEach(t => {
            const item = document.createElement('div');
            const isCur = t === current();
            item.style.cssText = 'padding:9px 14px;border-radius:5px;cursor:pointer;font-size:14px;' +
                'display:flex;align-items:center;gap:8px;white-space:nowrap;' +
                (isCur ? 'background:#667eea;color:#fff;font-weight:600;' : 'color:#333;');
            item.innerHTML = `<span style="font-size:15px">${ICONS[t]}</span><span>${LABELS[t]}</span>` +
                (isCur ? '<span style="margin-left:auto">✓</span>' : '');
            item.onmouseenter = () => { if (!isCur) item.style.background = '#f0f2f5'; };
            item.onmouseleave = () => { if (!isCur) item.style.background = 'transparent'; };
            item.onclick = () => { apply(t); box.remove(); };
            box.appendChild(item);
        });

        document.body.appendChild(box);

        setTimeout(() => {
            document.addEventListener('click', function close(e) {
                if (!box.contains(e.target)) { box.remove(); document.removeEventListener('click', close); }
            });
        }, 0);
    };

    document.addEventListener('DOMContentLoaded', function () {
        apply(current());

        // 把页面上原有的 .dark-mode-btn 升级成四主题选择器
        // 关键：原按钮只有 22px 宽的裸图标，用户根本发现不了。
        // 必须加上「文字标签 + 描边 + 悬停提示」才能被看见。
        document.querySelectorAll('.dark-mode-btn').forEach(btn => {
            btn.classList.add('theme-switch-btn');
            btn.dataset.theme = current();
            btn.setAttribute('onclick', 'showThemePicker()');
            btn.title = '切换主题（当前：' + LABELS[current()] + '，点击选择）';

            // 视觉重塑：图标 + 文字
            btn.innerHTML = '<span style="font-size:15px;line-height:1">' +
                ICONS[current()] + '</span>' +
                '<span class="theme-btn-label" style="font-size:12px;margin-left:5px;line-height:1">' +
                LABELS[current()] + '</span>' +
                '<span style="font-size:9px;margin-left:4px;opacity:.7;line-height:1">▼</span>';

            btn.style.cssText += ';display:inline-flex;align-items:center;gap:0;' +
                'padding:5px 11px;border:1px solid rgba(255,255,255,.45);border-radius:6px;' +
                'font-size:13px;cursor:pointer;white-space:nowrap;' +
                'transition:background .18s,border-color .18s;';
            btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(255,255,255,.18)'; });
            btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; });
        });
    });
})();
