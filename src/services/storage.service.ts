import type { Context } from '$/models/context.model'
import type { SyncFile } from '$/models/syncfile.model'
import { getFirebaseSyncFilePath } from '$/services/firebase.service'
import {
  deleteObject,
  getDownloadURL,
  getMetadata,
  ref,
  uploadBytesResumable,
  type UploadTaskSnapshot,
} from 'firebase/storage'
import { withRetry } from '$/utils/retries'

export async function generateNextVersion(context: Context, file: SyncFile): Promise<number> {
  const path = getFirebaseSyncFilePath(context, file)
  const storageRef = ref(context.firebase.storage, path)

  return await withRetry(async () => {
    try {
      const metadata = await getMetadata(storageRef)
      return parseInt(metadata.generation) + 1
    } catch (e /* StorageError */) {
      if (e.code === 'storage/object-not-found') {
        return 0
      } else {
        throw e
      }
    }
  })
}

export async function uploadFile(
  context: Context,
  file: SyncFile,
  version: number,
  progress: (proportion: number) => void
): Promise<UploadTaskSnapshot> {
  const path = getFirebaseSyncFilePath(context, file)
  const storageRef = ref(context.firebase.storage, path)
  const data = await context.obsidian.vault.adapter.readBinary(file.path)

  return await withRetry(async () => {
    const task = uploadBytesResumable(storageRef, data, {
      customMetadata: { 'x-firesync-version': version.toString() },
    })

    const unsubscribe = task.on('state_changed', snapshot => {
      const proportion = snapshot.bytesTransferred / snapshot.totalBytes
      progress(proportion)
    })

    await task

    unsubscribe()

    return task
  })
}

export async function downloadFile(
  context: Context,
  file: SyncFile,
  progress: (percent: number) => void
): Promise<ArrayBuffer> {
  const path = getFirebaseSyncFilePath(context, file)
  const storageRef = ref(context.firebase.storage, path)
  const url = await getDownloadURL(storageRef)

  return await withRetry(async () => {
    const bytes = await new Promise<ArrayBuffer>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', url, true)
      xhr.responseType = 'arraybuffer'
      xhr.onprogress = event => {
        progress(Math.round((event.loaded / event.total) * 100))
      }
      xhr.onload = _ => {
        progress(1)
        resolve(xhr.response)
      }
      xhr.onerror = _ => {
        reject(`download error: ${file.path}`)
      }
      xhr.ontimeout = _ => {
        reject(`download timeout: ${file.path}`)
      }
      xhr.send()
    })

    return bytes
  })
}

export async function deleteFile(context: Context, file: SyncFile): Promise<void> {
  const path = getFirebaseSyncFilePath(context, file)
  const storageRef = ref(context.firebase.storage, path)

  await withRetry(async () => {
    await deleteObject(ref(storageRef))
  })
}
