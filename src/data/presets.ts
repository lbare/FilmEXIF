import type { Format, Process } from './types'

export interface FilmPreset {
  brand: string
  name: string
  iso: number
  process: Process
  formats: Format[]
}

const both: Format[] = ['35mm', '120']

/** Common stocks to speed up adding film. Anything else can be typed in. */
export const FILM_PRESETS: FilmPreset[] = [
  { brand: 'Kodak', name: 'Portra 160', iso: 160, process: 'C-41', formats: both },
  { brand: 'Kodak', name: 'Portra 400', iso: 400, process: 'C-41', formats: both },
  { brand: 'Kodak', name: 'Portra 800', iso: 800, process: 'C-41', formats: both },
  { brand: 'Kodak', name: 'Ektar 100', iso: 100, process: 'C-41', formats: both },
  { brand: 'Kodak', name: 'Gold 200', iso: 200, process: 'C-41', formats: both },
  { brand: 'Kodak', name: 'UltraMax 400', iso: 400, process: 'C-41', formats: ['35mm'] },
  { brand: 'Kodak', name: 'ColorPlus 200', iso: 200, process: 'C-41', formats: ['35mm'] },
  { brand: 'Kodak', name: 'Ektachrome E100', iso: 100, process: 'E-6', formats: both },
  { brand: 'Kodak', name: 'Tri-X 400', iso: 400, process: 'B&W', formats: both },
  { brand: 'Kodak', name: 'T-Max 100', iso: 100, process: 'B&W', formats: both },
  { brand: 'Kodak', name: 'T-Max 400', iso: 400, process: 'B&W', formats: both },
  { brand: 'Kodak', name: 'T-Max P3200', iso: 3200, process: 'B&W', formats: ['35mm'] },
  { brand: 'Ilford', name: 'HP5 Plus', iso: 400, process: 'B&W', formats: both },
  { brand: 'Ilford', name: 'FP4 Plus', iso: 125, process: 'B&W', formats: both },
  { brand: 'Ilford', name: 'Delta 100', iso: 100, process: 'B&W', formats: both },
  { brand: 'Ilford', name: 'Delta 400', iso: 400, process: 'B&W', formats: both },
  { brand: 'Ilford', name: 'Delta 3200', iso: 3200, process: 'B&W', formats: both },
  { brand: 'Ilford', name: 'Pan F Plus 50', iso: 50, process: 'B&W', formats: both },
  { brand: 'Ilford', name: 'XP2 Super', iso: 400, process: 'C-41', formats: both },
  { brand: 'Ilford', name: 'SFX 200', iso: 200, process: 'B&W', formats: both },
  { brand: 'Kentmere', name: 'Pan 100', iso: 100, process: 'B&W', formats: ['35mm'] },
  { brand: 'Kentmere', name: 'Pan 400', iso: 400, process: 'B&W', formats: ['35mm'] },
  { brand: 'Harman', name: 'Phoenix 200', iso: 200, process: 'C-41', formats: both },
  { brand: 'Fujifilm', name: 'Superia X-TRA 400', iso: 400, process: 'C-41', formats: ['35mm'] },
  { brand: 'Fujifilm', name: 'Fujicolor 200', iso: 200, process: 'C-41', formats: ['35mm'] },
  { brand: 'Fujifilm', name: 'Velvia 50', iso: 50, process: 'E-6', formats: both },
  { brand: 'Fujifilm', name: 'Velvia 100', iso: 100, process: 'E-6', formats: both },
  { brand: 'Fujifilm', name: 'Provia 100F', iso: 100, process: 'E-6', formats: both },
  { brand: 'Fujifilm', name: 'Acros 100 II', iso: 100, process: 'B&W', formats: both },
  { brand: 'CineStill', name: '800T', iso: 800, process: 'C-41', formats: both },
  { brand: 'CineStill', name: '400D', iso: 400, process: 'C-41', formats: both },
  { brand: 'CineStill', name: '50D', iso: 50, process: 'C-41', formats: both },
  { brand: 'Lomography', name: 'Color Negative 400', iso: 400, process: 'C-41', formats: both },
  { brand: 'Lomography', name: 'Color Negative 800', iso: 800, process: 'C-41', formats: both },
  { brand: 'Lomography', name: 'LomoChrome Purple', iso: 400, process: 'C-41', formats: both },
  { brand: 'Lomography', name: 'Berlin Kino 400', iso: 400, process: 'B&W', formats: both },
  { brand: 'Foma', name: 'Fomapan 100', iso: 100, process: 'B&W', formats: both },
  { brand: 'Foma', name: 'Fomapan 400', iso: 400, process: 'B&W', formats: both },
  { brand: 'Rollei', name: 'RPX 400', iso: 400, process: 'B&W', formats: both },
  { brand: 'Rollei', name: 'Retro 80S', iso: 80, process: 'B&W', formats: both },
  { brand: 'Kodak', name: 'Vision3 250D', iso: 250, process: 'ECN-2', formats: ['35mm'] },
  { brand: 'Kodak', name: 'Vision3 500T', iso: 500, process: 'ECN-2', formats: ['35mm'] },
]

export const presetLabel = (p: Pick<FilmPreset, 'brand' | 'name'>) => `${p.brand} ${p.name}`

export const EXPOSURE_OPTIONS: Record<Format, number[]> = {
  '35mm': [36, 24, 27, 12],
  'half-frame': [72, 48, 24],
  '120': [12, 15, 16, 10, 8],
  'large-format': [1, 2],
  instant: [8, 10],
  other: [12, 24, 36],
}

export const defaultExposures = (format: Format) => EXPOSURE_OPTIONS[format][0] ?? 36
