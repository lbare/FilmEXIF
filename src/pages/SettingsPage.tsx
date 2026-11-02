import { Avatar, Button, Card, Group, NavLink, SegmentedControl, Select, Stack, Text, useMantineColorScheme, type MantineColorScheme } from '@mantine/core'
import { Camera, CaretRight, SignOut, Sparkle } from '@phosphor-icons/react'
import { signOut } from 'firebase/auth'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Page } from '../components/Page'
import { useAuth } from '../auth/AuthProvider'
import { useApi, useData } from '../data/DataProvider'
import { auth, usingEmulators } from '../lib/firebase'
import { CURRENCIES } from '../lib/format'
import { DataSection } from './settings/DataSection'

export default function SettingsPage() {
  const { user } = useAuth()
  const { profile } = useData()
  const api = useApi()
  const { colorScheme, setColorScheme } = useMantineColorScheme()

  return (
    <Page title="Settings">
      <Section title="Account">
        <Group justify="space-between" wrap="nowrap">
          <Group wrap="nowrap" style={{ minWidth: 0 }}>
            <Avatar src={user?.photoURL} name={user?.displayName ?? user?.email ?? undefined} color="initials" />
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Text fw={600} truncate>
                {user?.displayName ?? user?.email}
              </Text>
              {user?.displayName && (
                <Text size="sm" c="dimmed" truncate>
                  {user.email}
                </Text>
              )}
            </Stack>
          </Group>
          <Button variant="default" leftSection={<SignOut size={16} />} onClick={() => signOut(auth)}>
            Sign out
          </Button>
        </Group>
      </Section>

      <Section title="Library" hiddenFrom="sm">
        <NavLink component={Link} to="/gear" label="Cameras & lenses" leftSection={<Camera size={20} />} rightSection={<CaretRight size={14} />} />
        <NavLink component={Link} to="/year" label="Year in review" leftSection={<Sparkle size={20} />} rightSection={<CaretRight size={14} />} />
      </Section>

      <Section title="Preferences">
        <Stack>
          <div>
            <Text size="sm" fw={500} mb={4}>
              Appearance
            </Text>
            <SegmentedControl
              fullWidth
              value={colorScheme}
              onChange={(v) => setColorScheme(v as MantineColorScheme)}
              data={[
                { value: 'dark', label: 'Dark' },
                { value: 'light', label: 'Light' },
                { value: 'auto', label: 'System' },
              ]}
            />
          </div>
          <Select
            label="Currency"
            description="Used for film prices and development costs"
            data={CURRENCIES.includes(profile.currency) ? CURRENCIES : [profile.currency, ...CURRENCIES]}
            value={profile.currency}
            allowDeselect={false}
            onChange={(v) => v && api.updateProfile({ currency: v })}
          />
        </Stack>
      </Section>

      <DataSection />

      <Text size="xs" c="dimmed" ta="center">
        FilmEXIF {__APP_VERSION__}
        {usingEmulators && ' · emulator mode'}
      </Text>
    </Page>
  )
}

export function Section({ title, children, hiddenFrom }: { title: string; children: ReactNode; hiddenFrom?: 'sm' }) {
  return (
    <Card hiddenFrom={hiddenFrom}>
      <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb="sm">
        {title}
      </Text>
      {children}
    </Card>
  )
}
