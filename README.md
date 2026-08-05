# 📋 项目管理系统 (PM System)

[中文](#中文) | [English](#english)

---

<a id="中文"></a>

## 📋 项目管理系统

> 轻量级自托管项目管理系统，支持任务追踪、甘特图、看板视图、权限管理、多维度报告、机密项目隔离

![版本](https://img.shields.io/badge/版本-v2.5.0-blue)
![Python](https://img.shields.io/badge/Python-3.8+-green)
![Flask](https://img.shields.io/badge/Flask-3.x-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ 功能特性

### 核心功能
- 📊 **Dashboard仪表盘** — 项目概览、任务统计、到期预警、人员工作量
- 📋 **任务管理** — 创建/编辑/删除/批量操作，进度追踪，优先级标记，完成情况说明
- 📅 **甘特图** — 可视化时间线，5种时间维度（周/月/季/年/自定义），6种导出风格
- 📌 **看板视图** — 三列拖拽（待处理/进行中/已完成），5种导出风格
- 🐛 **问题追踪** — 问题创建/分配/解决，严重程度分级
- 👥 **人员管理** — 团队成员管理，部门/角色/联系方式，在职/离职/退休状态

### 报告系统
- 📊 **日报** — 当日任务概览、人员工作量（含当日推迟次数+评价统计）、延期预警、建议行动
- 📈 **周报** — 本周任务完成情况、人员绩效、评价统计
- 📉 **月报** — 月度任务统计、人员绩效表、月度趋势柱状图、评价分布
- 📅 **季度报** — 季度汇总、人员绩效明细、评价统计、月度趋势
- 📆 **年度报** — 年度汇总、12月趋势图、人员绩效排名、评价分布
- 📄 **报告导出** — HTML/PDF一键导出，3种风格，内容板块可选，甘特图时间维度可选

### 协作功能
- 💬 **评论系统** — 任务内评论，@提及通知
- 📎 **附件管理** — 文件上传/下载/删除
- 🔔 **通知中心** — 任务分配/完成/评论自动通知
- 🔍 **全局搜索** — Ctrl+K快捷键，跨项目/任务/人员搜索，点击定位高亮

### 权限与安全
- 🔐 **四角色权限模型** — 管理员/项目负责人/项目参与者/查看者
- 🔑 **用户认证** — 登录/登出，密码修改，管理员重置
- 👁️ **查看者授权** — 项目级细粒度权限控制
- 🔒 **机密项目** — 机密项目标记，报表自动排除，列表🔒标识

### 任务管理增强
- ⏰ **延期记录** — 自动记录截止日期变更历史，延期原因追踪
- ⭐ **完成评价** — 4级评价体系（不足/正常/优秀/卓越），报告展示评价统计
- 📊 **人员绩效** — 任务数/完成率/延期数/推迟次数/评价分布多维统计
- 🔄 **负责人变更** — 自动记录负责人变更历史，报告展示换人次数

### 绩效管理
- 📊 **绩效记录** — 月度/季度/年度三周期，分数+等级(S/A/B/C/D)+评语
- 📈 **绩效统计** — 等级分布柱状图、条线平均分、汇总统计卡片
- 📋 **考勤台账** — 加班(小时)+请假(天)记录，请假明细，备注
- 📥📤 **导入导出** — Excel批量导入导出（绩效+考勤）

### 体验优化
- 🌙 **暗黑模式** — 一键切换，偏好记忆
- 📱 **移动端适配** — 响应式布局
- 🎨 **任务模板** — 4个预设模板，自定义模板+编辑
- 🔄 **版本更新** — 一键更新脚本，自动备份+重启+验证

## 🚀 快速开始

### 本地部署

```bash
# 1. 克隆仓库
git clone https://github.com/DennisSkyWind/pm-system.git
cd pm-system

# 2. 安装依赖
pip install flask requests

# 3. 初始化
python3 -c "import os; os.makedirs('data', exist_ok=True); os.makedirs('data/attachments', exist_ok=True)"

# 4. 配置环境变量（可选）
cp .env.example .env
# 编辑 .env 设置路径

# 5. 启动服务
python3 pm_server.py
```

访问 http://localhost:5236

### Docker部署

```bash
docker build -t pm-system .
docker run -d -p 5236:5236 pm-system
```

### 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | pm2026 | 管理员 |
| lisi | pm2026 | 普通用户 |

> ⚠️ 首次部署后请立即修改默认密码

## 🛠️ 技术栈

| 组件 | 技术 |
|------|------|
| 后端 | Python Flask + SQLite (WAL模式) |
| 前端 | HTML/CSS/JavaScript（纯静态，无框架） |
| 数据库 | SQLite (WAL模式，支持并发读写) |
| 导出 | html2canvas + jsPDF (PDF), SheetJS (Excel) |
| 图表 | Canvas/SVG 柱状图 |

## 📁 项目结构

```
pm-system/
├── pm_server.py          # Flask后端服务
├── admin.html            # 管理后台
├── index.html            # Dashboard仪表盘
├── tasks.html            # 任务管理
├── projects.html         # 项目管理
├── persons.html          # 人员管理
├── gantt.html            # 甘特图
├── report.html           # 报告中心（日/周/月/季/年）
├── issues.html           # 问题追踪
├── settings.html         # 系统设置
├── auth.js               # 认证模块（登录/权限/改密）
├── pm-report-export.js   # 报告导出引擎
├── gantt-export.js       # 甘特图导出
├── kanban-export.js      # 看板导出
├── common.css            # 公共样式
├── dark-mode.css/js      # 暗黑模式
├── mobile.css            # 移动端适配
├── static/               # 静态资源
├── docs/                 # 文档
└── data/                 # 数据目录（SQLite + 附件）
```

## 🔄 更新

```bash
# 检查更新
bash pm_update.sh --check

# 执行更新（自动备份+git pull+重启+验证）
bash pm_update.sh

# 强制更新
bash pm_update.sh --force
```

## 📜 版本历史

### v2.5.0 (2026-08-05)
- 🆕 绩效管理模块（月度/季度/年度三周期，分数+等级+评语）
- 🆕 考勤台账（加班+请假记录，请假明细）
- 🆕 绩效统计（等级分布柱状图、条线平均分）
- 🆕 Excel批量导入导出（绩效+考勤）
- 🆕 任务负责人变更记录（自动记录+报告展示换人次数）
- 🐛 Dashboard待解决问题只显示未解决的（排除resolved）
- 🐛 月报/季度报/年度报JSON序列化None值报错修复

### v2.4.0 (2026-08-03)
- 🆕 日报人员统计增加当日推迟次数和评价列
- 🆕 机密项目功能（标记🔒、报表自动排除）
- 🆕 导航栏GitHub仓库链接
- 🆕 用户修改密码功能增强
- 🆕 季度报/年度报开发
- 🆕 月度趋势Canvas/SVG柱状图
- 🆕 版本号API + 一键更新脚本
- 🐛 Ctrl+K搜索点击定位修复
- 🐛 月报PDF人员统计布局修复
- 🐛 SQLite改WAL模式解决并发写入锁库

### v2.1.0 (2026-06-11)
- 🆕 报告导出（HTML/PDF），3种风格
- 🆕 报告甘特图时间维度选择
- 🆕 任务清单完成情况说明
- 🆕 模板编辑回填
- 🆕 任务start_date字段

### v2.0.0 (2026-05-12)
- 🎉 初始发布
- 📊 Dashboard + 任务管理 + 甘特图 + 看板
- 🔐 四角色权限模型
- 📄 PDF/Excel导出
- 🌙 暗黑模式

## 📄 License

MIT License

---

<a id="english"></a>

## 📋 PM System

> Lightweight self-hosted project management system with task tracking, Gantt chart, Kanban board, role-based access control, multi-dimensional reports, and confidential project isolation

![Version](https://img.shields.io/badge/Version-v2.5.0-blue)
![Python](https://img.shields.io/badge/Python-3.8+-green)
![Flask](https://img.shields.io/badge/Flask-3.x-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### Core
- 📊 **Dashboard** — Project overview, task statistics, due date alerts, workload by person
- 📋 **Task Management** — Create/edit/delete/batch operations, progress tracking, priority labels, completion notes
- 📅 **Gantt Chart** — Visual timeline, 5 time dimensions (week/month/quarter/year/custom), 6 export styles
- 📌 **Kanban Board** — Three-column drag-and-drop (pending/in-progress/completed), 5 export styles
- 🐛 **Issue Tracking** — Issue creation/assignment/resolution, severity levels
- 👥 **Personnel Management** — Team member management, department/role/contact, active/resigned/retired status

### Reporting System
- 📊 **Daily Report** — Today's task overview, personnel workload (with daily delay count + rating stats), overdue alerts, action recommendations
- 📈 **Weekly Report** — Weekly task completion, personnel performance, rating statistics
- 📉 **Monthly Report** — Monthly task statistics, personnel performance table, monthly trend bar chart, rating distribution
- 📅 **Quarterly Report** — Quarterly summary, personnel performance details, rating statistics, monthly trends
- 📆 **Annual Report** — Annual summary, 12-month trend chart, personnel performance ranking, rating distribution
- 📄 **Report Export** — One-click HTML/PDF export, 3 styles, selectable content sections, Gantt chart time dimension options

### Collaboration
- 💬 **Comments** — In-task comments, @mention notifications
- 📎 **Attachments** — File upload/download/delete
- 🔔 **Notifications** — Auto notifications for task assignment/completion/comments
- 🔍 **Global Search** — Ctrl+K shortcut, cross-project/task/person search with click-to-locate highlighting

### Security & Access Control
- 🔐 **4-Role Permission Model** — Admin / Project Owner / Project Member / Viewer
- 🔑 **Authentication** — Login/logout, password change, admin reset
- 👁️ **Viewer Authorization** — Project-level fine-grained access control
- 🔒 **Confidential Projects** — Confidential project marking, auto-exclusion from reports, 🔒 indicator in lists

### Task Management Enhancements
- ⏰ **Delay Tracking** — Automatic due date change history, delay reason tracking
- ⭐ **Completion Rating** — 4-level rating system (insufficient/normal/excellent/outstanding), rating stats in reports
- 📊 **Personnel Performance** — Multi-dimensional stats: task count / completion rate / overdue count / delay count / rating distribution
- 🔄 **Assignee Changes** — Automatic assignee change history, change count in reports

### Performance Management
- 📊 **Performance Records** — Monthly/quarterly/annual cycles, score + grade (S/A/B/C/D) + comment
- 📈 **Performance Stats** — Grade distribution chart, line average score, summary cards
- 📋 **Attendance Ledger** — Overtime (hours) + leave (days) records, leave details, notes
- 📥📤 **Import/Export** — Excel batch import/export (performance + attendance)

### UX
- 🌙 **Dark Mode** — One-click toggle with preference memory
- 📱 **Mobile Responsive** — Responsive layout
- 🎨 **Task Templates** — 4 preset templates, custom templates + editing
- 🔄 **Version Updates** — One-click update script with auto backup + restart + verification

## 🚀 Quick Start

### Local Deployment

```bash
# 1. Clone the repository
git clone https://github.com/DennisSkyWind/pm-system.git
cd pm-system

# 2. Install dependencies
pip install flask requests

# 3. Initialize
python3 -c "import os; os.makedirs('data', exist_ok=True); os.makedirs('data/attachments', exist_ok=True)"

# 4. Configure environment (optional)
cp .env.example .env
# Edit .env to set paths

# 5. Start the server
python3 pm_server.py
```

Visit http://localhost:5236

### Docker Deployment

```bash
docker build -t pm-system .
docker run -d -p 5236:5236 pm-system
```

### Default Accounts

| Username | Password | Role |
|----------|----------|------|
| admin | pm2026 | Admin |
| lisi | pm2026 | Regular User |

> ⚠️ Please change the default password immediately after first deployment

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Python Flask + SQLite (WAL mode) |
| Frontend | HTML/CSS/JavaScript (pure static, no framework) |
| Database | SQLite (WAL mode, concurrent read/write support) |
| Export | html2canvas + jsPDF (PDF), SheetJS (Excel) |
| Charts | Canvas/SVG bar charts |

## 📁 Project Structure

```
pm-system/
├── pm_server.py          # Flask backend service
├── admin.html            # Admin panel
├── index.html            # Dashboard
├── tasks.html            # Task management
├── projects.html         # Project management
├── persons.html          # Personnel management
├── gantt.html            # Gantt chart
├── report.html           # Report center (daily/weekly/monthly/quarterly/annual)
├── issues.html           # Issue tracking
├── settings.html         # System settings
├── auth.js               # Authentication module (login/permissions/password change)
├── pm-report-export.js   # Report export engine
├── gantt-export.js       # Gantt chart export
├── kanban-export.js      # Kanban board export
├── common.css            # Common styles
├── dark-mode.css/js      # Dark mode
├── mobile.css            # Mobile responsive
├── static/               # Static assets
├── docs/                 # Documentation
└── data/                 # Data directory (SQLite + attachments)
```

## 🔄 Updates

```bash
# Check for updates
bash pm_update.sh --check

# Perform update (auto backup + git pull + restart + verify)
bash pm_update.sh

# Force update
bash pm_update.sh --force
```

## 📜 Changelog

### v2.5.0 (2026-08-05)
- 🆕 Performance management module (monthly/quarterly/annual, score+grade+comment)
- 🆕 Attendance ledger (overtime+leave records, leave details)
- 🆕 Performance statistics (grade distribution chart, line average score)
- 🆕 Excel batch import/export (performance+attendance)
- 🆕 Task assignee change history (auto-record + report display)
- 🐛 Dashboard open issues fix (exclude resolved)
- 🐛 JSON serialization None value fix for reports

### v2.4.0 (2026-08-03)
- 🆕 Daily report personnel stats: daily delay count and rating columns
- 🆕 Confidential project feature (🔒 marking, auto-exclusion from reports)
- 🆕 GitHub repository link in navigation bar
- 🆕 Enhanced password change functionality
- 🆕 Quarterly/Annual report development
- 🆕 Monthly trend Canvas/SVG bar charts
- 🆕 Version API + one-click update script
- 🐛 Ctrl+K search click-to-locate fix
- 🐛 Monthly report PDF personnel stats layout fix
- 🐛 SQLite WAL mode for concurrent write lock resolution

### v2.1.0 (2026-06-11)
- 🆕 Report export (HTML/PDF), 3 styles
- 🆕 Report Gantt chart time dimension selection
- 🆕 Task list completion notes
- 🆕 Template editing with data pre-fill
- 🆕 Task start_date field

### v2.0.0 (2026-05-12)
- 🎉 Initial release
- 📊 Dashboard + Task management + Gantt chart + Kanban board
- 🔐 4-role permission model
- 📄 PDF/Excel export
- 🌙 Dark mode

## 📄 License

MIT License
