// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
import { Injectable } from '@angular/core'
import { CloudSyncSettingsComponent } from 'components/cloud-sync-settings.component'
import { SettingsTabProvider } from 'terminus-settings'
import CloudSyncLang from './data/lang'
@Injectable()
export class SyncConfigSettingsTabProvider extends SettingsTabProvider {
    id = 'tabby-sync-kentxxq'
    icon = 'cogs'
    title = CloudSyncLang.trans('common.menu_title')

    getComponentType(): any {
        return CloudSyncSettingsComponent
    }
}
