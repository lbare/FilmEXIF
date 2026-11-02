import { del, get, keys, set } from 'idb-keyval'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { useEffect, useState } from 'react'
import type { Api } from '../data/api'
import type { Frame, FramePhoto } from '../data/types'
import { storage } from './firebase'

/**
 * Reference photos are resized on the device and kept in IndexedDB first, so taking one works
 * offline. A background sync uploads them to Firebase Storage and keeps the thumbnail locally.
 */

interface LocalPhoto {
  full?: Blob
  thumb: Blob
}

const key = (frameId: string) => `photo:${frameId}`

async function resize(file: Blob, max: number, quality: number) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode photo'))), 'image/jpeg', quality),
  )
  return { blob, width, height }
}

/** Resize and store a captured photo for a frame; returns the frame's `photo` field. */
export async function storeLocalPhoto(frameId: string, file: File): Promise<FramePhoto> {
  const [full, thumb] = await Promise.all([resize(file, 1600, 0.82), resize(file, 360, 0.75)])
  await set(key(frameId), { full: full.blob, thumb: thumb.blob } satisfies LocalPhoto)
  objectUrls.delete(frameId)
  return { status: 'local', path: null, thumbPath: null, width: full.width, height: full.height }
}

export async function deleteLocalPhoto(frameId: string) {
  objectUrls.delete(frameId)
  await del(key(frameId))
}

let syncing = false

/** Upload any photos still only on this device. Safe to call often. */
export async function syncPhotos(api: Api, frames: Frame[]) {
  if (syncing || !navigator.onLine) return
  syncing = true
  try {
    const byId = new Map(frames.map((f) => [f.id, f]))
    const pending = (await keys()).filter((k): k is string => typeof k === 'string' && k.startsWith('photo:'))
    for (const k of pending) {
      const frameId = k.slice('photo:'.length)
      const frame = byId.get(frameId)
      const local = await get<LocalPhoto>(k)
      if (!local) continue
      if (!frame || !frame.photo) {
        // Frame or its photo was deleted: drop the orphan.
        await del(k)
        continue
      }
      if (frame.photo.status === 'uploaded' || !local.full) continue
      const base = `users/${api.uid}/photos/${frameId}`
      try {
        await uploadBytes(ref(storage, `${base}.jpg`), local.full, { contentType: 'image/jpeg' })
        await uploadBytes(ref(storage, `${base}_thumb.jpg`), local.thumb, { contentType: 'image/jpeg' })
      } catch (err) {
        console.warn('Photo upload failed; will retry later', err)
        return
      }
      api.update('frames', frameId, { photo: { ...frame.photo, status: 'uploaded', path: `${base}.jpg`, thumbPath: `${base}_thumb.jpg` } })
      // Keep the thumbnail on this device for offline viewing.
      await set(k, { thumb: local.thumb } satisfies LocalPhoto)
    }
  } finally {
    syncing = false
  }
}

const objectUrls = new Map<string, { thumb?: string; full?: string }>()
const remoteUrls = new Map<string, string>()

async function resolveUrl(frame: Frame, size: 'thumb' | 'full'): Promise<string | null> {
  const photo = frame.photo
  if (!photo) return null
  if (photo.url) return photo.url
  const cached = objectUrls.get(frame.id)?.[size]
  if (cached) return cached
  const local = await get<LocalPhoto>(key(frame.id))
  const blob = size === 'full' ? local?.full : local?.thumb
  if (blob) {
    const url = URL.createObjectURL(blob)
    objectUrls.set(frame.id, { ...objectUrls.get(frame.id), [size]: url })
    return url
  }
  const path = size === 'thumb' ? (photo.thumbPath ?? photo.path) : (photo.path ?? photo.thumbPath)
  if (!path) return size === 'full' ? resolveUrl(frame, 'thumb') : null
  const remote = remoteUrls.get(path)
  if (remote) return remote
  try {
    const url = await getDownloadURL(ref(storage, path))
    remoteUrls.set(path, url)
    return url
  } catch {
    return null
  }
}

export function usePhotoUrl(frame: Frame | undefined, size: 'thumb' | 'full' = 'thumb') {
  const [resolved, setResolved] = useState<{ key: string; url: string | null } | null>(null)
  const photoKey = frame?.photo ? `${frame.id}|${frame.photo.status}|${frame.photo.path}|${frame.photo.url}|${size}` : null
  useEffect(() => {
    if (!frame || !photoKey) return
    let cancelled = false
    void resolveUrl(frame, size).then((url) => !cancelled && setResolved({ key: photoKey, url }))
    return () => {
      cancelled = true
    }
    // photoKey captures every field of the frame that affects the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoKey])
  return resolved && resolved.key === photoKey ? resolved.url : null
}
