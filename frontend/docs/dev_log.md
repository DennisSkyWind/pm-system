# PM系统开发日志

## 2026-05-31 任务看板导出功能

### 需求
任务看板（Kanban视图）支持导出，至少5种风格

### 实现
1. **新建 `kanban-export.js`**：独立看板导出模块
2. **5种导出风格**：
   - 🏢 经典商务：蓝白配色，专业简洁
   - 🎨 现代彩色：渐变色彩，活力十足
   - 🌙 深色主题：暗色背景，护眼舒适
   - ✏️ 极简线框：黑白线条，极简主义
   - 📊 看板专业：多列泳道，Jira风格
3. **导出格式**：PNG图片 / PDF文档
4. **页面方向**：横向（推荐）/ 纵向
5. **交互**：弹窗选择风格→预览→导出，html2canvas截图+jsPDF生成
6. **依赖动态加载**：html2canvas和jsPDF按需从CDN加载，不影响页面初始加载速度

### 修改文件
- 新增：`kanban-export.js`（17KB）
- 修改：`tasks.html`（添加导出按钮 + JS引用）

### 验证
- JS语法检查通过 ✅
- 页面加载正常，按钮和JS引用正确 ✅

## 2026-05-30 编辑任务报错修复

### 问题
编辑任务保存失败：`Unexpected token '<', "<!doctype "... is not valid JSON`

### 根因
1. **API地址硬编码端口**：10个前端页面的API地址使用 `http://${window.location.hostname}:5236/api`，当用户通过非5236端口访问（如nginx代理）时，API请求被发送到错误地址，收到HTML 404页面而非JSON
2. **authFetch null处理缺失**：`authFetch()` 在401时返回 `null`，但调用方直接 `res.json()` 未检查null

### 修复
1. **API地址改相对路径**：10个文件的 `const API = \`http://\${API_BASE}:5236/api\`` → `const API = '/api'`
   - tasks.html, index.html, gantt.html, issues.html, persons.html, phases.html, project.html, projects.html, reminders.html, report.html, templates.html
   - admin.html, settings.html, login.html 原本已是相对路径，无需修改
   - resumeai.html 使用8001端口（ResumeAI后端），保留不动

2. **authFetch 增强**：
   - 无token/401时返回永不resolve的Promise，阻止后续代码执行（避免null.json()报错）
   - 网络错误抛出友好提示
   - 非JSON响应处理（防止"Unexpected token '<'"再次出现）

### 验证
- 14/14 页面HTTP 200 ✅
- 23/23 JS语法检查通过 ✅
- 后端API登录→获取任务→编辑任务完整流程正常 ✅
- 401返回JSON格式 ✅

### 备份
`backups/pre-api-fix-20260530/`
