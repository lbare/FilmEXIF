import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import type { Format, RollFilm, RollStatus } from '../data/types'

dayjs.extend(relativeTime)

export const formatDate = (iso: string | null | undefined, fmt = 'MMM D, YYYY') =>
  iso ? dayjs(iso).format(fmt) : '—'

export const formatDateTime = (iso: string | null | undefined) =>
  iso ? dayjs(iso).format('MMM D, YYYY · h:mm A') : '—'

export const formatTime = (iso: string | null | undefined) => (iso ? dayjs(iso).format('h:mm A') : '—')

export const fromNow = (iso: string | null | undefined) => (iso ? dayjs(iso).fromNow() : '—')

export const daysBetween = (a: string, b: string) => Math.max(0, dayjs(b).diff(dayjs(a), 'day', true))

export function formatMoney(value: number | null | undefined, currency: string) {
  if (value == null) return '—'
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value)
  } catch {
    return value.toFixed(2)
  }
}

export const filmLabel = (film: Pick<RollFilm, 'brand' | 'name'>) => `${film.brand} ${film.name}`.trim()

export const STATUS_ORDER: RollStatus[] = ['loaded', 'finished', 'developing', 'developed', 'scanned']

export const STATUS_META: Record<RollStatus, { label: string; color: string; dateField: string; action: string }> = {
  loaded: { label: 'In camera', color: 'green', dateField: 'loadedAt', action: 'Loaded' },
  finished: { label: 'Finished', color: 'yellow', dateField: 'finishedAt', action: 'Finish roll' },
  developing: { label: 'Developing', color: 'orange', dateField: 'developingAt', action: 'Send to develop' },
  developed: { label: 'Developed', color: 'blue', dateField: 'developedAt', action: 'Mark developed' },
  scanned: { label: 'Scanned', color: 'grape', dateField: 'scannedAt', action: 'Mark scanned' },
}

export const FORMAT_OPTIONS: { value: Format; label: string }[] = [
  { value: '35mm', label: '35mm' },
  { value: 'half-frame', label: 'Half frame' },
  { value: '120', label: '120' },
  { value: 'large-format', label: 'Large format' },
  { value: 'instant', label: 'Instant' },
  { value: 'other', label: 'Other' },
]

export const PROCESS_OPTIONS = ['C-41', 'E-6', 'B&W', 'ECN-2', 'other'].map((v) => ({
  value: v,
  label: v === 'other' ? 'Other' : v,
}))

const REGION_CURRENCY: Record<string, string> = {
  US: 'USD', CA: 'CAD', GB: 'GBP', AU: 'AUD', NZ: 'NZD', JP: 'JPY', CH: 'CHF', SE: 'SEK', NO: 'NOK',
  DK: 'DKK', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', IE: 'EUR',
  PT: 'EUR', FI: 'EUR', KR: 'KRW', MX: 'MXN', BR: 'BRL', IN: 'INR', SG: 'SGD', HK: 'HKD',
}

export function defaultCurrency() {
  const region = navigator.language.split('-')[1]?.toUpperCase()
  return (region && REGION_CURRENCY[region]) || 'USD'
}

export const CURRENCIES = [...new Set(Object.values(REGION_CURRENCY))].sort()
