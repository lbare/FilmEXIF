import { Button, Group, Paper, Stack, Text } from '@mantine/core'
import { Crosshair, Trash } from '@phosphor-icons/react'
import { useState } from 'react'
import { MapContainer, Marker, useMapEvents } from 'react-leaflet'
import type { GeoPoint } from '../../data/types'
import { FitBounds, frameIcon, Tiles } from './mapUtils'

function ClickToSet({ onSet }: { onSet: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onSet(e.latlng.lat, e.latlng.lng) })
  return null
}

/** Tap the map or drag the pin to set where a frame was taken. */
export default function LocationPicker({
  value,
  onChange,
  fallbackCenter,
  label,
}: {
  value: GeoPoint | null
  onChange: (value: GeoPoint | null) => void
  fallbackCenter: [number, number] | null
  label: number
}) {
  const [locating, setLocating] = useState(false)
  const center: [number, number] = value ? [value.lat, value.lng] : (fallbackCenter ?? [20, 0])
  const set = (lat: number, lng: number) => onChange({ lat, lng, accuracy: null, altitude: null })

  const useCurrent = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        onChange({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          altitude: pos.coords.altitude == null ? null : Math.round(pos.coords.altitude),
        })
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 20_000 },
    )
  }

  return (
    <Stack gap={6}>
      <Paper withBorder style={{ overflow: 'hidden', height: 220 }}>
        <MapContainer center={center} zoom={value || fallbackCenter ? 15 : 2} style={{ height: '100%' }}>
          <Tiles />
          <ClickToSet onSet={set} />
          {value && <FitBounds points={[[value.lat, value.lng]]} maxZoom={16} />}
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={frameIcon({ number: label, heading: null }, '#f76707')}
              draggable
              eventHandlers={{ dragend: (e) => set(e.target.getLatLng().lat, e.target.getLatLng().lng) }}
            />
          )}
        </MapContainer>
      </Paper>
      <Group justify="space-between" wrap="nowrap">
        <Text size="xs" c="dimmed" className="tabular">
          {value
            ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}${value.accuracy ? ` ±${value.accuracy} m` : ''}${value.altitude != null ? ` · ${value.altitude} m alt` : ''}`
            : 'No location. Tap the map to set one.'}
        </Text>
        <Group gap={4} wrap="nowrap">
          <Button size="compact-xs" variant="subtle" leftSection={<Crosshair size={14} />} onClick={useCurrent} loading={locating}>
            Here
          </Button>
          {value && (
            <Button size="compact-xs" variant="subtle" color="red" leftSection={<Trash size={14} />} onClick={() => onChange(null)}>
              Clear
            </Button>
          )}
        </Group>
      </Group>
    </Stack>
  )
}
