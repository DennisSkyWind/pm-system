# 🚀 ResumeAI 简历优化系统 — 完整搭建指南

> **面向对象**：数学专业、非IT背景的同学  
> **目标**：从零开始，搭建一个属于自己的AI简历优化云端应用  
> **预计耗时**：3-5小时（不含等待审核时间）

---

## 📖 目录

1. [项目全景介绍](#1-项目全景介绍)
2. [你需要准备什么](#2-你需要准备什么)
3. [第一步：注册所需账号](#3-第一步注册所需账号)
4. [第二步：获取代码](#4-第二步获取代码)
5. [第三步：配置AI大模型](#5-第三步配置ai大模型)
6. [第四步：部署后端到Render](#6-第四步部署后端到render)
7. [第五步：部署前端到Vercel](#7-第五步部署前端到vercel)
8. [第六步：配置邮箱服务](#8-第六步配置邮箱服务)
9. [第七步：配置自定义域名（可选）](#9-第七步配置自定义域名可选)
10. [第八步：验证上线](#10-第八步验证上线)
11. [第九步：接入支付功能](#11-第九步接入支付功能)
12. [常见问题排查](#12-常见问题排查)
13. [架构总览图](#13-架构总览图)

---

## 1. 项目全景介绍

### 这是什么？

ResumeAI 是一个 **AI简历优化系统**，用户上传简历，AI自动分析并给出优化建议。

### 它能做什么？

| 功能 | 说明 |
|------|------|
| 🤖 AI简历分析 | 上传简历，AI自动识别优缺点，给出评分 |
| ✨ 智能优化 | 根据目标岗位，AI重写简历内容 |
| 📄 PDF导出 | 一键导出优化后的简历PDF |
| 📊 行业匹配 | 支持销售、财务、IT、医疗等30+行业 |
| 🔐 用户系统 | 注册/登录/每日免费次数/会员等级 |
| 💰 支付系统 | 接入虎皮椒/Stripe，支持会员订阅 |

### 技术架构（一句话版）

```
用户浏览器 → Vercel(前端页面) → Render(后端API) → 阿里云AI大模型
```

- **前端**：纯HTML/CSS/JS静态页面，托管在 Vercel（免费）
- **后端**：Python FastAPI，托管在 Render（免费套餐）
- **AI**：阿里云通义千问API（按量付费，新用户有免费额度）
- **数据库**：SQLite（文件型数据库，无需安装，随代码走）

---

## 2. 你需要准备什么

### 必需品

| 项目 | 说明 | 费用 |
|------|------|------|
| 📧 一个邮箱 | 用于注册各平台账号 | 免费 |
| 💳 一张银行卡 | 用于阿里云实名认证（不扣费） | 免费 |
| 🖥️ 电脑 | Windows/Mac均可 | — |

### 不需要的

- ❌ 不需要买服务器
- ❌ 不需要懂Linux命令
- ❌ 不需要安装数据库
- ❌ 不需要域名（可以用免费域名）

### 费用预估

| 服务 | 费用 |
|------|------|
| Vercel 前端托管 | 免费 |
| Render 后端托管 | 免费（750小时/月） |
| 阿里云AI | 新用户有免费额度，之后约0.01元/次 |
| Resend 邮箱服务 | 免费（100封/天） |
| **总计** | **$0 起步** |

---

## 3. 第一步：注册所需账号

你需要注册以下5个账号，**按顺序来**：

### 3.1 GitHub 账号（代码托管）

1. 打开 https://github.com/signup
2. 填写用户名、邮箱、密码
3. 完成邮箱验证
4. ✅ 完成

### 3.2 阿里云账号（AI大模型）

1. 打开 https://www.aliyun.com/
2. 点击「免费注册」，用手机号注册
3. 完成**实名认证**（需要身份证，这是国内法规要求）
4. 进入「DashScope控制台」：https://dashscope.console.aliyun.com/
5. 点击「开通 DashScope 服务」（免费开通）
6. 点击左侧「API-KEY管理」→「创建 API Key」
7. **复制并保存这个 API Key**（格式如 `sk-sp-xxxxx`），后面要用！
   > ⚠️ 这个Key很重要，相当于你AI服务的密码，不要泄露给他人

### 3.3 Render 账号（后端托管）

1. 打开 https://dashboard.render.com/register
2. 点击「Sign up with GitHub」→ 用刚注册的GitHub账号登录
3. 授权 Render 访问你的 GitHub
4. ✅ 完成

### 3.4 Vercel 账号（前端托管）

1. 打开 https://vercel.com/signup
2. 点击「Continue with GitHub」→ 用GitHub账号登录
3. 授权 Vercel 访问你的 GitHub
4. ✅ 完成

### 3.5 Resend 账号（邮箱发送服务）

1. 打开 https://resend.com/signup
2. 用GitHub或Google账号注册
3. 进入 Dashboard → 左侧「API Keys」→「Create API Key」
4. **复制并保存这个 API Key**（格式如 `re_xxxxx`）
5. 左侧「Domains」→「Add Domain」→ 输入你的域名（如果有）
   > 如果没有域名，可以先用Resend的测试模式，后面第8步详细说

---

## 4. 第二步：获取代码

### 4.1 Fork项目到你的GitHub

1. 打开项目地址：https://github.com/DennisSkyWind/-resume-ai
2. 点击右上角 **「Fork」** 按钮
3. 选择你的账号，点击「Create fork」
4. 等待复制完成，你现在有了一份自己的代码

### 4.2 修改前端API地址

1. 在你的Fork仓库中，找到 `public/index.html`
2. 点击文件 → 右上角铅笔图标（编辑）
3. 找到以下代码（大约第1505-1508行）：

```javascript
const API_BASE = window.location.hostname;
const API = API_BASE === 'localhost' || API_BASE.startsWith('192.168.')
    ? `http://${API_BASE}:8001`  // 开发环境
    : 'https://resume-ai-9tvi.onrender.com';  // 生产环境（Render后端）
```

4. 把 `resume-ai-9tvi.onrender.com` 改成你自己的Render地址（后面第6步会获得）
   > 💡 如果你还没有Render地址，先跳过这一步，部署完Render后再回来改

5. 点击右上角「Commit changes」保存

### 4.3 修改后端AI配置

1. 在你的Fork仓库中，找到 `backend/main.py`
2. 点击编辑，找到以下代码（大约第399行）：

```python
DASHSCOPE_API_KEY = "sk-sp-e8d1076e8dd4461d8d1edf2542f8de68"
```

3. 替换为你在第3.2步获得的API Key：

```python
DASHSCOPE_API_KEY = os.environ.get("DASHSCOPE_API_KEY", "")
```

4. 同样找到 `backend/email_sender.py` 第12行：

```python
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "re_ARxpVJ73_7nqzDoQoPkLdDaUe6budhJHP")
```

5. 替换为：

```python
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
```

6. 点击「Commit changes」保存

> ⚠️ **安全提醒**：永远不要把API Key硬编码在代码里提交到GitHub！上面改成从环境变量读取是正确的做法。

---

## 5. 第三步：配置AI大模型

如果你在第3.2步已经开通了DashScope并拿到了API Key，这步就完成了。

### 补充说明

- **通义千问** 是阿里云的AI大模型，类似于ChatGPT
- 免费额度：新用户通常有100万Token免费额度，足够测试
- 付费后按量计费：大约0.01-0.02元/次简历分析
- 模型选择：项目默认使用 `qwen3.5-plus`，性价比最优

### 如果想换用其他AI模型

在 `backend/main.py` 中修改：

```python
DASHSCOPE_BASE_URL = "https://coding.dashscope.aliyuncs.com/v1"
DASHSCOPE_MODEL = "qwen3.5-plus"  # 可改为 qwen-max, qwen-plus 等
```

---

## 6. 第四步：部署后端到Render

### 6.1 创建Web Service

1. 登录 https://dashboard.render.com/
2. 点击 **「New +」** → **「Web Service」**
3. 选择 **「Build and deploy from a Git repository」**
4. 点击「Connect」连接你的GitHub账号
5. 找到你Fork的 `-resume-ai` 仓库，点击「Connect」

### 6.2 配置部署参数

在配置页面填写：

| 参数 | 值 |
|------|-----|
| **Name** | `resume-ai-api`（或你喜欢的名字） |
| **Region** | `Singapore`（新加坡，离中国最近） |
| **Branch** | `main` |
| **Root Directory** | `backend` ⚠️ 重要！ |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | `Free` |

### 6.3 添加环境变量

在同一个页面，找到「Environment Variables」，添加以下变量：

| Key | Value | 说明 |
|-----|-------|------|
| `JWT_SECRET` | `随便写一串英文数字` | 用户登录加密密钥，如 `my_secret_key_2026` |
| `JWT_EXPIRE_HOURS` | `168` | 登录有效期（168小时=7天） |
| `FREE_LIMIT` | `5` | 免费用户每天使用次数 |
| `DASHSCOPE_API_KEY` | `sk-sp-你的Key` | 第3.2步获得的AI密钥 |
| `RESEND_API_KEY` | `re-你的Key` | 第3.5步获得的邮箱密钥 |
| `PYTHON_VERSION` | `3.12.3` | Python版本 |

### 6.4 开始部署

1. 点击最下面的 **「Create Web Service」**
2. 等待3-5分钟，Render会自动构建和部署
3. 部署成功后，页面顶部会显示你的服务地址，格式如：
   ```
   https://resume-ai-api-xxxx.onrender.com
   ```
4. **复制这个地址**，后面要用！

### 6.5 验证后端

在浏览器中打开：`https://你的Render地址/api/v1/industries`

如果看到一长串JSON数据（行业列表），说明后端部署成功 ✅

> 💡 **首次访问可能需要30秒**：Render免费套餐有"冷启动"，服务闲置15分钟后会休眠，首次访问需要唤醒。

---

## 7. 第五步：部署前端到Vercel

### 7.1 创建项目

1. 登录 https://vercel.com/dashboard
2. 点击 **「Add New...」** → **「Project」**
3. 找到你Fork的 `-resume-ai` 仓库，点击「Import」

### 7.2 配置部署参数

| 参数 | 值 |
|------|-----|
| **Project Name** | `resume-ai`（或你喜欢的名字） |
| **Framework Preset** | `Other` |
| **Root Directory** | 点击「Edit」→ 输入 `public` ⚠️ 重要！ |
| **Build Command** | 留空 |
| **Output Directory** | 留空 |

### 7.3 开始部署

1. 点击 **「Deploy」**
2. 等待1-2分钟
3. 部署成功！页面会显示你的访问地址，格式如：
   ```
   https://resume-ai-xxxx.vercel.app
   ```

### 7.4 更新前端API地址

还记得第4.2步吗？现在你有Render地址了，需要回去更新：

1. 在GitHub你的Fork仓库中，编辑 `public/index.html`
2. 找到第1508行，把Render地址改成你的：
```javascript
: 'https://你的Render地址.onrender.com';
```
3. Commit保存
4. Vercel会自动检测到代码更新，1分钟内自动重新部署

### 7.5 验证前端

打开你的Vercel地址，应该能看到ResumeAI的首页 ✅

---

## 8. 第六步：配置邮箱服务

用户注册时需要接收验证码邮件，这步配置邮件发送。

### 8.1 如果你有自己的域名

1. 在 Resend Dashboard →「Domains」→ 添加你的域名
2. 按照提示在你的域名DNS中添加MX记录和SPF记录
3. 等待验证通过（通常几分钟到几小时）
4. 验证通过后，发件人地址可以设置为 `noreply@你的域名`

### 8.2 如果你没有域名

Resend提供了一个测试域名，但**只能发送到你自己的邮箱**。

1. 在 Resend Dashboard →「Domains」→ 你会看到默认的测试域名
2. 只能发送到你在Resend注册时使用的邮箱
3. **正式上线前建议购买一个域名**（约10元/年）

### 8.3 更新邮箱配置

1. 在GitHub编辑 `backend/email_sender.py`
2. 确认 `from_email` 设置正确：
```python
"from_email": "noreply@你的域名",  # 必须是Resend已验证的域名
```

---

## 9. 第七步：配置自定义域名（可选）

### 9.1 购买域名

推荐平台：
- 阿里云万网：https://wanwang.aliyun.com/ （.com域名约55元/年）
- Cloudflare：https://www.cloudflare.com/ （.com域名约$10/年）

### 9.2 绑定到Vercel

1. 在 Vercel Dashboard → 你的项目 →「Settings」→「Domains」
2. 输入你的域名，如 `resume.yourdomain.com`
3. 按照提示在你的域名DNS中添加CNAME记录：
   ```
   CNAME  resume  →  cname.vercel-dns.com
   ```
4. 等待DNS生效（通常5-30分钟）
5. Vercel会自动配置HTTPS（免费SSL证书）

### 9.3 绑定到Render

1. 在 Render Dashboard → 你的服务 →「Settings」
2. 找到「Custom Domains」→ 添加你的API域名，如 `api.yourdomain.com`
3. 按照提示添加CNAME记录
4. 更新前端 `index.html` 中的API地址

---

## 10. 第八步：验证上线

### 完整功能测试清单

按照以下顺序测试，全部通过即部署成功：

| # | 测试项 | 操作 | 预期结果 |
|---|--------|------|----------|
| 1 | 首页加载 | 打开你的Vercel地址 | 看到简历优化首页 |
| 2 | 注册账号 | 点击注册，输入邮箱 | 收到验证码邮件 |
| 3 | 输入验证码 | 填写6位验证码 | 注册成功，自动登录 |
| 4 | AI分析 | 输入简历内容，点击分析 | 返回AI评分和建议 |
| 5 | AI优化 | 点击优化按钮 | 返回优化后的简历 |
| 6 | 行业选择 | 切换不同行业 | 行业关键词正确加载 |
| 7 | PDF导出 | 点击导出PDF | 下载PDF文件 |
| 8 | 管理后台 | 访问 `/admin.html` | 看到管理登录页 |
| 9 | 使用次数 | 免费用户分析5次后 | 提示今日次数已用完 |
| 10 | 自动部署 | 修改GitHub代码 | Vercel/Render自动更新 |

---

## 11. 第九步：接入支付功能

> 📌 这是**进阶功能**，基础版不需要。当你想通过收费变现时再接入。

### 11.1 支付方案选择

| 方案 | 适合场景 | 费率 | 接入难度 |
|------|----------|------|----------|
| **虎皮椒** | 国内用户，微信/支付宝 | 1% | ⭐⭐ 简单 |
| **Stripe** | 海外用户，信用卡 | 2.9%+$0.3 | ⭐⭐⭐ 中等 |
| **LemonSqueezy** | 全球，SaaS订阅 | 5%+50¢ | ⭐ 最简单 |

**推荐**：面向国内用户选**虎皮椒**，面向海外选**Stripe**。

### 11.2 注册虎皮椒（国内推荐）

1. 打开 https://www.xunhupay.com/
2. 注册账号，完成实名认证
3. 创建商品：
   - 商品名称：`ResumeAI 基础会员 - 月度`
   - 价格：¥19/月
   - 回调地址：`https://你的Render地址/api/v1/payment/callback`
4. 获取**App ID**和**App Secret**

### 11.3 创建支付相关数据库表

在你的Render后端，需要添加订单表。编辑 `backend/main.py`，在 `ensure_tables_exist()` 函数中添加：

```python
# 订单表
cursor.execute('''CREATE TABLE IF NOT EXISTS orders
    (id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    order_no TEXT UNIQUE,
    product_id TEXT,
    product_name TEXT,
    amount REAL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    trade_no TEXT,
    paid_at TEXT,
    created_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id))''')

# 支付配置表
cursor.execute('''CREATE TABLE IF NOT EXISTS payment_config
    (key TEXT PRIMARY KEY,
    value TEXT)''')
```

### 11.4 添加支付API接口

在 `backend/main.py` 中添加以下API：

```python
# ========== 支付相关API ==========

@app.post("/api/v1/payment/create")
async def create_payment_order(request: Request):
    """创建支付订单"""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="未登录")
    
    data = await request.json()
    product_id = data.get("product_id")  # basic/pro/vip
    
    # 获取产品信息
    level_info = USER_LEVELS.get(product_id, None)
    if not level_info or product_id == "free":
        raise HTTPException(status_code=400, detail="无效的产品")
    
    # 创建订单
    order_no = f"RA{datetime.now().strftime('%Y%m%d%H%M%S')}{random.randint(1000,9999)}"
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO orders (user_id, order_no, product_id, product_name, amount, status, created_at) VALUES (?,?,?,?,?,?,?)",
        (user["id"], order_no, product_id, level_info["name"], level_info["price"], "pending", datetime.now().isoformat())
    )
    conn.commit()
    order_id = cursor.lastrowid
    conn.close()
    
    # 调用虎皮椒API创建支付链接
    # （此处需要根据虎皮椒文档实现）
    
    return {"success": True, "order_no": order_no, "amount": level_info["price"]}


@app.post("/api/v1/payment/callback")
async def payment_callback(request: Request):
    """支付回调（虎皮椒服务器调用）"""
    data = await request.json()
    
    # 验证签名（重要！防止伪造请求）
    # sign = data.get("hash")
    # 验证逻辑按虎皮椒文档实现
    
    order_no = data.get("order_no")
    trade_no = data.get("trade_no")
    
    conn = get_db()
    cursor = conn.cursor()
    
    # 更新订单状态
    cursor.execute("UPDATE orders SET status='paid', trade_no=?, paid_at=? WHERE order_no=?",
                   (trade_no, datetime.now().isoformat(), order_no))
    
    # 获取订单信息
    cursor.execute("SELECT user_id, product_id FROM orders WHERE order_no=?", (order_no,))
    order = cursor.fetchone()
    
    if order:
        # 升级用户等级
        product_id = order[1]
        expires_at = (datetime.now() + timedelta(days=30)).isoformat()
        cursor.execute("UPDATE users SET user_level=?, level_expires_at=?, is_paid=1 WHERE id=?",
                       (product_id, expires_at, order[0]))
    
    conn.commit()
    conn.close()
    
    return {"success": True}


@app.get("/api/v1/payment/orders")
async def get_payment_orders(request: Request):
    """查看用户支付历史"""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="未登录")
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC", (user["id"],))
    orders = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return {"success": True, "orders": orders}
```

### 11.5 添加前端支付页面

在 `public/index.html` 中添加支付弹窗：

```html
<!-- 会员升级弹窗 -->
<div id="upgrade-modal" style="display:none;">
  <h3>升级会员</h3>
  <div class="plan-card" onclick="selectPlan('basic')">
    <h4>基础会员</h4>
    <p>¥19/月 · 每天20次</p>
  </div>
  <div class="plan-card" onclick="selectPlan('pro')">
    <h4>专业会员</h4>
    <p>¥49/月 · 每天50次 + 模板</p>
  </div>
  <div class="plan-card" onclick="selectPlan('vip')">
    <h4>VIP会员</h4>
    <p>¥99/月 · 无限次 + 优先</p>
  </div>
  <button onclick="createPayment()">立即支付</button>
</div>

<script>
async function selectPlan(plan) {
    window.selectedPlan = plan;
}

async function createPayment() {
    const token = localStorage.getItem('resumeai_token');
    const res = await fetch(API + '/v1/payment/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ product_id: window.selectedPlan })
    });
    const data = await res.json();
    if (data.success) {
        // 跳转到虎皮椒支付页面
        window.location.href = data.payment_url;
    }
}
</script>
```

### 11.6 会员等级体系

系统已内置4个会员等级：

| 等级 | 价格 | 每日次数 | 功能 |
|------|------|----------|------|
| 免费用户 | ¥0 | 5次 | 分析+优化 |
| 基础会员 | ¥19/月 | 20次 | +上传+导出 |
| 专业会员 | ¥49/月 | 50次 | +模板+历史 |
| VIP会员 | ¥99/月 | 无限 | +优先处理 |

在 `backend/main.py` 中的 `USER_LEVELS` 配置可以自定义价格和功能。

### 11.7 配置Render环境变量

在 Render Dashboard → 你的服务 →「Environment」中添加：

| Key | Value |
|-----|-------|
| `XUNHU_APP_ID` | 虎皮椒App ID |
| `XUNHU_APP_SECRET` | 虎皮椒App Secret |
| `XUNHU_NOTIFY_URL` | `https://你的Render地址/api/v1/payment/callback` |

---

## 12. 常见问题排查

### ❓ 部署后页面空白

**原因**：前端API地址配置错误

**解决**：检查 `public/index.html` 中 `API` 变量的值是否指向你的Render地址

### ❓ AI分析返回错误

**原因**：DashScope API Key无效或额度用完

**解决**：
1. 登录 https://dashscope.console.aliyun.com/ 检查额度
2. 确认Render环境变量中 `DASHSCOPE_API_KEY` 设置正确

### ❓ 注册收不到验证码

**原因**：Resend配置问题

**解决**：
1. 检查Resend域名是否验证通过
2. 检查Render环境变量中 `RESEND_API_KEY` 是否正确
3. 临时方案：把 `email_sender.py` 中 `test_mode` 改为 `True`，验证码会显示在控制台

### ❓ Render冷启动慢（30秒+）

**原因**：免费套餐的服务15分钟无访问会休眠

**解决**：
- 这是正常现象，无法避免
- 可设置UptimeRobot每5分钟ping一次（免费），但可能触发Render的费用
- 或升级Render付费套餐（$7/月），无冷启动

### ❓ 代码改了但网站没更新

**原因**：Vercel/Render未检测到推送

**解决**：
1. 确认代码已push到GitHub的main分支
2. Vercel：Dashboard → 项目 → Deployments → 查看最新部署状态
3. Render：Dashboard → 服务 → 查看部署日志
4. 手动触发：Vercel点击「Redeploy」，Render点击「Manual Deploy」

### ❓ Render构建失败

**常见原因**：
1. Root Directory没有设为 `backend`
2. Python版本不兼容
3. requirements.txt中的包安装失败

**解决**：
1. 检查Render设置中Root Directory是否为 `backend`
2. 查看 Render 的构建日志（Build Log），找到具体错误
3. 确认 `PYTHON_VERSION` 环境变量设为 `3.12.3`

### ❓ 跨域错误（CORS）

**原因**：前端域名和后端域名不同

**解决**：后端已配置了 `allow_origins=["*"]`，正常情况不会出现。如果出现，检查Render地址是否正确。

---

## 13. 架构总览图

```
                        ┌─────────────────────┐
                        │    用户浏览器         │
                        │  https://your.site   │
                        └──────────┬──────────┘
                                   │
                          ┌────────▼────────┐
                          │   Vercel (免费)   │
                          │   前端静态页面      │
                          │   index.html      │
                          │   admin.html      │
                          └────────┬─────────┘
                                   │ API请求
                          ┌────────▼─────────┐
                          │  Render (免费)     │
                          │  Python FastAPI    │
                          │  后端API服务        │
                          │  ├ 用户认证         │
                          │  ├ 简历分析         │
                          │  ├ PDF导出         │
                          │  └ 支付处理         │
                          └──┬─────┬─────┬────┘
                             │     │     │
                    ┌────────▼┐  ┌▼────┐ ┌▼────────┐
                    │ SQLite  │  │阿里云│ │虎皮椒    │
                    │ 数据库   │  │AI   │ │支付      │
                    │ users.db│  │通义  │ │微信/支付宝│
                    └─────────┘  └─────┘ └──────────┘
```

### 数据流向

```
用户注册 → Resend发验证码 → 用户输入 → 写入SQLite
用户分析 → 前端发请求 → Render后端 → 调用阿里云AI → 返回结果
用户付费 → 前端下单 → Render后端 → 调虎皮椒 → 微信/支付宝 → 回调升级
```

### 文件结构

```
resume-ai/
├── public/                 ← Vercel部署这个目录
│   ├── index.html         主页面（194KB，包含所有前端逻辑）
│   ├── admin.html         管理后台
│   ├── help.html          帮助页面
│   ├── 404.html           404页面
│   ├── robots.txt         搜索引擎配置
│   └── sitemap.xml        站点地图
│
├── backend/               ← Render部署这个目录
│   ├── main.py            核心后端（4400行，所有API）
│   ├── email_sender.py    邮箱验证码发送
│   ├── requirements.txt   Python依赖
│   ├── keywords.json      行业关键词库
│   ├── resume_templates.json  简历模板
│   └── data/              数据目录（SQLite数据库）
│       └── users.db       自动创建
│
├── vercel.json            Vercel配置
├── render.yaml            Render配置
├── Dockerfile             Docker部署（可选）
├── runtime.txt            Python版本
└── deploy.sh              部署检查脚本
```

---

## 🎉 恭喜！

如果你完成了以上所有步骤，你已经拥有了一个：

- ✅ 可以通过互联网访问的AI简历优化应用
- ✅ 支持用户注册登录
- ✅ 接入AI大模型进行简历分析和优化
- ✅ 支持PDF导出
- ✅ 支持会员付费（如已接入）

### 下一步可以做的事

1. **推广**：分享给你的朋友使用
2. **优化**：根据用户反馈调整AI提示词
3. **变现**：接入支付，开始收费
4. **扩展**：添加更多行业、更多功能

---

*文档版本：v1.0 | 最后更新：2026-06-04*
