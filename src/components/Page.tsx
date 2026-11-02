import { ActionIcon, Container, Group, Stack, Text, Title, type ContainerProps } from '@mantine/core'
import { CaretLeft } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'

interface PageProps {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  /** Show a back button. `true` goes back in history; a string navigates there. */
  back?: boolean | string
  size?: ContainerProps['size']
  children: ReactNode
}

export function Page({ title, subtitle, actions, back, size = 'md', children }: PageProps) {
  const navigate = useNavigate()
  const goBack = () => {
    if (typeof back === 'string') navigate(back)
    else if (window.history.state?.idx > 0) navigate(-1)
    else navigate('/')
  }
  return (
    <Container size={size} px="md" py="md">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
          <Group gap="xs" wrap="nowrap" align="flex-start" style={{ minWidth: 0 }}>
            {back && (
              <ActionIcon variant="subtle" color="gray" size="lg" onClick={goBack} aria-label="Back" mt={2}>
                <CaretLeft size={22} />
              </ActionIcon>
            )}
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Title order={2} lh={1.2} style={{ overflowWrap: 'anywhere' }}>
                {title}
              </Title>
              {subtitle && (
                <Text c="dimmed" size="sm" component="div">
                  {subtitle}
                </Text>
              )}
            </Stack>
          </Group>
          {actions && (
            <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
              {actions}
            </Group>
          )}
        </Group>
        {children}
      </Stack>
    </Container>
  )
}
