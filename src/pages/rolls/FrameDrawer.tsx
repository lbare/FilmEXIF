import {
  ActionIcon,
  Box,
  Button,
  Drawer,
  FileButton,
  Group,
  Image,
  NumberInput,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { modals } from '@mantine/modals'
import { Camera as CameraIcon, Trash } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import { lazy, Suspense, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { StopPicker } from '../../components/StopPicker'
import { useApi, useData } from '../../data/DataProvider'
import type { Frame } from '../../data/types'
import { apertureOptions, ev100, EXPOSURE_COMP, focalOptions, formatAperture, formatStops, shutterOptions } from '../../lib/exposure'
import { useIsMobile } from '../../lib/hooks'
import { deleteLocalPhoto, storeLocalPhoto, usePhotoUrl } from '../../lib/photos'
import { compassPoint } from '../../lib/sensors'

const LocationPicker = lazy(() => import('../map/LocationPicker'))

/** Edit one frame. Rendered as a nested route of the roll page. */
export default function FrameDrawer() {
  const { rollId, frameId } = useParams()
  const { frames } = useData()
  const navigate = useNavigate()
  const mobile = useIsMobile()
  const frame = frames.find((f) => f.id === frameId)
  const close = () => navigate(`/rolls/${rollId}`, { replace: true })

  return (
    <Drawer
      opened
      onClose={close}
      position={mobile ? 'bottom' : 'right'}
      size={mobile ? '92%' : 'md'}
      title={<Text fw={700} size="lg">{frame ? `Frame ${frame.number}` : 'Frame not found'}</Text>}
      styles={{ content: mobile ? { borderRadius: 'var(--mantine-radius-lg) var(--mantine-radius-lg) 0 0' } : undefined, body: { paddingBottom: 'calc(var(--mantine-spacing-md) + env(safe-area-inset-bottom))' } }}
    >
      {frame ? <FrameForm key={frame.id} frame={frame} onDone={close} /> : <Text c="dimmed">It may have been deleted.</Text>}
    </Drawer>
  )
}

function FrameForm({ frame, onDone }: { frame: Frame; onDone: () => void }) {
  const api = useApi()
  const { rollById, cameraById, lensById, lenses, framesByRoll } = useData()
  const roll = rollById.get(frame.rollId)
  const camera = roll?.cameraId ? cameraById.get(roll.cameraId) : null
  const [draft, setDraft] = useState(frame)
  const [takenAt, setTakenAt] = useState(dayjs(frame.takenAt).format('YYYY-MM-DD HH:mm:ss'))
  const [newPhoto, setNewPhoto] = useState<File | null>(null)
  const photoUrl = usePhotoUrl(draft.photo ? frame : undefined, 'full')
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof Frame>(k: K, v: Frame[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const lens = draft.lensId ? lensById.get(draft.lensId) : null
  const apertures = apertureOptions(lens, camera)
  const shutters = shutterOptions(camera)
  // Keep values that came from elsewhere (e.g. a lens change) selectable.
  if (draft.aperture != null && !apertures.includes(draft.aperture)) apertures.push(draft.aperture)
  if (draft.shutter && !shutters.includes(draft.shutter)) shutters.push(draft.shutter)
  const focals = focalOptions(lens)
  const ev = roll ? ev100(draft.aperture, draft.shutter, roll.ratedIso) : null
  const siblings = (framesByRoll.get(frame.rollId) ?? []).filter((f) => f.location && f.id !== frame.id)
  const fallback = siblings.length ? ([siblings[0].location!.lat, siblings[0].location!.lng] as [number, number]) : null

  const save = async () => {
    setSaving(true)
    let photo = draft.photo
    if (newPhoto) {
      photo = await storeLocalPhoto(frame.id, newPhoto)
    } else if (!draft.photo && frame.photo) {
      await deleteLocalPhoto(frame.id)
    }
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = draft
    api.update('frames', frame.id, { ...rest, photo, takenAt: dayjs(takenAt).toISOString(), notes: draft.notes.trim() })
    setSaving(false)
    onDone()
  }

  const remove = () =>
    modals.openConfirmModal({
      title: `Delete frame ${frame.number}?`,
      children: <Text size="sm">Other frames keep their numbers. Use “Renumber frames” on the roll if you want to close the gap.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        api.remove('frames', frame.id)
        void deleteLocalPhoto(frame.id)
        onDone()
      },
    })

  return (
    <Stack>
      <Group grow align="flex-start">
        <NumberInput label="Frame #" min={0} max={999} value={draft.number} onChange={(v) => set('number', Number(v) || 0)} />
        <DateTimePicker label="Taken" valueFormat="MMM D, h:mm A" value={takenAt} onChange={(v) => v && setTakenAt(v)} />
      </Group>
      <SegmentedControl
        value={draft.status}
        onChange={(v) => set('status', v as Frame['status'])}
        data={[
          { value: 'shot', label: 'Shot' },
          { value: 'skipped', label: 'Skipped / blank' },
        ]}
      />

      {lenses.length > 0 && (
        <Select
          label="Lens"
          placeholder="No lens"
          data={lenses.filter((l) => !l.retired || l.id === draft.lensId).map((l) => ({ value: l.id, label: l.name }))}
          value={draft.lensId}
          onChange={(id) => {
            const l = id ? lensById.get(id) : null
            setDraft((d) => ({ ...d, lensId: id, focalLength: l && l.focalMin === l.focalMax ? l.focalMin : d.focalLength }))
          }}
          clearable
        />
      )}
      {focals.length > 0 ? (
        <StopPicker label="Focal length" options={focals} value={draft.focalLength} onChange={(v) => set('focalLength', v)} />
      ) : (
        !lens && (
          <NumberInput label="Focal length" suffix="mm" min={1} value={draft.focalLength ?? ''} onChange={(v) => set('focalLength', v === '' ? null : Number(v))} />
        )
      )}
      <StopPicker label="Aperture" options={apertures} value={draft.aperture} onChange={(v) => set('aperture', v)} format={formatAperture} />
      <StopPicker label="Shutter" options={shutters} value={draft.shutter} onChange={(v) => set('shutter', v)} />
      {ev != null && (
        <Text size="xs" c="dimmed">
          Scene brightness ≈ EV {ev.toFixed(1)} (at ISO 100)
        </Text>
      )}
      <StopPicker
        label="Exposure compensation"
        options={EXPOSURE_COMP}
        value={draft.exposureComp ?? 0}
        onChange={(v) => set('exposureComp', v ? v : null)}
        format={formatStops}
      />
      <Group grow>
        <Switch label="Flash" checked={draft.flash} onChange={(e) => set('flash', e.currentTarget.checked)} />
        <TextInput placeholder="Filter" value={draft.filter} onChange={(e) => set('filter', e.currentTarget.value)} />
      </Group>
      <Textarea label="Notes" autosize minRows={2} value={draft.notes} onChange={(e) => set('notes', e.currentTarget.value)} />

      <Box>
        <Text size="sm" fw={500} mb={4}>
          Reference photo
        </Text>
        <Group align="flex-start" wrap="nowrap">
          {newPhoto ? (
            <Image src={URL.createObjectURL(newPhoto)} h={96} w={96} radius="md" fit="cover" alt="" />
          ) : draft.photo && photoUrl ? (
            <a href={photoUrl} target="_blank" rel="noreferrer">
              <Image src={photoUrl} h={96} w={96} radius="md" fit="cover" alt={`Reference for frame ${frame.number}`} />
            </a>
          ) : draft.photo ? (
            <Paper withBorder h={96} w={96} />
          ) : null}
          <Stack gap={6}>
            <FileButton onChange={setNewPhoto} accept="image/*" capture="environment">
              {(props) => (
                <Button size="xs" variant="default" leftSection={<CameraIcon size={14} />} {...props}>
                  {draft.photo || newPhoto ? 'Replace' : 'Add photo'}
                </Button>
              )}
            </FileButton>
            {(draft.photo || newPhoto) && (
              <Button
                size="xs"
                variant="subtle"
                color="red"
                onClick={() => {
                  setNewPhoto(null)
                  set('photo', null)
                }}
              >
                Remove
              </Button>
            )}
            {draft.photo?.status === 'local' && !newPhoto && (
              <Text size="xs" c="dimmed" maw={180}>
                Only on the device that took it until it uploads.
              </Text>
            )}
          </Stack>
        </Group>
      </Box>

      <Box>
        <Group justify="space-between" mb={4}>
          <Text size="sm" fw={500}>
            Location
          </Text>
          {draft.heading != null && (
            <Text size="xs" c="dimmed">
              Facing {compassPoint(draft.heading)} ({draft.heading}°)
            </Text>
          )}
        </Group>
        <Suspense fallback={<Paper withBorder h={220} />}>
          <LocationPicker value={draft.location} onChange={(v) => set('location', v)} fallbackCenter={fallback} label={draft.number} />
        </Suspense>
      </Box>

      <Group justify="space-between" mt="sm">
        <ActionIcon variant="subtle" color="red" size="lg" onClick={remove} aria-label="Delete frame">
          <Trash size={20} />
        </ActionIcon>
        <Group gap="xs">
          <Button variant="default" onClick={onDone}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save
          </Button>
        </Group>
      </Group>
    </Stack>
  )
}
