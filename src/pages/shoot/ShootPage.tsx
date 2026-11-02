import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Collapse,
  Container,
  FileButton,
  Group,
  Image,
  Modal,
  Paper,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  Camera as CameraIcon,
  CaretDown,
  CaretLeft,
  CaretUp,
  Compass,
  MapPin,
  MapPinLine,
  SkipForward,
  X,
} from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { frameSettings } from '../../components/FrameList'
import { RollProgress, rollTitle } from '../../components/RollBits'
import { StopPicker } from '../../components/StopPicker'
import type { NewDoc } from '../../data/api'
import { useApi, useData } from '../../data/DataProvider'
import type { Aperture, Frame, Lens, Roll } from '../../data/types'
import { apertureOptions, EXPOSURE_COMP, focalOptions, formatAperture, formatStops, pushPullLabel, shutterOptions } from '../../lib/exposure'
import { filmLabel, formatTime } from '../../lib/format'
import { storeLocalPhoto } from '../../lib/photos'
import { compassPoint, toGeoPoint, useCompass, usePosition } from '../../lib/sensors'

interface ShotSettings {
  aperture: Aperture | null
  shutter: string | null
  lensId: string | null
  focalLength: number | null
  exposureComp: number | null
  flash: boolean
  filter: string
}

/** Start from the last shot frame's settings, so most frames are a single tap. */
function initialSettings(roll: Roll, frames: Frame[], lensById: Map<string, Lens>, defaultLensId: string | null): ShotSettings {
  const last = frames.toReversed().find((f) => f.status === 'shot')
  if (last) {
    return {
      aperture: last.aperture,
      shutter: last.shutter,
      lensId: last.lensId,
      focalLength: last.focalLength,
      exposureComp: last.exposureComp,
      flash: false,
      filter: last.filter,
    }
  }
  const lensId = roll.lensId ?? defaultLensId
  const lens = lensId ? lensById.get(lensId) : null
  return { aperture: null, shutter: null, lensId: lensId ?? null, focalLength: lens ? lens.focalMin : null, exposureComp: null, flash: false, filter: '' }
}

export default function ShootPage() {
  const { rollId } = useParams()
  const { rollById, framesByRoll, cameraById, lensById, lenses } = useData()
  const roll = rollId ? rollById.get(rollId) : undefined
  if (!roll) {
    return (
      <Container py="xl">
        <Text>Roll not found.</Text>
        <Button component={Link} to="/" mt="md">
          Back to rolls
        </Button>
      </Container>
    )
  }
  const camera = roll.cameraId ? (cameraById.get(roll.cameraId) ?? null) : null
  return (
    <Shoot
      key={roll.id}
      roll={roll}
      frames={framesByRoll.get(roll.id) ?? []}
      cameraName={camera?.name}
      initial={initialSettings(roll, framesByRoll.get(roll.id) ?? [], lensById, camera?.defaultLensId ?? null)}
      apertureFor={(lens) => apertureOptions(lens, camera)}
      shutters={shutterOptions(camera)}
      lenses={lenses}
      lensById={lensById}
    />
  )
}

interface ShootProps {
  roll: Roll
  frames: Frame[]
  cameraName?: string
  initial: ShotSettings
  apertureFor: (lens: Lens | null) => Aperture[]
  shutters: string[]
  lenses: Lens[]
  lensById: Map<string, Lens>
}

function Shoot({ roll, frames, cameraName, initial, apertureFor, shutters, lenses, lensById }: ShootProps) {
  const api = useApi()
  const navigate = useNavigate()
  const position = usePosition()
  const compass = useCompass()
  const [settings, setSettings] = useState<ShotSettings>(initial)
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [more, setMore] = useState(false)
  const [lastFramePrompt, setLastFramePrompt] = useState(false)
  const lastToast = useRef<string | null>(null)

  const lens = settings.lensId ? (lensById.get(settings.lensId) ?? null) : null
  const apertures = useMemo(() => apertureFor(lens), [apertureFor, lens])
  const focals = focalOptions(lens)
  const nextNumber = frames.length ? Math.max(...frames.map((f) => f.number)) + 1 : 1
  const shot = frames.filter((f) => f.status === 'shot').length
  const extra = nextNumber > roll.exposures
  const recent = frames.slice(-3).toReversed()
  const push = pushPullLabel(roll.film.iso, roll.ratedIso)
  const geo = toGeoPoint(position.fix)

  const photoPreview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo])
  useEffect(() => () => (photoPreview ? URL.revokeObjectURL(photoPreview) : undefined), [photoPreview])

  const set = <K extends keyof ShotSettings>(k: K, v: ShotSettings[K]) => setSettings((s) => ({ ...s, [k]: v }))

  const pickLens = (id: string | null) => {
    const l = id ? lensById.get(id) : null
    const options = apertureFor(l ?? null)
    setSettings((s) => ({
      ...s,
      lensId: id,
      focalLength: l ? (l.focalMin === l.focalMax ? l.focalMin : s.focalLength && s.focalLength >= l.focalMin && s.focalLength <= l.focalMax ? s.focalLength : l.focalMin) : null,
      aperture: s.aperture != null && options.includes(s.aperture) ? s.aperture : null,
    }))
  }

  const log = async (status: Frame['status']) => {
    const id = api.newId('frames')
    const frame: NewDoc<'frames'> = {
      rollId: roll.id,
      number: nextNumber,
      takenAt: new Date().toISOString(),
      status,
      location: toGeoPoint(position.fix),
      heading: compass.heading ?? (position.fix?.coords.heading != null && !Number.isNaN(position.fix.coords.heading) ? Math.round(position.fix.coords.heading) : null),
      ...(status === 'shot'
        ? settings
        : { aperture: null, shutter: null, lensId: null, focalLength: null, exposureComp: null, flash: false, filter: '' }),
      notes: notes.trim(),
      photo: null,
    }
    if (photo && status === 'shot') {
      try {
        frame.photo = await storeLocalPhoto(id, photo)
      } catch (err) {
        notifications.show({ color: 'red', message: `Couldn’t save the photo: ${(err as Error).message}` })
      }
    }
    api.logFrame(frame, id)
    navigator.vibrate?.(30)
    setNotes('')
    setPhoto(null)
    setSettings((s) => ({ ...s, flash: false }))
    const notifId = `frame-${id}`
    // One toast at a time: each new frame replaces the previous confirmation.
    if (lastToast.current) notifications.hide(lastToast.current)
    lastToast.current = notifId
    notifications.show({
      id: notifId,
      autoClose: 4000,
      withCloseButton: false,
      message: (
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm">
            {status === 'shot' ? `Frame ${frame.number} logged` : `Frame ${frame.number} skipped`}
            {frame.location ? '' : ' (no location)'}
          </Text>
          <Button
            size="compact-sm"
            variant="subtle"
            onClick={() => {
              api.remove('frames', id)
              notifications.hide(notifId)
            }}
          >
            Undo
          </Button>
        </Group>
      ),
    })
    if (frame.number === roll.exposures) setLastFramePrompt(true)
  }

  return (
    <Box style={{ minHeight: 'calc(100dvh - var(--app-shell-header-offset, 0px) - env(safe-area-inset-top) - env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column' }}>
      <Container size="sm" px="md" pt="sm" pb="md" w="100%" style={{ flex: 1 }}>
        <Stack gap="md">
          <Group wrap="nowrap" gap="xs">
            <ActionIcon variant="subtle" color="gray" size="lg" onClick={() => navigate(`/rolls/${roll.id}`)} aria-label="Back to roll">
              <CaretLeft size={22} />
            </ActionIcon>
            <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
              <Text fw={700} truncate>
                {rollTitle(roll)}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {[cameraName, `${roll.name ? `${filmLabel(roll.film)} · ` : ''}ISO ${roll.ratedIso}${push ? ` (${push})` : ''}`].filter(Boolean).join(' · ')}
              </Text>
            </Stack>
            <RollProgress shot={shot} exposures={roll.exposures} color="green" size={48} />
          </Group>

          <Group gap="xs">
            <LocationChip status={position.status} accuracy={geo?.accuracy ?? null} error={position.error} onRetry={position.retry} />
            {compass.state === 'on' && compass.heading != null && (
              <Badge size="lg" variant="light" color="gray" tt="none" leftSection={<Compass size={14} />} className="tabular">
                {compassPoint(compass.heading)} {compass.heading}°
              </Badge>
            )}
            {compass.state === 'needs-permission' && (
              <Button size="compact-sm" variant="light" color="gray" leftSection={<Compass size={14} />} onClick={compass.enable}>
                Enable compass
              </Button>
            )}
          </Group>

          <Paper withBorder p="md" ta="center">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              {extra ? 'Extra frame' : 'Next frame'}
            </Text>
            <Text fz={56} fw={800} lh={1} className="tabular">
              {nextNumber}
            </Text>
            <Text size="sm" c="dimmed">
              of {roll.exposures}
            </Text>
          </Paper>

          {lenses.length > 0 && (
            <Select
              label="Lens"
              placeholder="No lens"
              data={lenses.filter((l) => !l.retired || l.id === settings.lensId).map((l) => ({ value: l.id, label: l.name }))}
              value={settings.lensId}
              onChange={pickLens}
              clearable
              size="md"
            />
          )}
          {focals.length > 0 && (
            <StopPicker label="Focal length" options={focals} value={settings.focalLength} onChange={(v) => set('focalLength', v)} format={(f) => `${f}`} />
          )}
          <StopPicker label="Aperture" options={apertures} value={settings.aperture} onChange={(v) => set('aperture', v)} format={formatAperture} />
          <StopPicker label="Shutter" options={shutters} value={settings.shutter} onChange={(v) => set('shutter', v)} />

          <UnstyledButton onClick={() => setMore((m) => !m)}>
            <Group gap={6} c="dimmed">
              {more ? <CaretUp size={14} /> : <CaretDown size={14} />}
              <Text size="sm" fw={600}>
                Note, photo, exposure comp, flash
              </Text>
              {(notes || photo || settings.exposureComp || settings.flash || settings.filter) && (
                <Badge size="xs" variant="filled">
                  set
                </Badge>
              )}
            </Group>
          </UnstyledButton>
          <Collapse expanded={more}>
            <Stack>
              <Textarea placeholder="Note for this frame" autosize minRows={2} value={notes} onChange={(e) => setNotes(e.currentTarget.value)} />
              <Group align="center" wrap="nowrap">
                <FileButton onChange={setPhoto} accept="image/*" capture="environment">
                  {(props) => (
                    <Button variant="default" leftSection={<CameraIcon size={18} />} {...props}>
                      {photo ? 'Retake photo' : 'Reference photo'}
                    </Button>
                  )}
                </FileButton>
                {photoPreview && (
                  <Box pos="relative">
                    <Image src={photoPreview} h={56} w={56} radius="sm" fit="cover" alt="Reference photo" />
                    <ActionIcon size="xs" radius="xl" color="dark" pos="absolute" top={-6} right={-6} onClick={() => setPhoto(null)} aria-label="Remove photo">
                      <X size={10} />
                    </ActionIcon>
                  </Box>
                )}
              </Group>
              <StopPicker
                label="Exposure compensation"
                options={EXPOSURE_COMP}
                value={settings.exposureComp}
                onChange={(v) => set('exposureComp', v === 0 ? null : v)}
                format={(v) => formatStops(v)}
              />
              <Group grow>
                <Switch label="Flash" checked={settings.flash} onChange={(e) => set('flash', e.currentTarget.checked)} />
                <TextInput placeholder="Filter (e.g. yellow)" value={settings.filter} onChange={(e) => set('filter', e.currentTarget.value)} />
              </Group>
            </Stack>
          </Collapse>

          {recent.length > 0 && (
            <Stack gap={4}>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Recent
              </Text>
              {recent.map((f) => (
                <UnstyledButton key={f.id} component={Link} to={`/rolls/${roll.id}/frames/${f.id}`}>
                  <Group gap="sm" wrap="nowrap">
                    <Text fw={700} w={28} ta="right" className="tabular">
                      {f.number}
                    </Text>
                    <Text size="sm" style={{ flex: 1 }} truncate c={f.status === 'skipped' ? 'dimmed' : undefined}>
                      {f.status === 'skipped' ? 'Skipped' : frameSettings(f, f.lensId ? lensById.get(f.lensId)?.name : undefined) || 'No settings'}
                    </Text>
                    {!f.location && <MapPinLine size={14} color="var(--mantine-color-dimmed)" />}
                    <Text size="xs" c="dimmed">
                      {formatTime(f.takenAt)}
                    </Text>
                  </Group>
                </UnstyledButton>
              ))}
            </Stack>
          )}
        </Stack>
      </Container>

      <Box
        pos="sticky"
        bottom={0}
        px="md"
        pt="sm"
        pb="calc(var(--mantine-spacing-sm) + env(safe-area-inset-bottom))"
        bg="var(--mantine-color-body)"
        style={{ borderTop: '1px solid var(--mantine-color-default-border)', zIndex: 5 }}
      >
        <Container size="sm" p={0}>
          <Group wrap="nowrap" gap="sm">
            <Tooltip label="Log a skipped or blank frame">
              <Button variant="default" size="xl" px="md" onClick={() => log('skipped')} aria-label="Skip frame">
                <SkipForward size={22} />
              </Button>
            </Tooltip>
            <Button size="xl" style={{ flex: 1 }} onClick={() => log('shot')}>
              Log frame {nextNumber}
            </Button>
          </Group>
        </Container>
      </Box>

      <Modal opened={lastFramePrompt} onClose={() => setLastFramePrompt(false)} title="That was the last frame" withCloseButton={false}>
        <Text size="sm" mb="md">
          You’ve logged all {roll.exposures} exposures. Finish the roll, or keep going if your camera squeezes out a few extra.
        </Text>
        <Group grow>
          <Button variant="default" onClick={() => setLastFramePrompt(false)}>
            Keep shooting
          </Button>
          <Button
            onClick={() => {
              api.setRollStatus(roll, 'finished')
              navigate(`/rolls/${roll.id}`, { replace: true })
            }}
          >
            Finish roll
          </Button>
        </Group>
      </Modal>
    </Box>
  )
}

function LocationChip({ status, accuracy, error, onRetry }: { status: string; accuracy: number | null; error: string | null; onRetry: () => void }) {
  if (status === 'ok' && accuracy != null) {
    const color = accuracy <= 25 ? 'green' : accuracy <= 100 ? 'yellow' : 'orange'
    return (
      <Badge size="lg" variant="light" color={color} tt="none" leftSection={<MapPin size={14} weight="fill" />} className="tabular">
        ±{accuracy} m
      </Badge>
    )
  }
  if (status === 'locating') {
    return (
      <Badge size="lg" variant="light" color="gray" tt="none" leftSection={<MapPin size={14} />}>
        Locating…
      </Badge>
    )
  }
  return (
    <Tooltip label={error ?? 'Location unavailable'}>
      <Badge size="lg" variant="light" color="red" tt="none" leftSection={<MapPinLine size={14} />} style={{ cursor: 'pointer' }} onClick={onRetry}>
        {status === 'unsupported' ? 'No GPS' : 'No location · retry'}
      </Badge>
    </Tooltip>
  )
}
