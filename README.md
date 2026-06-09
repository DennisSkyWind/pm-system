# 📋 项目管理系统 (PM System)

> 轻量级项目管理系统，支持任务追踪、甘特图、看板视图、权限管理、报告导出、模板管理

## ✨ 功能特性

### 核心功能
- 📊 **Dashboard仪表盘** — 项目概览、任务统计、到期预警、人员工作量
- 📋 **任务管理** — 创建/编辑/删除/批量操作，进度追踪，优先级标记，完成情况说明
- 📅 **甘特图** — 可视化时间线，5种时间维度（周/月/季/年/自定义），6种导出风格
- 📌 **看板视图** — 三列拖拽（待处理/进行中/已完成），5种导出风格
- 🐛 **问题追踪** — 问题创建/分配/解决，严重程度分级
- 👥 **人员管理** — 团队成员管理，部门/角色/联系方式

### 协作功能
- 💬 **评论系统** — 任务内评论，@提及通知
- 📎 **附件管理** — 文件上传/下载/删除
- 🔔 **通知中心** — 任务分配/完成/评论自动通知
- 🔍 **全局搜索** — Ctrl+K快捷键，跨项目/任务/人员搜索

### 导出功能
- 📄 **PDF导出** — 5种专业模板，横向/纵向，状态筛选
- 📊 **Excel导出** — 任务/人员数据导出
- 📥 **Excel/CSV导入** — 批量导入任务
- 🖼️ **甘特图导出** — PNG/PDF，6种风格
- 🖼️ **看板导出** — PNG/PDF，5种风格

### 🆕 v2.1 新功能
- 📦 **报告导出** — 一键导出项目报告（HTML/PDF），3种风格，内容板块可选
- 📅 **报告甘特图时间维度** — 本月/本季度/本年度/自定义，带时间轴刻度+今天标线
- 📋 **任务清单完成情况说明** — 自动提取notes/description/completed_date
- 🎨 **模板编辑** — 编辑模板时回填所有原有数据（名称/类型/描述/阶段/任务）
- 📋 **任务start_date字段** — 甘特图和报告导出依赖开始日期

### 权限管理
- 🔐 **四角色权限模型** — 管理员/项目负责人/项目参与者/查看者
- 🔑 **用户认证** — 登录/登出，密码修改，管理员重置
- 👁️ **查看者授权** — 项目级细粒度权限控制

### 体验优化
- 🌙 **暗黑模式** — 一键切换，偏好记忆
- 📱 **移动端适配** — 响应式布局
- 🎨 **任务模板** — 4个预设模板，自定义模板+编辑

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
| wangwu | pm2026 | 普通用户 |

## ⚙️ 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| PM_FRONTEND_DIR | 前端文件目录 | ./frontend |
| PM_DB_PATH | 数据库路径 | ./data/pm.db |
| PM_UPLOAD_DIR | 附件上传目录 | ./data/attachments |
| MEMOS_SCRIPT | Memos集成脚本 | 空（禁用） |
| PM_PORT | 服务端口 | 5236 |

## 📁 项目结构

```
pm-system/
├── pm_server.py          # 后端服务（Flask）
├── frontend/
│   ├── index.html        # Dashboard仪表盘
│   ├── login.html        # 登录页面
│   ├── projects.html     # 项目列表
│   ├── project.html      # 项目详情
│   ├── tasks.html        # 任务管理
│   ├── gantt.html        # 甘特图
│   ├── issues.html       # 问题追踪
│   ├── persons.html      # 人员管理
│   ├── phases.html       # 阶段管理
│   ├── report.html       # 报告导出
│   ├── templates.html    # 任务模板
│   ├── reminders.html    # 提醒
│   ├── admin.html        # 管理后台
│   ├── settings.html     # 系统设置
│   ├── auth.js           # 认证工具
│   ├── dark-mode.js      # 暗黑模式
│   ├── gantt-export.js   # 甘特图导出模块
│   ├── kanban-export.js  # 看板导出模块
│   └── pm-report-export.js # 报告导出模块
├── data/
│   └── pm.db             # SQLite数据库
├── .env.example          # 环境变量模板
├── Dockerfile            # Docker构建文件
└── package.json          # 项目信息
```

## 🛠️ 技术栈

- **后端**: Python 3.12 + Flask + SQLite
- **前端**: 原生HTML/CSS/JavaScript
- **导出**: html2canvas + jsPDF + openpyxl
- **认证**: JWT Token

## 📄 License

MIT License
