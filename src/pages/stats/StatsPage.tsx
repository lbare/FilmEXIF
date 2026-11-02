import { Button, Select, SimpleGrid, Text } from '@mantine/core'
import { ChartBar, Sparkle } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '../../components/EmptyState'
import { Page } from '../../components/Page'
import { Stat } from '../../components/Stat'
import { useData } from '../../data/DataProvider'
import { formatAperture } from '../../lib/exposure'
import { filmLabel, formatMoney } from '../../lib/format'
import { useIsMobile } from '../../lib/hooks'
import { computeStats, yearsWithFrames, type StatsFilter } from '../../lib/stats'
import { ChartCard, Columns, RankBars, ShootingCalendar } from './charts'

const hourLabel = (h: string) => {
  const n = Number(h)
  return n === 0 ? '12a' : n < 12 ? `${n}a` : n === 12 ? '12p' : `${n - 12}p`
}

const days = (v: number) => `${v} day${v === 1 ? '' : 's'}`

export default function StatsPage() {
  const { rolls, frames, cameraById, lensById, cameras, profile } = useData()
  const [range, setRange] = useState<string>('last12')
  const [cameraId, setCameraId] = useState<string | null>(null)
  const [film, setFilm] = useState<string | null>(null)
  const years = yearsWithFrames(frames)
  const mobile = useIsMobile()

  const filter = useMemo<StatsFilter>(() => {
    if (range === 'all') return { from: null, to: null, cameraId, film }
    if (range === 'last12')
      return { from: dayjs().subtract(11, 'month').startOf('month').toISOString(), to: dayjs().endOf('day').toISOString(), cameraId, film }
    return { from: dayjs(`${range}-01-01`).toISOString(), to: dayjs(`${range}-12-31`).endOf('day').toISOString(), cameraId, film }
  }, [range, cameraId, film])

  const s = useMemo(() => computeStats({ rolls, frames, cameraById, lensById }, filter), [rolls, frames, cameraById, lensById, filter])

  if (!frames.some((f) => f.status === 'shot')) {
    return (
      <Page title="Stats">
        <EmptyState
          icon={ChartBar}
          title="No frames yet"
          description="Once you’ve logged some frames you’ll see what you shoot, when, with what, and what it costs."
          action={
            <Button component={Link} to="/shoot">
              Log a frame
            </Button>
          }
        />
      </Page>
    )
  }

  const money = (v: number | null) => formatMoney(v, profile.currency)
  const calendarEnd = range === 'last12' || range === 'all' ? dayjs().format('YYYY-MM-DD') : `${range}-12-31`
  const filmOptions = [...new Set(rolls.map((r) => filmLabel(r.film)))].sort()
  const pipeline = s.pipeline.filter((p) => p.value != null).map((p) => ({ label: p.label, value: Math.round(p.value! * 10) / 10 }))

  return (
    <Page
      title="Stats"
      size="lg"
      actions={
        years[0] && (
          <Button component={Link} to={`/year/${years[0]}`} variant="light" leftSection={<Sparkle size={16} />}>
            Year in review
          </Button>
        )
      }
    >
      {/* Phones: time range on its own row, camera and film side by side. Desktop: one row. */}
      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs">
        <Select
          aria-label="Time range"
          data={[
            { value: 'last12', label: 'Last 12 months' },
            { value: 'all', label: 'All time' },
            ...years.map((y) => ({ value: String(y), label: String(y) })),
          ]}
          value={range}
          onChange={(v) => setRange(v ?? 'last12')}
          allowDeselect={false}
          style={{ gridColumn: mobile ? 'span 2' : undefined }}
        />
        {cameras.length > 1 && (
          <Select aria-label="Camera" placeholder="All cameras" data={cameras.map((c) => ({ value: c.id, label: c.name }))} value={cameraId} onChange={setCameraId} clearable />
        )}
        {filmOptions.length > 1 && (
          <Select aria-label="Film" placeholder="All films" data={filmOptions} value={film} onChange={setFilm} clearable searchable />
        )}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
        <Stat label="Rolls" value={s.rollCount} hint={`${s.toDevelop} waiting to develop`} />
        <Stat label="Frames" value={s.frameCount} hint={`${s.shootingDays} shooting days`} />
        <Stat label="Spend" value={money(s.spend)} hint={s.costPerFrame != null ? `${money(s.costPerFrame)} per frame` : 'Add costs to rolls'} />
        <Stat
          label="Days per roll"
          value={s.avgDaysToFinish != null ? Math.round(s.avgDaysToFinish) : '—'}
          hint={`${s.frameCount ? Math.round((s.located / s.frameCount) * 100) : 0}% of frames located`}
        />
      </SimpleGrid>

      <ChartCard title="Frames per month" rows={s.months}>
        <Columns rows={s.months} />
      </ChartCard>

      <ChartCard title="Shooting days" subtitle={range === 'all' ? 'Last 12 months' : undefined}>
        <ShootingCalendar key={calendarEnd} daily={s.daily} end={calendarEnd} />
      </ChartCard>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <ChartCard title="Films" subtitle="By frames shot" rows={s.films}>
          <RankBars rows={s.films} />
        </ChartCard>
        <ChartCard title="Cameras" subtitle="By frames shot" rows={s.cameras}>
          <RankBars rows={s.cameras} />
        </ChartCard>
        <ChartCard title="Apertures" rows={s.apertures.map((a) => ({ label: formatAperture(Number(a.label)), value: a.value }))}>
          <Columns rows={s.apertures.map((a) => ({ label: formatAperture(Number(a.label)), value: a.value }))} />
        </ChartCard>
        <ChartCard title="Shutter speeds" rows={s.shutters}>
          <Columns rows={s.shutters} />
        </ChartCard>
        <ChartCard title="Lenses" rows={s.lenses}>
          <RankBars rows={s.lenses} />
        </ChartCard>
        <ChartCard title="Focal lengths" rows={s.focal.map((f) => ({ label: `${f.label}mm`, value: f.value }))}>
          <Columns rows={s.focal.map((f) => ({ label: `${f.label}mm`, value: f.value }))} />
        </ChartCard>
        <ChartCard title="Time of day" subtitle="When your frames were taken" rows={s.hours.map((h) => ({ label: hourLabel(h.label), value: h.value }))}>
          <Columns rows={s.hours} tickFormatter={hourLabel} />
        </ChartCard>
        <ChartCard
          title="ISO"
          subtitle={`${s.pushPull.push} pushed · ${s.pushPull.pull} pulled · ${s.pushPull.box} at box speed`}
          rows={s.isos.map((i) => ({ label: `ISO ${i.label}`, value: i.value }))}
        >
          <Columns rows={s.isos} unit="Rolls" />
        </ChartCard>
      </SimpleGrid>

      <ChartCard title="Turnaround" subtitle="Average days between steps" rows={pipeline} format={days}>
        {pipeline.length ? (
          <RankBars rows={pipeline} unit="Days" format={(v) => `${v}d`} keepOrder />
        ) : (
          <Text c="dimmed" size="sm">
            Move rolls through developing and scanning to see this.
          </Text>
        )}
      </ChartCard>
    </Page>
  )
}
