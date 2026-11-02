import { ActionIcon, Badge, Button, Card, Group, Menu, NumberInput, Paper, SimpleGrid, Stack, Text, TextInput, Title } from '@mantine/core'
import { modals } from '@mantine/modals'
import {
  Aperture,
  ArrowCounterClockwise,
  DotsThreeVertical,
  ListNumbers,
  PencilSimple,
  Printer,
  Trash,
} from '@phosphor-icons/react'
import { lazy, Suspense, useState } from 'react'
import { Link, Outlet, useNavigate, useParams } from 'react-router'
import { FrameList } from '../../components/FrameList'
import { Stat } from '../../components/Stat'
import { FormModal } from '../../components/FormModal'
import { Page } from '../../components/Page'
import { rollTitle, StatusBadge, StatusTrack } from '../../components/RollBits'
import { useApi, useData } from '../../data/DataProvider'
import type { Roll, RollStatus } from '../../data/types'
import { pushPullLabel } from '../../lib/exposure'
import { daysBetween, filmLabel, formatDate, formatMoney, STATUS_META, STATUS_ORDER } from '../../lib/format'
import { currencySymbol } from '../fridge/FilmForm'

const RollMap = lazy(() => import('../map/RollMap'))

export function rollCost(roll: Roll) {
  const parts = [roll.costs.film, roll.costs.dev, roll.costs.scan].filter((n): n is number => n != null)
  return parts.length ? parts.reduce((a, b) => a + b, 0) : null
}

export default function RollDetailPage() {
  const { rollId } = useParams()
  const { rollById, framesByRoll, cameraById, lensById, profile } = useData()
  const api = useApi()
  const navigate = useNavigate()
  const roll = rollId ? rollById.get(rollId) : undefined
  const [developing, setDeveloping] = useState(false)
  const [now] = useState(() => new Date().toISOString())

  if (!roll) {
    return (
      <Page title="Roll not found" back="/">
        <Text c="dimmed">This roll may have been deleted.</Text>
      </Page>
    )
  }

  const frames = framesByRoll.get(roll.id) ?? []
  const shot = frames.filter((f) => f.status === 'shot').length
  const camera = roll.cameraId ? cameraById.get(roll.cameraId) : null
  const lens = roll.lensId ? lensById.get(roll.lensId) : null
  const push = pushPullLabel(roll.film.iso, roll.ratedIso)
  const cost = rollCost(roll)
  const located = frames.filter((f) => f.location).length
  const step = STATUS_ORDER.indexOf(roll.status)
  const next = STATUS_ORDER[step + 1] as RollStatus | undefined
  const prev = STATUS_ORDER[step - 1] as RollStatus | undefined
  const end = roll.finishedAt ?? now
  const days = Math.round(daysBetween(roll.loadedAt, end))

  const advance = (status: RollStatus) => {
    if (status === 'developing') setDeveloping(true)
    else api.setRollStatus(roll, status)
  }

  const remove = () =>
    modals.openConfirmModal({
      title: `Delete ${rollTitle(roll)}?`,
      children: <Text size="sm">This deletes the roll and its {frames.length} frames. It can’t be undone.</Text>,
      labels: { confirm: 'Delete roll', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        api.deleteRoll(roll, frames)
        navigate('/', { replace: true })
      },
    })

  return (
    <Page
      back="/"
      title={rollTitle(roll)}
      subtitle={
        <Group gap={6} mt={2}>
          <StatusBadge status={roll.status} size="sm" />
          <Text size="sm" c="dimmed">
            {roll.name ? `${filmLabel(roll.film)} · ` : ''}ISO {roll.ratedIso}
          </Text>
          {push && (
            <Badge size="sm" variant="light" color={push.startsWith('Push') ? 'orange' : 'blue'}>
              {push}
            </Badge>
          )}
        </Group>
      }
      actions={
        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon variant="default" size="lg" aria-label="Roll actions">
              <DotsThreeVertical size={20} weight="bold" />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item component={Link} to={`/rolls/${roll.id}/edit`} leftSection={<PencilSimple size={16} />}>
              Edit roll
            </Menu.Item>
            <Menu.Item component={Link} to={`/rolls/${roll.id}/label`} leftSection={<Printer size={16} />}>
              Print sleeve label
            </Menu.Item>
            <Menu.Item leftSection={<ListNumbers size={16} />} onClick={() => api.renumberFrames(frames)} disabled={frames.length < 2}>
              Renumber frames by time
            </Menu.Item>
            {prev && (
              <Menu.Item leftSection={<ArrowCounterClockwise size={16} />} onClick={() => api.setRollStatus(roll, prev)}>
                Back to “{STATUS_META[prev].label}”
              </Menu.Item>
            )}
            <Menu.Divider />
            <Menu.Item color="red" leftSection={<Trash size={16} />} onClick={remove}>
              Delete roll
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      }
    >
      {roll.status === 'loaded' && (
        <Button component={Link} to={`/rolls/${roll.id}/shoot`} size="lg" leftSection={<Aperture size={22} weight="bold" />}>
          Shoot frame {frames.length ? Math.max(...frames.map((f) => f.number)) + 1 : 1}
        </Button>
      )}

      <Card>
        <StatusTrack roll={roll} />
        {next && (
          <Group mt="md" grow>
            <Button variant={roll.status === 'loaded' ? 'default' : 'light'} color={STATUS_META[next].color} onClick={() => advance(next)}>
              {STATUS_META[next].action}
            </Button>
          </Group>
        )}
      </Card>

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
        <Stat label="Frames" value={`${shot}/${roll.exposures}`} />
        <Stat label={roll.finishedAt ? 'Days to shoot' : 'Days in camera'} value={String(days)} />
        <Stat label="Cost" value={cost != null ? formatMoney(cost, profile.currency) : '—'} hint={cost != null && shot ? `${formatMoney(cost / shot, profile.currency)}/frame` : undefined} />
        <Stat label="Located" value={`${located}/${frames.length}`} />
      </SimpleGrid>

      <Card>
        <Stack gap="xs">
          <Detail label="Film" value={`${filmLabel(roll.film)} (ISO ${roll.film.iso}, ${roll.film.process})`} />
          <Detail label="Camera" value={camera?.name ?? '—'} />
          {lens && <Detail label="Lens" value={lens.name} />}
          <Detail label="Loaded" value={formatDate(roll.loadedAt)} />
          {roll.lab && <Detail label="Lab" value={roll.lab} />}
          {roll.tags.length > 0 && (
            <Group justify="space-between" wrap="nowrap" align="flex-start">
              <Text size="sm" c="dimmed">
                Tags
              </Text>
              <Group gap={4} justify="flex-end">
                {roll.tags.map((t) => (
                  <Badge key={t} variant="outline" size="sm">
                    {t}
                  </Badge>
                ))}
              </Group>
            </Group>
          )}
          {roll.notes && <Note label="Notes" text={roll.notes} />}
          {roll.devNotes && <Note label="Development" text={roll.devNotes} />}
        </Stack>
      </Card>

      {located > 0 && (
        <Suspense fallback={<Paper h={240} withBorder />}>
          <RollMap frames={frames} />
        </Suspense>
      )}

      <Group justify="space-between" mt="xs">
        <Title order={4}>Frames</Title>
        <Text size="sm" c="dimmed">
          {frames.length} logged
        </Text>
      </Group>
      <FrameList frames={frames} rollId={roll.id} />
      <FormModal opened={developing} onClose={() => setDeveloping(false)} title="Send to develop">
        <DevelopForm roll={roll} onDone={() => setDeveloping(false)} currency={profile.currency} />
      </FormModal>
      <Outlet />
    </Page>
  )
}

function DevelopForm({ roll, onDone, currency }: { roll: Roll; onDone: () => void; currency: string }) {
  const api = useApi()
  const { rolls } = useData()
  const [lab, setLab] = useState(roll.lab)
  const [dev, setDev] = useState<number | ''>(roll.costs.dev ?? '')
  const labs = [...new Set(rolls.map((r) => r.lab).filter(Boolean))]
  return (
    <Stack>
      <TextInput label="Lab" placeholder={labs[0] ?? 'Home, or the lab’s name'} value={lab} onChange={(e) => setLab(e.currentTarget.value)} list="labs" />
      <datalist id="labs">
        {labs.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>
      <NumberInput label="Developing cost" prefix={currencySymbol(currency)} min={0} decimalScale={2} value={dev} onChange={(n) => setDev(n === '' ? '' : Number(n))} />
      <Button
        onClick={() => {
          api.update('rolls', roll.id, { lab: lab.trim(), costs: { ...roll.costs, dev: dev === '' ? null : dev } })
          api.setRollStatus(roll, 'developing')
          onDone()
        }}
      >
        Send to develop
      </Button>
    </Stack>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="md">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text size="sm" ta="right">
        {value}
      </Text>
    </Group>
  )
}

function Note({ label, text }: { label: string; text: string }) {
  return (
    <Stack gap={2}>
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
        {text}
      </Text>
    </Stack>
  )
}
