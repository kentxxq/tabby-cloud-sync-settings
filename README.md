# Tabby Sync Cloud Settings (Fork)

本项目是 [niceit/tabby-cloud-sync-settings](https://github.com/niceit/tabby-cloud-sync-settings) 的 fork 版本。

### 为什么会有这个 fork？

由于原仓库的 WebDAV 同步功能存在问题，本项目对其进行了修复，以确保在 Tabby 中能正常同步配置。

## 如何安装 (Installation)

由于本插件已发布至 npm，你可以直接在 Tabby 内部进行安装：

1. 打开 Tabby 终端。
2. 进入 **Settings (设置)** -> **Plugins (插件)**。
3. 在搜索框中输入 `kentxxq` 或 `tabby-sync-kentxxq`。
4. 找到 **tabby-sync-kentxxq** 并点击 **Install (安装)**。
5. 重启 Tabby 以使插件生效。

> [!IMPORTANT]
> **使用建议与注意事项**：
> 1. **配置独立性**：本插件使用的配置字段与原版不同，**不会读取** `terminus-cloud-settings-sync` 的既有配置。你需要重新配置一次 WebDAV 等服务。
> 2. **停用原版**：建议在启用本插件前，先手动**停用/禁用**原有的 `terminus-cloud-settings-sync` 插件，以确保功能正常且互不干扰。
> 3. **版本号说明**：本插件目前设定为 `1.6.6` 版本，旨在确保能覆盖原版的同时，避免由于版本低于原版而弹出的更新提醒。如果原作者后续重新积极维护并修复了 WebDAV 问题，我们可能会考虑关闭版本检查功能或建议用户迁回。
> 4. **关于 PR**：本项目主要是基于辅助编码（AI coding）快速修复问题的产物，未经深度重构和长时间调研，因此暂时不打算向原仓库提交 Pull Request。

---

### Plugin for Tabby SSH https://github.com/Eugeny/tabby

<p align="center">
  <a href="https://github.com/kentxxq/tabby-cloud-sync-settings"><img alt="GitHub" src="https://img.shields.io/github/license/kentxxq/tabby-cloud-sync-settings"></a>
  <img alt="GitHub stars" src="https://img.shields.io/github/stars/kentxxq/tabby-cloud-sync-settings">
</p>

使用此插件，您可以跨设备自动同步您的设置（包括保存的 SSH 会话）。

Current platforms supported: **MacOS** **Windows** **Linux**

This plugin is **FREE** of use under public license MIT.


# Change logs

----

Keep tracking of version release change logs

## [v1.6.9] - 2026-03-06

### 变更 (Changes)
- 简化 README 内容，移除原项目的截图、云服务展示及捐赠链接。
- 优化 Taskfile.yml 任务日志输出。

## [v1.6.8] - 2026-03-06

### 修复 (Fixes)
- 修复 `syncLocalSettingsToCloud` 中 `isSyncingInProgress` 锁不释放的 bug，使用 `try/finally` 确保锁一定被释放。
- 当同步被跳过时（锁未释放），增加日志输出，方便排查问题。
- 修复自动同步定时器异常中断后不再恢复的问题，确保同步周期连续运行。
- 优化远程文件不存在时的处理逻辑，自动上传本地配置到云端而非弹出错误提示。

### 新增 (Features)
- 新增 Taskfile.yml 构建配置，支持 `task build` / `task publish` 等快捷命令。

## [v1.6.7] - 2026-03-05

- 升级版本号并更新 README.md 中的安装指南与注意事项。

## [v1.6.6] - 2026-03-05

### 修复 (Fixes)
- **修复 WebDAV 同步核心 bug**：将 `fs.stat` 回调方式替换为 `fs.statSync`，解决异步逻辑导致同步操作实际未执行的问题（对应 [issue #69](https://github.com/niceit/tabby-cloud-sync-settings/issues/69)）。
- 修复 `isAbleToLoadRemoteContent` 误判逻辑，避免上传成功后仍弹出 "server has no file or the setting file is corrupted" 错误提示。
- 替换 `node-sass` 为 `sass` (Dart Sass)，修复 macOS Apple Silicon (arm64) 上无法编译的问题。
- 降级 `webpack` 至 `5.88.2`，修复 `CompatibilityPlugin` 解析错误。
- 新增 `.npmrc` 配置 `shamefully-hoist=true`，兼容 pnpm 的依赖提升。

### 新增 (Features)
- 插件重命名为 `tabby-sync-kentxxq`，独立配置文件避免与原版冲突。
- 新增手动同步按钮：支持从设置页面手动触发 "Sync from Cloud" 和 "Sync to Cloud"。
- 增强 WebDAV 同步过程的日志输出，方便调试排查。

### 变更 (Changes)
- 配置文件名更新为 `tabby-sync-kentxxq-settings.json` / `tabby-sync-kentxxq-cloud.json`。
- 菜单标题更新为 "Tabby Sync (kentxxq)"。


## [v1.6.5] - 2024-10-14

- Dropbox official supported.
- Plugin logs supported.
- Optimize the sync feature.
- Fix known bugs
- UI Adjustments according to Tabby newer version.


## [v1.6.0] - 2023-02-17

- Fix WebDav init sync issue.
- Improve self checking for update.
- Add support for rollback to previous version.
- Sponsor list added.
- Minor bug fixes.

## [v1.5.2] - 2022-11-19

- Add custom config for setting interval syncing time.
- Added Check for update tab.
- Support check for update and inline update for the plugin.
- Minor bug fixes.

## [v1.5.1] - 2022-08-16

- Inline Feedback, change logs, donate button, and more.
- Improve UI for better user experience.
- Minor fixes and bugs.

## [v1.5.0] - 2022-07-17

- Official support for **S3 Compatibility Minio, and others...**
- Minor fixes and bugs.

## [v1.4.3] - ...

- Minor fixes and bugs.

## [v1.4.0] - 2022-05-22

- Auto sync support (Detect sync settings from other machine from cloud).
- Critical bugs fix.
- Minor fixes and bugs.

## [v1.3.0] - 2021-12-21

- Support FTP / FTPs Port setting
- Add support for Gists (GitHub, GitLab)
- Backup the Tabby settings for first time sync.
- Minor fixes and bugs.

## [v1.2.2] - 2021-08-24

## Added

- Add support for [Blackblaze B2 Storage](https://www.backblaze.com/b2/cloud-storage.html).

## [v1.2.1] - 2021-08-21

## Added

- Add support for [Digital Ocean Space](https://www.digitalocean.com/products/spaces/).

## [v1.2.0] - 2021-08-19

## Added

- Add support for [Wasabi Cloud Storage](https://wasabi.com/).

## [v1.1.3] - 2021-08-14

### Fixes

- Add logger.
- Minor fixes and bugs.

## [v1.0.2] - 2021-08-07

### Fixes

- Optimize for security setting file encryption.
- Fixing bugs.

## [v1.0.0] - 2021-08-01

### Added

- Initial the plugin package
- Added Support for Amazon S3, FTP, WebDav
