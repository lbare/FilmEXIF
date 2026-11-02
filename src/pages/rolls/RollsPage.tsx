import { Button, Group, Select, SegmentedControl, SimpleGrid, Stack, Text, TextInput, Title } from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'
import { Aperture, MagnifyingGlass, Plus } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Onboarding } from '../../components/Onboarding'
import { Page } from '../../components/Page'
import { RollCard, rollTitle } from '../../components/RollBits'
import { useData } from '../../data/DataProvider'
import type { Roll, RollStatus } from '../../data/types'
import { filmLabel } from '../../lib/format'

type Filter = 'all' | 'develop' | 'developed' | 'scanned'

const FILTERS: Record<Filter, RollStatus[]> = {
  all: ['finished', 'developing', 'developed', 'scanned'],
  develop: ['finished', 'developing'],
  developed: ['developed'],
  scanned: ['scanned'],
}

export default function RollsPage() {
  const { rolls, cameras, cameraById } = useData()
  const [filter, setFilter] = useLocalStorage<Filter>({ key: 'rolls-filter', defaultValue: 'all' })
  const [cameraId, setCameraId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const loaded = rolls.filter((r) => r.status === 'loaded')

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (r: Roll) => {
      if (cameraId && r.cameraId !== cameraId) return false
      if (!q) return true
      const camera = r.cameraId ? cameraById.get(r.cameraId)?.name : ''
      return [rollTitle(r), filmLabel(r.film), camera, r.lab, r.notes, ...r.tags].some((s) => s?.toLowerCase().includes(q))
    }
  }, [query, cameraId, cameraById])

  if (rolls.length === 0) {
    return (
      <Page title="Rolls">
        <Onboarding />
      </Page>
    )
  }

  const counts = Object.fromEntries(
    Object.entries(FILTERS).map(([k, statuses]) => [k, rolls.filter((r) => statuses.includes(r.status)).length]),
  ) as Record<Filter, number>
  const shown = rolls.filter((r) => FILTERS[filter].includes(r.status) && matches(r))
  const loadedShown = loaded.filter(matches)

  return (
    <Page
      title="Rolls"
      actions={
        <Button component={Link} to="/rolls/new" leftSection={<Plus size={16} weight="bold" />}>
          Load roll
        </Button>
      }
    >
      {(rolls.length > 6 || query) && (
        <Group gap="xs" wrap="nowrap">
          <TextInput
            placeholder="Search rolls"
            leftSection={<MagnifyingGlass size={16} />}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          {cameras.length > 1 && (
            <Select
              placeholder="All cameras"
              data={cameras.map((c) => ({ value: c.id, label: c.name }))}
              value={cameraId}
              onChange={setCameraId}
              clearable
              w={150}
            />
          )}
        </Group>
      )}

      <Stack gap="xs">
        <Title order={4}>In camera</Title>
        {loadedShown.length ? (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            {loadedShown.map((r) => (
              <RollCard key={r.id} roll={r} />
            ))}
          </SimpleGrid>
        ) : (
          <Text c="dimmed" size="sm">
            {loaded.length ? 'No loaded rolls match.' : 'Nothing loaded right now.'}{' '}
            {!loaded.length && (
              <Text component={Link} to="/rolls/new" c="var(--mantine-primary-color-filled)" size="sm">
                Load a roll
              </Text>
            )}
          </Text>
        )}
        {loadedShown.length > 0 && (
          <Button
            component={Link}
            to="/shoot"
            variant="light"
            leftSection={<Aperture size={18} />}
            hiddenFrom="sm"
            fullWidth
          >
            Log a frame
          </Button>
        )}
      </Stack>

      <Stack gap="xs" mt="sm">
        <Title order={4}>Shot</Title>
        <SegmentedControl
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          data={[
            { value: 'all', label: `All ${counts.all}` },
            { value: 'develop', label: `To develop ${counts.develop}` },
            { value: 'developed', label: `Developed ${counts.developed}` },
            { value: 'scanned', label: `Scanned ${counts.scanned}` },
          ]}
          size="xs"
          fullWidth
        />
        {shown.length ? (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            {shown.map((r) => (
              <RollCard key={r.id} roll={r} />
            ))}
          </SimpleGrid>
        ) : (
          <Text c="dimmed" size="sm" ta="center" py="md">
            No rolls here yet.
          </Text>
        )}
      </Stack>
    </Page>
  )
}
