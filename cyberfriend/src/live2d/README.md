# Live2D 集成占位说明

此目录用于放置 Live2D Cubism Web SDK 相关代码与模型资源。

结构建议：
```
live2d/
  core/                # 放 cubismCore.js / cubismCore.wasm （官方 SDK Core）
  framework/           # 可放裁剪后的 Framework 源码（若不走 CDN / npm）
  models/              # 每个模型一个子目录，内含 model3.json、motions、expressions、textures 等
  loader/              # 模型加载与资源管理
  components/          # React 组件封装（Live2DCanvas）
  utils/               # 工具（矩阵、坐标换算、日志）
```

> 版权提示：请自行从官方 Cubism SDK for Web 下载并放入 `core/` 与 `framework/`，不要直接把官方源码 commit 到公共仓库（关注其许可证约束）。

后续放置：
- `models/Demo/model3.json` 示例模型（待你提供）
- 若需多模型切换，可在 `ModelRegistry` 中维护清单。
