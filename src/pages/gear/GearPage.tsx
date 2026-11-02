import { Badge, Button, Card, Group, SimpleGrid, Tabs, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { Camera as CameraIcon, CircleHalf, Plus } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { EmptyState } from '../../components/EmptyState'
import { FormModal } from '../../components/FormModal'
import { Page } from '../../components/Page'
import { useApi, useData } from '../../data/DataProvider'
import type { Camera, Lens } from '../../data/types'
import { FORMAT_OPTIONS } from '../../lib/format'
import { CameraForm } from './CameraForm'
import { LensForm } from './LensForm'

type Editing = { kind: 'camera'; item?: Camera } | { kind: 'lens'; item?: Lens } | null

export default function GearPage() {
  const { cameras, lenses, rolls, frames, rollById } = useData()
  const api = useApi()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'lenses' ? 'lenses' : 'cameras'
  const [editing, setEditing] = useState<Editing>(params.get('new') === 'camera' ? { kind: 'camera' } : null)

  const usage = useMemo(() => {
    const cameraFrames = new Map<string, number>()
    const lensFrames = new Map<string, number>()
    const cameraRolls = new Map<string, number>()
    for (const r of rolls) if (r.cameraId) cameraRolls.set(r.cameraId, (cameraRolls.get(r.cameraId) ?? 0) + 1)
    for (const f of frames) {
      if (f.status !== 'shot') continue
      const cam = rollById.get(f.rollId)?.cameraId
      if (cam) cameraFrames.set(cam, (cameraFrames.get(cam) ?? 0) + 1)
      if (f.lensId) lensFrames.set(f.lensId, (lensFrames.get(f.lensId) ?? 0) + 1)
    }
    return { cameraFrames, lensFrames, cameraRolls }
  }, [rolls, frames, rollById])

  const mounts = [...new Set(lenses.map((l) => l.mount).filter(Boolean))]
  const close = () => setEditing(null)

  const confirmDelete = (label: string, inUse: number, onConfirm: () => void) =>
    modals.openConfirmModal({
      title: `Delete ${label}?`,
      children: (
        <Text size="sm">
          {inUse > 0
            ? `It’s used by ${inUse} roll${inUse === 1 ? '' : 's'} or frames, which will show it as unknown. Retiring it keeps the history intact.`
            : 'This can’t be undone.'}
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        onConfirm()
        close()
      },
    })

  return (
    <Page
      title="Gear"
      actions={
        <Button
          leftSection={<Plus size={16} weight="bold" />}
          onClick={() => setEditing(tab === 'cameras' ? { kind: 'camera' } : { kind: 'lens' })}
        >
          Add {tab === 'cameras' ? 'camera' : 'lens'}
        </Button>
      }
    >
      <Tabs value={tab} onChange={(v) => setParams({ tab: v ?? 'cameras' }, { replace: true })}>
        <Tabs.List grow>
          <Tabs.Tab value="cameras" leftSection={<CameraIcon size={16} />}>
            Cameras ({cameras.length})
          </Tabs.Tab>
          <Tabs.Tab value="lenses" leftSection={<CircleHalf size={16} />}>
            Lenses ({lenses.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="cameras" pt="md">
          {cameras.length === 0 ? (
            <EmptyState
              icon={CameraIcon}
              title="No cameras yet"
              description="Add the cameras you shoot with. Their shutter range sets the speeds you can pick when logging a frame."
              action={<Button onClick={() => setEditing({ kind: 'camera' })}>Add a camera</Button>}
            />
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {cameras.map((c) => (
                <Card key={c.id} component="button" onClick={() => setEditing({ kind: 'camera', item: c })} style={{ textAlign: 'left', opacity: c.retired ? 0.6 : 1 }}>
                  <Group justify="space-between" wrap="nowrap">
                    <Text fw={600}>{c.name}</Text>
                    {c.retired ? <Badge color="gray">Retired</Badge> : <Badge variant="light">{FORMAT_OPTIONS.find((f) => f.value === c.format)?.label}</Badge>}
                  </Group>
                  <Text size="sm" c="dimmed">
                    {c.slowestShutter} – {c.fastestShutter}
                    {c.bulb ? ' · B' : ''}
                    {c.autoExposure ? ' · Auto' : ''}
                  </Text>
                  <Text size="sm" c="dimmed" mt={4}>
                    {usage.cameraRolls.get(c.id) ?? 0} rolls · {usage.cameraFrames.get(c.id) ?? 0} frames
                  </Text>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="lenses" pt="md">
          {lenses.length === 0 ? (
            <EmptyState
              icon={CircleHalf}
              title="No lenses yet"
              description="Lenses are optional. Adding them limits the aperture picker to real values and tracks focal lengths in stats."
              action={<Button onClick={() => setEditing({ kind: 'lens' })}>Add a lens</Button>}
            />
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {lenses.map((l) => (
                <Card key={l.id} component="button" onClick={() => setEditing({ kind: 'lens', item: l })} style={{ textAlign: 'left', opacity: l.retired ? 0.6 : 1 }}>
                  <Group justify="space-between" wrap="nowrap">
                    <Text fw={600}>{l.name}</Text>
                    {l.retired ? <Badge color="gray">Retired</Badge> : l.mount && <Badge variant="light">{l.mount}</Badge>}
                  </Group>
                  <Text size="sm" c="dimmed">
                    ƒ/{l.maxAperture} – ƒ/{l.minAperture}
                  </Text>
                  <Text size="sm" c="dimmed" mt={4}>
                    {usage.lensFrames.get(l.id) ?? 0} frames
                  </Text>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Tabs.Panel>
      </Tabs>

      <FormModal
        opened={editing?.kind === 'camera'}
        onClose={close}
        title={editing?.item ? 'Edit camera' : 'Add camera'}
      >
        {editing?.kind === 'camera' && (
          <CameraForm
            initial={editing.item}
            onSubmit={(v) => {
              if (editing.item) api.update('cameras', editing.item.id, v)
              else api.create('cameras', v)
              close()
            }}
            onDelete={
              editing.item
                ? () => {
                    const c = editing.item!
                    confirmDelete(c.name, usage.cameraRolls.get(c.id) ?? 0, () => api.remove('cameras', c.id))
                  }
                : undefined
            }
          />
        )}
      </FormModal>

      <FormModal opened={editing?.kind === 'lens'} onClose={close} title={editing?.item ? 'Edit lens' : 'Add lens'}>
        {editing?.kind === 'lens' && (
          <LensForm
            initial={editing.item}
            mounts={mounts}
            onSubmit={(v) => {
              if (editing.item) api.update('lenses', editing.item.id, v)
              else api.create('lenses', v)
              close()
            }}
            onDelete={
              editing.item
                ? () => {
                    const l = editing.item!
                    confirmDelete(l.name, usage.lensFrames.get(l.id) ?? 0, () => api.remove('lenses', l.id))
                  }
                : undefined
            }
          />
        )}
      </FormModal>
    </Page>
  )
}
