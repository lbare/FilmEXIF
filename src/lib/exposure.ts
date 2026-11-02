import type { Aperture, Camera, Lens, StopIncrement } from '../data/types'

export const APERTURES: Record<StopIncrement, number[]> = {
  full: [1, 1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22, 32, 45, 64],
  half: [1, 1.2, 1.4, 1.7, 2, 2.4, 2.8, 3.3, 4, 4.8, 5.6, 6.7, 8, 9.5, 11, 13, 16, 19, 22, 27, 32, 38, 45, 64],
  third: [
    1, 1.1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.5, 2.8, 3.2, 3.5, 4, 4.5, 5, 5.6, 6.3, 7.1, 8, 9, 10, 11, 13, 14,
    16, 18, 20, 22, 25, 29, 32, 36, 40, 45, 64,
  ],
}

/** Third-stop shutter scale, slowest first. Full stops are a subset. */
export const SHUTTERS_THIRD = [
  '30"', '25"', '20"', '15"', '13"', '10"', '8"', '6"', '5"', '4"', '3.2"', '2.5"', '2"', '1.6"', '1.3"',
  '1"', '0.8"', '0.6"', '1/2', '0.4"', '0.3"', '1/4', '1/5', '1/6', '1/8', '1/10', '1/13', '1/15', '1/20',
  '1/25', '1/30', '1/40', '1/50', '1/60', '1/80', '1/100', '1/125', '1/160', '1/200', '1/250', '1/320',
  '1/400', '1/500', '1/640', '1/800', '1/1000', '1/1250', '1/1600', '1/2000', '1/2500', '1/3200',
  '1/4000', '1/5000', '1/6400', '1/8000',
]

export const SHUTTERS_FULL = [
  '30"', '15"', '8"', '4"', '2"', '1"', '1/2', '1/4', '1/8', '1/15', '1/30', '1/60', '1/125', '1/250',
  '1/500', '1/1000', '1/2000', '1/4000', '1/8000',
]

export const SHUTTER_BULB = 'B'
export const SHUTTER_AUTO = 'Auto'

/** Shutter label → seconds. `null` for bulb/auto or anything unparseable. */
export function shutterSeconds(label: string | null | undefined): number | null {
  if (!label) return null
  const s = label.trim()
  if (s.endsWith('"')) {
    const n = Number(s.slice(0, -1))
    return Number.isFinite(n) && n > 0 ? n : null
  }
  const m = /^1\/(\d+(?:\.\d+)?)$/.exec(s)
  if (m) return 1 / Number(m[1])
  return null
}

export function apertureOptions(lens: Lens | null | undefined, camera?: Camera | null): Aperture[] {
  let values: Aperture[]
  if (!lens) {
    values = APERTURES.full.filter((a) => a <= 22)
  } else {
    const scale = APERTURES[lens.apertureStops].filter(
      (a) => a > lens.maxAperture + 0.001 && a <= lens.minAperture + 0.001,
    )
    values = [lens.maxAperture, ...scale]
  }
  return camera?.autoExposure ? ['auto', ...values] : values
}

export function shutterOptions(camera: Camera | null | undefined): string[] {
  if (!camera) return [...SHUTTERS_FULL.slice(5, 16), SHUTTER_BULB]
  const scale = camera.shutterStops === 'third' ? SHUTTERS_THIRD : SHUTTERS_FULL
  const slow = shutterSeconds(camera.slowestShutter) ?? 1
  const fast = shutterSeconds(camera.fastestShutter) ?? 1 / 1000
  const values = scale.filter((label) => {
    const t = shutterSeconds(label)!
    return t <= slow * 1.0001 && t >= fast * 0.9999
  })
  if (camera.bulb) values.unshift(SHUTTER_BULB)
  if (camera.autoExposure) values.unshift(SHUTTER_AUTO)
  return values
}

export function formatAperture(a: Aperture | null | undefined): string {
  if (a == null) return '—'
  if (a === 'auto') return 'Auto'
  return `ƒ/${a}`
}

export function formatShutter(s: string | null | undefined): string {
  if (!s) return '—'
  return s
}

/** Push (+) or pull (−) in stops, rounded to the nearest third. */
export function pushPullStops(boxIso: number, ratedIso: number): number {
  if (!boxIso || !ratedIso) return 0
  return Math.round(Math.log2(ratedIso / boxIso) * 3) / 3
}

export function formatStops(stops: number): string {
  if (Math.abs(stops) < 0.01) return '0'
  const sign = stops > 0 ? '+' : '−'
  const abs = Math.abs(stops)
  const whole = Math.floor(abs + 0.01)
  const thirds = Math.round((abs - whole) * 3)
  const frac = thirds === 0 ? '' : thirds === 1 ? '⅓' : '⅔'
  return `${sign}${whole === 0 && frac ? '' : whole}${frac}`
}

export function pushPullLabel(boxIso: number, ratedIso: number): string | null {
  const stops = pushPullStops(boxIso, ratedIso)
  if (stops === 0) return null
  return `${stops > 0 ? 'Push' : 'Pull'} ${formatStops(stops).slice(1)}`
}

/** Exposure value at ISO 100 for the scene, i.e. how bright it was. */
export function ev100(aperture: Aperture | null, shutter: string | null, iso: number): number | null {
  if (typeof aperture !== 'number') return null
  const t = shutterSeconds(shutter)
  if (!t || !iso) return null
  return Math.log2((aperture * aperture) / t) - Math.log2(iso / 100)
}

export const EXPOSURE_COMP = [-2, -5 / 3, -4 / 3, -1, -2 / 3, -1 / 3, 0, 1 / 3, 2 / 3, 1, 4 / 3, 5 / 3, 2]

const FOCALS = [10, 12, 14, 16, 18, 20, 24, 28, 35, 40, 50, 55, 60, 70, 75, 80, 85, 90, 100, 105, 120, 135, 150, 180, 200, 250, 300, 400, 500, 600]

/** Common focal lengths within a zoom's range (empty for primes). */
export function focalOptions(lens: Lens | null | undefined): number[] {
  if (!lens || lens.focalMin === lens.focalMax) return []
  return [...new Set([lens.focalMin, ...FOCALS.filter((f) => f > lens.focalMin && f < lens.focalMax), lens.focalMax])]
}
