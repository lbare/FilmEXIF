# FilmEXIF Rebuild Roadmap

The plan for rebuilding FilmEXIF around two core jobs, **tracking rolls** and **logging shots**, plus two extras: **stats/data visualization** and a **map of shots**. Lightroom export is out of scope for now, but the data model below is designed so it can be added later without a migration.

Each phase ends in a working, deployable app. Phases build on each other in order, apart from Map and Stats, which are independent of each other.

---

## Decisions (defaults assumed, change before building if you disagree)

| Decision | Default | Why / alternative |
| --- | --- | --- |
| Rebuild vs. upgrade | **Fresh scaffold in this repo**, reusing little of the old code | Every dependency is 1–2 majors behind and the data layer needs replacing anyway |
| Backend | **Keep Firebase**: Auth + Firestore with offline persistence + Storage | Syncs phone ↔ desktop, which the Lightroom step will need. Alternative: local-only (IndexedDB), no account and no sync |
| Accounts | **Google sign-in**, data scoped per user | Today's data is shared and publicly writable |
| Offline | **Firestore's built-in offline cache + installable PWA** | You're often shooting with poor signal; logging a frame must never wait on the network |
| UI kit | **Mantine 9 only** (drop Tailwind) + `@mantine/charts` + `@mantine/dates` | One styling system, and the charts come with it |
| Map | **Leaflet + react-leaflet with OpenStreetMap tiles** + marker clustering | Free, no API key. Alternative: MapLibre/Mapbox for nicer styling |
| Routing on GitHub Pages | **HashRouter** | Removes the `404.html` redirect hack and works offline as a PWA |
| Old data | **One-time import** of the existing `activeRolls` / `developedRolls` / `completedRolls` collections into your account | Skip if the existing rolls are only test data |

## Target stack

React 19 · TypeScript · Vite 8 · Mantine 9 (+ charts, dates, notifications) · React Router (hash mode) · Firebase 13 (Auth, Firestore, Storage) · `vite-plugin-pwa` · react-leaflet + leaflet.markercluster · Vitest + Testing Library · ESLint flat config · GitHub Actions → Pages (the `gh-pages` script is removed)

## Data model

Everything lives under `users/{uid}/…`, with security rules restricting access to the owner.

```
cameras/{id}   name, make, model, format (35mm | 120 | other), shutterSpeeds[], notes, retired
lenses/{id}    name, focalLength (or zoom range), maxAperture, apertures[], mount, notes, retired
films/{id}     brand, name, boxIso, format, process (C-41 | E-6 | B&W | ECN-2), exposures default

rolls/{id}
  name?, status: loaded | finished | developing | developed | scanned
  cameraId, defaultLensId?, film: { filmId?, brand, name, boxIso }   ← film is snapshotted so later edits don't rewrite history
  ratedIso (push/pull), exposures, format
  loadedAt, finishedAt?, developedAt?, scannedAt?
  lab?, developer?, devNotes?, notes?, tags[]
  frameCount (denormalized for list views)

frames/{id}
  rollId, number, takenAt, status: shot | blank | skipped
  location?: { lat, lng, accuracy }
  aperture?, shutter?, lensId?, focalLength?, exposureComp?, filter?, flash?
  notes?, photo?: { storagePath, thumbPath, width, height }
```

Frames are their own collection (with a `rollId`) rather than an array on the roll, so editing one frame doesn't rewrite the whole roll, and the map and stats pages can read every frame without collection-group indexes.

---

## Phase 0 – Foundation
- Fresh Vite 8 + React 19 + TS scaffold, ESLint flat config, Vitest, Prettier.
- Mantine 9 theme (dark by default, light supported), app shell with a bottom tab bar on mobile and a side nav on desktop.
- Tabs: **Rolls · Map · Stats · Settings**, with a prominent "Shoot" entry point when a roll is loaded.
- HashRouter, PWA manifest and icons, offline app shell.
- CI: lint + typecheck + test + build on PRs, deploy to Pages on `main`.

**Done when:** an empty shell installs to the phone home screen and opens offline.

## Phase 1 – Auth and data layer
- Google sign-in, plus a signed-out landing screen.
- Firestore with `persistentLocalCache` (offline writes queue and sync later).
- Typed repository module (`data/rolls.ts`, `data/frames.ts`, `data/gear.ts`) with live-query hooks (`useRolls`, `useRoll(id)`, `useFrames(rollId)`) built on `onSnapshot`. This replaces the hand-rolled localStorage cache and the global-timestamp hack.
- `firestore.rules` and `storage.rules` checked into the repo (owner-only access).
- One-time importer for the old collections.

**Done when:** you can sign in, data survives reloads and offline use, and the rules reject other users.

**Needs you:** enable the Google provider in the Firebase console, and deploy the rules (`firebase deploy --only firestore:rules,storage`).

## Phase 2 – Gear and film library (Settings)
- CRUD for cameras, lenses, and film stocks, with sensible presets (standard full-stop and third-stop shutter and aperture scales, and a starter list of common film stocks).
- Retire gear without deleting it, so history stays intact.

**Done when:** gear and films can be picked from lists when creating a roll.

## Phase 3 – Roll tracking
- **New roll:** pick camera, film (or type one in), rated ISO with push/pull shown, exposures (24/36/custom, 120 formats), default lens, name, and notes.
- **Rolls list:** grouped by status with counts; filter by camera, film, or tag; search.
- **Roll detail:** header (film, camera, ISO, dates), status stepper (Loaded → Finished → Developing → Developed → Scanned) with dates recorded at each step, lab/dev notes, edit, delete (with confirmation), and the frame list.
- Only one roll per camera can be loaded at a time (with a warning if you try another).

**Done when:** a roll can be created, moved through every stage, edited, and deleted.

## Phase 4 – Shot logging (the core)
- **Shoot screen** for a loaded roll, built for one-handed use:
  - large next-frame number and progress;
  - aperture and shutter as swipeable stop pickers limited to the camera/lens's real values; lens and focal length picker;
  - settings **carry over from the previous frame**, so most frames are a single tap on **Log frame**;
  - GPS captured in the background at screen open, refreshed on log, with accuracy shown and a manual "no location" fallback;
  - optional quick note, exposure compensation, and reference photo (resized client-side, uploaded with a thumbnail, queued if offline);
  - undo toast after logging.
- Mark frames as blank or skipped; prompt to finish the roll at the last exposure (allowing a few frames past it).
- **Edit frames** from roll detail: change any field, fix location by dropping a pin, reorder or renumber, delete.
- Vitest coverage for stop scales, frame numbering, and carry-over logic.

**Done when:** a full 36-exposure roll can be logged quickly, offline, and edited afterwards.

## Phase 5 – Map
- **Map tab:** every frame that has a location, clustered. Filter by roll, camera, film, and date range. Tapping a marker shows a popup with frame number, settings, date, and thumbnail, linking to the frame.
- **Per-roll map** on roll detail: frames in shooting order, joined by a faint path line.
- "Locate me" button; fits bounds to the current filter.

**Done when:** frames from multiple rolls show and filter correctly on desktop and mobile.

## Phase 6 – Stats and data visualization
Using `@mantine/charts`, with stat aggregation in pure, unit-tested functions:
- **Headline tiles:** rolls shot, frames logged, rolls waiting to develop, average days to finish a roll.
- **Over time:** frames and rolls per month (bar chart), plus a calendar heatmap of shooting days.
- **Gear and film:** usage by film stock, camera, lens, and focal length (bar/donut charts).
- **Exposure habits:** aperture and shutter-speed distributions; ISO and push/pull usage.
- **Pipeline:** how long rolls sit in each status (finished → developed → scanned).
- Global filters (date range, camera, film) shared across charts.

**Done when:** the charts render from real data, handle an empty account gracefully, and the aggregation functions have tests.

## Phase 7 – Polish
- JSON backup export and import of all your data (a simple safety net, not the Lightroom feature).
- Empty states and first-run onboarding (add a camera → add a film → load a roll).
- Accessibility pass, loading skeletons, error toasts, update-available prompt for the PWA.
- README refresh with screenshots.

## Feature ideas (proposed, pick what you want)

Ideas beyond the brief. ★ marks the ones I'd fold into the phases above, since they're cheap given the data model. The rest are optional extras.

**In the field**
- ★ **Bracketing quick action:** log 3 or 5 frames at once, stepping exposure (−1 / 0 / +1). *(Phase 4)*
- ★ **Heading and altitude per frame:** compass direction from the device sensors, shown as a direction cone on the map. *(Phase 4/5)*
- ★ **Home-screen shortcut:** a PWA shortcut that opens straight to "Log frame" on the loaded roll. *(Phase 4)*
- **Exposure helper:** Sunny 16 calculator for the roll's rated ISO, plus equivalent-exposure suggestions within the lens and camera's limits.
- **Reciprocity calculator:** per film stock, for long exposures, with a built-in timer.
- **Voice notes:** dictate a frame note, transcribed with the browser's speech recognition.
- **Multiple-exposure flag:** keep logging settings on the same frame number.

**Film fridge and costs**
- ★ **Film inventory:** stock count per film, expiry dates, a warning for expired or soon-to-expire film, and loading a roll takes one from stock. *(Phase 2)*
- ★ **Cost tracking:** price of film, development, and scanning per roll, giving cost-per-roll and cost-per-frame stats. *(Phase 2/6)*
- **Lab tracker:** drop-off date, lab name, and a "ready for pickup?" reminder after N days.
- **Home development log:** developer, dilution, temperature, time, and agitation, with a step-by-step dev timer.

**After development**
- ★ **Printable sleeve label:** a small card with roll name, film, camera, dates, and a QR code linking to the roll page, to keep with the negatives. *(Phase 7)*
- **Contact sheet view:** attach low-res scans to frames later, then rate and mark favourites (a first step toward Lightroom matching).
- **Camera service log:** total frames per camera body, plus service and repair notes.

**Stats extras**
- **Year in review:** a shareable "your year on film" summary card (rolls, top stock, top location, busiest month).
- **Time-of-day / golden-hour chart:** when you shoot, compared against sunrise and sunset at each location.
- **Keeper rate:** favourites ÷ frames, per film and camera, once ratings exist.

## Later (not in this rebuild)
- Lightroom Classic plugin / XMP sidecar or ExifTool CSV export, matching frames to scans by order.
- Reverse-geocoded place names, weather at time of shot.
- Sharing a read-only roll page.

---

## How I'll build it
- One branch and PR per phase (`rebuild/phase-0-foundation`, …), each green on lint, typecheck, test, and build, and checked in the browser at mobile width before it's opened.
- The rebuild replaces `src/` wholesale in Phase 0. The old code remains in git history for reference.
- After each phase, I'll stop briefly to summarize and flag anything that needs you (Firebase console steps, design choices).
