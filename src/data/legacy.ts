import type { Camera, Frame, Roll, RollStatus } from './types'

/** Shape of rolls saved by the original version of the app. */
export interface LegacyRoll {
  id: string
  dateCreated: string
  name?: string
  camera: string
  filmBrand: string
  filmName: string
  iso: number | string
  exposures: number
  photos?: { id: string; date: string; location?: { latitude: number; longitude: number }; imageUrl?: string }[]
  lastUpdated?: string
}

export type LegacyStage = 'activeRolls' | 'developedRolls' | 'completedRolls'

// The old app's "Develop" section held finished rolls waiting to be developed; "Completed" meant developed.
const STAGE_STATUS: Record<LegacyStage, RollStatus> = {
  activeRolls: 'loaded',
  developedRolls: 'finished',
  completedRolls: 'developed',
}

export interface LegacyImport {
  cameras: Camera[]
  rolls: Roll[]
  frames: Frame[]
  skipped: number
}

/** Convert old rolls into the new model. Pure, so it can be tested; the caller writes the result. */
export function convertLegacy(
  docs: { stage: LegacyStage; roll: LegacyRoll }[],
  existing: { cameras: Camera[]; rolls: Roll[] },
  newId: () => string,
  now = new Date().toISOString(),
): LegacyImport {
  const imported = new Set(existing.rolls.map((r) => r.legacyId).filter(Boolean))
  const cameraByName = new Map(existing.cameras.map((c) => [c.name.trim().toLowerCase(), c]))
  const result: LegacyImport = { cameras: [], rolls: [], frames: [], skipped: 0 }
  const seen = new Set<string>()

  for (const { stage, roll: old } of docs) {
    if (!old?.id || imported.has(old.id) || seen.has(old.id)) {
      result.skipped++
      continue
    }
    seen.add(old.id)

    let cameraId: string | null = null
    const cameraName = (old.camera ?? '').trim()
    if (cameraName) {
      const key = cameraName.toLowerCase()
      let camera = cameraByName.get(key)
      if (!camera) {
        camera = {
          id: newId(),
          createdAt: now,
          updatedAt: now,
          name: cameraName,
          format: '35mm',
          slowestShutter: '1"',
          fastestShutter: '1/1000',
          shutterStops: 'full',
          bulb: true,
          autoExposure: false,
          defaultLensId: null,
          notes: 'Imported from the original app',
          retired: false,
        }
        cameraByName.set(key, camera)
        result.cameras.push(camera)
      }
      cameraId = camera.id
    }

    const status = STAGE_STATUS[stage]
    const photos = [...(old.photos ?? [])].sort((a, b) => a.date.localeCompare(b.date))
    const loadedAt = old.dateCreated || photos[0]?.date || now
    const lastShot = photos.at(-1)?.date ?? loadedAt
    const iso = Number(old.iso) || 400
    const rollId = newId()

    result.rolls.push({
      id: rollId,
      createdAt: now,
      updatedAt: now,
      name: old.name ?? '',
      status,
      cameraId,
      lensId: null,
      filmId: null,
      film: { brand: old.filmBrand ?? '', name: old.filmName ?? '', iso, process: 'C-41' },
      ratedIso: iso,
      exposures: old.exposures || 36,
      format: '35mm',
      loadedAt,
      finishedAt: status === 'loaded' ? null : lastShot,
      developingAt: null,
      developedAt: status === 'developed' ? (old.lastUpdated ?? lastShot) : null,
      scannedAt: null,
      lab: '',
      devNotes: '',
      notes: '',
      tags: [],
      costs: { film: null, dev: null, scan: null },
      legacyId: old.id,
    })

    photos.forEach((p, i) => {
      const loc = p.location
      const hasLocation = loc && !(loc.latitude === 0 && loc.longitude === 0)
      result.frames.push({
        id: newId(),
        createdAt: now,
        updatedAt: now,
        rollId,
        number: i + 1,
        takenAt: p.date,
        status: 'shot',
        location: hasLocation ? { lat: loc.latitude, lng: loc.longitude, accuracy: null, altitude: null } : null,
        heading: null,
        aperture: null,
        shutter: null,
        lensId: null,
        focalLength: null,
        exposureComp: null,
        flash: false,
        filter: '',
        notes: '',
        photo: p.imageUrl
          ? { status: 'uploaded', path: null, thumbPath: null, url: p.imageUrl, width: 0, height: 0 }
          : null,
      })
    })
  }
  return result
}
