import { ActionIcon, Box, Card, Group, ScrollArea, Table, Text, Tooltip, useComputedColorScheme } from '@mantine/core'
import { BarChart, Heatmap } from '@mantine/charts'
import { ChartBar, Table as TableIcon } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { topN, type Bucket } from '../../lib/stats'

const BAR = 'orange.6'

/** A titled chart with a toggle to the same data as a table. */
export function ChartCard({
  title,
  subtitle,
  rows,
  format = String,
  children,
}: {
  title: string
  subtitle?: ReactNode
  rows?: Bucket[]
  format?: (v: number) => string
  children: ReactNode
}) {
  const [table, setTable] = useState(false)
  return (
    <Card>
      <Group justify="space-between" align="flex-start" wrap="nowrap" mb="sm">
        <div>
          <Text fw={700}>{title}</Text>
          {subtitle && (
            <Text size="xs" c="dimmed">
              {subtitle}
            </Text>
          )}
        </div>
        {rows && rows.length > 0 && (
          <Tooltip label={table ? 'Show chart' : 'Show as table'}>
            <ActionIcon variant="subtle" color="gray" onClick={() => setTable((t) => !t)} aria-label={table ? 'Show chart' : 'Show as table'}>
              {table ? <ChartBar size={18} /> : <TableIcon size={18} />}
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
      {rows && rows.length === 0 ? (
        <Text c="dimmed" size="sm" py="md" ta="center">
          Nothing logged yet.
        </Text>
      ) : table && rows ? (
        <Table striped withRowBorders={false} fz="sm">
          <Table.Tbody>
            {rows.map((r) => (
              <Table.Tr key={r.label}>
                <Table.Td>{r.label}</Table.Td>
                <Table.Td ta="right" className="tabular">
                  {format(r.value)}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        children
      )}
    </Card>
  )
}

/** Horizontal bars for "which X do you use most", top 8 with the rest folded into Other. */
export function RankBars({ rows, unit = "Frames", format = String, keepOrder }: { rows: Bucket[]; unit?: string; format?: (v: number) => string; keepOrder?: boolean }) {
  const data = keepOrder ? rows : topN(rows, 8)
  return (
    <BarChart
      h={Math.max(80, data.length * 34 + 16)}
      data={data}
      dataKey="label"
      orientation="vertical"
      series={[{ name: 'value', label: unit, color: BAR }]}
      gridAxis="none"
      tickLine="none"
      yAxisProps={{ width: 120, interval: 0 }}
      xAxisProps={{ hide: true }}
      withBarValueLabel
      valueLabelProps={{ position: 'right', fill: 'var(--mantine-color-dimmed)', fontSize: 12 }}
      barChartProps={{ margin: { right: 36 } }}
      valueFormatter={format}
      maxBarWidth={18}
      barProps={{ radius: [0, 4, 4, 0] }}
      cursorFill="gray"
    />
  )
}

/** Vertical columns along an ordered axis (months, stops, hours). */
export function Columns({ rows, unit = 'Frames', h = 180, tickFormatter }: { rows: Bucket[]; unit?: string; h?: number; tickFormatter?: (v: string) => string }) {
  return (
    <BarChart
      h={h}
      data={rows}
      dataKey="label"
      series={[{ name: 'value', label: unit, color: BAR }]}
      gridAxis="x"
      tickLine="none"
      xAxisProps={{ interval: 'preserveStartEnd', minTickGap: 6, tickFormatter }}
      yAxisProps={{ width: 28, allowDecimals: false }}
      maxBarWidth={28}
      barProps={{ radius: [4, 4, 0, 0] }}
      cursorFill="gray"
    />
  )
}

const RAMP = {
  light: ['#ffe8cc', '#ffc078', '#ff922b', '#e8590c'],
  dark: ['#5c2b0b', '#9c4510', '#e8590c', '#ffa94d'],
}

/** One year of shooting days, scrolled to the most recent weeks on small screens. */
export function ShootingCalendar({ daily, end }: { daily: Record<string, number>; end: string }) {
  const scheme = useComputedColorScheme('dark')
  const viewport = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = viewport.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])
  const endDate = dayjs(end)
  return (
    <ScrollArea viewportRef={viewport} type="never">
      <Box miw={720}>
        <Heatmap
          data={daily}
          startDate={endDate.subtract(1, 'year').add(1, 'day').format('YYYY-MM-DD')}
          endDate={endDate.format('YYYY-MM-DD')}
          colors={RAMP[scheme]}
          withMonthLabels
          withWeekdayLabels
          withTooltip
          rectSize={11}
          gap={2}
          getTooltipLabel={({ date, value }) => `${dayjs(date).format('ddd, MMM D')}: ${value ?? 0} frame${value === 1 ? '' : 's'}`}
        />
      </Box>
    </ScrollArea>
  )
}
