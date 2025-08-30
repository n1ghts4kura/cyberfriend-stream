此目录用于放置官方 Live2D Cubism Web Framework 的 TypeScript 源码。

仓库不直接提交官方源码：
* 遵守官方许可，避免再分发疑义。
* 减少升级 SDK 时的大量 diff 噪音。

获取方式：
1. 登录 Live2D 官方网站下载 Cubism Web SDK。 
2. 解压后找到 Framework 源码（通常在 `Framework/src`）及 Core 脚本。
3. 仅复制以下内容到本目录：各子文件夹（`effect`, `math`, `model`, `motion`, `physics`, `rendering`, `type`, `utils`）以及根部所有 `*.ts` 文件（含 `live2dcubismframework.ts`）。
4. 确认根部存在 `live2dcubismframework.ts`；我们提供的 `live2dcubismframework.js` 只是一个 `export *` 的桥接文件。
5. 不要修改官方源文件，所有自定义逻辑放在：`frameworkEntry.js`, `bootCubism.js`。

升级 SDK：
1. 删除（或备份）当前官方源码文件，但保留上述 4 个自定义封装文件。
2. 拷贝新的官方源码进来。
3. 运行 `npm run dev`，检查控制台是否有 API 变动或错误。

注意：如果再次放入与官方同名的额外 JS 占位文件，可能会遮蔽真实 TS 实现导致符号缺失，请避免。
