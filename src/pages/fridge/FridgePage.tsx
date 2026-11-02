import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { Minus, Plus, Snowflake } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { EmptyState } from '../../components/EmptyState'
import { FormModal } from '../../components/FormModal'
import { Page } from '../../components/Page'
import { useApi, useData } from '../../data/DataProvider'
import type { FilmStock } from '../../data/types'
import { FORMAT_OPTIONS, formatMoney } from '../../lib/format'
import { FilmForm } from './FilmForm'
import { Stat } from '../../components/Stat'

export function expiryStatus(expiresOn: string | null): { label: string; color: string } | null {
  if (!expiresOn) return null
  const months = dayjs(expiresOn).diff(dayjs(), 'month', true)
  if (months < 0) return { label: `Expired ${dayjs(expiresOn).format('MMM YYYY')}`, color: 'red' }
  if (months < 3) return { label: `Expires ${dayjs(expiresOn).format('MMM YYYY')}`, color: 'yellow' }
  return { label: `Exp. ${dayjs(expiresOn).format('MMM YYYY')}`, color: 'gray' }
}

export default function FridgePage() {
  const { films, profile, rolls } = useData()
  const api = useApi()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'stock' | 'all'>('stock')
  const [editing, setEditing] = useState<{ item?: FilmStock } | null>(null)

  const inStock = films.filter((f) => f.stock > 0)
  const shown = filter === 'stock' ? inStock : films
  const totalRolls = inStock.reduce((n, f) => n + f.stock, 0)
  const value = inStock.reduce((n, f) => n + f.stock * (f.pricePerRoll ?? 0), 0)
  const expiring = inStock.filter((f) => f.expiresOn && dayjs(f.expiresOn).diff(dayjs(), 'month', true) < 3).length

  const close = () => setEditing(null)
  const adjust = (f: FilmStock, delta: number) => api.update('films', f.id, { stock: Math.max(0, f.stock + delta) })

  return (
    <Page
      title="Film fridge"
      actions={
        <Button leftSection={<Plus size={16} weight="bold" />} onClick={() => setEditing({})}>
          Add film
        </Button>
      }
    >
      {films.length === 0 ? (
        <EmptyState
          icon={Snowflake}
          title="Your fridge is empty"
          description="Keep track of the film you have on hand. Loading a roll from here takes one out of stock, and the price feeds your cost stats."
          action={<Button onClick={() => setEditing({})}>Add film</Button>}
        />
      ) : (
        <>
          <SimpleGrid cols={3} spacing="sm">
            <Stat label="Rolls" value={String(totalRolls)} />
            <Stat label="Value" value={value ? formatMoney(value, profile.currency) : '—'} />
            <Stat label="Expiring" value={String(expiring)} color={expiring ? 'yellow' : undefined} />
          </SimpleGrid>
          <SegmentedControl
            value={filter}
            onChange={(v) => setFilter(v as 'stock' | 'all')}
            data={[
              { value: 'stock', label: `In stock (${inStock.length})` },
              { value: 'all', label: `All films (${films.length})` },
            ]}
          />
          {shown.length === 0 && (
            <Text c="dimmed" ta="center" py="lg">
              Nothing in stock. Switch to “All films” to restock.
            </Text>
          )}
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {shown.map((f) => {
              const expiry = expiryStatus(f.expiresOn)
              const shot = rolls.filter((r) => r.filmId === f.id).length
              return (
                <Card key={f.id} p="md">
                  <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <Stack gap={2} style={{ cursor: 'pointer', minWidth: 0 }} onClick={() => setEditing({ item: f })}>
                      <Text fw={600} truncate>
                        {f.brand} {f.name}
                      </Text>
                      <Group gap={6}>
                        <Badge variant="light" size="sm">
                          ISO {f.iso}
                        </Badge>
                        <Badge variant="light" color="gray" size="sm">
                          {FORMAT_OPTIONS.find((o) => o.value === f.format)?.label}
                        </Badge>
                        <Badge variant="light" color="gray" size="sm">
                          {f.process}
                        </Badge>
                      </Group>
                    </Stack>
                    <Group gap={4} wrap="nowrap">
                      <ActionIcon variant="default" size="lg" onClick={() => adjust(f, -1)} disabled={f.stock === 0} aria-label="Remove one roll">
                        <Minus size={16} />
                      </ActionIcon>
                      <Text fw={700} w={32} ta="center" className="tabular" size="lg">
                        {f.stock}
                      </Text>
                      <ActionIcon variant="default" size="lg" onClick={() => adjust(f, 1)} aria-label="Add one roll">
                        <Plus size={16} />
                      </ActionIcon>
                    </Group>
                  </Group>
                  <Group justify="space-between" mt="sm" wrap="nowrap">
                    <Group gap={6}>
                      {expiry && (
                        <Badge color={expiry.color} variant={expiry.color === 'gray' ? 'outline' : 'filled'} size="sm">
                          {expiry.label}
                        </Badge>
                      )}
                      <Text size="xs" c="dimmed">
                        {f.pricePerRoll != null && `${formatMoney(f.pricePerRoll, profile.currency)}/roll · `}
                        {shot} shot
                      </Text>
                    </Group>
                    <Button size="compact-sm" variant="light" disabled={f.stock === 0} onClick={() => navigate(`/rolls/new?film=${f.id}`)}>
                      Load
                    </Button>
                  </Group>
                </Card>
              )
            })}
          </SimpleGrid>
        </>
      )}

      <FormModal opened={editing !== null} onClose={close} title={editing?.item ? 'Edit film' : 'Add film'}>
        {editing && (
          <FilmForm
            initial={editing.item}
            currency={profile.currency}
            onSubmit={(v) => {
              if (editing.item) api.update('films', editing.item.id, v)
              else api.create('films', v)
              close()
            }}
            onDelete={
              editing.item
                ? () =>
                    modals.openConfirmModal({
                      title: `Delete ${editing.item!.brand} ${editing.item!.name}?`,
                      children: <Text size="sm">Rolls already shot on it keep their film details.</Text>,
                      labels: { confirm: 'Delete', cancel: 'Cancel' },
                      confirmProps: { color: 'red' },
                      onConfirm: () => {
                        api.remove('films', editing.item!.id)
                        close()
                      },
                    })
                : undefined
            }
          />
        )}
      </FormModal>
    </Page>
  )
}

