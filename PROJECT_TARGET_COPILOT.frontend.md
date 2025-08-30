# PROJECT_TARGET_COPILOT

此文件记录当前已确认的项目高层共识（供 AI / 开发同步使用）。

更新时间: 2025-08-30

## 1. 核心目标 (已确认)
构建一个可被后端实时事件（WebSocket）驱动的 Live2D 展示层；后端通过统一协议触发表情 / 动作 / 姿势 / 参数 / 音频口型与资源预载，不需理解 Cubism 细节。

## 2. 分层架构 (已确认：当前阶段实施 1~5 层，6~10 占位)
必做层:
- Transport: WebSocket 连接、心跳（简化版）、重连策略（可先固定间隔）。
- Protocol: 事件解析 + 基础字段校验（暂不引入完整 JSON Schema）。
- State & Scheduling: 维护当前动作/表情/Idle 状态与简单优先级 (Force > Normal > Idle)。
- Live2D 抽象: 封装模型加载 / 资源解析 / 参数写入。
- Resource 管理(精简): 按需加载 + 简单内存缓存 Map。

占位层 (记录，暂不复杂实现):
- Playback Engine: 使用现有 rAF 循环，后续才加入多轨淡入/混合。
- Extension Hooks: 预留 on/off 接口（可返回未实现 warning）。
- UI & React: 现有 Canvas 组件即可，Debug Overlay 延后。
- Security: 仅事件类型白名单，速率/鉴权延后。
- Config & Version: 固定 protocolVersion=1，capabilities 仅返回 { motions:true } 等占位。

## 3. 前端内部 API 范围 (未确认)
说明：仅提出初步候选；除 initLive2D 名称外尚未正式确认任何接口签名或收敛范围。

## 4. WebSocket 事件类型（初始子集）(未确认)
计划先支持：
- system.hello (可选)
- model.load
- motion.play
- param.set
- expression.set (可选，若模型有表情)
- ping/pong (保持连接)

其余事件（speech.play / pose.set / expression.clear / error.report）放入 backlog。

## 5. 优先级策略 (未确认)
描述当前是建议草案，尚未正式确认采用。
- 层级: Force > Normal > Idle。
- 新 Force 始终打断；Normal 互相打断；Idle 仅在无其它动作时轮播。
- 表情暂不做多层混合，仅覆盖或最后一次为准（后续升级为权重混合）。

## 6. 资源策略 (未确认)
- 模型加载一次缓存。
- Motion/Expression 按需拉取并缓存在 Map。
- 不实现过期与 LRU；记录 TODO。

## 7. 更新循环 (未确认)
- 单一 rAF：deltaTime → (若有播放中的 motion) 推进 → 写参数 → draw。
- 不实现淡入/口型同步/多轨混合（TODO 标记）。

## 8. 错误处理 (未确认)
- 统一 prefix: [L2D]。
- 分类最少: LOAD_ERROR / PROTOCOL_ERROR / RUNTIME_ERROR。
- 暂不回传后端 ack；仅控制台输出 + 可选 hook。

## 9. 非功能性目标 (未确认)
- 60fps 目标；首次模型加载 < 1s（网络正常情况下）。
- 最小内存分配重复利用（后续再优化）。
- 代码模块化，独立测试点: protocol 解析 / state 调度 / motion 播放。

## 10. Milestones (未确认)
M1 (当前进行): init + model.load + motion.play + idle 基础 + param.set + WebSocket 连接。
M2 (下个阶段): expression.set + 优先级打断细化 + motion 淡入淡出。
M3: speech.play + 口型同步。
M4: 预加载接口 + debug overlay + 错误上报（后端）。
M5: schema 校验 + 重连退避 + 事件白名单强化。
M6: 多模型 + 插件钩子 + 混合权重系统。

## 11. Backlog & TODO 标记 (未确认)
- Motion 淡入淡出与多轨混合。
- 表情权重叠加与渐变。
- 口型同步（音频幅度采样）。
- 资源预加载批量接口。
- Debug overlay / Inspector。
- JSON Schema 验证与版本协商。
- 速率限制 & 安全白名单强化。
- 多模型支持与插件系统。

## 12. Open Questions (未确认 / 待讨论)
Q1 音频采用 URL 还是传输 Base64？
Q2 是否需要鉴权 token？
Q3 初期是否只支持单模型？ (默认: 是)
Q4 是否需要事件执行结果回执？
Q5 后端是否会提供资源 CDN 基础路径？

## 13. 约束/假设 (未确认)
- 单模型场景。
- 后端发送 JSON 文本 Frame。
- Motion 与 Expression 资源可通过 HTTP(s) GET。
- 没有 DRM/鉴权限制（后续再加）。

---
后续修改：在本文件追加“Revision”段，注明日期 + 变更摘要。