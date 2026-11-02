import { Paper, Text } from '@mantine/core'
import type { ReactNode } from 'react'

export function Stat({ label, value, hint, color }: { label: string; value: ReactNode; hint?: ReactNode; color?: string }) {
  return (
    <Paper withBorder p="sm">
      <Text size="xs" c="dimmed" tt="uppercase" fw={600} truncate>
        {label}
      </Text>
      <Text fw={700} size="lg" c={color} className="tabular" truncate>
        {value}
      </Text>
      {hint && (
        <Text size="xs" c="dimmed" truncate>
          {hint}
        </Text>
      )}
    </Paper>
  )
}
