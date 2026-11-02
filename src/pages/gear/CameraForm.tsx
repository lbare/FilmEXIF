import { Button, Group, SegmentedControl, Select, Stack, Switch, Text, Textarea, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import type { NewDoc } from '../../data/api'
import { useData } from '../../data/DataProvider'
import type { Camera, Format } from '../../data/types'
import { SHUTTERS_THIRD } from '../../lib/exposure'
import { FORMAT_OPTIONS } from '../../lib/format'

export const NEW_CAMERA: NewDoc<'cameras'> = {
  name: '',
  format: '35mm',
  slowestShutter: '1"',
  fastestShutter: '1/1000',
  shutterStops: 'full',
  bulb: true,
  autoExposure: false,
  defaultLensId: null,
  notes: '',
  retired: false,
}

interface Props {
  initial?: Camera
  onSubmit: (values: NewDoc<'cameras'>) => void
  onDelete?: () => void
}

export function CameraForm({ initial, onSubmit, onDelete }: Props) {
  const { lenses } = useData()
  const form = useForm<NewDoc<'cameras'>>({
    initialValues: initial ? { ...NEW_CAMERA, ...stripBase(initial) } : NEW_CAMERA,
    validate: {
      name: (v) => (v.trim() ? null : 'Give the camera a name'),
    },
  })

  return (
    <form onSubmit={form.onSubmit((v) => onSubmit({ ...v, name: v.name.trim() }))}>
      <Stack>
        <TextInput label="Name" placeholder="e.g. Nikon FM2" data-autofocus {...form.getInputProps('name')} />
        <Select
          label="Format"
          data={FORMAT_OPTIONS}
          allowDeselect={false}
          {...form.getInputProps('format')}
          onChange={(v) => form.setFieldValue('format', (v ?? '35mm') as Format)}
        />
        <Stack gap={4}>
          <Text size="sm" fw={500}>
            Shutter speeds
          </Text>
          <Group grow>
            <Select
              aria-label="Slowest shutter speed"
              description="Slowest"
              data={SHUTTERS_THIRD}
              allowDeselect={false}
              searchable
              {...form.getInputProps('slowestShutter')}
            />
            <Select
              aria-label="Fastest shutter speed"
              description="Fastest"
              data={SHUTTERS_THIRD}
              allowDeselect={false}
              searchable
              {...form.getInputProps('fastestShutter')}
            />
          </Group>
          <SegmentedControl
            data={[
              { value: 'full', label: 'Full stops' },
              { value: 'third', label: '⅓ stops' },
            ]}
            {...form.getInputProps('shutterStops')}
          />
        </Stack>
        <Switch label="Bulb (B) mode" {...form.getInputProps('bulb', { type: 'checkbox' })} />
        <Switch
          label="Auto exposure"
          description="Point & shoots, or aperture/shutter priority. Adds “Auto” to the pickers."
          {...form.getInputProps('autoExposure', { type: 'checkbox' })}
        />
        <Select
          label="Default lens"
          placeholder={lenses.length ? 'None' : 'Add lenses on the Lenses tab'}
          data={lenses.filter((l) => !l.retired || l.id === form.values.defaultLensId).map((l) => ({ value: l.id, label: l.name }))}
          clearable
          {...form.getInputProps('defaultLensId')}
        />
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
          <Button type="submit">{initial ? 'Save' : 'Add camera'}</Button>
        </Group>
      </Stack>
    </form>
  )
}

export function stripBase<T extends { id: string; createdAt: string; updatedAt: string }>(doc: T) {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = doc
  return rest
}
