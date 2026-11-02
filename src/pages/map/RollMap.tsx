import { Anchor, Paper, Stack, Text } from '@mantine/core'
import { MapContainer, Marker, Polyline, Popup } from 'react-leaflet'
import { Link } from 'react-router'
import { frameSettings } from '../../components/FrameList'
import type { Frame } from '../../data/types'
import { formatDateTime } from '../../lib/format'
import { FitBounds, frameIcon, Tiles } from './mapUtils'

/** A roll's frames in shooting order, joined by a path. */
export default function RollMap({ frames, height = 260 }: { frames: Frame[]; height?: number }) {
  const located = frames
    .filter((f) => f.location)
    .sort((a, b) => a.takenAt.localeCompare(b.takenAt))
  const points = located.map((f) => [f.location!.lat, f.location!.lng] as [number, number])
  const color = 'var(--mantine-primary-color-filled)'

  return (
    <Paper withBorder style={{ overflow: 'hidden', height }}>
      <MapContainer center={points[0] ?? [0, 0]} zoom={13} style={{ height: '100%' }} scrollWheelZoom={false}>
        <Tiles />
        <FitBounds points={points} />
        {points.length > 1 && <Polyline positions={points} pathOptions={{ color: '#f76707', weight: 2, opacity: 0.6, dashArray: '4 6' }} />}
        {located.map((f) => (
          <Marker key={f.id} position={[f.location!.lat, f.location!.lng]} icon={frameIcon(f, '#f76707')}>
            <Popup>
              <Stack gap={2}>
                <Text fw={700} size="sm">
                  Frame {f.number}
                </Text>
                <Text size="xs">{formatDateTime(f.takenAt)}</Text>
                <Text size="xs">{frameSettings(f) || 'No settings'}</Text>
                {f.notes && (
                  <Text size="xs" c="dimmed">
                    {f.notes}
                  </Text>
                )}
                <Anchor component={Link} to={`/rolls/${f.rollId}/frames/${f.id}`} size="xs" c={color}>
                  Open frame
                </Anchor>
              </Stack>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Paper>
  )
}
