import type { DataState } from './DataProvider'
import type { Base, CollectionName, Profile } from './types'

export const BACKUP_COLLECTIONS: CollectionName[] = ['cameras', 'lenses', 'films', 'rolls', 'frames']

export interface Backup {
  app: 'filmexif'
  version: 1
  exportedAt: string
  profile: Profile
  cameras: Base[]
  lenses: Base[]
  films: Base[]
  rolls: Base[]
  frames: Base[]
}

export function createBackup(data: DataState): Backup {
  return {
    app: 'filmexif',
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: data.profile,
    cameras: data.cameras,
    lenses: data.lenses,
    films: data.films,
    rolls: data.rolls,
    frames: data.frames,
  }
}

export function parseBackup(text: string): Backup {
  const parsed = JSON.parse(text) as Partial<Backup>
  if (parsed?.app !== 'filmexif' || parsed.version !== 1) throw new Error('This isn’t a FilmEXIF backup file.')
  for (const name of BACKUP_COLLECTIONS) {
    const list = parsed[name]
    if (!Array.isArray(list) || list.some((d) => typeof d?.id !== 'string' || !d.id)) {
      throw new Error(`The backup’s “${name}” section is damaged.`)
    }
  }
  return parsed as Backup
}

export function downloadFile(filename: string, content: Blob | string, type = 'application/json') {
  const blob = typeof content === 'string' ? new Blob([content], { type }) : content
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
