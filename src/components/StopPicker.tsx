import { Box, Group, Text, UnstyledButton } from '@mantine/core'
import { useEffect, useRef } from 'react'

interface StopPickerProps<T extends string | number> {
  label: string
  options: T[]
  value: T | null
  onChange: (value: T | null) => void
  format?: (value: T) => string
}

/**
 * Horizontally scrolling row of values (apertures, shutter speeds, …), sized for thumbs.
 * Tapping the selected value again clears it.
 */
export function StopPicker<T extends string | number>({ label, options, value, onChange, format = String }: StopPickerProps<T>) {
  const scroller = useRef<HTMLDivElement>(null)

  // Keep the selected value in view (centred) when it changes.
  useEffect(() => {
    if (value == null) return
    const el = scroller.current?.querySelector<HTMLElement>(`[data-value="${CSS.escape(String(value))}"]`)
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [value])

  return (
    <Box>
      <Group justify="space-between" mb={4}>
        <Text size="xs" fw={700} c="dimmed" tt="uppercase">
          {label}
        </Text>
        <Text size="xs" c="dimmed">
          {value == null ? 'Not set' : ''}
        </Text>
      </Group>
      <Box
        ref={scroller}
        className="no-scrollbar"
        style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollSnapType: 'x proximity', padding: '2px 0', margin: '0 -16px', paddingInline: 16 }}
      >
        {options.map((opt) => {
          const selected = opt === value
          return (
            <UnstyledButton
              key={String(opt)}
              data-value={String(opt)}
              onClick={() => onChange(selected ? null : opt)}
              aria-pressed={selected}
              style={{
                flexShrink: 0,
                scrollSnapAlign: 'center',
                minWidth: 56,
                height: 44,
                padding: '0 12px',
                borderRadius: 'var(--mantine-radius-md)',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                background: selected ? 'var(--mantine-primary-color-filled)' : 'var(--mantine-color-default)',
                color: selected ? 'var(--mantine-color-white)' : undefined,
                border: `1px solid ${selected ? 'transparent' : 'var(--mantine-color-default-border)'}`,
              }}
            >
              {format(opt)}
            </UnstyledButton>
          )
        })}
      </Box>
    </Box>
  )
}
