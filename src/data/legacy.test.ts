import { describe, expect, it } from 'vitest'
import { convertLegacy, type LegacyRoll } from './legacy'
import type { Roll } from './types'

let n = 0
const newId = () => `id${++n}`

const old = (patch: Partial<LegacyRoll> = {}): LegacyRoll => ({
  id: 'old-1',
  dateCreated: '2024-07-01T10:00:00.000Z',
  camera: 'Pentax K1000',
  filmBrand: 'Kodak',
  filmName: 'Gold',
  iso: 200,
  exposures: 36,
  photos: [
    { id: 'p2', date: '2024-07-02T12:00:00.000Z', location: { latitude: 0, longitude: 0 } },
    { id: 'p1', date: '2024-07-01T12:00:00.000Z', location: { latitude: 48.4, longitude: -123.3 }, imageUrl: 'https://x/img.png' },
  ],
  ...patch,
})

describe('convertLegacy', () => {
  it('maps stages, cameras and frames', () => {
    const r = convertLegacy(
      [
        { stage: 'completedRolls', roll: old() },
        { stage: 'activeRolls', roll: old({ id: 'old-2', camera: 'pentax k1000 ', photos: [] }) },
      ],
      { cameras: [], rolls: [] },
      newId,
    )
    expect(r.cameras).toHaveLength(1)
    expect(r.rolls.map((x) => x.status)).toEqual(['developed', 'loaded'])
    expect(r.rolls.every((x) => x.cameraId === r.cameras[0].id)).toBe(true)
    expect(r.rolls[0].finishedAt).toBe('2024-07-02T12:00:00.000Z')
    expect(r.rolls[1].finishedAt).toBeNull()

    expect(r.frames.map((f) => f.number)).toEqual([1, 2])
    expect(r.frames[0].location).toEqual({ lat: 48.4, lng: -123.3, accuracy: null, altitude: null })
    expect(r.frames[0].photo?.url).toBe('https://x/img.png')
    // 0,0 was the old app's "no location"
    expect(r.frames[1].location).toBeNull()
  })

  it('skips rolls that were already imported', () => {
    const existing = [{ legacyId: 'old-1' } as Roll]
    const r = convertLegacy([{ stage: 'activeRolls', roll: old() }], { cameras: [], rolls: existing }, newId)
    expect(r.rolls).toHaveLength(0)
    expect(r.skipped).toBe(1)
  })
})
