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