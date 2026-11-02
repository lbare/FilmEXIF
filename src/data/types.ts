export type Format = '35mm' | 'half-frame' | '120' | 'large-format' | 'instant' | 'other'
export type Process = 'C-41' | 'E-6' | 'B&W' | 'ECN-2' | 'other'
export type StopIncrement = 'full' | 'half' | 'third'

export interface Base {
  id: string
  createdAt: string
  updatedAt: string
}

export interface Camera extends Base {
  name: string
  format: Format
  /** Slowest and fastest marked speeds, as shutter labels (`1"`, `1/1000`). */
  slowestShutter: string
  fastestShutter: string
  shutterStops: 'full' | 'third'
  bulb: boolean
  /** Has an auto/program mode, so "Auto" is offered for aperture and shutter. */
  autoExposure: boolean
  defaultLensId: string | null
  notes: string
  retired: boolean
}

export interface Lens extends Base {
  name: string
  mount: string
  focalMin: number
  focalMax: number
  maxAperture: number
  minAperture: number
  apertureStops: StopIncrement
  notes: string
  retired: boolean
}

export interface FilmStock extends Base {
  brand: string
  name: string
  iso: number
  format: Format
  process: Process
  exposures: number
  /** Unshot rolls in the fridge. */
  stock: number
  expiresOn: string | null
  pricePerRoll: number | null
  notes: string
}

export type RollStatus = 'loaded' | 'finished' | 'developing' | 'developed' | 'scanned'

export interface RollFilm {
  brand: string
  name: string
  iso: number
  process: Process
}

export interface RollCosts {
  film: number | null
  dev: number | null
  scan: number | null
}

export interface Roll extends Base {
  name: string
  status: RollStatus
  cameraId: string | null
  lensId: string | null
  filmId: string | null
  /** Snapshot of the film at load time so later edits to the stock don't rewrite history. */
  film: RollFilm
  ratedIso: number
  exposures: number
  format: Format
  loadedAt: string
  finishedAt: string | null
  developingAt: string | null
  developedAt: string | null
  scannedAt: string | null
  lab: string
  devNotes: string
  notes: string
  tags: string[]
  costs: RollCosts
  legacyId?: string
}

export interface GeoPoint {
  lat: number
  lng: number
  accuracy: number | null
  altitude: number | null
}

export interface FramePhoto {
  /** `local` = only on the device that took it (waiting to upload, or upload unavailable). */
  status: 'local' | 'uploaded'
  path: string | null
  thumbPath: string | null
  /** Direct URL, used for photos imported from the original app. */
  url?: string | null
  width: number
  height: number
}

export type Aperture = number | 'auto'

export interface Frame extends Base {
  rollId: string
  number: number
  takenAt: string
  status: 'shot' | 'skipped'
  location: GeoPoint | null
  /** Compass heading in degrees, 0 = north. */
  heading: number | null
  aperture: Aperture | null
  shutter: string | null
  lensId: string | null
  focalLength: number | null
  exposureComp: number | null
  flash: boolean
  filter: string
  notes: string
  photo: FramePhoto | null
}

export interface Profile {
  currency: string
  legacyImportedAt: string | null
}

export type CollectionName = 'cameras' | 'lenses' | 'films' | 'rolls' | 'frames'

export interface CollectionTypes {
  cameras: Camera
  lenses: Lens
  films: FilmStock
  rolls: Roll
  frames: Frame
}
