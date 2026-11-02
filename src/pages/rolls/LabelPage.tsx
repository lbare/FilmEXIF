import { Button, Container, Group, SegmentedControl, Stack, Text } from '@mantine/core'
import { CaretLeft, Printer } from '@phosphor-icons/react'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { rollTitle } from '../../components/RollBits'
import { useData } from '../../data/DataProvider'
import { formatAperture, pushPullLabel } from '../../lib/exposure'
import { filmLabel, formatDate } from '../../lib/format'
import classes from './LabelPage.module.css'

/** Printable card to keep with the negatives, with a QR code back to the roll. */
export default function LabelPage() {
  const { rollId } = useParams()
  const { rollById, framesByRoll, cameraById, lensById } = useData()
  const [layout, setLayout] = useState<'card' | 'strip'>('card')
  const [qr, setQr] = useState<string | null>(null)
  const roll = rollId ? rollById.get(rollId) : undefined
  const url = `${window.location.origin}${import.meta.env.BASE_URL}#/rolls/${rollId}`

  useEffect(() => {
    void QRCode.toDataURL(url, { margin: 0, width: 240, errorCorrectionLevel: 'M' }).then(setQr)
  }, [url])

  if (!roll) return <Text p="md">Roll not found.</Text>

  const frames = framesByRoll.get(roll.id) ?? []
  const camera = roll.cameraId ? cameraById.get(roll.cameraId) : null
  const lens = roll.lensId ? lensById.get(roll.lensId) : null
  const push = pushPullLabel(roll.film.iso, roll.ratedIso)
  const dates = [
    `Loaded ${formatDate(roll.loadedAt, 'D MMM YYYY')}`,
    roll.finishedAt && `Finished ${formatDate(roll.finishedAt, 'D MMM YYYY')}`,
    roll.developedAt && `Developed ${formatDate(roll.developedAt, 'D MMM YYYY')}${roll.lab ? ` (${roll.lab})` : ''}`,
  ].filter(Boolean)

  const header = (
    <div className={classes.header}>
      <div style={{ minWidth: 0 }}>
        <div className={classes.title}>{rollTitle(roll)}</div>
        <div className={classes.meta}>
          {roll.name ? `${filmLabel(roll.film)} · ` : ''}ISO {roll.ratedIso}
          {push ? ` (${push})` : ''} · {roll.film.process}
        </div>
        <div className={classes.meta}>{[camera?.name, lens?.name].filter(Boolean).join(' + ') || 'Camera not set'}</div>
        <div className={classes.meta}>{dates.join(' · ')}</div>
        {roll.tags.length > 0 && <div className={classes.meta}>{roll.tags.map((t) => `#${t}`).join(' ')}</div>}
      </div>
      {qr && <img src={qr} alt="QR code linking to this roll" className={classes.qr} />}
    </div>
  )

  return (
    <Container size="sm" py="md">
      <Stack className={classes.noPrint} mb="md">
        <Group justify="space-between">
          <Button component={Link} to={`/rolls/${roll.id}`} variant="subtle" color="gray" leftSection={<CaretLeft size={16} />}>
            Back
          </Button>
          <Button leftSection={<Printer size={16} />} onClick={() => window.print()}>
            Print
          </Button>
        </Group>
        <SegmentedControl
          value={layout}
          onChange={(v) => setLayout(v as 'card' | 'strip')}
          data={[
            { value: 'card', label: 'Index card with frames' },
            { value: 'strip', label: 'Sleeve strip' },
          ]}
        />
      </Stack>

      <div className={`${classes.label} ${layout === 'strip' ? classes.strip : ''}`}>
        {header}
        {layout === 'card' && frames.length > 0 && (
          <table className={classes.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Aperture</th>
                <th>Shutter</th>
                <th>Focal</th>
                <th>Date</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {frames.map((f) => (
                <tr key={f.id} className={f.status === 'skipped' ? classes.skipped : undefined}>
                  <td>{f.number}</td>
                  <td>{f.status === 'skipped' ? '—' : f.aperture != null ? formatAperture(f.aperture) : ''}</td>
                  <td>{f.status === 'skipped' ? '' : (f.shutter ?? '')}</td>
                  <td>{f.focalLength ? `${f.focalLength}` : ''}</td>
                  <td>{formatDate(f.takenAt, 'D MMM')}</td>
                  <td className={classes.notes}>{f.status === 'skipped' ? 'skipped' : f.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Container>
  )
}
