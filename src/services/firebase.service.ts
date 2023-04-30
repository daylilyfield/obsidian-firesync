import { initializeApp, getApp, deleteApp } from 'firebase/app'
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  type User as FirebaseUser,
} from 'firebase/auth'
import type { Settings } from '$/models/settings.model'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getLogger } from '$/logging/logger'
import type { FirebaseContext, UnauthenticatedFirebaseContext } from '$/models/firebase.models'
import type { Context } from '$/models/context.model'
import type { SyncFile } from '$/models/syncfile.model'

export function canInitializeFirebase(settings: Settings) {
  return !!(
    settings.apiKey &&
    settings.authDomain &&
    settings.projectId &&
    settings.storageBucket &&
    settings.appId
  )
}

export async function initializeFirebase(
  settings: Settings
): Promise<UnauthenticatedFirebaseContext> {
  const { debug } = getLogger('firebase.service')

  try {
    const current = getApp('obisidan-firesync')
    await deleteApp(current)
  } catch (e) {
    if (e.code !== 'app/no-app') {
      throw e
    }
    debug('firebase app has not been initialized.')
  }

  const app = initializeApp(
    {
      apiKey: settings.apiKey,
      authDomain: settings.authDomain,
      projectId: settings.projectId,
      storageBucket: settings.storageBucket,
      appId: settings.appId,
    },
    'obsidian-firesync'
  )

  return {
    app,
    auth: getAuth(app),
    firestore: getFirestore(app),
    storage: getStorage(app),
  }
}

export function canAuthenticate(settings: Settings): boolean {
  return !!(settings.email && settings.password)
}

export async function authenticate(
  firebase: UnauthenticatedFirebaseContext,
  settings: Settings
): Promise<FirebaseContext> {
  if (firebase.auth.currentUser) {
    return {
      ...firebase,
      user: firebase.auth.currentUser,
    }
  }

  const user = await new Promise<FirebaseUser | null>(resolve => {
    onAuthStateChanged(firebase.auth, user => resolve(user))
  })

  if (user) {
    return { ...firebase, user }
  }

  const credential = await signInWithEmailAndPassword(
    firebase.auth,
    settings.email,
    settings.password
  )

  return { ...firebase, user: credential.user }
}

export function getFirebaseSyncFilePath(
  context: Context,
  file?: Partial<SyncFile> & { id: string }
): string {
  const uid = context.firebase.user.uid
  const vid = context.obsidian.vault.id
  const base = `/app/v1/users/${uid}/vaults/${vid}/files`

  if (!file) {
    return base
  }

  return `${base}/${file.id}`
}
