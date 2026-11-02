import dayjs from 'dayjs'
import type { Camera, Frame, Lens, Roll } from '../data/types'
import { pushPullStops, shutterSeconds } from './exposure'
import { daysBetween, filmLabel } from './format'

export interface StatsInput {
  rolls: Roll[]
  frames: Frame[]
  cameraById: Map<string, Camera>
  lensById: Map<string, Lens>
}

export interface StatsFilter {
  /** Inclusive ISO date bounds on when frames were taken / rolls were loaded. */
  from: string | null
  to: string | null
  cameraId: string | null
  film: string | null
}

export interface Bucket {
  label: string
  value: number
}

const inRange = (iso: string, from: string | null, to: string | null) =>
  (!from || iso >= from) && (!to || iso <= to)

/** Rolls and shot frames matching the filter. A roll counts if it was loaded in range. */
export function applyFilter(input: StatsInput, f: StatsFilter) {
  const rollOk = (r: Roll) => (!f.cameraId || r.cameraId === f.cameraId) && (!f.film || filmLabel(r.film) === f.film)
  const rollById = new Map(input.rolls.map((r) => [r.id, r]))
  const rolls = input.rolls.filter((r) => rollOk(r) && inRange(r.loadedAt, f.from, f.to))
  const frames = input.frames.filter((fr) => {
    if (fr.status !== 'shot') return false
    const roll = rollById.get(fr.rollId)
    return !!roll && rollOk(roll) && inRange(fr.takenAt, f.from, f.to)
  })
  return { rolls, frames, rollById }
}

function countBy<T>(items: T[], key: (item: T) => string | null | undefined): Map<string, number> {
  const m = new Map<string, number>()
  for (const item of items) {
    const k = key(item)
    if (k == null || k === '') continue
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return m
}

const toBuckets = (m: Map<string, number>) => [...m].map(([label, value]) => ({ label, value }))
const byValueDesc = (a: Bucket, b: Bucket) => b.value - a.value || a.label.localeCompare(b.label)

/** Top N buckets by value; the rest fold into "Other". */
export function topN(buckets: Bucket[], n: number): Bucket[] {
  const sorted = [...buckets].sort(byValueDesc)
  if (sorted.length <= n) return sorted
  const other = sorted.slice(n - 1).reduce((s, b) => s + b.value, 0)
  return [...sorted.slice(0, n - 1), { label: 'Other', value: other }]
}

export function rollCostTotal(roll: Roll) {
  const parts = [roll.costs.film, roll.costs.dev, roll.costs.scan].filter((n): n is number => n != null)
  return parts.length ? parts.reduce((a, b) => a + b, 0) : null
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

export function computeStats(input: StatsInput, filter: StatsFilter) {
  const { rolls, frames, rollById } = applyFilter(input, filter)

  const costs = rolls.map(rollCostTotal).filter((c): c is number => c != null)
  const spend = costs.length ? costs.reduce((a, b) => a + b, 0) : null
  const framesOfCostedRolls = rolls
    .filter((r) => rollCostTotal(r) != null)
    .reduce((n, r) => n + input.frames.filter((f) => f.rollId === r.id && f.status === 'shot').length, 0)

  const finished = rolls.filter((r) => r.finishedAt)
  const toDevelop = input.rolls.filter((r) => r.status === 'finished' || r.status === 'developing').length

  // Frames per month across the filtered span (or the frames' own span).
  const months: Bucket[] = []
  const times = frames.map((f) => f.takenAt).sort()
  const start = dayjs(filter.from ?? times[0] ?? undefined).startOf('month')
  const end = dayjs(filter.to ?? times.at(-1) ?? undefined).startOf('month')
  const perMonth = countBy(frames, (f) => dayjs(f.takenAt).format('YYYY-MM'))
  if (frames.length || filter.from) {
    for (let m = start; !m.isAfter(end) && months.length < 120; m = m.add(1, 'month')) {
      // Short labels; the year is only shown where it changes (and on the first bar).
      const label = months.length === 0 || m.month() === 0 ? m.format('MMM YY') : m.format('MMM')
      months.push({ label, value: perMonth.get(m.format('YYYY-MM')) ?? 0 })
    }
  }

  const daily: Record<string, number> = {}
  for (const f of frames) {
    const d = dayjs(f.takenAt).format('YYYY-MM-DD')
    daily[d] = (daily[d] ?? 0) + 1
  }

  const filmOf = (f: Frame) => {
    const r = rollById.get(f.rollId)
    return r ? filmLabel(r.film) : null
  }
  const cameraOf = (f: Frame) => {
    const id = rollById.get(f.rollId)?.cameraId
    return id ? (input.cameraById.get(id)?.name ?? null) : null
  }

  const apertures = toBuckets(countBy(frames, (f) => (typeof f.aperture === 'number' ? String(f.aperture) : null))).sort(
    (a, b) => Number(a.label) - Number(b.label),
  )
  const shutters = toBuckets(countBy(frames, (f) => (shutterSeconds(f.shutter) != null ? f.shutter : null))).sort(
    (a, b) => shutterSeconds(b.label)! - shutterSeconds(a.label)!,
  )
  const focal = toBuckets(
    countBy(frames, (f) => {
      if (f.focalLength) return String(f.focalLength)
      const lens = f.lensId ? input.lensById.get(f.lensId) : null
      return lens && lens.focalMin === lens.focalMax ? String(lens.focalMin) : null
    }),
  ).sort((a, b) => Number(a.label) - Number(b.label))

  const hours = Array.from({ length: 24 }, (_, h) => ({ label: String(h), value: 0 }))
  for (const f of frames) hours[dayjs(f.takenAt).hour()].value++

  const pushPull = { push: 0, pull: 0, box: 0 }
  for (const r of rolls) {
    const s = pushPullStops(r.film.iso, r.ratedIso)
    if (s > 0) pushPull.push++
    else if (s < 0) pushPull.pull++
    else pushPull.box++
  }

  const stage = (from: keyof Roll, to: keyof Roll) =>
    mean(
      rolls
        .filter((r) => r[from] && r[to])
        .map((r) => daysBetween(r[from] as string, r[to] as string)),
    )

  return {
    rollCount: rolls.length,
    frameCount: frames.length,
    located: frames.filter((f) => f.location).length,
    toDevelop,
    avgDaysToFinish: mean(finished.map((r) => daysBetween(r.loadedAt, r.finishedAt!))),
    spend,
    costPerFrame: spend != null && framesOfCostedRolls ? spend / framesOfCostedRolls : null,
    shootingDays: Object.keys(daily).length,
    months,
    daily,
    films: toBuckets(countBy(frames, filmOf)),
    filmRolls: toBuckets(countBy(rolls, (r) => filmLabel(r.film))),
    cameras: toBuckets(countBy(frames, cameraOf)),
    lenses: toBuckets(countBy(frames, (f) => (f.lensId ? (input.lensById.get(f.lensId)?.name ?? null) : null))),
    focal,
    apertures,
    shutters,
    hours,
    isos: toBuckets(countBy(rolls, (r) => String(r.ratedIso))).sort((a, b) => Number(a.label) - Number(b.label)),
    pushPull,
    pipeline: [
      { label: 'Loaded → finished', value: stage('loadedAt', 'finishedAt') },
      { label: 'Finished → at lab', value: stage('finishedAt', 'developingAt') },
      { label: 'At lab → developed', value: stage('developingAt', 'developedAt') },
      { label: 'Developed → scanned', value: stage('developedAt', 'scannedAt') },
    ],
  }
}

export type Stats = ReturnType<typeof computeStats>

const top = (buckets: Bucket[]) => [...buckets].sort(byValueDesc)[0] ?? null

/** ~1 km grid cell used to group frames into "places". */
const placeKey = (lat: number, lng: number) => `${lat.toFixed(2)},${lng.toFixed(2)}`

export function yearReview(input: StatsInput, year: number) {
  const from = dayjs(`${year}-01-01`).startOf('day').toISOString()
  const to = dayjs(`${year}-12-31`).endOf('day').toISOString()
  const filter: StatsFilter = { from, to, cameraId: null, film: null }
  const stats = computeStats(input, filter)
  const { frames } = applyFilter(input, filter)

  // A roll belongs to the year if any of its frames were shot that year.
  const rollIds = new Set(frames.map((f) => f.rollId))
  const rolls = input.rolls.filter((r) => rollIds.has(r.id))

  const places = new Map<string, { count: number; lat: number; lng: number }>()
  for (const f of frames) {
    if (!f.location) continue
    const k = placeKey(f.location.lat, f.location.lng)
    const p = places.get(k) ?? { count: 0, lat: 0, lng: 0 }
    p.count++
    p.lat += f.location.lat
    p.lng += f.location.lng
    places.set(k, p)
  }
  const topPlace = [...places.values()].sort((a, b) => b.count - a.count)[0]

  const busiestDay = Object.entries(stats.daily).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
  const busiestMonth = top(
    toBuckets(countBy(frames, (f) => dayjs(f.takenAt).format('MMMM'))),
  )
  const sorted = [...frames].sort((a, b) => a.takenAt.localeCompare(b.takenAt))
  const finishedDurations = rolls
    .filter((r) => r.finishedAt)
    .map((r) => ({ roll: r, days: daysBetween(r.loadedAt, r.finishedAt!) }))
    .sort((a, b) => a.days - b.days)

  return {
    year,
    rolls: rolls.length,
    frames: frames.length,
    shootingDays: stats.shootingDays,
    places: places.size,
    topFilm: top(stats.films),
    topCamera: top(stats.cameras),
    topLens: top(stats.lenses),
    topAperture: top(stats.apertures),
    topShutter: top(stats.shutters),
    busiestMonth,
    busiestDay: busiestDay ? { date: busiestDay[0], frames: busiestDay[1] } : null,
    topPlace: topPlace ? { lat: topPlace.lat / topPlace.count, lng: topPlace.lng / topPlace.count, frames: topPlace.count } : null,
    firstFrame: sorted[0] ?? null,
    lastFrame: sorted.at(-1) ?? null,
    fastestRoll: finishedDurations[0] ?? null,
    slowestRoll: finishedDurations.at(-1) ?? null,
    pushed: rolls.filter((r) => pushPullStops(r.film.iso, r.ratedIso) > 0).length,
    spend: (() => {
      const c = rolls.map(rollCostTotal).filter((n): n is number => n != null)
      return c.length ? c.reduce((a, b) => a + b, 0) : null
    })(),
    daily: stats.daily,
  }
}

export type YearReview = ReturnType<typeof yearReview>

/** Years that have at least one shot frame, newest first. */
export function yearsWithFrames(frames: Frame[]) {
  return [...new Set(frames.filter((f) => f.status === 'shot').map((f) => dayjs(f.takenAt).year()))].sort((a, b) => b - a)
}
