import { Autocomplete, Button, Group, NumberInput, SegmentedControl, Select, Stack, Switch, Text, Textarea, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useState } from 'react'
import type { NewDoc } from '../../data/api'
import type { Lens } from '../../data/types'
import { APERTURES } from '../../lib/exposure'
import { stripBase } from './CameraForm'

export const NEW_LENS: NewDoc<'lenses'> = {
  name: '',
  mount: '',
  focalMin: 50,
  focalMax: 50,
  maxAperture: 1.8,
  minAperture: 22,
  apertureStops: 'half',
  notes: '',
  retired: false,
}

interface Props {
  initial?: Lens
  mounts: string[]
  onSubmit: (values: NewDoc<'lenses'>) => void
  onDelete?: () => void
}

export function LensForm({ initial, mounts, onSubmit, onDelete }: Props) {
  const [zoom, setZoom] = useState(initial ? initial.focalMin !== initial.focalMax : false)
  const form = useForm<NewDoc<'lenses'>>({
    initialValues: initial ? { ...NEW_LENS, ...stripBase(initial) } : NEW_LENS,
    validate: {
      focalMin: (v) => (v > 0 ? null : 'Required'),
      focalMax: (v, values) => (!zoom || v > values.focalMin ? null : 'Must be longer than the wide end'),
      maxAperture: (v) => (v > 0 ? null : 'Required'),
      minAperture: (v, values) => (v > values.maxAperture ? null : 'Must be smaller than the max aperture'),
    },
  })

  const autoName = (v: NewDoc<'lenses'>) => {
    const focal = zoom ? `${v.focalMin}-${v.focalMax}mm` : `${v.focalMin}mm`
    return `${focal} ƒ/${v.maxAperture}`
  }

  const submit = form.onSubmit((v) => {
    const values = { ...v, focalMax: zoom ? v.focalMax : v.focalMin, mount: v.mount.trim() }
    onSubmit({ ...values, name: v.name.trim() || autoName(values) })
  })

  return (
    <form onSubmit={submit}>
      <Stack>
        <TextInput
          label="Name"
          placeholder={autoName(form.values)}
          description="Leave blank to use the focal length and aperture"
          {...form.getInputProps('name')}
        />
        <Autocomplete
          label="Mount"
          placeholder="e.g. Nikon F, M42, Fixed"
          data={[...new Set([...mounts, 'Fixed'])]}
          {...form.getInputProps('mount')}
        />
        <Stack gap={4}>
          <Group justify="space-between">
            <Text size="sm" fw={500}>
              Focal length (mm)
            </Text>
            <Switch size="xs" label="Zoom" checked={zoom} onChange={(e) => setZoom(e.currentTarget.checked)} />
          </Group>
          <Group grow>
            <NumberInput
              aria-label={zoom ? 'Wide end' : 'Focal length'}
              min={1}
              max={2000}
              suffix="mm"
              {...form.getInputProps('focalMin')}
            />
            {zoom && <NumberInput aria-label="Long end" min={1} max={2000} suffix="mm" {...form.getInputProps('focalMax')} />}
          </Group>
        </Stack>
        <Group grow align="flex-start">
          <NumberInput
            label="Max aperture"
            prefix="ƒ/"
            min={0.7}
            max={64}
            step={0.1}
            decimalScale={1}
            {...form.getInputProps('maxAperture')}
          />
          <Select
            label="Min aperture"
            data={APERTURES.full.slice(4).map((a) => ({ value: String(a), label: `ƒ/${a}` }))}
            allowDeselect={false}
            value={String(form.values.minAperture)}
            onChange={(v) => form.setFieldValue('minAperture', Number(v))}
            error={form.errors.minAperture}
          />
        </Group>
        <Stack gap={4}>
          <Text size="sm" fw={500}>
            Aperture clicks
          </Text>
          <SegmentedControl
            data={[
              { value: 'full', label: 'Full' },
              { value: 'half', label: '½' },
              { value: 'third', label: '⅓' },
            ]}
            {...form.getInputProps('apertureStops')}
          />
        </Stack>
        <Textarea label="Notes" autosize minRows={2} {...form.getInputProps('notes')} />
        {initial && (
          <Switch
            label="Retired"
            description="Hide from pickers but keep its history."
            {...form.getInputProps('retired', { type: 'checkbox' })}
          />
        )}
        <Group justify="space-between" mt="sm">
          {onDelete ? (
            <Button variant="subtle" color="red" onClick={onDelete}>
              Delete
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit">{initial ? 'Save' : 'Add lens'}</Button>
        </Group>
      </Stack>
    </form>
  )
}
