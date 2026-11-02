import { describe, expect, it } from 'vitest'
import type { Camera, Lens } from '../data/types'
import {
  apertureOptions,
  ev100,
  formatStops,
  pushPullLabel,
  pushPullStops,
  SHUTTERS_FULL,
  SHUTTERS_THIRD,
  shutterOptions,
  shutterSeconds,
} from './exposure'

const base = { id: 'x', createdAt: '', updatedAt: '', notes: '', retired: false }

const camera = (patch: Partial<Camera> = {}): Camera => ({
  ...base,
  name: 'FM2',
  format: '35mm',
  slowestShutter: '1"',
  fastestShutter: '1/4000',
  shutterStops: 'full',
  bulb: true,
  autoExposure: false,
  defaultLensId: null,
  ...patch,
})

const lens = (patch: Partial<Lens> = {}): Lens => ({
  ...base,
  name: '50mm',
  mount: 'F',
  focalMin: 50,
  focalMax: 50,
  maxAperture: 1.8,
  minAperture: 22,
  apertureStops: 'full',
  ...patch,
})

describe('shutterSeconds', () => {
  it('parses fractions and whole seconds', () => {
    expect(shutterSeconds('1/125')).toBeCloseTo(1 / 125)
    expect(shutterSeconds('2"')).toBe(2)
    expect(shutterSeconds('0.8"')).toBe(0.8)
  })
  it('returns null for bulb, auto and junk', () => {
    expect(shutterSeconds('B')).toBeNull()
    expect(shutterSeconds('Auto')).toBeNull()
    expect(shutterSeconds('fast')).toBeNull()
    expect(shutterSeconds(null)).toBeNull()
  })
  it('lists every scale slowest first', () => {
    for (const scale of [SHUTTERS_FULL, SHUTTERS_THIRD]) {
      const secs = scale.map((s) => shutterSeconds(s)!)
      expect(secs.every((t, i) => i === 0 || t < secs[i - 1])).toBe(true)
    }
  })
  it('includes every full stop in the third-stop scale', () => {
    for (const s of SHUTTERS_FULL) expect(SHUTTERS_THIRD).toContain(s)
  })
})

describe('shutterOptions', () => {
  it('limits to the camera range and adds bulb', () => {
    expect(shutterOptions(camera())).toEqual(['B', '1"', '1/2', '1/4', '1/8', '1/15', '1/30', '1/60', '1/125', '1/250', '1/500', '1/1000', '1/2000', '1/4000'])
  })
  it('uses thirds and auto when the camera has them', () => {
    const opts = shutterOptions(camera({ shutterStops: 'third', bulb: false, autoExposure: true, slowestShutter: '1/30', fastestShutter: '1/60' }))
    expect(opts).toEqual(['Auto', '1/30', '1/40', '1/50', '1/60'])
  })
})

describe('apertureOptions', () => {
  it('starts at the lens max aperture even when it is between stops', () => {
    expect(apertureOptions(lens())).toEqual([1.8, 2, 2.8, 4, 5.6, 8, 11, 16, 22])
  })
  it('does not duplicate a max aperture on the scale', () => {
    expect(apertureOptions(lens({ maxAperture: 2.8, minAperture: 8 }))).toEqual([2.8, 4, 5.6, 8])
  })
  it('adds auto for auto-exposure cameras', () => {
    expect(apertureOptions(lens({ maxAperture: 2.8, minAperture: 4 }), camera({ autoExposure: true }))).toEqual(['auto', 2.8, 4])
  })
})

describe('push/pull', () => {
  it('computes stops to the nearest third', () => {
    expect(pushPullStops(400, 1600)).toBe(2)
    expect(pushPullStops(400, 200)).toBe(-1)
    expect(pushPullStops(400, 500)).toBeCloseTo(1 / 3)
    expect(pushPullStops(400, 400)).toBe(0)
  })
  it('formats labels', () => {
    expect(pushPullLabel(400, 1600)).toBe('Push 2')
    expect(pushPullLabel(400, 200)).toBe('Pull 1')
    expect(pushPullLabel(400, 400)).toBeNull()
    expect(formatStops(2 / 3)).toBe('+⅔')
    expect(formatStops(-4 / 3)).toBe('−1⅓')
  })
})

describe('ev100', () => {
  it('matches sunny 16', () => {
    // ƒ/16 at 1/125 on ISO 100 ≈ EV 15
    expect(ev100(16, '1/125', 100)).toBeCloseTo(14.97, 1)
    expect(ev100(16, '1/500', 400)).toBeCloseTo(14.97, 1)
  })
  it('is null without numeric settings', () => {
    expect(ev100('auto', '1/125', 100)).toBeNull()
    expect(ev100(8, 'B', 100)).toBeNull()
  })
})
