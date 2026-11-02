import 'react-leaflet-cluster/dist/assets/MarkerCluster.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css'

import { ActionIcon, Anchor, Badge, Box, Button, Drawer, Group, Image, Indicator, Paper, Select, Stack, Text } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { FunnelSimple, MapTrifold } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import L from 'leaflet'
import { useMemo, useState } from 'react'
import { MapContainer, Marker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { Link } from 'react-router'
import { EmptyState } from '../../components/EmptyState'
import { frameSettings } from '../../components/FrameList'
import { Page } from '../../components/Page'
import { rollTitle } from '../../components/RollBits'
import { useData } from '../../data/DataProvider'
import type { Frame } from '../../data/types'
import { filmLabel, formatDateTime, STATUS_META } from '../../lib/format'
import { useIsMobile } from '../../lib/hooks'
import { usePhotoUrl } from '../../lib/photos'
import { FitBounds, frameIcon, STATUS_HEX, Tiles } from './mapUtils'

interface Filters {
  rollId: string | null
  cameraId: string | null
  film: string | null
  range: [string | null, string | null]
}

const EMPTY: Filters = { rollId: null, cameraId: null, film: null, range: [null, null] }

function clusterIcon(cluster: { getChildCount: () => number }) {
  const n = cluster.getChildCount()
  const size = n < 10 ? 34 : n < 100 ? 40 : 48
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:rgba(247,103,7,.85);border:3px solid rgba(255,255,255,.85);display:grid;place-items:center;color:white;font:700 13px/1 system-ui,sans-serif;box-shadow:0 1px 6px rgba(0,0,0,.35)">${n}</div>`,
  })
}

export default function MapPage() {
  const { frames, rolls, rollById, cameras, lensById } = useData()
  const mobile = useIsMobile()
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [open, setOpen] = useState(false)

  const filmOptions = useMemo(() => [...new Set(rolls.map((r) => filmLabel(r.film)))].sort(), [rolls])

  const located = useMemo(() => {
    const [from, to] = filters.range
    return frames.filter((f) => {
      if (!f.location || f.status !== 'shot') return false
      const roll = rollById.get(f.rollId)
      if (!roll) return false
      if (filters.rollId && f.rollId !== filters.rollId) return false
      if (filters.cameraId && roll.cameraId !== filters.cameraId) return false
      if (filters.film && filmLabel(roll.film) !== filters.film) return false
      if (from && dayjs(f.takenAt).isBefore(dayjs(from).startOf('day'))) return false
      if (to && dayjs(f.takenAt).isAfter(dayjs(to).endOf('day'))) return false
      return true
    })
  }, [frames, rollById, filters])

  const points = located.map((f) => [f.location!.lat, f.location!.lng] as [number, number])
  const activeCount = [filters.rollId, filters.cameraId, filters.film, filters.range[0]].filter(Boolean).length
  const anyLocated = frames.some((f) => f.location)

  if (!anyLocated) {
    return (
      <Page title="Map">
        <EmptyState
          icon={MapTrifold}
          title="No located frames yet"
          description="Frames logged with location turned on show up here. You can also add a location to any frame from its editor."
          action={
            <Button component={Link} to="/shoot">
              Log a frame
            </Button>
          }
        />
      </Page>
    )
  }

  const filterControls = (
    <Stack>
      <Select
        label="Roll"
        placeholder="All rolls"
        data={rolls.map((r) => ({ value: r.id, label: `${rollTitle(r)} · ${dayjs(r.loadedAt).format('MMM YYYY')}` }))}
        value={filters.rollId}
        onChange={(rollId) => setFilters((f) => ({ ...f, rollId }))}
        clearable
        searchable
      />
      <Select
        label="Camera"
        placeholder="All cameras"
        data={cameras.map((c) => ({ value: c.id, label: c.name }))}
        value={filters.cameraId}
        onChange={(cameraId) => setFilters((f) => ({ ...f, cameraId }))}
        clearable
      />
      <Select label="Film" placeholder="All films" data={filmOptions} value={filters.film} onChange={(film) => setFilters((f) => ({ ...f, film }))} clearable searchable />
      <DatePickerInput
        type="range"
        label="Dates"
        placeholder="Any time"
        value={filters.range}
        onChange={(range) => setFilters((f) => ({ ...f, range: range as [string | null, string | null] }))}
        clearable
        allowSingleDateInRange
      />
      <Button variant="subtle" color="gray" onClick={() => setFilters(EMPTY)} disabled={!activeCount}>
        Clear filters
      </Button>
    </Stack>
  )

  return (
    <Box
      pos="relative"
      style={{
        height:
          'calc(100dvh - var(--app-shell-header-offset, 0px) - var(--app-shell-footer-offset, 0px) - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      }}
    >
      <MapContainer center={points[0] ?? [20, 0]} zoom={3} minZoom={2} worldCopyJump style={{ height: "100%" }} zoomControl={!mobile}>
        <Tiles />
        <FitBounds points={points} />
        <MarkerClusterGroup chunkedLoading iconCreateFunction={clusterIcon} maxClusterRadius={48} showCoverageOnHover={false}>
          {located.map((f) => {
            const roll = rollById.get(f.rollId)!
            return (
              <Marker key={f.id} position={[f.location!.lat, f.location!.lng]} icon={frameIcon(f, STATUS_HEX[STATUS_META[roll.status].color])}>
                <Popup minWidth={200}>
                  <FramePopup frame={f} title={rollTitle(roll)} settings={frameSettings(f, f.lensId ? lensById.get(f.lensId)?.name : undefined)} />
                </Popup>
              </Marker>
            )
          })}
        </MarkerClusterGroup>
      </MapContainer>

      <Group pos="absolute" top={12} left={12} right={12} justify="space-between" style={{ zIndex: 1, pointerEvents: 'none' }} wrap="nowrap">
        <Paper shadow="md" px="sm" py={6} style={{ pointerEvents: 'auto' }}>
          <Text size="sm" fw={600}>
            {located.length} frame{located.length === 1 ? '' : 's'}
            {activeCount > 0 && (
              <Text span c="dimmed" size="sm">
                {' '}
                · filtered
              </Text>
            )}
          </Text>
        </Paper>
        <Indicator label={activeCount} size={18} disabled={!activeCount} style={{ pointerEvents: 'auto' }}>
          <ActionIcon size="xl" variant="default" onClick={() => setOpen(true)} aria-label="Filter map" style={{ boxShadow: 'var(--mantine-shadow-md)' }}>
            <FunnelSimple size={22} />
          </ActionIcon>
        </Indicator>
      </Group>

      {located.length === 0 && (
        <Paper shadow="md" p="md" pos="absolute" bottom={24} left="50%" style={{ transform: 'translateX(-50%)', zIndex: 1 }}>
          <Text size="sm">No frames match these filters.</Text>
        </Paper>
      )}

      <Drawer opened={open} onClose={() => setOpen(false)} title={<Text fw={700}>Filter map</Text>} position={mobile ? 'bottom' : 'right'} size={mobile ? 470 : 'sm'} styles={{ content: mobile ? { borderRadius: 'var(--mantine-radius-lg) var(--mantine-radius-lg) 0 0' } : undefined }}>
        <Box pb="calc(var(--mantine-spacing-md) + env(safe-area-inset-bottom))">{filterControls}</Box>
      </Drawer>
    </Box>
  )
}

function FramePopup({ frame, title, settings }: { frame: Frame; title: string; settings: string }) {
  const thumb = usePhotoUrl(frame, 'thumb')
  return (
    <Stack gap={4}>
      {thumb && <Image src={thumb} h={120} radius="sm" fit="cover" alt="" />}
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Text fw={700} size="sm" truncate>
          {title}
        </Text>
        <Badge size="sm" variant="light">
          #{frame.number}
        </Badge>
      </Group>
      <Text size="xs">{formatDateTime(frame.takenAt)}</Text>
      {settings && <Text size="xs">{settings}</Text>}
      {frame.notes && (
        <Text size="xs" c="dimmed" lineClamp={3}>
          {frame.notes}
        </Text>
      )}
      <Anchor component={Link} to={`/rolls/${frame.rollId}/frames/${frame.id}`} size="xs">
        Open frame →
      </Anchor>
    </Stack>
  )
}
