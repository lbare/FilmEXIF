import { Box, Card, Divider, Group, Stack, Text, UnstyledButton } from '@mantine/core'
import { Camera as PhotoIcon, MapPin, NotePencil } from '@phosphor-icons/react'
import { Fragment } from 'react'
import { Link } from 'react-router'
import { useData } from '../data/DataProvider'
import type { Frame } from '../data/types'
import { formatAperture } from '../lib/exposure'
import { formatDate, formatTime } from '../lib/format'

export function frameSettings(frame: Frame, lensName?: string) {
  const parts = [
    frame.aperture != null ? formatAperture(frame.aperture) : null,
    frame.shutter,
    frame.focalLength ? `${frame.focalLength}mm` : lensName,
    frame.exposureComp ? `${frame.exposureComp > 0 ? '+' : ''}${Math.round(frame.exposureComp * 3) / 3} EV` : null,
    frame.flash ? 'Flash' : null,
  ].filter(Boolean)
  return parts.join(' · ')
}

export function FrameList({ frames, rollId }: { frames: Frame[]; rollId: string }) {
  const { lensById } = useData()
  const days = frames.map((f) => formatDate(f.takenAt, 'ddd, MMM D'))
  return (
    <Card p={0}>
      {frames.map((f, i) => {
        const day = days[i]
        const showDay = i === 0 || day !== days[i - 1]
        const settings = frameSettings(f, f.lensId ? lensById.get(f.lensId)?.name : undefined)
        return (
          <Fragment key={f.id}>
            {showDay && (
              <Box px="md" py={6} bg="var(--mantine-color-default-hover)" style={i === 0 ? { borderRadius: 'var(--mantine-radius-lg) var(--mantine-radius-lg) 0 0' } : undefined}>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  {day}
                </Text>
              </Box>
            )}
            {!showDay && <Divider />}
            <UnstyledButton component={Link} to={`/rolls/${rollId}/frames/${f.id}`} px="md" py="sm" display="block" style={{ opacity: f.status === 'skipped' ? 0.5 : 1 }}>
              <Group wrap="nowrap" gap="sm">
                <Text fw={800} size="lg" w={32} ta="right" className="tabular" c={f.status === 'skipped' ? 'dimmed' : undefined}>
                  {f.number}
                </Text>
                <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={500} truncate>
                    {f.status === 'skipped' ? 'Skipped' : settings || 'No settings'}
                  </Text>
                  {f.notes && (
                    <Text size="xs" c="dimmed" truncate>
                      {f.notes}
                    </Text>
                  )}
                </Stack>
                <Group gap={6} wrap="nowrap" c="dimmed">
                  {f.photo && <PhotoIcon size={16} />}
                  {f.notes && <NotePencil size={16} />}
                  {f.location && <MapPin size={16} />}
                  <Text size="xs" w={58} ta="right" className="tabular">
                    {formatTime(f.takenAt)}
                  </Text>
                </Group>
              </Group>
            </UnstyledButton>
          </Fragment>
        )
      })}
      {frames.length === 0 && (
        <Text c="dimmed" size="sm" ta="center" p="lg">
          No frames logged yet.
        </Text>
      )}
    </Card>
  )
}

