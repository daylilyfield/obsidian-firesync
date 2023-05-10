import { getLogger, setVerbose } from '$/logging/logger'
import { createEventQueue, type EventQueue } from '$/stores/eventqueue.store'
import {
  authenticate,
  canAuthenticate,
  canInitializeFirebase,
  initializeFirebase,
} from '$/services/firebase.service'
import { getSyncTime, setSyncTime } from '$/services/synctime.service'
import { showNotice } from '$/views/notice'
import { Plugin, TFile } from 'obsidian'
import { onVaultCreate, onVaultModify, setUpVaultListeners } from '$/listeners/vault.listener'
import { onFirebaseChanged, setUpFirebaseListeners } from '$/listeners/firebase.listener'
import { SettingsTabView } from '$/views/settingstab.view'
import type { InternalFile } from '$/models/vault.model'
import type { Context } from '$/models/context.model'
import { setUpLocalHandlers } from '$/handlers/local.handler'
import type { Unsubscriber } from 'svelte/store'
import { SyncStatusView, viewTypeStatus } from '$/views/syncstatus.view'
import { setUpRemoteHandlers } from '$/handlers/remote.handler'
import { defaultSettings, type Settings } from '$/models/settings.model'
import { findSyncFilesAfter } from '$/services/firestore.service'
import type { SyncTime } from '$/models/synctime.model'
import {
  applyVaultId,
  findInternalFilesAfter,
  findVaultFilesAfter,
  generateVaultId,
  isInternalPath,
} from '$/services/vault.service'
import { binarySearch } from '$/utils/binsearch'
import type { ObsidianContext } from '$/models/obsidian.model'

const { debug } = getLogger('main')

async function main(
  plugin: FiresyncPlugin,
  queue: EventQueue,
  settings: Settings
): Promise<Unsubscriber[]> {
  setVerbose(settings.debug)

  if (!settings.sync) {
    debug('synchronization settings:', settings.sync)
    return []
  }

  if (!canInitializeFirebase(settings)) {
    debug('missing firebase settings:', settings)
    showNotice('Firebase settings missing or invalid.')
    return []
  }

  if (!canAuthenticate(settings)) {
    debug('missing or invalid authentication settings:', settings)
    showNotice('Authentication settings missing or invalid.')
    return []
  }

  const unauthenticated = await initializeFirebase(settings)
  const firebase = await authenticate(unauthenticated, settings)
  const vault = plugin.app.vault

  applyVaultId(vault, await generateVaultId(vault))

  const obsidian: ObsidianContext = {
    plugin,
    app: plugin.app,
    vault,
  }

  const context: Context = {
    plugin,
    obsidian,
    firebase,
  }

  let syncTime = getSyncTime()

  const unsubscribers = [setUpLocalHandlers(context, queue), setUpRemoteHandlers(context, queue)]

  if (syncTime === 0) {
    debug('start to sync: firsttime')
    syncTime = await syncFirstTime(context, queue)
  } else {
    debug('start to sync: startup')
    syncTime = await syncOnStartUp(context, queue, syncTime)
  }

  setSyncTime(syncTime)

  return [
    ...unsubscribers,
    setUpVaultListeners(context, queue),
    setUpFirebaseListeners(context, queue),
  ]
}

async function syncFirstTime(context: Context, queue: EventQueue): Promise<SyncTime> {
  const { internal } = context.plugin.settings

  const remotes = (await findSyncFilesAfter(context, 0)).filter(
    file => internal || !isInternalPath(context, file.path)
  )
  const files = findVaultFilesAfter(context, 0)
  const internals = internal ? await findInternalFilesAfter(context, 0) : []
  const locals: (TFile | InternalFile)[] = [...files, ...internals]

  remotes.sort((a, b) => a.path.localeCompare(b.path))

  const onCreate = onVaultCreate(context, queue)
  const onModify = onVaultModify(context, queue)

  let syncTime = 0

  for (const local of locals) {
    const index = binarySearch(remotes, remote => remote.path.localeCompare(local.path))

    if (!~index) {
      debug('found unmanaged local file:', local.path)
      await onCreate(local as TFile)
      continue
    }

    const remote = remotes.splice(index, 1).at(0)

    if (!remote) {
      continue
    }

    if (local.stat.mtime < remote.mtime) {
      debug('remote file is newer than local file:', local.path)
      await onFirebaseChanged(context, remote, queue)
    } else if (local.stat.mtime > remote.mtime) {
      debug('local file is newer than remote file:', local.path)
      await onModify(local as TFile)
    } else {
      debug('local file has same mtime with remote file:', local.path)
    }

    if (syncTime < remote.mtime) {
      syncTime = remote.mtime
    }
  }

  for (const remote of remotes) {
    await onFirebaseChanged(context, remote, queue)

    if (syncTime < remote.mtime) {
      syncTime = remote.mtime
    }
  }

  return syncTime
}

async function syncOnStartUp(
  context: Context,
  queue: EventQueue,
  syncTime: SyncTime
): Promise<SyncTime> {
  let lastSyncTime = syncTime

  const remotes = await findSyncFilesAfter(context, syncTime)

  debug(`${remotes.length} remote file(s) found.`)

  for (const remote of remotes) {
    await onFirebaseChanged(context, remote, queue)

    if (remote.mtime > syncTime) {
      lastSyncTime = remote.mtime
    }
  }

  return lastSyncTime
}

export default class FiresyncPlugin extends Plugin {
  public settings: Settings

  private unsubscribers: Unsubscriber[] = []
  private queue: EventQueue

  async onload(): Promise<void> {
    await this.loadSettings()

    this.queue = createEventQueue(this.settings)

    this.addSettingTab(new SettingsTabView(this))

    this.registerView(viewTypeStatus, leaf => new SyncStatusView(leaf, this.queue))

    this.addCommand({
      id: 'obsidian-firesync-show-status',
      name: 'Show synchronization status',
      callback: async () => {
        this.app.workspace.detachLeavesOfType(viewTypeStatus)
        await this.app.workspace.getRightLeaf(false).setViewState({
          type: viewTypeStatus,
          active: true,
        })
        this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(viewTypeStatus)[0])
      },
    })

    await this.doStart()
  }

  onunload(): void {
    this.queue.destroy()
    this.unsubscribers.forEach(it => it())
    this.app.workspace.detachLeavesOfType(viewTypeStatus)
  }

  async loadSettings() {
    this.settings = { ...defaultSettings, ...(await this.loadData()) }
  }

  async saveSettings(settings: Partial<Settings>) {
    this.settings = { ...this.settings, ...settings }
    await this.saveData(this.settings)
  }

  async doStart() {
    this.doStop()

    try {
      this.unsubscribers = await main(this, this.queue, this.settings)
    } catch (e) {
      showNotice(e)
    }
  }

  doStop() {
    if (this.unsubscribers.length > 0) {
      this.unsubscribers.forEach(it => it())
      this.unsubscribers = []
    }
  }
}
