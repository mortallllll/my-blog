# KONGYU'S BLOG

个人技术 & 生活博客，基于 Next.js 16 + Vercel KV，部署在 Vercel。

🔗 https://my-blog-iota-red.vercel.app

---

## 功能

### 访客端

- 📄 文章列表 + 卡片式布局
- 🔍 全文搜索
- 📅 GitHub 风格日历热力图 — 按日期筛选文章
- 🏷️ 标签分类 — 按标签筛选文章
- 🌓 亮色 / 暗色 / 跟随系统 三种主题
- 🌿 复古树叶边框装饰（SVG 动画）

### 管理端

- ✍️ 文章 CRUD（新建 / 编辑 / 删除）
- 🤖 **DeepSeek AI 生成** — 输入主题自动生成完整文章
- 🔒 密码认证（cookie-based）

### 外观自定义

- 导航栏颜色 + 透明度
- 树叶边框颜色（6 种预设 + 自定义取色器）
- 侧边栏收起 / 展开

---

## 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS 4 |
| 存储 | Vercel KV (Upstash Redis) |
| 认证 | Cookie + 环境变量 |
| AI | DeepSeek Chat API |
| 部署 | Vercel + GitHub 自动部署 |

---

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
# → http://localhost:3000

# 构建
npm run build
```

### 环境变量

创建 `.env.local`：

```env
ADMIN_PASSWORD=admin123
DEEPSEEK_API_KEY=sk-xxxxxxxx    # 可选，用于 AI 生成
```

---

## 项目结构

```
src/
├── app/
│   ├── page.tsx                  # 首页（服务端数据获取）
│   ├── HomePageClient.tsx        # 首页客户端（筛选状态管理）
│   ├── layout.tsx                # 根布局
│   ├── globals.css               # 全局样式 + 动画
│   ├── admin/                    # 管理端
│   │   ├── page.tsx              # 文章管理
│   │   └── login/                # 登录页
│   ├── post/[slug]/              # 文章详情页
│   └── api/
│       ├── posts/                # 文章 CRUD API
│       ├── auth/                 # 认证 API
│       └── generate/             # DeepSeek AI 生成 API
├── components/
│   ├── PostCard.tsx              # 文章卡片
│   ├── PostEditor.tsx            # 文章编辑器（含 AI 生成）
│   ├── Sidebar.tsx               # 左侧导航栏
│   ├── ContributionCalendar.tsx  # 日历热力图
│   ├── TagList.tsx               # 标签分类
│   ├── VintageLeafBorder.tsx     # 树叶边框装饰
│   ├── SettingsProvider.tsx      # 外观设置 Context
│   ├── SettingsPanel.tsx         # 设置面板 UI
│   └── Toast.tsx                 # 消息提示
└── lib/
    ├── posts.ts                  # 存储核心（KV + 文件）
    ├── auth.ts                   # 认证逻辑
    ├── calendar.ts               # 日历数据计算
    ├── settings.ts               # 外观设置类型 + 工具函数
    └── markdown.ts               # Markdown 渲染
```

---

## 部署

推送 `main` 分支后 Vercel 自动部署。手动部署：

```bash
npx vercel --prod --yes
```
