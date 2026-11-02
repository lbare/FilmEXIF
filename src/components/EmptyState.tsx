import { Paper, Stack, Text, ThemeIcon } from '@mantine/core'
import type { Icon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

export function EmptyState({
  icon: IconComponent,
  title,
  description,
  action,
}: {
  icon: Icon
  title: string
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <Paper withBorder p="xl" style={{ borderStyle: 'dashed' }}>
      <Stack align="center" gap="xs" ta="center">
        <ThemeIcon size={56} radius="xl" variant="light">
          <IconComponent size={30} />
        </ThemeIcon>
        <Text fw={600} size="lg">
          {title}
        </Text>
        {description && (
          <Text c="dimmed" size="sm" maw={420}>
            {description}
          </Text>
        )}
        {action && <div style={{ marginTop: 8 }}>{action}</div>}
      </Stack>
    </Paper>
  )
}
