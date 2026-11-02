import { Autocomplete, Button, Group, NumberInput, Select, Stack, Textarea, TextInput } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import type { NewDoc } from '../../data/api'
import { defaultExposures, FILM_PRESETS, presetLabel } from '../../data/presets'
import type { FilmStock, Format, Process } from '../../data/types'
import { FORMAT_OPTIONS, PROCESS_OPTIONS } from '../../lib/format'
import { stripBase } from '../gear/CameraForm'

export const NEW_FILM: NewDoc<'films'> = {
  brand: '',
  name: '',
  iso: 400,
  format: '35mm',
  process: 'C-41',
  exposures: 36,
  stock: 1,
  expiresOn: null,
  pricePerRoll: null,
  notes: '',
}

interface Props {
  initial?: FilmStock
  currency: string
  onSubmit: (values: NewDoc<'films'>) => void
  onDelete?: () => void
}

export function FilmForm({ initial, currency, onSubmit, onDelete }: Props) {
  const form = useForm<NewDoc<'films'>>({
    initialValues: initial ? { ...NEW_FILM, ...stripBase(initial) } : NEW_FILM,
    validate: {
      brand: (v) => (v.trim() ? null : 'Required'),
      name: (v) => (v.trim() ? null : 'Required'),
      iso: (v) => (v > 0 ? null : 'Required'),
      exposures: (v) => (v > 0 ? null : 'Required'),
    },
  })

  const applyPreset = (label: string) => {
    const p = FILM_PRESETS.find((x) => presetLabel(x) === label)
    if (!p) return
    const format = p.formats.includes(form.values.format) ? form.values.format : p.formats[0]
    form.setValues({ brand: p.brand, name: p.name, iso: p.iso, process: p.process, format, exposures: defaultExposures(format) })
  }

  return (
    <form onSubmit={form.onSubmit((v) => onSubmit({ ...v, brand: v.brand.trim(), name: v.name.trim() }))}>
      <Stack>
        {!initial && (
          <Autocomplete
            label="Quick pick"
            placeholder="Search common films…"
            data={FILM_PRESETS.map(presetLabel)}
            onOptionSubmit={applyPreset}
            limit={8}
          />
        )}
        <Group grow align="flex-start">
          <Autocomplete
            label="Brand"
            data={[...new Set(FILM_PRESETS.map((p) => p.brand))]}
            {...form.getInputProps('brand')}
          />
          <TextInput label="Film" placeholder="e.g. Portra 400" {...form.getInputProps('name')} />
        </Group>
        <Group grow align="flex-start">
          <NumberInput label="Box ISO" min={1} max={25600} {...form.getInputProps('iso')} />
          <Select
            label="Process"
            data={PROCESS_OPTIONS}
            allowDeselect={false}
            {...form.getInputProps('process')}
            onChange={(v) => form.setFieldValue('process', (v ?? 'C-41') as Process)}
          />
        </Group>
        <Group grow align="flex-start">
          <Select
            label="Format"
            data={FORMAT_OPTIONS}
            allowDeselect={false}
            {...form.getInputProps('format')}
            onChange={(v) => {
              const format = (v ?? '35mm') as Format
              form.setValues({ format, exposures: defaultExposures(format) })
            }}
          />
          <NumberInput label="Exposures" min={1} max={100} {...form.getInputProps('exposures')} />
        </Group>
        <Group grow align="flex-start">
          <NumberInput label="Rolls in stock" min={0} max={999} {...form.getInputProps('stock')} />
          <NumberInput
            label="Price per roll"
            min={0}
            decimalScale={2}
            fixedDecimalScale
            prefix={currencySymbol(currency)}
            value={form.values.pricePerRoll ?? ''}
            onChange={(v) => form.setFieldValue('pricePerRoll', v === '' ? null : Number(v))}
          />
        </Group>
        <DatePickerInput
          label="Expires"
          placeholder="Optional"
          clearable
          valueFormat="MMM YYYY"
          {...form.getInputProps('expiresOn')}
        />
        <Textarea label="Notes" autosize minRows={2} {...form.getInputProps('notes')} />
        <Group justify="space-between" mt="sm">
          {onDelete ? (
            <Button variant="subtle" color="red" onClick={onDelete}>
              Delete
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit">{initial ? 'Save' : 'Add film'}</Button>
        </Group>
      </Stack>
    </form>
  )
}

export function currencySymbol(currency: string) {
  try {
    return (
      new Intl.NumberFormat(undefined, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
        .formatToParts(0)
        .find((p) => p.type === 'currency')?.value ?? ''
    )
  } catch {
    return ''
  }
}
