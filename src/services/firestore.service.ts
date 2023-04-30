import type { Context } from '$/models/context.model'
import type { SyncFile } from '$/models/syncfile.model'
import { getFirebaseSyncFilePath } from '$/services/firebase.service'
import { hash } from '$/utils/hashes'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  setDoc,
  startAfter,
  type DocumentData,
  type FirestoreDataConverter,
  type SetOptions,
  type SnapshotOptions,
  type WithFieldValue,
  type DocumentChange,
} from 'firebase/firestore'
import { readable, type Readable } from 'svelte/store'

export const converters = {
  syncFile: <FirestoreDataConverter<SyncFile>>{
    toFirestore: (modelObject: WithFieldValue<SyncFile>, options: SetOptions): DocumentData => {
      return options && 'merge' in options && options.merge
        ? modelObject
        : {
            id: modelObject.id,
            path: modelObject.path,
            hash: modelObject.hash,
            mtime: modelObject.mtime,
            deleted: modelObject.deleted,
            trashed: modelObject.trashed,
          }
    },
    fromFirestore: (
      snapshot: QueryDocumentSnapshot<DocumentData>,
      _options?: SnapshotOptions | undefined
    ): SyncFile => {
      const data = snapshot.data()
      return {
        id: data.id,
        path: data.path,
        hash: data.hash,
        mtime: data.mtime,
        deleted: data.deleted,
        trashed: data.trashed,
      }
    },
  },
}

export async function generateSyncFileId(path: string): Promise<string> {
  return await hash(path)
}

export async function findSyncFilesAfter(context: Context, syncTime: number): Promise<SyncFile[]> {
  const path = getFirebaseSyncFilePath(context)
  const snapshot = await getDocs(
    query(
      collection(context.firebase.firestore, path).withConverter(converters.syncFile),
      orderBy('mtime'),
      startAfter(syncTime)
    )
  )

  return snapshot.docs.map(it => it.data()).sort((a, b) => a.path.localeCompare(b.path))
}

export async function findSyncFile(context: Context, filePath: string): Promise<SyncFile | null> {
  const id = await hash(filePath)
  const path = getFirebaseSyncFilePath(context, { id })

  const snapshot = await getDoc(
    doc(context.firebase.firestore, path).withConverter(converters.syncFile)
  )

  if (!snapshot.exists()) {
    return null
  }

  return snapshot.data()
}

export async function createSyncFile(context: Context, file: SyncFile): Promise<void> {
  const path = getFirebaseSyncFilePath(context, file)
  const docRef = doc(context.firebase.firestore, path).withConverter(converters.syncFile)

  await setDoc(docRef, file)
}

export async function updateSyncFile(
  context: Context,
  file: Partial<SyncFile> & { id: string }
): Promise<void> {
  const path = getFirebaseSyncFilePath(context, file)
  const docRef = doc(context.firebase.firestore, path).withConverter(converters.syncFile)
  await setDoc(docRef, file, { merge: true })
}

export function watchSyncFileChanges(
  context: Context,
  stime: number
): Readable<DocumentChange<SyncFile>[]> {
  const path = getFirebaseSyncFilePath(context)

  return readable<DocumentChange<SyncFile>[]>([], set => {
    return onSnapshot(
      query(
        collection(context.firebase.firestore, path).withConverter(converters.syncFile),
        orderBy('mtime'),
        startAfter(stime)
      ),
      async snapshot => {
        const files = snapshot.docChanges()
        set(files)
      },
      _ => {
        // TODO: handle error
      }
    )
  })
}

export function watchSyncFiles(context: Context, stime: number): Readable<SyncFile[]> {
  const path = getFirebaseSyncFilePath(context)

  return readable<SyncFile[]>([], set => {
    return onSnapshot(
      query(
        collection(context.firebase.firestore, path).withConverter(converters.syncFile),
        orderBy('mtime'),
        startAfter(stime)
      ),
      async snapshot => {
        const files = snapshot.docChanges().map(change => change.doc.data())
        set(files)
      }
    )
  })
}
