import { useComputedColorScheme } from '@mantine/core'
import L from 'leaflet'
import { useEffect } from 'react'
import { TileLayer, useMap } from 'react-leaflet'
import type { Frame } from '../../data/types'

export function Tiles() {
  const scheme = useComputedColorScheme('dark')
  return (
    <TileLayer
      key={scheme}
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      maxZoom={19}
      // Dark mode: invert the standard tiles rather than depend on a keyed dark tile service.
      className={scheme === 'dark' ? 'tiles-dark' : undefined}
    />
  )
}

/** Fit the map to the given points whenever the set of points changes. */
export function FitBounds({ points, maxZoom = 15 }: { points: [number, number][]; maxZoom?: number }) {
  const map = useMap()
  const key = points.map((p) => p.join(',')).join(';')
  useEffect(() => {
    if (!points.length) return
    if (points.length === 1) map.setView(points[0], maxZoom)
    else map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom })
    // `key` captures the points' identity; the array itself is new every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key, maxZoom])
  return null
}

const iconCache = new Map<string, L.DivIcon>()

/** Round frame marker with its number, plus a direction cone when the heading is known. */
export function frameIcon(frame: Pick<Frame, 'number' | 'heading'>, color: string, label: string | number = frame.number) {
  const heading = frame.heading == null ? null : Math.round(frame.heading / 5) * 5
  const key = `${label}|${heading}|${color}`
  let icon = iconCache.get(key)
  if (!icon) {
    const cone =
      heading == null
        ? ''
        : `<svg width="56" height="56" viewBox="0 0 56 56" style="position:absolute;left:-14px;top:-14px;transform:rotate(${heading}deg)"><path d="M28 28 L19 3 A26 26 0 0 1 37 3 Z" fill="${color}" fill-opacity="0.35"/></svg>`
    icon = L.divIcon({
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
      html: `<div style="position:relative;width:28px;height:28px">${cone}<div style="position:absolute;inset:0;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);display:grid;place-items:center;color:white;font:700 11px/1 system-ui,sans-serif">${label}</div></div>`,
    })
    iconCache.set(key, icon)
  }
  return icon
}

export const STATUS_HEX: Record<string, string> = {
  green: '#37b24d',
  yellow: '#f59f00',
  orange: '#f76707',
  blue: '#1c7ed6',
  grape: '#ae3ec9',
}
