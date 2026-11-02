// Seed the local Firebase emulators with a year of realistic sample data for development.
// Usage: npm run emulators   (in one terminal)
//        node scripts/seed-emulator.mjs [email] [password]
// Creates the account if needed. Never point this at the real project.
import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { connectFirestoreEmulator, doc, getFirestore, writeBatch } from 'firebase/firestore'

const [email = 'tester@filmexif.test', password = 'emulator-only-123'] = process.argv.slice(2)

const app = initializeApp({ apiKey: 'demo-key', projectId: 'demo-filmexif', authDomain: 'localhost' })
const auth = getAuth(app)
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
const db = getFirestore(app)
connectFirestoreEmulator(db, '127.0.0.1', 8080)

const cred = await signInWithEmailAndPassword(auth, email, password).catch(() =>
  createUserWithEmailAndPassword(auth, email, password),
)
const uid = cred.user.uid

// Deterministic pseudo-random numbers so every seed looks the same.
let seed = 42
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const id = (prefix, n) => `seed-${prefix}-${n}`
const iso = (d) => d.toISOString()
const day = 86_400_000

const t0 = new Date().toISOString()
const base = { createdAt: t0, updatedAt: t0 }

const cameras = [
  { id: id('cam', 1), name: 'Nikon FM2', format: '35mm', slowestShutter: '1"', fastestShutter: '1/4000', shutterStops: 'full', bulb: true, autoExposure: false, defaultLensId: id('lens', 1), notes: '', retired: false },
  { id: id('cam', 2), name: 'Olympus mju-II', format: '35mm', slowestShutter: '1"', fastestShutter: '1/1000', shutterStops: 'full', bulb: false, autoExposure: true, defaultLensId: id('lens', 3), notes: '', retired: false },
  { id: id('cam', 3), name: 'Mamiya 7', format: '120', slowestShutter: '4"', fastestShutter: '1/500', shutterStops: 'full', bulb: true, autoExposure: false, defaultLensId: null, notes: '', retired: false },
]
const lenses = [
  { id: id('lens', 1), name: '50mm ƒ/1.8', mount: 'Nikon F', focalMin: 50, focalMax: 50, maxAperture: 1.8, minAperture: 22, apertureStops: 'half', notes: '', retired: false },
  { id: id('lens', 2), name: '28-85mm ƒ/3.5', mount: 'Nikon F', focalMin: 28, focalMax: 85, maxAperture: 3.5, minAperture: 22, apertureStops: 'half', notes: '', retired: false },
  { id: id('lens', 3), name: '35mm ƒ/2.8', mount: 'Fixed', focalMin: 35, focalMax: 35, maxAperture: 2.8, minAperture: 11, apertureStops: 'full', notes: '', retired: false },
]
const films = [
  { id: id('film', 1), brand: 'Kodak', name: 'Portra 400', iso: 400, format: '35mm', process: 'C-41', exposures: 36, stock: 4, expiresOn: '2027-06-01', pricePerRoll: 21.5, notes: '' },
  { id: id('film', 2), brand: 'Ilford', name: 'HP5 Plus', iso: 400, format: '35mm', process: 'B&W', exposures: 36, stock: 6, expiresOn: '2028-01-01', pricePerRoll: 11, notes: '' },
  { id: id('film', 3), brand: 'Kodak', name: 'Ektar 100', iso: 100, format: '120', process: 'C-41', exposures: 10, stock: 2, expiresOn: iso(new Date(Date.now() + 40 * day)).slice(0, 10), pricePerRoll: 14, notes: '' },
  { id: id('film', 4), brand: 'CineStill', name: '800T', iso: 800, format: '35mm', process: 'C-41', exposures: 36, stock: 0, expiresOn: null, pricePerRoll: 24, notes: '' },
]

const places = [
  { name: 'Victoria', lat: 48.4284, lng: -123.3656 },
  { name: 'Vancouver', lat: 49.2827, lng: -123.1207 },
  { name: 'Tofino', lat: 49.1529, lng: -125.9066 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'Kyoto', lat: 35.0116, lng: 135.7681 },
]

const apertures = { 1: [1.8, 2.8, 4, 5.6, 8, 11], 2: ['auto'], 3: [4, 5.6, 8, 11, 16] }
const shutters = { 1: ['1/60', '1/125', '1/250', '1/500', '1/1000'], 2: ['Auto'], 3: ['1/30', '1/60', '1/125', '1/250'] }

const rollSpecs = [
  { cam: 1, film: 1, place: 0, daysAgo: 330, status: 'scanned', iso: 400, name: '', tags: ['family'] },
  { cam: 2, film: 4, place: 1, daysAgo: 290, status: 'scanned', iso: 800, name: 'Night walks', tags: ['night'] },
  { cam: 3, film: 3, place: 2, daysAgo: 240, status: 'scanned', iso: 100, name: 'Tofino weekend', tags: ['landscape'] },
  { cam: 1, film: 2, place: 3, daysAgo: 170, status: 'developed', iso: 1600, name: 'Tokyo', tags: ['travel'] },
  { cam: 2, film: 1, place: 4, daysAgo: 160, status: 'developed', iso: 400, name: 'Kyoto', tags: ['travel'] },
  { cam: 1, film: 1, place: 0, daysAgo: 90, status: 'developing', iso: 400, name: '', tags: [] },
  { cam: 3, film: 3, place: 2, daysAgo: 45, status: 'finished', iso: 100, name: 'Beach', tags: ['landscape'] },
  { cam: 1, film: 2, place: 0, daysAgo: 12, status: 'loaded', iso: 400, name: '', tags: [] },
]

const rolls = []
const frames = []
rollSpecs.forEach((spec, i) => {
  const film = films[spec.film - 1]
  const camera = cameras[spec.cam - 1]
  const loadedAt = new Date(Date.now() - spec.daysAgo * day)
  const exposures = film.exposures
  const count = spec.status === 'loaded' ? 14 : exposures
  const shootDays = 3 + Math.floor(rand() * 20)
  const place = places[spec.place]
  const rollId = id('roll', i + 1)
  let cursor = { lat: place.lat, lng: place.lng }
  let last = loadedAt
  for (let n = 1; n <= count; n++) {
    const t = new Date(loadedAt.getTime() + (n / count) * shootDays * day + rand() * 6 * 3600_000 + 8 * 3600_000)
    last = t
    cursor = { lat: cursor.lat + (rand() - 0.5) * 0.01, lng: cursor.lng + (rand() - 0.5) * 0.014 }
    const skipped = rand() < 0.03
    frames.push({
      id: id(`f${i + 1}`, n),
      ...base,
      rollId,
      number: n,
      takenAt: iso(t),
      status: skipped ? 'skipped' : 'shot',
      location: rand() < 0.92 ? { lat: cursor.lat, lng: cursor.lng, accuracy: Math.round(5 + rand() * 30), altitude: Math.round(rand() * 80) } : null,
      heading: rand() < 0.6 ? Math.round(rand() * 359) : null,
      aperture: skipped ? null : pick(apertures[spec.cam]),
      shutter: skipped ? null : pick(shutters[spec.cam]),
      lensId: skipped ? null : spec.cam === 1 ? (rand() < 0.7 ? lenses[0].id : lenses[1].id) : spec.cam === 2 ? lenses[2].id : null,
      focalLength: spec.cam === 3 ? 80 : null,
      exposureComp: rand() < 0.1 ? pick([-1, -1 / 3, 1 / 3, 2 / 3, 1]) : null,
      flash: rand() < 0.05,
      filter: spec.cam === 1 && spec.film === 2 && rand() < 0.3 ? 'Yellow' : '',
      notes: rand() < 0.15 ? pick(['Backlit', 'Window light', 'Street corner', 'Golden hour', 'Long shadows', 'Rain']) : '',
      photo: null,
    })
  }
  const order = ['loaded', 'finished', 'developing', 'developed', 'scanned']
  const step = order.indexOf(spec.status)
  const at = (k, extra) => (step >= k ? iso(new Date(last.getTime() + extra * day)) : null)
  rolls.push({
    id: rollId,
    ...base,
    name: spec.name,
    status: spec.status,
    cameraId: camera.id,
    lensId: camera.defaultLensId,
    filmId: film.id,
    film: { brand: film.brand, name: film.name, iso: film.iso, process: film.process },
    ratedIso: spec.iso,
    exposures,
    format: film.format,
    loadedAt: iso(loadedAt),
    finishedAt: at(1, 0.2),
    developingAt: at(2, 3),
    developedAt: at(3, 10),
    scannedAt: at(4, 14),
    lab: step >= 2 ? pick(['The Lab', 'Home', 'Downtown Photo']) : '',
    devNotes: '',
    notes: '',
    tags: spec.tags,
    costs: { film: film.pricePerRoll, dev: step >= 2 ? 15 : null, scan: step >= 4 ? 12 : null },
  })
})

const all = [
  ...cameras.map((d) => ['cameras', { ...base, ...d }]),
  ...lenses.map((d) => ['lenses', { ...base, ...d }]),
  ...films.map((d) => ['films', { ...base, ...d }]),
  ...rolls.map((d) => ['rolls', d]),
  ...frames.map((d) => ['frames', d]),
]
for (let i = 0; i < all.length; i += 400) {
  const batch = writeBatch(db)
  for (const [col, data] of all.slice(i, i + 400)) batch.set(doc(db, 'users', uid, col, data.id), data)
  await batch.commit()
}
console.log(`Seeded ${rolls.length} rolls and ${frames.length} frames for ${email} (${uid}).`)
process.exit(0)
