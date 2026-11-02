import { useCallback, useEffect, useRef, useState } from 'react'
import type { GeoPoint } from '../data/types'

type PositionStatus = 'locating' | 'ok' | 'error' | 'unsupported'

/** Watches GPS while mounted so a fix is ready the moment a frame is logged. */
export function usePosition() {
  const [fix, setFix] = useState<GeolocationPosition | null>(null)
  const [status, setStatus] = useState<PositionStatus>(() => ('geolocation' in navigator ? 'locating' : 'unsupported'))
  const [error, setError] = useState<string | null>(null)
  const watchId = useRef<number | null>(null)

  const start = useCallback(() => {
    if (!('geolocation' in navigator)) return
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current)
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setFix(pos)
        setStatus('ok')
        setError(null)
      },
      (err) => {
        setStatus((s) => (s === 'ok' ? s : 'error'))
        setError(err.code === err.PERMISSION_DENIED ? 'Location permission denied' : 'Can’t get a location fix')
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 },
    )
  }, [])

  useEffect(() => {
    start()
    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
  }, [start])

  const retry = useCallback(() => {
    setStatus('locating')
    start()
  }, [start])

  return { fix, status, error, retry }
}

/** A fix is usable for a frame if it's under five minutes old. */
export function toGeoPoint(fix: GeolocationPosition | null, now = Date.now()): GeoPoint | null {
  if (!fix || now - fix.timestamp > 5 * 60_000) return null
  const { latitude, longitude, accuracy, altitude } = fix.coords
  return { lat: latitude, lng: longitude, accuracy: Math.round(accuracy), altitude: altitude == null ? null : Math.round(altitude) }
}

type CompassState = 'idle' | 'needs-permission' | 'on' | 'denied' | 'unsupported'

interface OrientationEventWithCompass extends DeviceOrientationEvent {
  webkitCompassHeading?: number
}

type PermissionedOrientation = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> }

/**
 * Device compass heading (0 = north). iOS needs a tap to grant permission; Android Chrome
 * provides absolute orientation without asking. Desktops usually never fire events.
 */
export function useCompass() {
  const [heading, setHeading] = useState<number | null>(null)
  const [state, setState] = useState<CompassState>(() => {
    if (typeof DeviceOrientationEvent === 'undefined') return 'unsupported'
    return typeof (DeviceOrientationEvent as PermissionedOrientation).requestPermission === 'function' ? 'needs-permission' : 'idle'
  })
  const last = useRef(0)

  const listen = useCallback(() => {
    const handler = (e: Event) => {
      const ev = e as OrientationEventWithCompass
      let h: number | null = null
      if (typeof ev.webkitCompassHeading === 'number') h = ev.webkitCompassHeading
      else if (ev.absolute && ev.alpha != null) h = (360 - ev.alpha) % 360
      if (h == null) return
      const angle = screen.orientation?.angle ?? 0
      h = (h + angle + 360) % 360
      const now = performance.now()
      if (now - last.current < 250) return
      last.current = now
      setHeading(Math.round(h))
      setState('on')
    }
    const type = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation'
    window.addEventListener(type, handler)
    return () => window.removeEventListener(type, handler)
  }, [])

  const [listening, setListening] = useState(state === 'idle')
  useEffect(() => (listening ? listen() : undefined), [listening, listen])

  const enable = useCallback(async () => {
    const DOE = DeviceOrientationEvent as PermissionedOrientation
    try {
      const result = await DOE.requestPermission?.()
      if (result === 'denied') return setState('denied')
      setListening(true)
    } catch {
      setState('denied')
    }
  }, [])

  return { heading, state, enable }
}

const COMPASS_POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
export const compassPoint = (deg: number) => COMPASS_POINTS[Math.round(deg / 45) % 8]
