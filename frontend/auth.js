/**
 * 认证模块 - 强制登录检查
 * 所有页面必须引入此脚本
 */

const AUTH_API = '/api/auth';
const LOGIN_PAGE = 'login.html';

// 获取存储的token
function getToken() {
    return localStorage.getItem('pm_token');
}

// 检查登录状态
async function checkLogin(required = true) {
    const token = getToken();
    
    if (!token) {
        if (required) {
            redirectToLogin();
        }
        return null;
    }
    
    try {
        const res = await fetch(AUTH_API + '/me', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        
        if (data.success) {
            return data.user;
        } else {
            localStorage.removeItem('pm_token');
            localStorage.removeItem('pm_user');
            if (required) {
                redirectToLogin();
            }
            return null;
        }
    } catch (e) {
        console.error('登录检查失败:', e);
        if (required) {
            redirectToLogin();
        }
        return null;
    }
}

// 跳转到登录页
function redirectToLogin() {
    const currentPath = window.location.pathname;
    const filename = currentPath.split('/').pop() || 'index.html';
    localStorage.setItem('pm_redirect', filename);
    window.location.href = LOGIN_PAGE;
}

// 登录后跳回原页面
function redirectAfterLogin() {
    const redirect = localStorage.getItem('pm_redirect');
    localStorage.removeItem('pm_redirect');
    if (redirect) {
        window.location.href = redirect;
    } else {
        window.location.href = 'index.html';
    }
}

// 退出登录
async function logout() {
    const token = getToken();
    if (token) {
        try {
            await fetch(AUTH_API + '/logout', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token }
            });
        } catch (e) {}
    }
    localStorage.removeItem('pm_token');
    localStorage.removeItem('pm_user');
    window.location.href = LOGIN_PAGE;
}

// 获取认证请求头
function getAuthHeaders() {
    const token = getToken();
    return {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    };
}

// 带认证的fetch
async function authFetch(url, options = {}) {
    const token = getToken();
    if (!token) {
        redirectToLogin();
        // 返回一个永不resolve的Promise，阻止后续代码执行
        return new Promise(() => {});
    }
    
    const headers = {
        ...options.headers,
        'Authorization': 'Bearer ' + token
    };
    
    let res;
    try {
        res = await fetch(url, { ...options, headers });
    } catch (e) {
        // 网络错误（如跨域、DNS解析失败等）
        throw new Error('网络请求失败，请检查网络连接');
    }
    
    // 401表示token过期
    if (res.status === 401) {
        localStorage.removeItem('pm_token');
        localStorage.removeItem('pm_user');
        redirectToLogin();
        return new Promise(() => {});
    }
    
    // 非2xx状态码且非401，尝试读取错误信息
    if (!res.ok) {
        try {
            const errData = await res.json();
            throw new Error(errData.error || `请求失败 (${res.status})`);
        } catch (e) {
            if (e.message && !e.message.startsWith('Unexpected')) {
                throw e;
            }
            throw new Error(`请求失败 (${res.status})`);
        }
    }
    
    return res;
}

// 显示用户信息到header
async function showUserInHeader() {
    const user = await checkLogin();
    if (user) {
        const userArea = document.getElementById('user-area');
        if (userArea) {
            userArea.innerHTML = `
                <span class="user-name">👤 ${user.person_name}</span>
                <button class="logout-btn" onclick="showChangePasswordModal()" style="background:rgba(255,255,255,0.15);">🔑 改密</button>
                <button class="logout-btn" onclick="logout()">退出</button>
            `;
        }
    }
}

// 页面初始化认证检查
async function initAuthPage() {
    const user = await checkLogin();
    if (user) {
        showUserInHeader();
        return user;
    }
    return null;
}

// 修改密码弹窗
function showChangePasswordModal() {
    // 移除已有弹窗
    const old = document.getElementById('change-password-modal');
    if (old) old.remove();
    
    const modal = document.createElement('div');
    modal.id = 'change-password-modal';
    modal.className = 'modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `
        <div style="background:white;border-radius:12px;padding:30px;width:400px;max-width:90vw;box-shadow:0 4px 20px rgba(0,0,0,0.3);">
            <h3 style="margin:0 0 20px 0;">🔑 修改密码</h3>
            <div style="margin-bottom:12px;">
                <label style="display:block;margin-bottom:4px;font-size:13px;color:#666;">当前密码</label>
                <input type="password" id="cp-old" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;" placeholder="请输入当前密码">
            </div>
            <div style="margin-bottom:12px;">
                <label style="display:block;margin-bottom:4px;font-size:13px;color:#666;">新密码</label>
                <input type="password" id="cp-new" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;" placeholder="至少8位，含字母和数字">
            </div>
            <div style="margin-bottom:12px;">
                <label style="display:block;margin-bottom:4px;font-size:13px;color:#666;">确认新密码</label>
                <input type="password" id="cp-confirm" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;" placeholder="再次输入新密码">
            </div>
            <div id="cp-msg" style="display:none;margin-bottom:12px;padding:8px 12px;border-radius:6px;font-size:13px;"></div>
            <div style="display:flex;gap:10px;justify-content:flex-end;">
                <button onclick="document.getElementById('change-password-modal').remove()" style="padding:8px 20px;border:1px solid #ddd;border-radius:6px;background:white;cursor:pointer;">取消</button>
                <button onclick="doChangePassword()" style="padding:8px 20px;border:none;border-radius:6px;background:#1976d2;color:white;cursor:pointer;">确认修改</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    // 点击遮罩关闭
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

async function doChangePassword() {
    const oldPwd = document.getElementById('cp-old').value;
    const newPwd = document.getElementById('cp-new').value;
    const confirmPwd = document.getElementById('cp-confirm').value;
    const msgEl = document.getElementById('cp-msg');
    
    if (!oldPwd || !newPwd || !confirmPwd) {
        msgEl.style.display = 'block'; msgEl.style.background = '#fff3e0'; msgEl.style.color = '#e65100';
        msgEl.textContent = '请填写所有字段'; return;
    }
    if (newPwd.length < 8) {
        msgEl.style.display = 'block'; msgEl.style.background = '#fff3e0'; msgEl.style.color = '#e65100';
        msgEl.textContent = '新密码长度至少8位'; return;
    }
    if (newPwd !== confirmPwd) {
        msgEl.style.display = 'block'; msgEl.style.background = '#fff3e0'; msgEl.style.color = '#e65100';
        msgEl.textContent = '两次输入的新密码不一致'; return;
    }
    
    try {
        const res = await authFetch(API + '/users/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ old_password: oldPwd, new_password: newPwd })
        });
        const data = await res.json();
        if (data.success) {
            msgEl.style.display = 'block'; msgEl.style.background = '#e8f5e9'; msgEl.style.color = '#2e7d32';
            msgEl.textContent = '✅ 密码修改成功！';
            setTimeout(() => document.getElementById('change-password-modal').remove(), 1500);
        } else {
            msgEl.style.display = 'block'; msgEl.style.background = '#ffebee'; msgEl.style.color = '#c62828';
            msgEl.textContent = data.error || '修改失败';
        }
    } catch (e) {
        msgEl.style.display = 'block'; msgEl.style.background = '#ffebee'; msgEl.style.color = '#c62828';
        msgEl.textContent = '网络错误，请重试';
    }
}