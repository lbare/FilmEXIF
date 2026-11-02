import { notifications } from '@mantine/notifications'
import { collection, deleteDoc, doc, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type {
  Base,
  CollectionName,
  CollectionTypes,
  FilmStock,
  Frame,
  Profile,
  Roll,
  RollStatus,
} from './types'

export type NewDoc<K extends CollectionName> = Omit<CollectionTypes[K], keyof Base>

const now = () => new Date().toISOString()

/**
 * Writes are fire-and-forget: Firestore applies them to the local cache immediately (so the UI updates
 * offline) and the promise only settles once the server acknowledges. We just surface failures.
 */
function track(p: Promise<unknown>) {
  p.catch((err: Error) => {
    console.error(err)
    notifications.show({ color: 'red', title: 'Couldn’t save', message: err.message })
  })
}

export const STATUS_DATE_FIELD: Record<RollStatus, keyof Roll> = {
  loaded: 'loadedAt',
  finished: 'finishedAt',
  developing: 'developingAt',
  developed: 'developedAt',
  scanned: 'scannedAt',
}

export function createApi(uid: string) {
  const col = (name: CollectionName) => collection(db, 'users', uid, name)
  const ref = (name: CollectionName, id: string) => doc(db, 'users', uid, name, id)
  const profileRef = doc(db, 'users', uid)

  const newId = (name: CollectionName) => doc(col(name)).id

  function create<K extends CollectionName>(name: K, data: NewDoc<K>, id = newId(name)): string {
    const t = now()
    track(setDoc(ref(name, id), { ...data, id, createdAt: t, updatedAt: t }))
    return id
  }

  function update<K extends CollectionName>(name: K, id: string, patch: Partial<NewDoc<K>>) {
    track(updateDoc(ref(name, id), { ...patch, updatedAt: now() }))
  }

  function remove(name: CollectionName, id: string) {
    track(deleteDoc(ref(name, id)))
  }

  return {
    uid,
    newId,
    create,
    update,
    remove,

    updateProfile(patch: Partial<Profile>) {
      track(setDoc(profileRef, patch, { merge: true }))
    },

    /** Load a new roll; takes one roll out of fridge stock if it came from there. */
    loadRoll(roll: NewDoc<'rolls'>, film: FilmStock | null) {
      const id = newId('rolls')
      const t = now()
      const batch = writeBatch(db)
      batch.set(ref('rolls', id), { ...roll, id, createdAt: t, updatedAt: t })
      if (film && film.stock > 0) batch.update(ref('films', film.id), { stock: film.stock - 1, updatedAt: t })
      track(batch.commit())
      return id
    },

    /** Move a roll to a status, stamping the date for that step (and any skipped steps). */
    setRollStatus(roll: Roll, status: RollStatus, at = now()) {
      const order: RollStatus[] = ['loaded', 'finished', 'developing', 'developed', 'scanned']
      const target = order.indexOf(status)
      const patch: Partial<Roll> = { status }
      order.forEach((s, i) => {
        if (i === 0) return
        const field = STATUS_DATE_FIELD[s] as 'finishedAt'
        if (i <= target && !roll[field]) patch[field] = at
        if (i > target) patch[field] = null
      })
      update('rolls', roll.id, patch)
    },

    deleteRoll(roll: Roll, frames: Frame[]) {
      const batch = writeBatch(db)
      frames.forEach((f) => batch.delete(ref('frames', f.id)))
      batch.delete(ref('rolls', roll.id))
      track(batch.commit())
    },

    logFrame(frame: NewDoc<'frames'>, id = newId('frames')) {
      return create('frames', frame, id)
    },

    /** Renumber a roll's frames 1..n in shooting order. */
    renumberFrames(frames: Frame[]) {
      const sorted = [...frames].sort((a, b) => a.takenAt.localeCompare(b.takenAt))
      const batch = writeBatch(db)
      const t = now()
      let changed = false
      sorted.forEach((f, i) => {
        if (f.number !== i + 1) {
          batch.update(ref('frames', f.id), { number: i + 1, updatedAt: t })
          changed = true
        }
      })
      if (changed) track(batch.commit())
    },

    /** Write many documents at once (backup restore / legacy import). Firestore batches cap at 500. */
    async bulkSet(docs: { collection: CollectionName; data: Base & Record<string, unknown> }[]) {
      for (let i = 0; i < docs.length; i += 400) {
        const batch = writeBatch(db)
        docs.slice(i, i + 400).forEach(({ collection: c, data }) => batch.set(ref(c, data.id), data))
        await batch.commit()
      }
    },
  }
}

export type Api = ReturnType<typeof createApi>
