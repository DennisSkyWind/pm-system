/* PM系统暗黑模式 - 自动记忆偏好 */
(function() {
    const saved = localStorage.getItem('pm_dark_mode');
    if (saved === 'true') document.body.classList.add('dark');
    
    window.toggleDarkMode = function() {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        localStorage.setItem('pm_dark_mode', isDark);
        // 更新按钮图标
        document.querySelectorAll('.dark-mode-btn').forEach(btn => {
            btn.textContent = isDark ? '☀️' : '🌙';
            btn.title = isDark ? '切换亮色模式' : '切换暗黑模式';
        });
    };
    
    // 页面加载后更新按钮状态
    document.addEventListener('DOMContentLoaded', function() {
        const isDark = document.body.classList.contains('dark');
        document.querySelectorAll('.dark-mode-btn').forEach(btn => {
            btn.textContent = isDark ? '☀️' : '🌙';
            btn.title = isDark ? '切换亮色模式' : '切换暗黑模式';
        });
    });
})();
