import type FiresyncPlugin from '$/main'
import { setSyncTime } from '$/services/synctime.service'
import ignore from 'ignore'
import { PluginSettingTab, setIcon, Setting, ToggleComponent } from 'obsidian'

async function display(view: SettingsTabView) {
  const { containerEl, plugin } = view

  const h2 = (icon: string, text: string) => {
    const h2 = containerEl.createEl('h2', {
      attr: {
        style: [
          'margin: var(--size-4-4) 0',
          'display: flex',
          'align-items: center',
          'gap: var(--size-2-2)',
        ].join('; '),
      },
    })
    setIcon(h2, icon)
    h2.append(text)
  }

  containerEl.empty()

  h2('flame', 'Firebase Projects')

  new Setting(containerEl)
    .setName('API Key')
    .setDesc('*REQUIRED* Your firebase project API key.')
    .addText(text =>
      text
        .setPlaceholder('firebaseprojectapikey')
        .setValue(plugin.settings.apiKey)
        .onChange(async value => {
          await plugin.saveSettings({ apiKey: value })
        })
    )

  new Setting(containerEl)
    .setName('Auth Domain')
    .setDesc('*REQUIRED* Your firebase project auth domain.')
    .addText(text =>
      text
        .setPlaceholder('yourproject.firebaseapp.com')
        .setValue(plugin.settings.authDomain)
        .onChange(async value => {
          await plugin.saveSettings({ authDomain: value })
        })
    )

  new Setting(containerEl)
    .setName('Project ID')
    .setDesc('*REQUIRED* Your firebase project ID.')
    .addText(text =>
      text
        .setPlaceholder('your-project-id')
        .setValue(plugin.settings.projectId)
        .onChange(async value => {
          await plugin.saveSettings({ projectId: value })
        })
    )

  new Setting(containerEl)
    .setName('Storage Bucket')
    .setDesc('*REQUIRED* Your firebase storage bucket.')
    .addText(text =>
      text
        .setPlaceholder('yourproject.appspot.com')
        .setValue(plugin.settings.storageBucket)
        .onChange(async value => {
          await plugin.saveSettings({ storageBucket: value })
        })
    )

  new Setting(containerEl)
    .setName('App Id')
    .setDesc('*REQUIRED* Your firebase app ID.')
    .addText(text =>
      text
        .setPlaceholder('yourfirebaseappid')
        .setValue(plugin.settings.appId)
        .onChange(async value => {
          await plugin.saveSettings({ appId: value })
        })
    )

  h2('user', 'Firebase Authentication')

  new Setting(containerEl)
    .setName('Email')
    .setDesc('*REQUIRED* Your email account for the firebase authentication.')
    .addText(text =>
      text
        .setPlaceholder('you@example.com')
        .setValue(plugin.settings.email)
        .onChange(async value => {
          await plugin.saveSettings({ email: value })
        })
    )

  new Setting(containerEl)
    .setName('Password')
    .setDesc('*REQUIRED* Your password for the firebase authentication.')
    .addText(text =>
      text
        .setPlaceholder('xxxxxxxxxxxxxxxxxxxx')
        .setValue(plugin.settings.password)
        .onChange(async value => {
          await plugin.saveSettings({ password: value })
        })
    )

  h2('upload-cloud', 'Synchronization')

  let syncToggle: ToggleComponent

  new Setting(containerEl)
    .setName('Sync Files & Folders')
    .setDesc('Sync your vault with your firebase project.')
    .addToggle(toggle => {
      syncToggle = toggle
      toggle.setValue(plugin.settings.sync)
      toggle.onChange(async sync => {
        await plugin.saveSettings({ sync })

        if (sync) {
          await plugin.doStart()
        } else {
          plugin.doStop()
        }
      })
    })

  new Setting(containerEl)
    .setName('Sync Internal Files & Folders')
    .setDesc('Sync .obsidian folder and its files.')
    .addToggle(toggle => {
      toggle.setValue(plugin.settings.internal)
      toggle.onChange(async internal => {
        await plugin.saveSettings({ internal })

        if (plugin.settings.sync) {
          await plugin.doStart()
        } else {
          plugin.doStop()
        }
      })
    })

  new Setting(containerEl)
    .setName('Reset Last Sync Time')
    .setDesc('Reset last sync time. Please enable sync switch above after updating this setting.')
    .addButton(button => {
      button.setButtonText('Reset')
      button.onClick(async () => {
        setSyncTime(0)
        syncToggle.setValue(false)
      })
    })

  h2('bug', 'Advanced')

  new Setting(containerEl)
    .setName('Debounce')
    .setDesc('Set debounce time in milliseconds to prevent frequent file synchronization.')
    .addSlider(slider => {
      slider
        .setDynamicTooltip()
        .setLimits(0, 10000, 100)
        .setValue(plugin.settings.debounce)
        .onChange(async value => {
          await plugin.saveSettings({ debounce: value })
        })
    })

  new Setting(containerEl)
    .setName('Ignored File Patterns')
    .setDesc(
      'Specify files not to be synchronized in ".gitignore" file format. Please enable sync switch above after updating this setting.'
    )
    .addTextArea(text => {
      text.setValue('')
      text.setValue(plugin.settings.ignores)
      text.onChange(async ignores => {
        await plugin.saveSettings({ ignores })
        syncToggle.setValue(false)
      })
    })

  new Setting(containerEl)
    .setName('Debug Mode')
    .setDesc('Enable debug mode. Please disable and re-enable this plugin to take effect.')
    .addToggle(toggle => {
      toggle.setValue(plugin.settings.debug).onChange(async value => {
        await plugin.saveSettings({ debug: value })
      })
    })
}

export class SettingsTabView extends PluginSettingTab {
  constructor(public plugin: FiresyncPlugin) {
    super(app, plugin)
  }

  async display(): Promise<void> {
    await display(this)
  }
}
