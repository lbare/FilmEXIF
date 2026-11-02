import { Button, FileButton, Group, Stack, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { ClockCounterClockwise, DownloadSimple, UploadSimple } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import { collection, getDocs } from 'firebase/firestore'
import { useState } from 'react'
import { BACKUP_COLLECTIONS, createBackup, downloadFile, parseBackup } from '../../data/backup'
import { useApi, useData } from '../../data/DataProvider'
import { convertLegacy, type LegacyRoll, type LegacyStage } from '../../data/legacy'
import type { Base } from '../../data/types'
import { db } from '../../lib/firebase'
import { Section } from '../SettingsPage'

const LEGACY: LegacyStage[] = ['activeRolls', 'developedRolls', 'completedRolls']

export function DataSection() {
  const data = useData()
  const api = useApi()
  const [busy, setBusy] = useState<'import' | 'legacy' | null>(null)

  const exportBackup = () => {
    const backup = createBackup(data)
    downloadFile(`filmexif-backup-${dayjs().format('YYYY-MM-DD')}.json`, JSON.stringify(backup, null, 2))
  }

  const importBackup = async (file: File | null) => {
    if (!file) return
    try {
      const backup = parseBackup(await file.text())
      const total = BACKUP_COLLECTIONS.reduce((n, c) => n + backup[c].length, 0)
      modals.openConfirmModal({
        title: 'Restore backup?',
        children: (
          <Text size="sm">
            This adds {total} items from {dayjs(backup.exportedAt).format('MMM D, YYYY')}. Anything with the same ID is
            replaced by the backup’s version; everything else is kept.
          </Text>
        ),
        labels: { confirm: 'Restore', cancel: 'Cancel' },
        onConfirm: async () => {
          setBusy('import')
          try {
            await api.bulkSet(
              BACKUP_COLLECTIONS.flatMap((c) =>
                (backup[c] as (Base & Record<string, unknown>)[]).map((d) => ({ collection: c, data: d })),
              ),
            )
            api.updateProfile({ currency: backup.profile.currency })
            notifications.show({ color: 'teal', message: `Restored ${total} items.` })
          } catch (err) {
            notifications.show({ color: 'red', title: 'Restore failed', message: String(err) })
          } finally {
            setBusy(null)
          }
        },
      })
    } catch (err) {
      notifications.show({ color: 'red', title: 'Can’t read that file', message: (err as Error).message })
    }
  }

  const importLegacy = async () => {
    setBusy('legacy')
    try {
      const docs = (
        await Promise.all(
          LEGACY.map(async (stage) => {
            const snap = await getDocs(collection(db, stage))
            return snap.docs.map((d) => ({ stage, roll: d.data() as LegacyRoll }))
          }),
        )
      ).flat()
      const result = convertLegacy(docs, data, () => api.newId('rolls'))
      if (result.rolls.length === 0) {
        notifications.show({ message: docs.length ? 'Those rolls were already imported.' : 'No rolls found in the old app.' })
      } else {
        await api.bulkSet([
          ...result.cameras.map((d) => ({ collection: 'cameras' as const, data: { ...d } })),
          ...result.rolls.map((d) => ({ collection: 'rolls' as const, data: { ...d } })),
          ...result.frames.map((d) => ({ collection: 'frames' as const, data: { ...d } })),
        ])
        notifications.show({
          color: 'teal',
          message: `Imported ${result.rolls.length} rolls and ${result.frames.length} frames.`,
        })
      }
      api.updateProfile({ legacyImportedAt: new Date().toISOString() })
    } catch (err) {
      notifications.show({ color: 'red', title: 'Import failed', message: String(err) })
    } finally {
      setBusy(null)
    }
  }

  return (
    <Section title="Your data">
      <Stack gap="md">
        <div>
          <Text size="sm" fw={500}>
            Backup
          </Text>
          <Text size="sm" c="dimmed" mb="xs">
            Everything is synced to your account. A JSON backup is an extra copy you control (photos aren’t included).
          </Text>
          <Group gap="xs">
            <Button variant="default" leftSection={<DownloadSimple size={16} />} onClick={exportBackup}>
              Download backup
            </Button>
            <FileButton onChange={importBackup} accept="application/json,.json">
              {(props) => (
                <Button variant="default" leftSection={<UploadSimple size={16} />} loading={busy === 'import'} {...props}>
                  Restore
                </Button>
              )}
            </FileButton>
          </Group>
        </div>
        <div>
          <Text size="sm" fw={500}>
            Original FilmEXIF rolls
          </Text>
          <Text size="sm" c="dimmed" mb="xs">
            {data.profile.legacyImportedAt
              ? `Imported ${dayjs(data.profile.legacyImportedAt).format('MMM D, YYYY')}. Running it again only adds rolls that weren’t imported.`
              : 'Copy the rolls saved by the first version of the app into your account.'}
          </Text>
          <Button variant="default" leftSection={<ClockCounterClockwise size={16} />} loading={busy === 'legacy'} onClick={importLegacy}>
            Import old rolls
          </Button>
        </div>
      </Stack>
    </Section>
  )
}
