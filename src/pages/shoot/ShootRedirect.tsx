import { Button, Stack, Text } from '@mantine/core'
import { Aperture } from '@phosphor-icons/react'
import { Link, Navigate } from 'react-router'
import { EmptyState } from '../../components/EmptyState'
import { Page } from '../../components/Page'
import { RollCard } from '../../components/RollBits'
import { useData } from '../../data/DataProvider'

/** `/shoot` (also the home-screen shortcut): straight to the loaded roll, or pick one. */
export default function ShootRedirect() {
  const { rolls } = useData()
  const loaded = rolls.filter((r) => r.status === 'loaded')
  if (loaded.length === 1) return <Navigate to={`/rolls/${loaded[0].id}/shoot`} replace />

  return (
    <Page title="Shoot">
      {loaded.length === 0 ? (
        <EmptyState
          icon={Aperture}
          title="No roll loaded"
          description="Load a roll to start logging frames."
          action={
            <Button component={Link} to="/rolls/new">
              Load a roll
            </Button>
          }
        />
      ) : (
        <Stack gap="sm">
          <Text c="dimmed" size="sm">
            Which camera are you shooting?
          </Text>
          {loaded.map((r) => (
            <RollCard key={r.id} roll={r} to={`/rolls/${r.id}/shoot`} />
          ))}
        </Stack>
      )}
    </Page>
  )
}
