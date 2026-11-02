import {
  Alert,
  Autocomplete,
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  Collapse,
  Group,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  TagsInput,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { CaretDown, CaretUp, Warning } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { Page } from '../../components/Page'
import { rollTitle } from '../../components/RollBits'
import type { NewDoc } from '../../data/api'
import { useApi, useData } from '../../data/DataProvider'
import { defaultExposures, EXPOSURE_OPTIONS, FILM_PRESETS } from '../../data/presets'
import type { Format, Process, Roll } from '../../data/types'
import { pushPullLabel } from '../../lib/exposure'
import { FORMAT_OPTIONS, PROCESS_OPTIONS } from '../../lib/format'
import { stripBase } from '../gear/CameraForm'
import { currencySymbol } from '../fridge/FilmForm'

type Values = Omit<NewDoc<'rolls'>, 'loadedAt'> & { loadedAt: string; filmSource: 'fridge' | 'other' }

const toPicker = (iso: string) => dayjs(iso).format('YYYY-MM-DD HH:mm:ss')
const fromPicker = (v: string) => dayjs(v).toISOString()

export default function RollFormPage() {
  const { rollId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { rollById, cameras, lenses, films, filmById, rolls, cameraById, profile } = useData()
  const api = useApi()
  const editing = rollId ? rollById.get(rollId) : undefined
  const [finishOther, setFinishOther] = useState(true)
  const [showMore, setShowMore] = useState(Boolean(editing))

  const [initial] = useState<Values>(() => {
    if (editing) return { ...stripBase(editing), loadedAt: toPicker(editing.loadedAt), filmSource: editing.filmId ? 'fridge' : 'other' }
    const inStock = films.filter((f) => f.stock > 0)
    const film = films.find((f) => f.id === params.get('film')) ?? (inStock.length === 1 ? inStock[0] : null)
    const camera = cameras.find((c) => !c.retired) ?? null
    const format = film?.format ?? camera?.format ?? '35mm'
    return {
      name: '',
      status: 'loaded',
      cameraId: camera?.id ?? null,
      lensId: camera?.defaultLensId ?? null,
      filmId: film?.id ?? null,
      film: film ? { brand: film.brand, name: film.name, iso: film.iso, process: film.process } : { brand: '', name: '', iso: 400, process: 'C-41' },
      ratedIso: film?.iso ?? 400,
      exposures: film?.exposures ?? defaultExposures(format),
      format,
      loadedAt: toPicker(new Date().toISOString()),
      finishedAt: null,
      developingAt: null,
      developedAt: null,
      scannedAt: null,
      lab: '',
      devNotes: '',
      notes: '',
      tags: [],
      costs: { film: film?.pricePerRoll ?? null, dev: null, scan: null },
      filmSource: film || films.some((f) => f.stock > 0) ? 'fridge' : 'other',
    }
  })

  const form = useForm<Values>({
    initialValues: initial,
    validate: {
      filmId: (v, values) => (values.filmSource === 'fridge' && !v ? 'Pick a film' : null),
      film: {
        brand: (v, values) => (values.filmSource === 'other' && !v.trim() ? 'Required' : null),
        name: (v, values) => (values.filmSource === 'other' && !v.trim() ? 'Required' : null),
        iso: (v) => (v > 0 ? null : 'Required'),
      },
      ratedIso: (v) => (v > 0 ? null : 'Required'),
      exposures: (v) => (v > 0 ? null : 'Required'),
    },
  })
  const v = form.values

  if (rollId && !editing) {
    return (
      <Page title="Roll not found" back="/">
        <Text c="dimmed">This roll may have been deleted.</Text>
      </Page>
    )
  }

  const camera = v.cameraId ? cameraById.get(v.cameraId) : null
  const otherLoaded = !editing && camera ? rolls.find((r) => r.status === 'loaded' && r.cameraId === camera.id) : undefined
  const push = pushPullLabel(v.film.iso, v.ratedIso)
  const fridgeFilms = films.filter((f) => f.stock > 0 || f.id === v.filmId)
  const symbol = currencySymbol(profile.currency)

  const pickCamera = (id: string | null) => {
    const c = id ? cameraById.get(id) : null
    form.setValues({
      cameraId: id,
      lensId: c?.defaultLensId ?? v.lensId,
      ...(c && !v.filmId && c.format !== v.format ? { format: c.format, exposures: defaultExposures(c.format) } : {}),
    })
  }

  const pickFilm = (id: string | null) => {
    const f = id ? filmById.get(id) : null
    if (!f) return form.setFieldValue('filmId', null)
    form.setValues({
      filmId: f.id,
      film: { brand: f.brand, name: f.name, iso: f.iso, process: f.process },
      ratedIso: f.iso,
      format: f.format,
      exposures: f.exposures,
      costs: { ...v.costs, film: f.pricePerRoll ?? v.costs.film },
    })
  }

  const pickPreset = (label: string) => {
    const p = FILM_PRESETS.find((x) => `${x.brand} ${x.name}` === label)
    if (p) form.setValues({ film: { brand: p.brand, name: p.name, iso: p.iso, process: p.process }, ratedIso: p.iso })
  }

  const submit = form.onSubmit(({ filmSource, ...values }) => {
    const roll: NewDoc<'rolls'> = {
      ...values,
      filmId: filmSource === 'fridge' ? values.filmId : null,
      film: { ...values.film, brand: values.film.brand.trim(), name: values.film.name.trim() },
      name: values.name.trim(),
      loadedAt: fromPicker(values.loadedAt),
    }
    if (editing) {
      api.update('rolls', editing.id, roll)
      navigate(`/rolls/${editing.id}`, { replace: true })
      return
    }
    if (otherLoaded && finishOther) api.setRollStatus(otherLoaded, 'finished')
    const id = api.loadRoll(roll, roll.filmId ? (filmById.get(roll.filmId) ?? null) : null)
    navigate(`/rolls/${id}/shoot`, { replace: true })
  })

  const costInput = (key: keyof Roll['costs'], label: string) => (
    <NumberInput
      label={label}
      min={0}
      decimalScale={2}
      prefix={symbol}
      value={v.costs[key] ?? ''}
      onChange={(n) => form.setFieldValue(`costs.${key}`, n === '' ? null : Number(n))}
    />
  )

  return (
    <Page title={editing ? `Edit ${rollTitle(editing)}` : 'Load a roll'} back size="sm">
      <form onSubmit={submit}>
        <Stack>
          <Card>
            <Stack>
              <Select
                label="Camera"
                placeholder={cameras.length ? 'Pick a camera' : 'No cameras yet'}
                data={cameras.filter((c) => !c.retired || c.id === v.cameraId).map((c) => ({ value: c.id, label: c.name }))}
                value={v.cameraId}
                onChange={pickCamera}
                clearable
                description={cameras.length ? undefined : 'Add cameras under Gear to get the right shutter speeds.'}
              />
              {otherLoaded && (
                <Alert color="yellow" icon={<Warning size={18} />} p="sm">
                  <Text size="sm">
                    {camera?.name} already has <b>{rollTitle(otherLoaded)}</b> loaded.
                  </Text>
                  <Checkbox mt={6} size="xs" label="Mark that roll finished" checked={finishOther} onChange={(e) => setFinishOther(e.currentTarget.checked)} />
                </Alert>
              )}
              {lenses.length > 0 && (
                <Select
                  label="Lens"
                  description="Used as the starting lens when logging frames"
                  placeholder="None"
                  data={lenses.filter((l) => !l.retired || l.id === v.lensId).map((l) => ({ value: l.id, label: l.name }))}
                  clearable
                  {...form.getInputProps('lensId')}
                />
              )}
            </Stack>
          </Card>

          <Card>
            <Stack>
              {films.length > 0 && (
                <SegmentedControl
                  data={[
                    { value: 'fridge', label: 'From the fridge' },
                    { value: 'other', label: 'Other film' },
                  ]}
                  {...form.getInputProps('filmSource')}
                />
              )}
              {v.filmSource === 'fridge' && films.length > 0 ? (
                <Select
                  label="Film"
                  placeholder={fridgeFilms.length ? 'Pick a film' : 'Nothing in stock'}
                  data={fridgeFilms.map((f) => ({
                    value: f.id,
                    label: `${f.brand} ${f.name} · ${FORMAT_OPTIONS.find((o) => o.value === f.format)?.label} (${f.stock} left)`,
                  }))}
                  value={v.filmId}
                  onChange={pickFilm}
                  error={form.errors.filmId}
                  searchable
                  description={editing ? 'Changing the film here doesn’t change fridge stock.' : 'Takes one roll out of stock.'}
                />
              ) : (
                <>
                  <Autocomplete label="Quick pick" placeholder="Search common films…" data={FILM_PRESETS.map((p) => `${p.brand} ${p.name}`)} onOptionSubmit={pickPreset} limit={8} />
                  <Group grow align="flex-start">
                    <TextInput label="Brand" {...form.getInputProps('film.brand')} />
                    <TextInput label="Film" {...form.getInputProps('film.name')} />
                  </Group>
                  <Group grow align="flex-start">
                    <NumberInput label="Box ISO" min={1} {...form.getInputProps('film.iso')} />
                    <Select
                      label="Process"
                      data={PROCESS_OPTIONS}
                      allowDeselect={false}
                      value={v.film.process}
                      onChange={(p) => form.setFieldValue('film.process', (p ?? 'C-41') as Process)}
                    />
                  </Group>
                </>
              )}
              <NumberInput
                label="Shooting at ISO"
                min={1}
                {...form.getInputProps('ratedIso')}
                rightSection={push ? <Badge size="sm" variant="light" color={push.startsWith('Push') ? 'orange' : 'blue'} mr={40}>{push}</Badge> : undefined}
                rightSectionWidth={push ? 110 : undefined}
              />
              <Group grow align="flex-start">
                <Select
                  label="Format"
                  data={FORMAT_OPTIONS}
                  allowDeselect={false}
                  value={v.format}
                  onChange={(f) => {
                    const format = (f ?? '35mm') as Format
                    form.setValues({ format, exposures: defaultExposures(format) })
                  }}
                />
                <NumberInput label="Exposures" min={1} max={200} {...form.getInputProps('exposures')} />
              </Group>
              <Chip.Group value={String(v.exposures)} onChange={(e) => form.setFieldValue('exposures', Number(e))}>
                <Group gap={6}>
                  {EXPOSURE_OPTIONS[v.format].map((n) => (
                    <Chip key={n} value={String(n)} size="xs">
                      {n}
                    </Chip>
                  ))}
                </Group>
              </Chip.Group>
            </Stack>
          </Card>

          <Button variant="subtle" color="gray" onClick={() => setShowMore((s) => !s)} rightSection={showMore ? <CaretUp size={14} /> : <CaretDown size={14} />}>
            {showMore ? 'Fewer details' : 'Name, date, notes and costs'}
          </Button>

          <Collapse expanded={showMore}>
            <Stack>
              <Card>
                <Stack>
                  <TextInput label="Name" placeholder="Optional, e.g. Japan trip" {...form.getInputProps('name')} />
                  <DateTimePicker label="Loaded" valueFormat="MMM D, YYYY h:mm A" {...form.getInputProps('loadedAt')} />
                  <TagsInput
                    label="Tags"
                    placeholder="Add a tag"
                    data={[...new Set(rolls.flatMap((r) => r.tags))]}
                    {...form.getInputProps('tags')}
                  />
                  <Textarea label="Notes" autosize minRows={2} {...form.getInputProps('notes')} />
                </Stack>
              </Card>
              <Card>
                <Stack>
                  <Group grow align="flex-start">
                    {costInput('film', 'Film cost')}
                    {costInput('dev', 'Developing')}
                    {costInput('scan', 'Scanning')}
                  </Group>
                  {editing && (
                    <>
                      <TextInput label="Lab" placeholder="Who developed it" {...form.getInputProps('lab')} />
                      <Textarea label="Development notes" placeholder="Chemistry, times, push/pull, scanner…" autosize minRows={2} {...form.getInputProps('devNotes')} />
                    </>
                  )}
                </Stack>
              </Card>
            </Stack>
          </Collapse>

          <Button type="submit" size="md">
            {editing ? 'Save' : 'Load roll & start shooting'}
          </Button>
        </Stack>
      </form>
    </Page>
  )
}
