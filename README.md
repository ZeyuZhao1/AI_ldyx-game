# 两弹一星 (Two Bombs, One Satellite) — 现代化架构重构工程

戈壁砺剑 · 星辰为证 —— 基于真实史实改编的国防科技历史研学汇报游戏。

本项目对原单文件 HTML/JS 游戏（build v16）进行了彻底的模块化现代工程重构。采用 **TypeScript（Strict Mode）+ Vite + HTML5 Canvas 2D + Vitest** 原生架构，在完整保留原版 14 个历史主线关卡、9 位功勋科学家图鉴、特色弹道技能与全部核心玩法的基础上，修复了多项物理穿模与生命周期缺陷，重构了沉浸式复古航天指挥中心 UI，并新增了支持课堂汇报教学的专属演示模式。

---

## 架构概览

```text
src/
  main.ts                  # 应用入口，实例化并挂载 GameApp
  app/
    GameApp.ts             # 核心协调器，驱动 Fixed-Timestep 循环与模块联动
    GameStateMachine.ts    # 显式状态机 (MENU, LEVEL_INTRO, PLAYING, RESULT)
  engine/
    GameEngine.ts          # 权威游戏规则与模拟状态中心
    Physics.ts             # 弹道轨迹、拉弓力度计与掩体沉降重力模拟
    Collision.ts           # 连续碰撞检测 (CCD 射线扫掠防穿模) 与支撑力学
    Scheduler.ts           # 会话隔离的取消型任务调度器 (消除异步脏回调)
  systems/
    ProjectileSystem.ts    # 弹头特性与飞行管理
    ExplosionSystem.ts     # 动态半径伤害、王承书铀浓缩增幅与阵地殉爆
    AbilitySystem.ts       # 钱学森弹道滑翔 (双向支持)、二级点火与核装置布设
    ProgressionSystem.ts   # 科技树门控、发射架力度计算与无尽模式波次生成
  rendering/
    CanvasRenderer.ts      # High-DPI 视口渲染、预测弹道虚线与全粒子火光特效
  input/
    InputController.ts     # 统一 Pointer Events 捕获与防重复键盘事件
  ui/
    MainMenu.ts            # 主菜单 (开始闯关 / 课堂汇报 / 图鉴 / 设置)
    LevelSelection.ts      # 编年史历史关卡网格
    ScientistGallery.ts    # 9位功勋科学家图鉴与名言描述
    GameHUD.ts             # 战斗态信息仪表盘与阵地/弹药切换
    DialogManager.ts       # 关卡开场、结算与浮层通知
    PresentationMode.ts    # 课堂汇报教学演示模式
  data/
    levels.ts              # 14个真实历史关卡定义与障碍布局
    scientists.ts          # 9位功勋科学家档案与研学引用
    gameConfig.ts          # 全局物理常数、武器威力与视口参数
  persistence/
    SaveManager.ts         # V2 版本化存档系统与旧版 ldxy_* 格式平滑迁移
  types/
    game.ts                # 严格 TypeScript 实体与事件类型定义
  audio/
    SoundEffects.ts        # 纯前端 Web Audio API 实时合成音效
  styles/
    main.css               # 复古未来主义国防科研指挥中心专属样式
test/
  physics_and_collision.test.ts     # 轨迹模拟与扫掠碰撞防穿模单元测试
  abilities_and_submarine.test.ts   # 钱学森滑翔与潜射双向点火单元测试
  explosion_and_progression.test.ts # 爆炸杀伤、铀浓缩增益与科技树测试
  save_and_scheduler.test.ts        # 存档迁移与异步任务失效隔离测试
```

---

## 核心修复与现代化改进

### 1. 消除异步生命周期竞态与脏回调 (Problem 4.1)
原版使用孤立的 `setTimeout` 处理胜利结算、连锁殉爆和波次过渡，极易在玩家快速重开或切关卡时发生旧定时器修改新关卡状态的“幽灵结算”。
- **修复方案**：引入 `Scheduler` 调度系统，每一次关卡启动或重开均递增 `sessionId`，任何旧会话挂起的异步操作直接失效并被回收，彻底杜绝状态污染。

### 2. 连续碰撞检测 (CCD) 杜绝高速穿模 (Problem 4.2)
原版采用离散点检测，在弹丸高速下行或狭窄墙体阻隔时容易瞬移穿透掩体。
- **修复方案**：在 `Collision` 模块实现线段扫掠（Swept Segment vs AABB），在高速运动时计算首个碰撞接触点与时间标量 $t \in [0, 1]$，保障钻地弹穿透计算与普通弹爆破的绝对物理严谨。

### 3. 固定步长模拟循环 (Fixed-Timestep Accumulator, Problem 4.3)
游戏逻辑采用 120Hz 固定物理步长模拟（`GAME_CONFIG.FIXED_DELTA = 1/120`），与 `requestAnimationFrame` 渲染彻底解耦。即使在高刷屏（120Hz/144Hz）、普通 60Hz 屏幕或切到后台唤醒后，弹道物理曲线均保持严格一致。

### 4. 统一 Pointer Events 现代触控输入 (Problem 4.4)
统一整合鼠标、触屏与触控笔交互，具备 `setPointerCapture` 与 `pointercancel` 丢失保护，杜绝拖拽脱离画布引起的卡住发射；键盘按键加入 `e.repeat` 防重复触发校验。

### 5. 巨浪潜射阵地双向发射与滑翔修复 (Problem 4.5)
原版潜射阵地虽然允许向左射击，但钱学森弹道的滑翔逻辑硬编码为 $v_x > 0$，导致向左发射时技能失效甚至反向漂移。
- **修复方案**：`AbilitySystem` 计算速度方向符号 $\text{sign}(v_x)$，向左发射时滑翔与二级点火均沿左向运动轴冲刺，双向发射手感完全对称自然。

### 6. 平滑向下兼容的 V2 存档架构 (Problem 4.6)
自动探测并无缝读取旧版 `ldxy_progress` 与 `ldxy_sci` 数据并升级为版本化 schema。支持存档重置，并保证课堂汇报模式完全独立，绝不污染正常闯关进度。

### 7. 课堂汇报教学演示模式 (Section 6)
专为高校思政课汇报答辩打造，支持：
- 任意自由跳选 14 处重大国防科技历史节点
- 一键开启“全科技/全弹药装备就位”进行全方位战术功能展示
- 支持随时暂停、快速重演与纯净教学讲解

---

## 游戏操作指南

- **瞄准与发射**：在画布任意位置按住并向发射方向的反向拖拽拉弓，松开指针即刻发射（陆基向左下拖拽向右发射；潜射阵地可左右双向发射）。
- **钱学森弹道**：导弹飞行过程中，按下【空格键】或轻触屏幕，进入高超音速滑翔段，弹道压平、射程大增。
- **二级点火**：滑翔段飞行过程中，再次按下【空格键】或轻触屏幕，启动第二级火箭发动机，再次加速爬升冲刺。
- **定点试爆**：点击 HUD【部署核装置】，在右侧靶场地面点击架设铁塔试爆装置，适当时机点击【起爆】造成大范围爆破与连锁殉爆。
- **退出与重试**：【Esc】键或 HUD 按钮可随时返回菜单或快速重置试验。

---

## 本地开发与测试指令

```bash
# 安装依赖
npm install

# 启动本地开发服务器 (默认端口 3000)
npm run dev

# 静态类型严格检查 (Strict Mode)
npm run typecheck

# 运行自动化单元测试套件 (Vitest, 23 项关键力学测试)
npm run test

# 构建生产环境静态资源
npm run build

# 预览生产构建包
npm run preview
```
