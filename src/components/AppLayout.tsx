import { ActionIcon, AppShell, Box, Group, Image, NavLink, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core'
import { useMediaQuery, useNetwork } from '@mantine/hooks'
import {
  Aperture,
  Camera,
  ChartBar,
  CloudArrowUp,
  CloudCheck,
  CloudSlash,
  FilmStrip,
  Gear,
  MapTrifold,
  Snowflake,
  Sparkle,
  type Icon,
} from '@phosphor-icons/react'
import { Suspense, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { useApi, useData } from '../data/DataProvider'
import { syncPhotos } from '../lib/photos'
import { PageLoader } from './PageLoader'

interface NavItem {
  to: string
  label: string
  icon: Icon
  /** Other path prefixes that count as this tab being active. */
  also?: string[]
}

const ROLLS: NavItem = { to: '/', label: 'Rolls', icon: FilmStrip, also: ['/rolls'] }
const SHOOT: NavItem = { to: '/shoot', label: 'Shoot', icon: Aperture }
const FRIDGE: NavItem = { to: '/fridge', label: 'Fridge', icon: Snowflake }
const GEAR: NavItem = { to: '/gear', label: 'Gear', icon: Camera }
const MAP: NavItem = { to: '/map', label: 'Map', icon: MapTrifold }
const STATS: NavItem = { to: '/stats', label: 'Stats', icon: ChartBar }
const YEAR: NavItem = { to: '/year', label: 'Year in review', icon: Sparkle }
const SETTINGS: NavItem = { to: '/settings', label: 'Settings', icon: Gear }

const MOBILE_TABS = [ROLLS, FRIDGE, SHOOT, MAP, STATS]
const DESKTOP_NAV = [ROLLS, SHOOT, FRIDGE, GEAR, MAP, STATS, YEAR, SETTINGS]

export const FOOTER_HEIGHT = 64

function isActive(item: NavItem, pathname: string) {
  if (item.to === '/') return pathname === '/' || (item.also ?? []).some((p) => pathname.startsWith(p))
  return pathname.startsWith(item.to) || (item.also ?? []).some((p) => pathname.startsWith(p))
}

function SyncIndicator() {
  const { online } = useNetwork()
  const { pendingWrites } = useData()
  const [Icon, label, color] = !online
    ? [CloudSlash, 'Offline. Changes are saved on this device and will sync later.', 'yellow']
    : pendingWrites
      ? [CloudArrowUp, 'Syncing…', 'blue']
      : [CloudCheck, 'All changes synced', 'dimmed']
  return (
    <Tooltip label={label} events={{ hover: true, focus: true, touch: true }} multiline maw={240}>
      <Box c={color} style={{ display: 'flex' }} aria-label={label}>
        <Icon size={22} />
      </Box>
    </Tooltip>
  )
}

/** Upload reference photos taken offline whenever we're online. */
function PhotoSync() {
  const api = useApi()
  const { frames, loading } = useData()
  const { online } = useNetwork()
  const pending = frames.filter((f) => f.photo?.status === 'local').length
  useEffect(() => {
    if (!loading && online) void syncPhotos(api, frames)
    // Re-run when the number of local photos changes or we come back online, not on every edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, loading, online, pending])
  return null
}

export function AppLayout() {
  const { pathname } = useLocation()
  const { loading } = useData()
  const desktop = useMediaQuery('(min-width: 48em)', true, { getInitialValueInEffect: false })
  const immersive = pathname.endsWith('/shoot') && !desktop

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 230, breakpoint: 'sm', collapsed: { mobile: true } }}
      footer={{ height: FOOTER_HEIGHT, collapsed: desktop || immersive }}
      padding={0}
    >
      <AppShell.Header px="md" style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(56px + env(safe-area-inset-top))' }}>
        <Group h={56} justify="space-between" wrap="nowrap">
          <UnstyledButton component={Link} to="/">
            <Group gap={8} wrap="nowrap">
              <Image src={`${import.meta.env.BASE_URL}favicon.svg`} w={28} h={28} alt="" />
              <Text fw={700} size="lg">
                FilmEXIF
              </Text>
            </Group>
          </UnstyledButton>
          <Group gap="sm" wrap="nowrap">
            <SyncIndicator />
            {!desktop && (
              <ActionIcon component={Link} to="/settings" variant="subtle" color="gray" size="lg" aria-label="Settings">
                <Gear size={22} />
              </ActionIcon>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <Stack gap={2}>
          {DESKTOP_NAV.map((item) => (
            <NavLink
              key={item.to}
              component={Link}
              to={item.to}
              label={item.label}
              leftSection={<item.icon size={20} />}
              active={isActive(item, pathname)}
              variant="light"
              style={{ borderRadius: 'var(--mantine-radius-md)' }}
            />
          ))}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          paddingTop: 'calc(var(--app-shell-header-offset, 0px) + env(safe-area-inset-top))',
          paddingBottom: immersive || desktop ? 'env(safe-area-inset-bottom)' : `calc(${FOOTER_HEIGHT}px + env(safe-area-inset-bottom))`,
        }}
      >
        <Suspense fallback={<PageLoader />}>{loading ? <PageLoader /> : <Outlet />}</Suspense>
      </AppShell.Main>

      <AppShell.Footer style={{ height: `calc(${FOOTER_HEIGHT}px + env(safe-area-inset-bottom))`, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <Group h={FOOTER_HEIGHT} grow gap={0} wrap="nowrap">
          {MOBILE_TABS.map((item) => {
            const active = isActive(item, pathname)
            const center = item === SHOOT
            return (
              <UnstyledButton
                key={item.to}
                component={Link}
                to={item.to}
                aria-label={item.label}
                h="100%"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}
              >
                {center ? (
                  <Box
                    bg="var(--mantine-primary-color-filled)"
                    c="white"
                    style={{ borderRadius: 999, width: 48, height: 48, display: 'grid', placeItems: 'center' }}
                  >
                    <item.icon size={28} weight="bold" />
                  </Box>
                ) : (
                  <>
                    <item.icon
                      size={24}
                      weight={active ? 'fill' : 'regular'}
                      color={active ? 'var(--mantine-primary-color-filled)' : 'var(--mantine-color-dimmed)'}
                    />
                    <Text size="10px" fw={active ? 700 : 500} c={active ? undefined : 'dimmed'}>
                      {item.label}
                    </Text>
                  </>
                )}
              </UnstyledButton>
            )
          })}
        </Group>
      </AppShell.Footer>
      <PhotoSync />
    </AppShell>
  )
}
