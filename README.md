# cyberfriend-stream

基于 Live2D Cubism + React + Vite + Electron 的最小整合示例。仓库中不直接提交官方 Cubism Framework 源码，只保留极薄的封装与指引文件；使用者需自行下载官方 SDK 放入指定目录后再运行。

## 快速开始（Quick Start）

1. 克隆并安装依赖：
	```bash
	npm install
	```
2. 前往 Live2D 官网（登录）下载 Cubism Web SDK（包含 Framework TypeScript 源码 与 Core 脚本）。
3. 将 SDK 中的 Framework 源码复制到 `src/live2d/framework/` 下，使该目录包含 `model/`, `motion/`, `physics/`, `rendering/`, `effect/`, `math/`, `utils/`, `type/` 等文件夹以及根部若干 `cubism*.ts`、`live2dcubismframework.ts`。
	- 不要覆盖本仓库已有的封装文件：`frameworkEntry.js`, `bootCubism.js`, `live2dcubismframework.js`, `NO_STUB_README.md`。
4. 将模型资源放入 `public/live2d/models/<你的模型>`，例如：`public/live2d/models/Haru/Haru.model3.json`。
5. 将 Core 脚本放入 `public/live2d/core/`（文件名常见：`live2dcubismcore.min.js`；加载器内含多候选名称）。
6. 启动开发：
	```bash
	npm run dev
	```
7. 启动带 Electron 的开发窗口（如已配置）：
	```bash
	npm run dev:electron
	```

## 封装文件说明
| 文件 | 作用 |
| ---- | ---- |
| `src/live2d/framework/frameworkEntry.js` | 聚合少量核心类，业务侧集中引用 |
| `src/live2d/framework/bootCubism.js` | CubismFramework 启动与初始化的幂等封装 |
| `src/live2d/framework/live2dcubismframework.js` | re-export stub：让无扩展导入指向 TS 源 |
| `src/live2d/framework/NO_STUB_README.md` | 放置官方源码的中文说明 |

## 模型目录结构示例
```
public/live2d/
  core/
	 live2dcubismcore.min.js
  models/
	 Haru/
		Haru.model3.json
		Haru.moc3
		textures/
		  texture_00.png
```

## 升级 / 替换 SDK 流程
1. 删除 `src/live2d/framework/` 中官方源码（保留 4 个封装文件）。
2. 拷贝新版本官方源码进去。
3. 运行 `npm run dev`，观察控制台是否出现接口变动或弃用告警。

## 常见问题 (FAQ)
**Q: 启动时报 404 找不到 live2dcubismcore.min.js？**  
确认已将 Core 脚本放到 `public/live2d/core/` 且文件名与大小写匹配；加载器会尝试大小写 / min / 非 min 多种组合。

**Q: 模型显示比例异常或被压扁？**  
检查我们组件的投影逻辑是否被修改；默认进行了 contain-fit + 设备像素比处理。

**Q: 可以把官方源码改成 npm 依赖吗？**  
可以，将其发布到私有源或者使用 git submodule，然后把当前忽略策略去掉并更新 README 指引。

## 许可证说明
Live2D Cubism SDK 版权所有 © Live2D Inc. 使用需遵守其官方许可协议。本仓库仅分发自定义封装代码与集成示例，不包含官方框架源码或模型资产。

---
若需要自动校验官方文件完整性、添加动作/物理/交互示例，可在 Issue 或后续需求中提出。

