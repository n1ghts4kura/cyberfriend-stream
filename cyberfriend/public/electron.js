// electron-builder react-cra 预设会寻找 build/electron.js 作为入口。
// CRA 构建时会把 public 下的该文件复制到 build/ 根目录，命名保持 electron.js。
// 这里直接转发到真正的主进程入口 electron-main.js。
require('../electron-main.js');
