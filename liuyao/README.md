# 六爻 · 纳甲排盘

提供中文响应式网页和 Electron 桌面窗口，共享同一套 JavaScript 起卦与排盘逻辑。当前版本不包含 Android/iOS 原生工程；手机可使用响应式网页访问。

## 开发运行

需要 Node.js 20 或更高版本。

```powershell
npm.cmd install
npm.cmd start
```

访问 `http://127.0.0.1:4173`，首页提供“网页版使用”和“下载 Windows 安装包”两个入口。下载前需先运行 `npm.cmd run package` 生成 `release` 下的安装程序；部署到服务器时需同时部署 Node 服务与安装包文件。网页版也可在支持 PWA 的浏览器中安装到桌面，安装后直接打开排盘页。

## 桌面应用

```powershell
npm.cmd install
npm.cmd run desktop
```

打包当前操作系统的安装包：

```powershell
npm.cmd run package
```

Windows 安装包位于 `release/六爻排盘-安装程序-1.0.0-x64.exe`，采用安装向导，可选安装位置并创建桌面与开始菜单快捷方式；卸载时会保留本机排盘记录。Windows、macOS、Linux 安装包使用 electron-builder 配置分别构建；macOS 构建需要 macOS/Xcode 环境，当前工作区为 Windows。

## 起卦及规则边界

- 手动输入六爻值：6 老阴、7 少阳、8 少阴、9 老阳，顺序自下而上。
- 铜钱模拟按每枚反面 2、正面 3，连续模拟六次；老阴、老阳为动爻。
- 默认按通用京房纳甲映射生成本卦、变卦、八宫、世应、伏神、纳甲干支与六亲。
- 出生年月日仅作为求测者资料保存，不会被当作起卦日干支；由于没有输入起卦日历数据，界面不排六神、旬空及月令旺衰。
- 起卦后会分项说明卦象、动爻、世应、六亲和伏神；具体用神需结合所问及流派判断，说明不作确定性预测。
- 排盘记录保存在当前浏览器/Electron 本机存储，不上传服务端。

## 验证

```powershell
npm.cmd test
```
