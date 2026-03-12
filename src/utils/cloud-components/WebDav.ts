// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
import { AuthType, createClient } from 'webdav'
import CloudSyncSettingsData from '../../data/setting-items'
import SettingsHelper from '../settings-helper'
import { ConfigService, PlatformService } from 'terminus-core'
import * as yaml from 'js-yaml'
import { ToastrService } from 'ngx-toastr'
import CloudSyncLang from '../../data/lang'
import Logger from '../../utils/Logger'
import path from 'path'
import fs from 'fs'
import moment from 'moment'

let isSyncingInProgress = false
class WebDav {
    async sync(config: ConfigService, platform: PlatformService, toast: ToastrService, params, firstInit = false) {
        const logger = new Logger(platform)
        const result = { result: false, message: '' }
        const client = WebDav.createClient(params)
        const remoteFile = WebDav.getRemoteFilePath(params.location)
        let remoteSyncConfigUpdatedAt = null
        let isAbleToLoadRemoteContent = false

        try {
            await client.stat(remoteFile).then(async (fileStats: any) => {
                isAbleToLoadRemoteContent = true
                if (fileStats?.lastmod) {
                    remoteSyncConfigUpdatedAt = moment(fileStats.lastmod)
                }
                await client.getFileContents(remoteFile, { format: 'text' }).then(async (content: string) => {
                    try {
                        yaml.load(content)
                        if (firstInit) {
                            if ((await platform.showMessageBox({
                                type: 'warning',
                                message: CloudSyncLang.trans('sync.sync_confirmation'),
                                buttons: [CloudSyncLang.trans('buttons.sync_from_cloud'), CloudSyncLang.trans('buttons.sync_from_local')],
                                defaultId: 0,
                            })).response === 1) {
                                await client.putFileContents(remoteFile, SettingsHelper.readTabbyConfigFile(platform, true, true), { overwrite: true })
                                result['result'] = true
                            } else {
                                if (SettingsHelper.verifyServerConfigIsValid(content)) {
                                    await SettingsHelper.backupTabbyConfigFile(platform)
                                    config.writeRaw(SettingsHelper.doDescryption(content))
                                    result['result'] = true
                                } else {
                                    result['result'] = false
                                    result['message'] = CloudSyncLang.trans('common.errors.invalidServerConfig')
                                }
                            }
                        } else {
                            const filePath = path.join(path.dirname(platform.getConfigPath()), CloudSyncSettingsData.tabbySettingsFilename)
                            let localFileUpdatedAt = null
                            try {
                                // 使用 statSync 替代回调版 fs.stat，确保同步逻辑正确执行
                                const stats = fs.statSync(filePath)
                                localFileUpdatedAt = moment(stats.mtime)
                                logger.log('Auto Sync WebDav')
                                logger.log('Remote file: ' + remoteFile)
                                logger.log('Server Updated At ' + (remoteSyncConfigUpdatedAt ? remoteSyncConfigUpdatedAt.format('YYYY-MM-DD HH:mm:ss') : null))
                                logger.log('Local Updated At ' + localFileUpdatedAt.format('YYYY-MM-DD HH:mm:ss'))

                                if (remoteSyncConfigUpdatedAt && remoteSyncConfigUpdatedAt > localFileUpdatedAt) {
                                    logger.log('Sync direction: Cloud to local.')
                                    config.writeRaw(SettingsHelper.doDescryption(content))
                                } else {
                                    logger.log('Sync direction: Local To Cloud.')
                                    await this.syncLocalSettingsToCloud(platform, toast)
                                }
                            } catch (statErr) {
                                logger.log('Error reading local config file: ' + statErr.toString(), 'error')
                            }
                            result['result'] = true
                        }
                    } catch (e) {
                        result['result'] = false
                        result['message'] = e.toString()
                        toast.error(CloudSyncLang.trans('sync.error_invalid_setting'))
                        await client.moveFile(remoteFile, remoteFile + '_bk' + new Date().getTime())
                        await client.putFileContents(remoteFile, SettingsHelper.readTabbyConfigFile(platform, true, true), { overwrite: true })
                        logger.log(CloudSyncLang.trans('log.read_cloud_settings') + ' | Exception: ' + e.toString(), 'error')
                    }
                })
            })
        } catch (e) {
            logger.log(CloudSyncLang.trans('log.read_cloud_settings') + ' | Remote file: ' + remoteFile + ' | Exception: ' + e.toString())
            if (!firstInit) {
                // 自动同步时，远程文件不可达则静默跳过，等待下次同步周期重试（auto sync: skip silently, retry next cycle）
                logger.log('Auto sync: remote file unreachable, will retry next cycle.')
                return result
            }
            try {
                await client.putFileContents(remoteFile, SettingsHelper.readTabbyConfigFile(platform, true, true), { overwrite: true })
                isAbleToLoadRemoteContent = true
                result['result'] = true
                logger.log('Local config uploaded to cloud successfully after stat failure.')
            } catch (exception) {
                logger.log(CloudSyncLang.trans('log.error_upload_settings') + ' | Exception: ' + exception.toString(), 'error')
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!isAbleToLoadRemoteContent) {
            if (firstInit) {
                // 仅首次初始化时弹窗询问用户（only prompt user during first init）
                if ((await platform.showMessageBox({
                    type: 'warning',
                    message: 'Seem to be server has no file or the setting file is corrupted. Do you want to push local file to the cloud?',
                    buttons: ['Cancel', 'Yes'],
                    defaultId: 0,
                })).response === 1) {
                    await client.putFileContents(remoteFile, SettingsHelper.readTabbyConfigFile(platform, true, true), { overwrite: true })
                    result['result'] = true
                }
            } else {
                // 自动同步时静默跳过，等待下次周期重试（auto sync: skip silently, retry next cycle）
                logger.log('Auto sync: unable to load remote content, will retry next cycle.')
            }
        }
        return result
    }

    async syncLocalSettingsToCloud(platform: PlatformService, toast: ToastrService) {
        const logger = new Logger(platform)
        if (!isSyncingInProgress) {
            isSyncingInProgress = true

            const savedConfigs = SettingsHelper.readConfigFile(platform)
            const params = savedConfigs.configs
            const remoteFile = WebDav.getRemoteFilePath(params.location)
            const client = WebDav.createClient(params)

            try {
                await client.putFileContents(remoteFile, SettingsHelper.readTabbyConfigFile(platform, true, true), { overwrite: true }).then(() => {
                    logger.log(CloudSyncLang.trans('sync.sync_success'))
                })
                return true
            } catch (e) {
                logger.log(CloudSyncLang.trans('log.error_upload_settings') + ' | Exception: ' + e.toString(), 'error')
                toast.error(CloudSyncLang.trans('sync.sync_error'))
            } finally {
                // 确保锁一定被释放，无论成功还是失败 (ensure lock is always released)
                isSyncingInProgress = false
            }
        } else {
            logger.log('Sync to cloud skipped: another sync is already in progress.')
        }

        return false
    }

    private static createClient(params) {
        return createClient(WebDav.normalizeBaseURL(params.host, params.port), {
            authType: AuthType.Password,
            username: params.username,
            password: params.password,
        })
    }

    private static normalizeBaseURL(host: string, port: string): string {
        let rawHost = (host || '').trim()
        if (!/^https?:\/\//i.test(rawHost)) {
            rawHost = 'https://' + rawHost
        }

        try {
            const parsed = new URL(rawHost)
            if (port && port.trim()) {
                parsed.port = port.trim()
            }
            return parsed.toString().replace(/\/$/, '')
        } catch {
            return rawHost + (port ? ':' + port : '')
        }
    }

    private static getRemoteFilePath(location: string): string {
        return (location || '').trim() + CloudSyncSettingsData.cloudSettingsFilename
    }
}
export default new WebDav()
