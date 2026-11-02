# FilmEXIF

A phone-first web app for logging film photography: every roll, every frame, with its exposure settings, location, compass heading and time. It works offline, installs to your home screen, and syncs to your account so the same data is on your desktop.

Inspired by **Film Shots** by Oleksii Novikov ([35mmc write-up](https://www.35mmc.com/06/08/2020/film-shots-another-film-exif-app-for-android-and-ios-but-with-a-difference-by-oleksii-novikov/)), which is no longer on the app stores.

Live: https://lbare.github.io/FilmEXIF/

## Features

- **Shoot screen:** a big next-frame number, thumb-sized aperture/shutter/focal pickers limited to your gear's real values, and settings that carry over from the last frame, so most frames take one tap. GPS and compass heading are captured automatically. Optional extras: note, reference photo, exposure compensation, flash, filter, and skip frame.
- **Rolls:** load a roll from the fridge or type in any film, with push/pull, exposures, tags, notes and costs. Each roll tracks Loaded → Finished → At lab → Developed → Scanned, with a date for each step.
- **Frame editor:** fix any setting or the time, renumber frames, or move the location pin on a map.
- **Film fridge:** stock counts, expiry warnings, price per roll, and the value of what's in the fridge. Loading a roll takes one out of stock.
- **Gear:** cameras (shutter range, ⅓ stops, bulb, auto) and lenses (focal range, aperture range and clicks). Retire gear without losing its history.
- **Map:** every located frame, clustered and filterable by roll, camera, film and date. Each roll also has its own map.
- **Stats:** frames per month, a shooting-day calendar, films, cameras, lenses, focal lengths, apertures, shutter speeds, time of day, ISO and push/pull, spend and cost per frame, and turnaround times.
- **Year in review:** a shareable summary of a year on film.
- **Sleeve labels:** a printable index card or strip with a QR code back to the roll.
- **Your data:** JSON backup and restore, plus a one-time import of rolls from the original version of this app.

## Tech

React 19 · TypeScript 7 · Vite 8 · Mantine 9 (+ charts, dates) · React Router (hash routing for GitHub Pages) · Firebase 13 (Auth, Firestore with offline cache, Storage) · Leaflet + OpenStreetMap · vite-plugin-pwa · Vitest · oxlint

```
src/
  auth/         sign-in and auth state
  data/         types, Firestore API, DataProvider (live subscription to the user's data), backup, legacy import
  lib/          exposure maths, stats, sensors (GPS/compass), photos (offline queue), formatting
  components/   shared UI (layout, pickers, roll cards, frame list)
  pages/        rolls, shoot, fridge, gear, map, stats, settings
```

Data lives under `users/{uid}/{cameras,lenses,films,rolls,frames}` and is private to each user (`firestore.rules`, `storage.rules`). Writes are applied to the local cache immediately and sync when there's a connection. Reference photos are resized on the device, kept in IndexedDB, and uploaded in the background.

## Development

```bash
npm install
npm run dev          # http://localhost:5173/FilmEXIF/ against the real Firebase project
```

To work against local emulators instead (needs Java 21+):

```bash
npm run emulators    # auth, firestore and storage emulators (uses npx firebase-tools)
npm run dev:emu      # app pointed at the emulators
node scripts/seed-emulator.mjs   # optional: a year of sample rolls and frames
```

Checks (all run in CI on every PR):

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Pushing to `main` builds the app and publishes `dist/` to the `gh-pages` branch, which GitHub Pages serves.

## Firebase setup (one time)

1. In the [Firebase console](https://console.firebase.google.com/project/filmexif-e38ff/authentication), open **Authentication → Get started**, then enable the **Google** and **Email/Password** providers.
2. Under **Authentication → Settings → Authorized domains**, add `lbare.github.io`.
3. Deploy the security rules:
   ```bash
   npx firebase-tools deploy --only firestore:rules,storage --project filmexif-e38ff
   ```
4. Reference-photo uploads need Cloud Storage, which may require the Blaze plan. Without it, photos stay on the device that took them and everything else still works.

## Roadmap

See [ROADMAP.md](ROADMAP.md). Next up: Lightroom export and linking frames to scans.
