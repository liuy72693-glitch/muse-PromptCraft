# PromptCraft

Muse — 提示词优化助手。纯 Web：React + Zustand + Vite，localStorage 持久化。

> 左边选环境，中间聊需求，右边看结果。你不会的技术名词交给 AI，你只管说你要什么。

---

## 架构

```
PromptCraft/
├── index.html              # 中控台入口
├── app.html                # Muse 入口
│
├── src/
│   ├── dashboard/          # 中控台：粒子背景 + 玻璃拟态卡片
│   │   ├── main.tsx
│   │   ├── Dashboard.tsx
│   │   └── Dashboard.css
│   │
│   ├── App.tsx             # Muse 主布局（三栏可折叠）
│   ├── store.ts            # Muse Zustand store
│   │
│   ├── components/         # Muse 组件
│   │   ├── Chat/           # ChatView, MessageBubble, InputBar, ContextBar
│   │   ├── Sidebar/        # HistoryView, ContextPanel
│   │   ├── Preview/        # ResultPreview, DiffView, VersionSlider
│   │   └── Settings/       # SettingsView（API 提供商管理）
│   │
│   ├── services/
│   │   ├── ai.ts           # 统一 AI 调用（流式 + 非流式，多提供商）
│   │   ├── providers.ts    # 模型检测
│   │   ├── storage.ts      # localStorage 持久化
│   │   ├── reports.ts      # 工作报告
│   │   └── diff.ts         # LCS 差异算法
│   │
│   ├── types/index.ts      # 共享类型定义
│   └── index.css           # 全局样式
│
└── package.json
```

---

## Muse — 提示词灵感助手

### 核心工作流

```
启动 → 选环境（平台/语言/框架/任务/目标AI/风格）→ 输入粗糙提示词
     → AI 返回优化版 + 右侧 diff 对比 → 继续对话调整 → 复制
```

### 快捷指令

输入 `/` 弹出菜单：`/简化` `/详细` `/举例` `/测试` `/还原` `/新对话`

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Enter` | 发送消息 |
| `/` | 快捷指令菜单 |
| `Esc` | 关闭弹窗 |

---

## 技术细节

### API 支持
- Anthropic（Claude）
- OpenAI 兼容（DeepSeek、通义千问、Moonshot、智谱、SiliconFlow）
- Google Gemini

### 存储（localStorage）
- `pc_conversations` — Muse 对话
- `pc_providers` — API 提供商配置
- `pc_work_reports` — 工作报告
- `pc_favorites` — 收藏
- `pc_greeting_cache` — 每日问候缓存

### 代理
- 浏览器 dev 模式经 vite `/api/proxy` 转发（国内提供商不支持浏览器跨域）
- 生产构建直连（Anthropic/Gemini 支持 CORS）

---

## 历史

- **Quill（编程助手）已删除**：曾尝试基于 Rust 自研引擎做 IDE 式编程助手，方向投入过大，2026-08 已全部移除（Rust 引擎、Monaco 前端、插件系统、子代理、Tauri 壳、中控台）。Muse 现在是纯 Web 单入口应用。
