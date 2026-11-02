import { describe, expect, it } from 'vitest'
import type { Camera, Frame, Lens, Roll } from '../data/types'
import { applyFilter, computeStats, topN, yearReview, yearsWithFrames, type StatsInput } from './stats'

const base = { createdAt: '', updatedAt: '' }

const roll = (id: string, patch: Partial<Roll> = {}): Roll => ({
  ...base,
  id,
  name: '',
  status: 'scanned',
  cameraId: 'cam1',
  lensId: null,
  filmId: null,
  film: { brand: 'Kodak', name: 'Portra 400', iso: 400, process: 'C-41' },
  ratedIso: 400,
  exposures: 36,
  format: '35mm',
  loadedAt: '2025-03-01T10:00:00.000Z',
  finishedAt: '2025-03-11T10:00:00.000Z',
  developingAt: '2025-03-12T10:00:00.000Z',
  developedAt: '2025-03-20T10:00:00.000Z',
  scannedAt: '2025-03-22T10:00:00.000Z',
  lab: '',
  devNotes: '',
  notes: '',
  tags: [],
  costs: { film: 20, dev: 15, scan: null },
  ...patch,
})

const frame = (id: string, rollId: string, takenAt: string, patch: Partial<Frame> = {}): Frame => ({
  ...base,
  id,
  rollId,
  number: 1,
  takenAt,
  status: 'shot',
  location: null,
  heading: null,
  aperture: 8,
  shutter: '1/125',
  lensId: 'lens1',
  focalLength: null,
  exposureComp: null,
  flash: false,
  filter: '',
  notes: '',
  photo: null,
  ...patch,
})

const input: StatsInput = {
  rolls: [
    roll('r1'),
    roll('r2', {
      cameraId: 'cam2',
      film: { brand: 'Ilford', name: 'HP5 Plus', iso: 400, process: 'B&W' },
      ratedIso: 1600,
      loadedAt: '2025-07-01T10:00:00.000Z',
      finishedAt: null,
      developingAt: null,
      developedAt: null,
      scannedAt: null,
      status: 'loaded',
      costs: { film: null, dev: null, scan: null },
    }),
    roll('r3', { loadedAt: '2024-12-30T10:00:00.000Z', finishedAt: '2025-01-09T10:00:00.000Z', status: 'finished', developingAt: null, developedAt: null, scannedAt: null }),
  ],
  frames: [
    frame('a', 'r1', '2025-03-02T09:00:00.000Z', { location: { lat: 48.42841, lng: -123.36561, accuracy: 5, altitude: null } }),
    frame('b', 'r1', '2025-03-02T17:30:00.000Z', { aperture: 2.8, shutter: '1/60', location: { lat: 48.42849, lng: -123.36569, accuracy: 5, altitude: null } }),
    frame('c', 'r1', '2025-03-05T12:00:00.000Z', { status: 'skipped', aperture: null, shutter: null }),
    frame('d', 'r2', '2025-07-04T12:00:00.000Z', { shutter: 'Auto', aperture: 'auto' }),
    frame('e', 'r3', '2024-12-31T12:00:00.000Z'),
  ],
  cameraById: new Map([
    ['cam1', { id: 'cam1', name: 'FM2' } as Camera],
    ['cam2', { id: 'cam2', name: 'mju' } as Camera],
  ]),
  lensById: new Map([['lens1', { id: 'lens1', name: '50mm', focalMin: 50, focalMax: 50 } as Lens]]),
}

const ALL = { from: null, to: null, cameraId: null, film: null }

describe('applyFilter', () => {
  it('drops skipped frames and filters by camera and film', () => {
    expect(applyFilter(input, ALL).frames.map((f) => f.id)).toEqual(['a', 'b', 'd', 'e'])
    expect(applyFilter(input, { ...ALL, cameraId: 'cam2' }).frames.map((f) => f.id)).toEqual(['d'])
    expect(applyFilter(input, { ...ALL, film: 'Kodak Portra 400' }).rolls.map((r) => r.id)).toEqual(['r1', 'r3'])
  })
})

describe('computeStats', () => {
  const s = computeStats(input, ALL)

  it('counts rolls, frames and days', () => {
    expect(s.rollCount).toBe(3)
    expect(s.frameCount).toBe(4)
    expect(s.shootingDays).toBe(3)
    expect(s.toDevelop).toBe(1)
    expect(s.avgDaysToFinish).toBeCloseTo(10)
  })

  it('totals spend and cost per frame over costed rolls only', () => {
    expect(s.spend).toBe(70)
    // r1 has 2 shot frames, r3 has 1; r2 has no costs
    expect(s.costPerFrame).toBeCloseTo(70 / 3)
  })

  it('orders apertures and shutters numerically and skips auto', () => {
    expect(s.apertures).toEqual([
      { label: '2.8', value: 1 },
      { label: '8', value: 2 },
    ])
    expect(s.shutters.map((b) => b.label)).toEqual(['1/60', '1/125'])
  })

  it('fills empty months across the span', () => {
    expect(s.months.map((m) => m.label)).toEqual(['Dec 24', 'Jan 25', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'])
    expect(s.months.find((m) => m.label === 'Mar')?.value).toBe(2)
  })

  it('counts push/pull and uses fixed-lens focal lengths', () => {
    expect(s.pushPull).toEqual({ push: 1, pull: 0, box: 2 })
    expect(s.focal).toEqual([{ label: '50', value: 4 }])
  })
})

describe('topN', () => {
  it('folds the tail into Other', () => {
    const b = [5, 4, 3, 2, 1].map((v, i) => ({ label: `x${i}`, value: v }))
    expect(topN(b, 3)).toEqual([
      { label: 'x0', value: 5 },
      { label: 'x1', value: 4 },
      { label: 'Other', value: 6 },
    ])
  })
})

describe('yearReview', () => {
  it('summarises a year', () => {
    const y = yearReview(input, 2025)
    expect(y.rolls).toBe(2)
    expect(y.frames).toBe(3)
    expect(y.topFilm?.label).toBe('Kodak Portra 400')
    expect(y.places).toBe(1)
    expect(y.topPlace?.frames).toBe(2)
    expect(y.busiestDay).toEqual({ date: '2025-03-02', frames: 2 })
    expect(y.pushed).toBe(1)
  })

  it('lists years with frames, newest first', () => {
    expect(yearsWithFrames(input.frames)).toEqual([2025, 2024])
  })
})
