import { Component, EventEmitter, OnInit, Output } from '@angular/core'
import CloudSyncSettingsData from '../../../data/setting-items'
import { AuthType, createClient } from 'webdav'
import Lang from '../../../data/lang'
import SettingsHelper from '../../../utils/settings-helper'
import { ConfigService, PlatformService } from 'terminus-core'
import { ToastrService } from 'ngx-toastr'
import CloudSyncLang from '../../../data/lang'
import Logger from '../../../utils/Logger'
import WebDav from '../../../utils/cloud-components/WebDav'

interface formData {
    host: string,
    port: string,
    username: string,
    password: string,
    location: string,
}

@Component({
    selector: 'webdav-settings',
    template: require('./webdav-settings.component.pug'),
    styles: [require('./webdav-settings.component.scss')],
})
export class CloudSyncWebDavSettingsComponent implements OnInit {
    @Output() resetFormMessages = new EventEmitter()
    @Output() setFormMessage = new EventEmitter()

    translate = CloudSyncLang
    presetData = CloudSyncSettingsData
    isPreloadingSavedConfig = true
    isSettingSaved = false
    isCheckLoginSuccess = false
    isFormProcessing = false
    isSyncingProgress = false

    form: formData = CloudSyncSettingsData.formData[CloudSyncSettingsData.values.WEBDAV] as formData

    constructor(private config: ConfigService, private platform: PlatformService, private toast: ToastrService) {

    }

    ngOnInit(): void {
        const configs = SettingsHelper.readConfigFile(this.platform)
        if (configs) {
            if (configs.adapter === this.presetData.values.WEBDAV) {
                this.form = configs.configs as formData
                this.isSettingSaved = true
            }
        }
        this.isPreloadingSavedConfig = false
    }

    async testConnection(): Promise<void> {
        const logger = new Logger(this.platform)
        this.resetFormMessages.emit()
        let isFormValidated = true
        for (const idx in this.form) {
            if (this.form[idx].trim() === '' && idx !== 'port') {
                this.setFormMessage.emit({
                    message: Lang.trans('form.error.required_all'),
                    type: 'error',
                })
                isFormValidated = false
                break
            }
        }

        if (isFormValidated) {
            const client = createClient(this.form.host + (this.form.port ? ':' + this.form.port : ''), {
                authType: AuthType.Password,
                username: this.form.username,
                password: this.form.password,
            })
            this.isFormProcessing = true
            if (this.form.location !== '/') {
                this.form.location = this.form.location.endsWith('/')
                    ? this.form.location.substr(0, this.form.location.length - 1)
                    : this.form.location
            }

            try {
                await client.putFileContents(this.form.location + 'test.txt', 'Test content', { overwrite: true }).then(() => {
                    this.isFormProcessing = false
                    this.isCheckLoginSuccess = true
                    this.setFormMessage.emit({
                        message: Lang.trans('sync.setting_valid'),
                        type: 'success',
                    })
                    client.deleteFile(this.form.location + 'test.txt')
                })
            } catch (e) {
                this.isFormProcessing = false
                this.setFormMessage.emit({
                    message: Lang.trans('sync.error_connection'),
                    type: 'error',
                })
                logger.log(CloudSyncLang.trans('log.error_test_connection') + ' | Exception: ' + e.toString(), 'error')
            }
        }
    }

    async saveSettings(): Promise<void> {
        this.resetFormMessages.emit()
        this.isFormProcessing = true
        SettingsHelper.saveSettingsToFile(this.platform, CloudSyncSettingsData.values.WEBDAV, this.form).then(result => {
            this.isFormProcessing = false
            if (!result) {
                this.setFormMessage.emit({
                    message: Lang.trans('settings.amazon.save_settings_failed'),
                    type: 'error',
                })
            } else {
                this.isSettingSaved = true
                this.setFormMessage.emit({
                    message: Lang.trans('settings.amazon.save_settings_success'),
                    type: 'success',
                })
                this.isSettingSaved = true
                SettingsHelper.syncWithCloud(this.config, this.platform, this.toast, true).then(async (result) => {
                    const resultCheck = typeof result === 'boolean' ? result : result['result']
                    if (resultCheck) {
                        this.config.requestRestart()
                    } else {
                        this.setFormMessage.emit({
                            message: typeof result !== 'boolean' && result['message'] ? result['message'] : Lang.trans('sync.sync_server_failed'),
                            type: 'error',
                        })
                        this.isSettingSaved = false
                        this.isCheckLoginSuccess = false
                        this.isPreloadingSavedConfig = false
                        await SettingsHelper.removeConfirmFile(this.platform, this.toast, false)
                    }
                    this.isSyncingProgress = false
                })
            }
        })
    }

    async uploadLocalSettings(): Promise<void> {
        this.resetFormMessages.emit()
        this.isFormProcessing = true
        SettingsHelper.saveSettingsToFile(this.platform, CloudSyncSettingsData.values.WEBDAV, this.form).then(result => {
            this.isFormProcessing = false
            if (!result) {
                this.setFormMessage.emit({
                    message: Lang.trans('settings.amazon.save_settings_failed') + ' 1',
                    type: 'error',
                })
            } else {
                this.isSettingSaved = true
                this.setFormMessage.emit({
                    message: Lang.trans('settings.amazon.save_settings_success'),
                    type: 'success',
                })
                this.isSettingSaved = true
                WebDav.syncLocalSettingsToCloud(this.platform, this.toast).then(async (result) => {
                    const resultCheck = typeof result === 'boolean' ? result : result['result']
                    if (resultCheck) {
                        this.config.requestRestart()
                    } else {
                        this.setFormMessage.emit({
                            message: (typeof result !== 'boolean' && result['message'] ? result['message'] : Lang.trans('sync.sync_server_failed')) + ' 2',
                            type: 'error',
                        })
                        this.isSettingSaved = false
                        this.isCheckLoginSuccess = false
                        this.isPreloadingSavedConfig = false
                        await SettingsHelper.removeConfirmFile(this.platform, this.toast, false)
                    }
                    this.isSyncingProgress = false
                })
            }
        })
    }

    cancelSaveSettings(): void {
        this.resetFormMessages.emit()
        this.isCheckLoginSuccess = false
    }

    async removeSavedSettings(): Promise<void> {
        this.resetFormMessages.emit()
        const result = await SettingsHelper.removeConfirmFile(this.platform, this.toast)
        if (result) {
            this.isSettingSaved = false
            this.isCheckLoginSuccess = false
            this.isPreloadingSavedConfig = false
            this.config.requestRestart()
        }
    }

    // 手动触发从云端同步到本地 (Manual sync from cloud to local)
    async manualSyncFromCloud(): Promise<void> {
        const logger = new Logger(this.platform)
        this.resetFormMessages.emit()
        this.isSyncingProgress = true
        logger.log('Manual sync triggered: Cloud to Local')
        try {
            await SettingsHelper.syncWithCloud(this.config, this.platform, this.toast, false).then((result) => {
                const resultCheck = typeof result === 'boolean' ? result : result['result']
                if (resultCheck) {
                    this.setFormMessage.emit({
                        message: 'Sync from cloud completed successfully.',
                        type: 'success',
                    })
                    logger.log('Manual sync from cloud completed successfully.')
                } else {
                    this.setFormMessage.emit({
                        message: typeof result !== 'boolean' && result['message'] ? result['message'] : 'Sync from cloud failed.',
                        type: 'error',
                    })
                    logger.log('Manual sync from cloud failed.', 'error')
                }
                this.isSyncingProgress = false
            })
        } catch (e) {
            this.isSyncingProgress = false
            this.setFormMessage.emit({
                message: 'Sync error: ' + e.toString(),
                type: 'error',
            })
            logger.log('Manual sync from cloud error: ' + e.toString(), 'error')
        }
    }

    // 手动触发从本地同步到云端 (Manual sync from local to cloud)
    async manualSyncToCloud(): Promise<void> {
        const logger = new Logger(this.platform)
        this.resetFormMessages.emit()
        this.isSyncingProgress = true
        logger.log('Manual sync triggered: Local to Cloud')
        try {
            await WebDav.syncLocalSettingsToCloud(this.platform, this.toast).then((result) => {
                if (result) {
                    this.setFormMessage.emit({
                        message: 'Local settings pushed to cloud successfully.',
                        type: 'success',
                    })
                    logger.log('Manual sync to cloud completed successfully.')
                } else {
                    this.setFormMessage.emit({
                        message: 'Push to cloud failed. Check logs for details.',
                        type: 'error',
                    })
                    logger.log('Manual sync to cloud failed.', 'error')
                }
                this.isSyncingProgress = false
            })
        } catch (e) {
            this.isSyncingProgress = false
            this.setFormMessage.emit({
                message: 'Sync error: ' + e.toString(),
                type: 'error',
            })
            logger.log('Manual sync to cloud error: ' + e.toString(), 'error')
        }
    }
}
