import { Button, Group, Notification, Portal, Text } from '@mantine/core'
import { useRegisterSW } from 'virtual:pwa-register/react'

/** Shown when a new version of the app has been downloaded in the background. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null
  return (
    <Portal>
      <Notification
        withCloseButton
        onClose={() => setNeedRefresh(false)}
        title="Update available"
        style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top) + 12px)', left: 12, right: 12, zIndex: 1100, maxWidth: 420, margin: '0 auto' }}
      >
        <Group justify="space-between" mt={4}>
          <Text size="sm">A new version of FilmEXIF is ready.</Text>
          <Button size="xs" onClick={() => updateServiceWorker(true)}>
            Reload
          </Button>
        </Group>
      </Notification>
    </Portal>
  )
}
