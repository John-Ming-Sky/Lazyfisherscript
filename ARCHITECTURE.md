# LazyFisher 合并版 · 代码结构说明

供维护者与 AI 助手快速定位模块，**每次发版请同步更新**「当前版本」与「最近结构变更」。

**当前版本：** `LazyFisher合并版V1.3.user.js`

---

## 单文件布局

```
LazyFisher合并版V*.user.js   (~19k 行，单文件油猴脚本)
├── 文件头 @name / @version / @match …
├── LazyFisherMergedBootstrap   三模块总开关 + GM 菜单
├── Module: LazyFisher信息增强    默认启用
├── Module: lazyfisher辅助增强    默认启用（含 FISH_DATABASE 大表）
└── Module: LazyFisher环境显示    默认启用
```

配套文档：

| 文件 | 用途 |
|------|------|
| `CHANGELOG.md` | 用户可见变更摘要 |
| `ARCHITECTURE.md` | 本文件：结构地图 |
| `.cursor/rules/lazyfisher-versioning.mdc` | 发版与版本号规则 |

---

## 1. Bootstrap（`LazyFisherMergedBootstrap`）

- **位置：** 文件开头，`// ==UserScript==` 之后
- **职责：** 读写 `GM_getValue` / `GM_setValue`，暴露 `window.LazyFisherMerged`
- **模块 ID：**
  - `infoEnhance` — LazyFisher 信息增强
  - `publicEnhance` — lazyfisher 辅助增强（公开版）
  - `environmentDisplay` — 环境显示

各 Module 用 `if (window.LazyFisherMerged?.isEnabled('…'))` 包裹，可单独关闭。

---

## 2. Module: LazyFisher信息增强

**分界注释：** `// Module: LazyFisher信息增强`

### 核心单例（按 `#region` 划分）

| 符号 | 职责 |
|------|------|
| `Utils` / `Rarity` / `ScoreOffsetCalc` | 工具、科技分判定、评级偏移统计 |
| `FishKeepHistory` | 鱼护数据持久化、价格/经验计算 |
| `FishKeepHistoryUi` | 弹窗：历史总览、收益、**鱼护记录**、统计 |
| `FishKeepUi` | 设置弹窗：鱼护管理、数据导入导出 |
| `BoatHelper` | 船钓/区域鱼群网格增强、排序、标签 `__LF_ENHANCE_FISH_GRIDS` |
| `CatchTiming` | 消息页 & 钓鱼页日志/上鱼框：评级着色、狠活/败北、鱼口间隔 |

### 鱼护记录 `recordPanel()`

- 分组表格、折叠分组、`lf-record-panel` 浅色样式
- 约在 `FishKeepHistoryUi.recordPanel` 内

### 狠活 / 败北

- `CatchTiming.specialCatchMark(score)` — 唯一判定源（消息卡、钓鱼日志、上鱼框共用）
- 徽章类名：`.lf-special-mark`

### 信息增强接管

- `INFO_ENHANCE_TAKEOVER`：公开版同名功能（如 `fishSort`、鱼口计算）在信息增强启用时停用，菜单显示 `[接管]`

---

## 3. Module: lazyfisher辅助增强（公开版）

**分界注释：** `// Module: lazyfisher辅助增强(公开版)`

- **`FISH_DATABASE`**：内嵌 JSON 鱼种库（体积大，勿随意重排）
- **`FEATURES` + `INIT_MAP`**：按开关调用 `initXxx()`
- **主要 `init` 函数：**

| 函数 | 功能 |
|------|------|
| `initFishSort` | 区域鱼群排序（可被信息增强接管） |
| `initWaterLayer` | 水层标签；网格内由 `BoatHelper` 独占 |
| `initFishLogColor` | 钓鱼日志文字染色 |
| `initCatchSummary` | 本次钓行统计（狠活/败北计数） |
| `initFishCardGradeColor` / `initFishCardGlow` | 鱼获卡片背景/辉光 |
| `initFishWeightGlow` | 可遇鱼类重量色条 |
| `initRealtimeChart` | 搏斗实时波动图 |
| … | 见 `INIT_MAP` 完整列表 |

### 跨模块钩子

- `window.__LF_ENHANCE_FISH_GRIDS` — 由 `BoatHelper` 注册，水层模块在网格变更时调用，避免重复打标签

### 性能约定（V1.0+）

- 监听 `document.body` 的 `MutationObserver` 应对 DOM 变更做 **debounce**（约 150ms）
- 批量扫描优先使用 `:not([data-…])` 跳过已处理节点

---

## 4. Module: LazyFisher环境显示

**分界注释：** `// Module: LazyFisher环境显示`

- 钓鱼概览：水流、湿度、降雨、附近玩家、软封/IP 状态
- 依赖 `.fishing-compact-card`、`.fishing-overview-grid` 等页面结构

---

## 5. 样式注入

- 信息增强：`GM_addStyle(\`…\`)` 块在模块开头（日志/上鱼框评级、鱼标签 `.lf-fish-badge` 等）
- 公开版：部分功能自建 `<style id="…">`

---

## 6. 发版时更新本文件

1. 改 **当前版本** 文件名  
2. 若有以下情况，在 **最近结构变更** 补一行：
   - 新增/删除模块或 `init` 入口
   - 新增跨模块钩子或单例
   - 大规模 DOM 选择器/类名变更

### 最近结构变更

| 版本 | 说明 |
|------|------|
| V1.3 | 败北稀有区间 `[98.85,99)`；钓行统计鱼种列表徽章与鱼名分离 |
| V1.2 | 标签首字缩写；`resolveSortFishGrid` 全网格排序面板 |
| V1.1 | `initFishWeightGlow` 跳过 `.region-fish-grid`；`enhanceFishGrid` 默认 `withPrice`；`resolveFishCardContent` 不缓存失败 |
| V1.0 | 版本号进位至 V1.0；公开版 Observer debounce + 已标记节点跳过扫描 |
| V0.10 | `recordPanel` 折叠分组与浅色表样式 |
| V0.9 | `CatchTiming.setSpecialCatchMarkBadge` 同步日志/上鱼框 |
| V0.8 | `__LF_ENHANCE_FISH_GRIDS`、统一 `.lf-fish-badge` |

---

## 7. 版本号规则（摘要）

详见 `.cursor/rules/lazyfisher-versioning.mdc`：

- `V0.1` … `V0.10` 预发布递增  
- **`V0.10` 之后下一版为 `V1.0`**（满十进一）  
- 此后 `V1.1` … `V1.10` → `V2.0`，以此类推  
- 旧文件保留；`@version` 与文件名一致
