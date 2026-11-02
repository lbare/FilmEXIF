import { Modal } from '@mantine/core'
import type { ReactNode } from 'react'
import { useIsMobile } from '../lib/hooks'

/** Full-screen on phones, centered dialog on desktop. */
export function FormModal({
  opened,
  onClose,
  title,
  children,
}: {
  opened: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
}) {
  const mobile = useIsMobile()
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      fullScreen={mobile}
      size="lg"
      transitionProps={{ transition: mobile ? 'slide-up' : 'pop' }}
      styles={{ title: { fontWeight: 700, fontSize: 'var(--mantine-font-size-lg)' } }}
    >
      {children}
    </Modal>
  )
}
