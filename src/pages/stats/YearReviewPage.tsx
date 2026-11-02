import { Box, Button, Group, Paper, Select, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { ShareNetwork, Sparkle } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import { toBlob } from 'html-to-image'
import { lazy, Suspense, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { EmptyState } from '../../components/EmptyState'
import { Page } from '../../components/Page'
import { rollTitle } from '../../components/RollBits'
import { downloadFile } from '../../data/backup'
import { useData } from '../../data/DataProvider'
import { formatAperture } from '../../lib/exposure'
import { formatMoney } from '../../lib/format'
import { yearReview, yearsWithFrames } from '../../lib/stats'
import { ShootingCalendar } from './charts'

const PlaceMap = lazy(() => import('./PlaceMap'))

export default function YearReviewPage() {
  const { year: param } = useParams()
  const navigate = useNavigate()
  const { rolls, frames, cameraById, lensById, profile } = useData()
  const years = yearsWithFrames(frames)
  const year = Number(param)
  const card = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)

  const review = useMemo(
    () => (year ? yearReview({ rolls, frames, cameraById, lensById }, year) : null),
    [year, rolls, frames, cameraById, lensById],
  )

  if (!param) {
    return years.length ? (
      <Navigate to={`/year/${years[0]}`} replace />
    ) : (
      <Page title="Year in review">
        <EmptyState icon={Sparkle} title="Nothing to review yet" description="Log some frames and your year on film will show up here." />
      </Page>
    )
  }
  if (!review) return <Navigate to="/year" replace />

  const share = async () => {
    if (!card.current) return
    setSharing(true)
    try {
      const blob = await toBlob(card.current, { pixelRatio: 2, cacheBust: true })
      if (!blob) throw new Error('Could not render the image')
      const file = new File([blob], `filmexif-${year}.png`, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `My ${year} on film` })
      } else {
        downloadFile(file.name, blob)
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') notifications.show({ color: 'red', message: `Couldn’t share: ${(err as Error).message}` })
    } finally {
      setSharing(false)
    }
  }

  const fastest = review.fastestRoll
  const slowest = review.slowestRoll

  return (
    <Page
      title="Year in review"
      back="/stats"
      actions={
        <Select
          aria-label="Year"
          data={years.map(String)}
          value={String(year)}
          onChange={(v) => v && navigate(`/year/${v}`, { replace: true })}
          allowDeselect={false}
          w={100}
        />
      }
    >
      {review.frames === 0 ? (
        <EmptyState icon={Sparkle} title={`No frames in ${year}`} />
      ) : (
        <>
          <Box ref={card} p="lg" style={{ borderRadius: 'var(--mantine-radius-lg)', background: 'linear-gradient(160deg, var(--mantine-color-orange-9) 0%, var(--mantine-color-dark-7) 55%)', color: 'white' }}>
            <Stack gap="lg">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text size="sm" fw={700} tt="uppercase" style={{ letterSpacing: 2, opacity: 0.8 }}>
                    FilmEXIF
                  </Text>
                  <Title order={1} fz={40} lh={1.05}>
                    {year}
                    <br />
                    on film
                  </Title>
                </div>
                <Sparkle size={36} weight="fill" color="var(--mantine-color-yellow-4)" />
              </Group>

              <SimpleGrid cols={2} spacing="md">
                <Big value={review.rolls} label={review.rolls === 1 ? 'roll' : 'rolls'} />
                <Big value={review.frames} label="frames" />
                <Big value={review.shootingDays} label="days out shooting" />
                <Big value={review.places} label={review.places === 1 ? 'place' : 'places'} />
              </SimpleGrid>

              <Stack gap={8}>
                {review.topFilm && <Line k="Top film" v={`${review.topFilm.label} (${review.topFilm.value} frames)`} />}
                {review.topCamera && <Line k="Most-used camera" v={review.topCamera.label} />}
                {review.topLens && <Line k="Go-to lens" v={review.topLens.label} />}
                {(review.topAperture || review.topShutter) && (
                  <Line k="Signature exposure" v={[review.topAperture && formatAperture(Number(review.topAperture.label)), review.topShutter?.label].filter(Boolean).join(' at ')} />
                )}
                {review.busiestMonth && <Line k="Busiest month" v={`${review.busiestMonth.label} (${review.busiestMonth.value} frames)`} />}
                {review.busiestDay && <Line k="Biggest day" v={`${dayjs(review.busiestDay.date).format('MMMM D')}: ${review.busiestDay.frames} frames`} />}
                {review.pushed > 0 && <Line k="Pushed" v={`${review.pushed} roll${review.pushed === 1 ? '' : 's'}`} />}
                {review.spend != null && <Line k="Spent" v={formatMoney(review.spend, profile.currency)} />}
              </Stack>

              <Box bg="rgba(0,0,0,0.25)" p="xs" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
                <ShootingCalendar key={year} daily={review.daily} end={`${year}-12-31`} />
              </Box>
            </Stack>
          </Box>

          <Button size="md" leftSection={<ShareNetwork size={18} />} onClick={share} loading={sharing}>
            Share as image
          </Button>

          {review.topPlace && (
            <Paper withBorder p="md">
              <Text fw={700} mb={4}>
                Where you shot the most
              </Text>
              <Text size="sm" c="dimmed" mb="sm">
                {review.topPlace.frames} frames within about a kilometre of here.
              </Text>
              <Suspense fallback={<Paper withBorder h={220} />}>
                <PlaceMap lat={review.topPlace.lat} lng={review.topPlace.lng} />
              </Suspense>
            </Paper>
          )}

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {review.firstFrame && (
              <Moment title="First frame of the year" when={review.firstFrame.takenAt}>
                <Link to={`/rolls/${review.firstFrame.rollId}/frames/${review.firstFrame.id}`}>
                  {rollTitle(rolls.find((r) => r.id === review.firstFrame!.rollId)!)}, frame {review.firstFrame.number}
                </Link>
              </Moment>
            )}
            {review.lastFrame && (
              <Moment title="Last frame of the year" when={review.lastFrame.takenAt}>
                <Link to={`/rolls/${review.lastFrame.rollId}/frames/${review.lastFrame.id}`}>
                  {rollTitle(rolls.find((r) => r.id === review.lastFrame!.rollId)!)}, frame {review.lastFrame.number}
                </Link>
              </Moment>
            )}
            {fastest && (
              <Moment title="Quickest roll" when={null}>
                <Link to={`/rolls/${fastest.roll.id}`}>{rollTitle(fastest.roll)}</Link> in {Math.max(1, Math.round(fastest.days))} days
              </Moment>
            )}
            {slowest && slowest !== fastest && (
              <Moment title="Slowest roll" when={null}>
                <Link to={`/rolls/${slowest.roll.id}`}>{rollTitle(slowest.roll)}</Link> took {Math.round(slowest.days)} days
              </Moment>
            )}
          </SimpleGrid>
        </>
      )}
    </Page>
  )
}

function Big({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <Text fz={34} fw={800} lh={1} className="tabular">
        {value.toLocaleString()}
      </Text>
      <Text size="sm" style={{ opacity: 0.85 }}>
        {label}
      </Text>
    </div>
  )
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="md" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 6 }}>
      <Text size="sm" style={{ opacity: 0.8, whiteSpace: 'nowrap' }}>
        {k}
      </Text>
      <Text size="sm" fw={600} ta="right">
        {v}
      </Text>
    </Group>
  )
}

function Moment({ title, when, children }: { title: string; when: string | null; children: ReactNode }) {
  return (
    <Paper withBorder p="md">
      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
        {title}
      </Text>
      <Text size="sm" mt={4}>
        {children}
      </Text>
      {when && (
        <Text size="xs" c="dimmed">
          {dayjs(when).format('MMMM D, h:mm A')}
        </Text>
      )}
    </Paper>
  )
}
