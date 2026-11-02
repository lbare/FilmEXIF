import { Badge, Box, Card, Group, RingProgress, Stack, Text, type BadgeProps } from '@mantine/core'
import { Camera as CameraIcon, FilmStrip } from '@phosphor-icons/react'
import { Link } from 'react-router'
import { useData } from '../data/DataProvider'
import type { Roll, RollStatus } from '../data/types'
import { pushPullLabel } from '../lib/exposure'
import { filmLabel, formatDate, STATUS_META } from '../lib/format'

export function StatusBadge({ status, ...props }: { status: RollStatus } & BadgeProps) {
  const meta = STATUS_META[status]
  return (
    <Badge color={meta.color} variant="light" {...props}>
      {meta.label}
    </Badge>
  )
}

export function rollTitle(roll: Roll) {
  return roll.name || filmLabel(roll.film) || 'Untitled roll'
}

/** Shot frames vs. exposures as a ring, with the count in the middle. */
export function RollProgress({ shot, exposures, color, size = 52 }: { shot: number; exposures: number; color: string; size?: number }) {
  const pct = exposures ? Math.min(100, (shot / exposures) * 100) : 0
  return (
    <RingProgress
      size={size}
      thickness={4}
      roundCaps
      sections={[{ value: pct, color }]}
      label={
        <Text ta="center" fw={700} size={size > 60 ? 'lg' : 'sm'} className="tabular">
          {shot}
        </Text>
      }
    />
  )
}

export function RollCard({ roll, to }: { roll: Roll; to?: string }) {
  const { cameraById, framesByRoll } = useData()
  const frames = framesByRoll.get(roll.id) ?? []
  const shot = frames.filter((f) => f.status === 'shot').length
  const camera = roll.cameraId ? cameraById.get(roll.cameraId) : null
  const meta = STATUS_META[roll.status]
  const push = pushPullLabel(roll.film.iso, roll.ratedIso)
  const dateField = meta.dateField as keyof Roll

  return (
    <Card component={Link} to={to ?? `/rolls/${roll.id}`} p="sm" style={{ textDecoration: 'none' }}>
      <Group wrap="nowrap" gap="sm">
        <RollProgress shot={shot} exposures={roll.exposures} color={meta.color} />
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" wrap="nowrap" gap="xs">
            <Text fw={600} truncate>
              {rollTitle(roll)}
            </Text>
            <StatusBadge status={roll.status} size="sm" style={{ flexShrink: 0 }} />
          </Group>
          <Group gap={6} wrap="nowrap">
            <FilmStrip size={14} color="var(--mantine-color-dimmed)" style={{ flexShrink: 0 }} />
            <Text size="xs" c="dimmed" truncate>
              {roll.name ? `${filmLabel(roll.film)} · ` : ''}ISO {roll.ratedIso} · {roll.film.process}
              {push && ` (${push})`}
            </Text>
          </Group>
          <Group gap={6} wrap="nowrap" justify="space-between">
            <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
              <CameraIcon size={14} color="var(--mantine-color-dimmed)" style={{ flexShrink: 0 }} />
              <Text size="xs" c="dimmed" truncate>
                {camera?.name ?? 'No camera'}
              </Text>
            </Group>
            <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
              {formatDate((roll[dateField] as string | null) ?? roll.loadedAt, 'MMM D')}
            </Text>
          </Group>
        </Stack>
      </Group>
    </Card>
  )
}

const STEPS: RollStatus[] = ['loaded', 'finished', 'developing', 'developed', 'scanned']

/** Compact five-step track of where a roll is, with the date of each step reached. */
export function StatusTrack({ roll }: { roll: Roll }) {
  const current = STEPS.indexOf(roll.status)
  return (
    <Group gap={0} wrap="nowrap" align="flex-start">
      {STEPS.map((s, i) => {
        const meta = STATUS_META[s]
        const reached = i <= current
        const date = roll[meta.dateField as keyof Roll] as string | null
        return (
          <Stack key={s} gap={4} align="center" style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            {i > 0 && (
              <Box
                style={{
                  position: 'absolute',
                  top: 7,
                  right: '50%',
                  width: '100%',
                  height: 2,
                  background: reached ? `var(--mantine-color-${STATUS_META[STEPS[i]].color}-filled)` : 'var(--mantine-color-default-border)',
                }}
              />
            )}
            <Box
              style={{
                width: 16,
                height: 16,
                borderRadius: 99,
                zIndex: 1,
                background: reached ? `var(--mantine-color-${meta.color}-filled)` : 'var(--mantine-color-body)',
                border: `2px solid ${reached ? `var(--mantine-color-${meta.color}-filled)` : 'var(--mantine-color-default-border)'}`,
                boxShadow: i === current ? `0 0 0 4px var(--mantine-color-${meta.color}-light)` : undefined,
              }}
            />
            <Text size="11px" fw={i === current ? 700 : 500} c={reached ? undefined : 'dimmed'} ta="center" lh={1.2}>
              {meta.short}
            </Text>
            <Text size="10px" c="dimmed" ta="center">
              {reached && date ? formatDate(date, 'MMM D') : ' '}
            </Text>
          </Stack>
        )
      })}
    </Group>
  )
}
