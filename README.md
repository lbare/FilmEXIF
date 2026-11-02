# FilmEXIF

A mobile-first web app for logging film photography shots as you take them, so the metadata (camera, film, settings, location, date) can later be attached to your scanned negatives.

It's modelled on **Film Shots** by Oleksii Novikov ([35mmc write-up](https://www.35mmc.com/06/08/2020/film-shots-another-film-exif-app-for-android-and-ios-but-with-a-difference-by-oleksii-novikov/)), which is no longer on the app stores. Film Shots logged each frame on your phone, then let you push that data into Lightroom and match it to your scans. FilmEXIF aims to do the same.

Live: https://lbare.github.io/FilmEXIF/

## Goals

1. **Track shots** – for every frame: camera, film stock, exposure settings, location, and date/time.
2. **Track rolls through their lifecycle** – shooting → developing → scanned/completed.
3. **Export** – get each roll's data out in a portable format (JSON/CSV, and EXIF/XMP-friendly).
4. **Lightroom linking** – match logged frames to scanned negatives in Lightroom and write the metadata onto them.

Goals 1 and 2 are partly built. Goals 3 and 4 haven't been started.

## Tech stack

- React 18 + TypeScript, built with Vite
- Mantine 7 (UI components and forms), Tailwind CSS (layout), Phosphor icons
- Firebase: Firestore for roll data, Storage for reference photos
- React Router (`/FilmEXIF` base path) and GitHub Pages hosting (`public/404.html` sends deep links back to the SPA)

## How it works today

### Screens (bottom tab bar — `src/navigation/TabNavigator.tsx`)

| Tab | File | What it does |
| --- | --- | --- |
| Library | `src/pages/Library.tsx` | Lists rolls in three sections: **Active**, **Develop**, **Completed** |
| Add | `src/pages/AddRoll.tsx` | Form for a new roll: optional name, camera, film brand, film name, ISO |
| Settings | `src/pages/Settings.tsx` | Placeholder |

### Roll lifecycle

- **Active** rolls show a progress ring with the next frame number out of the total exposures.
  - **Tap +** logs a shot: it grabs the current GPS position (falls back to `0,0` if that fails) and the current time.
  - **Long-press +** opens `RollOptionsModal`, where you can either take a reference photo with the phone camera (resized to 1024px JPEG and uploaded to Firebase Storage) or **Finish Roll**.
- **Finish Roll** moves the roll to **Develop**. The ✓ button there moves it to **Completed**.
- The **Completed** folder button doesn't do anything yet. It's meant to be the place for export and Lightroom linking.

### Data model (`src/interfaces.tsx`)

```ts
FilmRoll { id, dateCreated, name?, camera, filmBrand, filmName, iso, exposures, photos: Photo[] }
Photo    { id, location: { latitude, longitude }, date, imageUrl? }
```

### Persistence (`src/firebase/config.ts`, `src/contexts/RollsContext.tsx`)

- Each stage is its own Firestore collection: `activeRolls`, `developedRolls`, `completedRolls`. Moving a roll copies the document into the next collection and deletes the old one.
- Photos are stored as an array on the roll document.
- `metadata/globalLastUpdated` holds a timestamp. On load, the app compares it with the copy in `localStorage` and either uses the cached rolls or re-fetches everything.
- There's no authentication, so every visitor reads and writes the same collections.

## Known gaps and issues

**Missing for the core "log a shot" goal**
- Shots only record location and time. There are no fields for **aperture, shutter speed, lens/focal length, exposure compensation, or notes**, and no screen to view or edit the frames on a roll.
- `exposures` is always 36 (the form has no field for it), and nothing stops you logging more frames than the roll holds.
- The ISO list is fixed (100–1600), so push/pull ratings like 3200 or 50 aren't available.
- Camera and film are free text. There's no saved gear or film presets yet, though the Settings tab could hold them.
- Rolls can't be edited or deleted from the UI.

**Bugs / tech debt**
- Firestore document IDs and roll IDs don't match. `addDoc` creates a random document ID, while the app's own UUID is stored in the `id` field. `deleteRollFromFirebase` looks the roll up by `doc(db, …, rollId)`, so it would never find it (it isn't called from anywhere yet). Fix: use `setDoc(doc(db, coll, roll.id), …)` everywhere.
- After a reference photo uploads, the local state doesn't get its `imageUrl` until the next full reload from Firestore.
- The long-press handlers are spread onto the same button as the tap handler, so a long press can log a shot *and* open the modal.
- The "new only" sync path compares a `Date` against ISO-string timestamps. It's never called, so it doesn't break anything today.
- Splitting stages across three collections makes moves non-atomic. A single `rolls` collection with a `stage` field would be simpler.
- With no auth and open collections, the data is effectively public. Add Firebase Auth and per-user security rules before relying on it.
- There are two deploy paths: the `yarn deploy` script (gh-pages) and the GitHub Actions workflow (`.github/workflows/main.yml`). Pick one.

## Roadmap

The app is being rebuilt. The current plan is in [ROADMAP.md](ROADMAP.md). The list below is the original sketch.

1. **Richer shot logging** – per-frame aperture, shutter, lens, focal length, notes. Quick-entry UI that carries the last frame's settings forward. A roll detail view for editing and deleting frames.
2. **Gear and film presets** – saved cameras, lenses, and film stocks (Settings tab), plus editable exposure count and custom ISO.
3. **Data fixes** – single collection keyed by roll ID, edit/delete, auth and per-user rules.
4. **Export** – per-roll JSON and CSV download. Optionally an ExifTool-compatible CSV or `.xmp` sidecars named by frame number, so metadata can be applied to scans outside Lightroom too.
5. **Lightroom linking** – the original Film Shots approach. A Lightroom Classic plugin (Lua SDK) that:
   - imports a roll export (file or fetched from Firebase),
   - matches frames to the selected scans in capture/filename order, with manual adjustment,
   - writes capture date/time, GPS, camera/lens, ISO, aperture, and shutter. Lightroom's SDK can set some of these fields directly; the rest need custom plugin metadata or an ExifTool pass.

## Development

```bash
yarn install
yarn dev        # local dev server (served under /FilmEXIF/)
yarn build      # type-check + production build to dist/
yarn lint
```

Pushing to `main` deploys to GitHub Pages through GitHub Actions.
