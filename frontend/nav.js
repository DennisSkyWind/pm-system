/* ================================================================
 * PM 系统 · 统一顶部导航栏（nav.js）
 * 版本：v1 · 2026-11-10
 *
 * 目的：消灭 15 个页面各自硬编码 nav 造成的菜单漂移
 *       （曾出现：缺 📊绩效、缺 👥人员周报、缺右侧工具区整块等）。
 *
 * 用法：在 <head> 内加一行
 *       <script src="nav.js"></script>
 *       （也可放 </body> 前；脚本会在 DOMContentLoaded 时注入）
 *
 * 行为：
 *   1. 注入完全一致的菜单：13 个链接 + 右侧工具区（搜索/通知/暗色/GitHub）
 *   2. 按当前文件名自动打 class="active"（含 ?query 场景）
 *   3. 移除页面上重复的 #notification-bell（原本在 header-top 里的那一份）
 *   4. 兜底：页面若未定义 showGlobalSearch / toggleNotificationPanel /
 *      toggleDarkMode，则安装通用实现（各页已有的实现优先，不覆盖）
 * ================================================================ */
(function () {
  'use strict';

  /* ---------- 1. 统一菜单定义（唯一真源，改这里即可全站生效） ---------- */
  var LINKS = [
    { href: 'index.html',          label: 'Dashboard' },
    { href: 'projects.html',       label: '项目列表' },
    { href: 'tasks.html',          label: '任务管理' },
    { href: 'gantt.html',          label: '甘特图' },
    { href: 'issues.html',         label: '问题追踪' },
    { href: 'report.html',         label: '📊 报告' },
    { href: 'person-report.html',  label: '👥 人员周报' },
    { href: 'performance.html',    label: '📊 绩效' },
    { href: 'persons.html',        label: '👥 人员' },
    { href: 'phases.html',         label: '阶段管理' },
    { href: 'templates.html',      label: '📋 模板' },
    { href: 'reminders.html',      label: '🔔 提醒' },
    { href: 'settings.html',       label: '⚙️ 设置' },
    { href: 'admin.html',          label: '🔐 管理后台' }
  ];

  /* h1 与 nav 标签的措辞映射（无 header 的页面自动补 h1 时用，保证与菜单文案一致） */
  var H1_TITLES = {
    'performance.html': '📊 绩效'
  };

  var GH_SVG = '<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" style="vertical-align:middle;"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>';

  /* ---------- 2. 统一样式（保证不依赖 common.css，各页观感一致） ---------- */
  var CSS = [
    'nav.pmnav{display:flex;gap:15px;margin-top:15px;margin-left:0;padding:0;flex-wrap:wrap;align-items:center;background:transparent;font-size:14px;}',
    /* 顶栏用户区（👤姓名 / 🔑改密 / 退出）：index 的样式原为页内联样式，其他页没有 → 公共化 */
    '.user-area{display:flex;align-items:center;gap:10px;}',
    '.user-area .user-name{font-size:14px;padding:6px 12px;background:rgba(255,255,255,0.2);border-radius:6px;color:#fff;}',
    '.user-area .logout-btn{font-size:13px;padding:6px 12px;background:rgba(255,255,255,0.3);border-radius:6px;color:#fff;cursor:pointer;border:none;}',
    '.user-area .login-link{color:#fff;text-decoration:none;padding:8px 16px;border-radius:6px;background:rgba(255,255,255,0.2);}',
    '.user-area .login-link:hover{background:rgba(255,255,255,0.3);}',
    'nav.pmnav>a:not(.pm-gh){color:#fff;text-decoration:none;padding:8px 16px;border-radius:6px;background:rgba(255,255,255,0.2);font-size:14px;line-height:1.4;flex-shrink:0;}',
    'nav.pmnav>a:not(.pm-gh):hover{background:rgba(255,255,255,0.3);}',
    'nav.pmnav>a.active{background:rgba(255,255,255,0.4);font-weight:600;}',
    'nav.pmnav .pm-tools{margin-left:auto;display:flex;align-items:center;gap:6px;cursor:pointer;opacity:0.9;flex-shrink:0;}',
    /* body 直挂的 nav（无 header 包裹的页面）：自带统一紫蓝渐变，替代各页私设背景 */
    'nav.pmnav .pm-tools:hover{opacity:1;}',
    'nav.pmnav .pm-kbd{background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:4px;font-size:12px;}',
    'nav.pmnav #notification-bell{cursor:pointer;position:relative;font-size:18px;margin-left:8px;}',
    'nav.pmnav #notification-badge{display:inline-block;position:absolute;top:-5px;right:-8px;background:#f44336;color:white;font-size:10px;padding:1px 5px;border-radius:10px;font-weight:600;}',
    'nav.pmnav .dark-mode-btn{cursor:pointer;font-size:18px;margin-left:8px;}',
    'nav.pmnav a.pm-gh{font-size:18px;margin-left:8px;color:inherit;text-decoration:none;display:inline-flex;align-items:center;background:transparent;padding:0;border-radius:0;}',
    /* 兜底搜索/通知面板 */
    '#global-search-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;backdrop-filter:blur(2px);}',
    '#global-search-box{max-width:600px;margin:80px auto 0;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.3);overflow:hidden;}',
    '#global-search-box .pm-s-head{display:flex;align-items:center;padding:16px 20px;border-bottom:1px solid #eee;gap:10px;}',
    '#global-search-input{flex:1;border:none;font-size:16px;outline:none;}',
    '#global-search-box .pm-s-kbd{background:#f0f0f0;padding:2px 8px;border-radius:4px;font-size:12px;color:#888;}',
    '#global-search-results{max-height:420px;overflow-y:auto;}',
    '#global-search-results .pm-s-row{display:flex;align-items:center;gap:10px;padding:10px 20px;border-bottom:1px solid #f5f5f5;text-decoration:none;color:#333;}',
    '#global-search-results .pm-s-row:hover{background:#f5f5f5;}',
    '#notification-panel{position:fixed;top:60px;right:20px;width:360px;max-height:500px;background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.15);z-index:9998;overflow:hidden;}',
    '#notification-panel .pm-n-head{padding:12px 16px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;}',
    '#notification-panel .pm-n-head h3{font-size:15px;margin:0;}',
    '#notification-panel .pm-n-list{max-height:420px;overflow-y:auto;}',
    '#notification-panel .pm-n-item{padding:10px 16px;border-bottom:1px solid #f5f5f5;font-size:13px;color:#333;}'
  ].join('\n');

  /* ---------- 3. 工具函数 ---------- */
  function currentFile() {
    var p = window.location.pathname || '';
    return (p.split('/').pop() || 'index.html').split('?')[0].split('#')[0];
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function apiBase() {
    /* ★ 必须 try/catch：页面若用 `const API = ...` 且声明在 nav.js 之后，
       此处读取时 API 处于 TDZ，`typeof API` 同样抛 ReferenceError
       （typeof 只对「从未声明」的变量返回 'undefined'，对 TDZ 变量会抛）。 */
    try {
      return (typeof API !== 'undefined' && API) ? API : '/api';
    } catch (e) {
      return '/api';
    }
  }

  /* ★ API 根推导：页面的 API 常量未必是通用根。
     例：person-report.html 的 API = '/api/report'（报表专用前缀），
     若直接拼 '/notifications' 会 404（/api/report/notifications 不存在）。
     通知等全局接口必须落在 API 根上，故从 '/api/report' 还原为 '/api'。 */
  function apiRoot() {
    var b = apiBase();
    var m = String(b).match(/^(.*?)\/report(?:\/.*)?$/);
    return (m && m[1]) ? m[1] : b;
  }

  function notificationsApi() {
    return apiRoot() + '/notifications';
  }

  function authHeaders() {
    try {
      if (typeof authFetch === 'function') return {};   // 用 authFetch，不手动拼头
      var tok = localStorage.getItem('pm_token');
      return tok ? { 'Authorization': 'Bearer ' + tok } : {};
    } catch (e) { return {}; }
  }

  function getJSON(url) {
    if (typeof authFetch === 'function') return authFetch(url).then(function (r) { return r.json(); });
    return fetch(url, { headers: authHeaders() }).then(function (r) { return r.json(); });
  }

  /* ---------- 4. 兜底实现（仅当页面未定义时安装；各页已有的优先） ---------- */
  function installFallbacks() {
    /* --- 全局搜索 --- */
    if (typeof window.showGlobalSearch !== 'function') {
      var _data = { projects: [], tasks: [], persons: [], loaded: false };

      function ensureSearchDOM() {
        if (document.getElementById('global-search-overlay')) return;
        var d = document.createElement('div');
        d.id = 'global-search-overlay';
        d.style.display = 'none';
        d.innerHTML =
          '<div id="global-search-box" onclick="event.stopPropagation()">' +
            '<div class="pm-s-head"><span style="font-size:20px">🔍</span>' +
            '<input type="text" id="global-search-input" placeholder="搜索项目、任务、人员..." ' +
            'oninput="doGlobalSearch()" onkeydown="pmSearchKey(event)">' +
            '<span class="pm-s-kbd">ESC</span></div>' +
            '<div id="global-search-results"></div>' +
          '</div>';
        document.body.appendChild(d);
        d.addEventListener('click', function () { hideGlobalSearch(); });
      }

      window.showGlobalSearch = function () {
        ensureSearchDOM();
        var ov = document.getElementById('global-search-overlay');
        ov.style.display = 'block';
        var inp = document.getElementById('global-search-input');
        inp.value = ''; inp.focus();
        document.getElementById('global-search-results').innerHTML =
          '<div style="padding:20px;text-align:center;color:#999">输入关键词搜索项目、任务、人员</div>';
      };
      window.hideGlobalSearch = function () {
        var ov = document.getElementById('global-search-overlay');
        if (ov) ov.style.display = 'none';
      };
      window.doGlobalSearch = function () {
        var q = (document.getElementById('global-search-input').value || '').trim().toLowerCase();
        var box = document.getElementById('global-search-results');
        if (!q) {
          box.innerHTML = '<div style="padding:20px;text-align:center;color:#999">输入关键词搜索项目、任务、人员</div>';
          return;
        }
        if (!_data.loaded) {
          Promise.all([
            getJSON(apiBase() + '/projects').catch(function () { return {}; }),
            getJSON(apiBase() + '/tasks').catch(function () { return {}; }),
            getJSON(apiBase() + '/persons').catch(function () { return {}; })
          ]).then(function (rs) {
            _data.projects = rs[0].projects || [];
            _data.tasks = rs[1].tasks || [];
            _data.persons = rs[2].persons || [];
            _data.loaded = true;
            window.doGlobalSearch();
          });
          box.innerHTML = '<div style="padding:20px;text-align:center;color:#999">搜索中…</div>';
          return;
        }
        var out = [];
        _data.projects.forEach(function (p) {
          if ((p.name || '').toLowerCase().indexOf(q) >= 0 && out.length < 24) {
            out.push({ icon: '📁', name: p.name, detail: '进度 ' + (p.progress || 0) + '%', link: 'project.html?id=' + p.id });
          }
        });
        _data.tasks.forEach(function (t) {
          if ((t.name || '').toLowerCase().indexOf(q) >= 0 && out.length < 24) {
            var ic = { pending: '⬜', in_progress: '🔄', completed: '✅', cancelled: '❌' }[t.status] || '📋';
            out.push({ icon: ic, name: t.name, detail: (t.project_name || '') + ' · ' + (t.assignee_name || '未分配'), link: 'tasks.html?highlight=' + t.id });
          }
        });
        _data.persons.forEach(function (p) {
          if ((p.name || '').toLowerCase().indexOf(q) >= 0 && out.length < 24) {
            out.push({ icon: '👤', name: p.name, detail: p.position || p.department || '', link: 'persons.html' });
          }
        });
        box.innerHTML = out.length ? out.map(function (r) {
          return '<a class="pm-s-row" href="' + r.link + '"><span>' + r.icon + '</span><span style="flex:1"><b>' +
            esc(r.name) + '</b><br><span style="font-size:12px;color:#888">' + esc(r.detail) + '</span></span></a>';
        }).join('') : '<div style="padding:20px;text-align:center;color:#999">未找到匹配结果</div>';
      };
      window.pmSearchKey = function (e) {
        if (e.key === 'Escape') window.hideGlobalSearch();
        if (e.key === 'Enter') {
          var f = document.querySelector('#global-search-results a');
          if (f) window.location.href = f.getAttribute('href');
        }
      };
      window.pmSearchKey = window.pmSearchKey;
      document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); window.showGlobalSearch(); }
      });
    }

    /* --- 通知面板 --- */
    if (typeof window.toggleNotificationPanel !== 'function') {
      function ensureNotifDOM() {
        if (document.getElementById('notification-panel')) return;
        var d = document.createElement('div');
        d.id = 'notification-panel';
        d.style.display = 'none';
        d.innerHTML =
          '<div class="pm-n-head"><h3>🔔 通知</h3><span style="cursor:pointer;font-size:16px;" onclick="toggleNotificationPanel()">✕</span></div>' +
          '<div class="pm-n-list" id="notification-list"></div>';
        document.body.appendChild(d);
      }
      window.toggleNotificationPanel = function () {
        ensureNotifDOM();
        var p = document.getElementById('notification-panel');
        p.style.display = (p.style.display === 'none' || !p.style.display) ? 'block' : 'none';
        if (p.style.display === 'block') {
          var list = document.getElementById('notification-list');
          list.innerHTML = '<div style="padding:20px;text-align:center;color:#999">加载中…</div>';
          getJSON(notificationsApi()).then(function (r) {
            var ns = r.notifications || [];
            var badge = document.getElementById('notification-badge');
            var unread = ns.filter(function (n) { return !n.is_read; }).length;
            if (badge) { badge.style.display = unread ? 'inline-block' : 'none'; badge.textContent = unread; }
            list.innerHTML = ns.length ? ns.map(function (n) {
              return '<div class="pm-n-item"' + (n.is_read ? '' : ' style="font-weight:600;background:#f8f9fa"') + '>' +
                '<b>' + esc(n.title || '') + '</b><br><span style="font-size:12px;color:#888">' +
                esc(n.content || '') + ' · ' + esc((n.created_at || '').slice(0, 16)) + '</span></div>';
            }).join('') : '<div style="padding:20px;text-align:center;color:#999">暂无通知</div>';
          }).catch(function () {
            list.innerHTML = '<div style="padding:20px;text-align:center;color:#999">通知加载失败</div>';
          });
        }
      };
    }
  }

  /* ---------- 5. 注入 ---------- */
  function injectCSS() {
    if (document.getElementById('pm-nav-css')) return;
    var st = document.createElement('style');
    st.id = 'pm-nav-css';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  /* ★ 顶栏用户区：auth.js 的 showUserInHeader() 只在页面存在 #user-area 元素时才填充
     「👤姓名 / 🔑改密 / 退出」，而原先只有 index / settings / admin 三个页面有这个元素，
     其余 11 页顶栏右侧整块空白。这里为每页补上该元素，auth.js 即自动填充。 */
  function ensureUserArea(nav) {
    var header = nav.parentElement;
    if (!header || header.tagName !== 'HEADER') return;
    if (document.getElementById('user-area')) return;   // 页面自带则不动

    var top = header.querySelector('.header-top');
    if (!top) {
      top = document.createElement('div');
      top.className = 'header-top';
      var h1 = header.querySelector('h1');
      if (h1) top.appendChild(h1);            // 把 h1 并入 header-top，与 index 版式一致
      header.insertBefore(top, header.firstChild);
    }
    var ua = document.createElement('div');
    ua.id = 'user-area';
    ua.className = 'user-area';
    ua.innerHTML = '<a href="login.html" class="login-link">登录</a>';
    top.appendChild(ua);
  }

  /* 用户区统一为「👤姓名 / 🔑改密 / 退出」：
     admin.html 原来自带一份用户区但少了「🔑改密」按钮，这里补齐并保证全站一致。 */
  function normalizeUserArea() {
    var ua = document.getElementById('user-area');
    if (!ua) return;
    if (!ua.querySelector('.pm-chpwd')) {
      var b = document.createElement('button');
      b.className = 'logout-btn pm-chpwd';
      b.setAttribute('onclick', 'showChangePasswordModal()');
      b.setAttribute('style', 'background:rgba(255,255,255,0.15);');
      b.textContent = '🔑 改密';
      var lo = ua.querySelector('.logout-btn[onclick*="logout"]');
      if (lo) ua.insertBefore(b, lo); else ua.appendChild(b);
    }
  }

  /* 填充用户名：★ 只有 index.html 调了 initAuthPage()，其余页的 auth.js 从不填用户区
     → 这里统一调 checkLogin(false)（required=false，不强制跳登录页）填充。
     已有内容的页面（如 index / admin）不覆盖。 */
  function fillUserArea() {
    var ua = document.getElementById('user-area');
    if (!ua || typeof checkLogin !== 'function') return;
    var nameEl = ua.querySelector('.user-name');
    if (nameEl && nameEl.textContent.trim()) return;
    checkLogin(false).then(function (u) {
      if (!u) return;
      var ua2 = document.getElementById('user-area');
      if (!ua2) return;
      var ne = ua2.querySelector('.user-name');
      if (ne && ne.textContent.trim()) return;   // 已被页面自身填充，不覆盖
      /* ★ 整体替换为标准模板：否则初始的「登录」链接会残留、且缺「退出」按钮 */
      /* 模板与 auth.js 的 showUserInHeader() 保持同构（含换行，
         使 DOM 文本与各页原生渲染完全一致，不只是视觉一致） */
      ua2.innerHTML = `
                <span class="user-name">👤 ${u.person_name}</span>
                <button class="logout-btn pm-chpwd" onclick="showChangePasswordModal()" style="background:rgba(255,255,255,0.15);">🔑 改密</button>
                <button class="logout-btn" onclick="logout()">退出</button>
            `;
    }).catch(function () {});
  }

  function buildNavHTML() {
    var cur = currentFile();
    var links = LINKS.map(function (l) {
      var active = (l.href === cur) ? ' class="active"' : '';
      return '<a href="' + l.href + '"' + active + '>' + l.label + '</a>';
    }).join('');

    var tools =
      '<span class="pm-tools" onclick="showGlobalSearch()" title="全局搜索 (Ctrl+K)">🔍 <span class="pm-kbd">Ctrl+K</span></span>' +
      '<span id="notification-bell" onclick="toggleNotificationPanel()" title="通知">🔔' +
        '<span id="notification-badge" style="display:none">0</span></span>' +
      '<span class="dark-mode-btn" onclick="toggleDarkMode()" title="切换暗黑模式">🌙</span>' +
      '<a class="pm-gh" href="https://github.com/DennisSkyWind/pm-system" target="_blank" title="GitHub仓库">' + GH_SVG + '</a>';

    return links + tools;
  }

  function inject() {
    /* 移除 header-top 里重复的 #notification-bell（原唯一一份在 nav 之外的 user-area 中） */
    var dupes = document.querySelectorAll('.user-area #notification-bell, .header-top #notification-bell');
    for (var i = 0; i < dupes.length; i++) {
      var dup = dupes[i];
      if (dup && dup.parentNode) dup.parentNode.removeChild(dup);
    }

    /* 定位 nav 容器：优先 header > nav，其次 body > nav，都没有则新建 */
    var nav = document.querySelector('header > nav') || document.querySelector('body > nav');
    if (!nav) {
      nav = document.createElement('nav');
      document.body.insertBefore(nav, document.body.firstChild);
    }
    /* ★ 无 header 的页面（如 performance.html）：补 header + 标题，
       使结构与其余页面完全一致（nav 位于 header 内，背景由 header 渐变提供） */
    if (!nav.parentElement || nav.parentElement.tagName !== 'HEADER') {
      var header = document.querySelector('header');
      if (!header) {
        header = document.createElement('header');
        var cur0 = currentFile();
        var ttl = H1_TITLES[cur0] || (document.title || '').split(' - ')[0] || '项目管理系统';
        var h1 = document.createElement('h1');
        h1.textContent = '📊 ' + ttl;
        header.appendChild(h1);
        nav.parentNode.insertBefore(header, nav);
      }
      header.appendChild(nav);
    }
    nav.className = 'pmnav';
    nav.innerHTML = buildNavHTML();
    ensureUserArea(nav);
    normalizeUserArea();
    /* h1 文案与菜单标签对齐（仅当页面 h1 存在且映射表有该页时才改） */
    var h1map = H1_TITLES[currentFile()];
    if (h1map) {
      var host = nav.parentElement;
      var h1el = host && host.querySelector('h1');
      if (h1el) h1el.textContent = h1map;
    }
  }

  /* ---------- 6. 启动 ---------- */
  /* 未读角标：统一由 nav.js 拉取并写入。
     ★ 各页旧代码写 `style.display = unread > 0 ? '' : 'none'`，
       空字符串会覆盖 CSS 的 display:none 导致数字算出来却看不见；
       现 CSS 默认 inline-block、各页写 '' 即显示，nav.js 也主动兜底（覆盖无角标代码的页面） */
  function paintBadge(n) {
    var b = document.getElementById('notification-badge');
    if (!b) return;
    b.textContent = n;
    b.style.display = n > 0 ? 'inline-block' : 'none';
  }
  function refreshBadge() {
    if (typeof apiBase !== 'function') return;
    getJSON(notificationsApi()).then(function (r) {
      r = r || {};
      var unread = (typeof r.unread_count === 'number')
        ? r.unread_count
        : (r.notifications || []).filter(function (n) { return !n.is_read; }).length;
      paintBadge(unread);
    }).catch(function () {});
  }

  function boot() {
    injectCSS();
    installFallbacks();
    inject();
    /* ★ 各页 body 普遍带 has-nav（dark-mode/theme 用它判断有无导航）；
       performance.html 原本没有 → 切企业MIS主题时 8 个菜单项被钉到左侧却无侧栏底色，
       变成幽灵文字浮在内容上。这里统一补上。 */
    if (document.body) document.body.classList.add('has-nav');
    /* ★ 角标刷新必须等 DOMContentLoaded：此时页面所有 script 已执行完，
       `const API` 才不在 TDZ，notificationsApi() 才能取到正确前缀。 */
    function startBadge() {
      refreshBadge();
      setInterval(refreshBadge, 30000);
      fillUserArea();          // 用户名（各页原本只有 index 调了 initAuthPage）
      setTimeout(fillUserArea, 800);   // 兜底：等待各页自身填充完成后再补
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startBadge);
    } else {
      startBadge();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
