# FilmEXIF Roadmap

## Done: the 2026 rebuild

The app was rebuilt from scratch around tracking rolls and logging shots, plus a map and stats.

| Area | Status | Notes |
| --- | --- | --- |
| Foundation | ✅ | React 19, Vite 8, Mantine 9, Firebase 13, hash routing, installable PWA, CI → gh-pages |
| Accounts & data | ✅ | Google and email sign-in, per-user Firestore with an offline cache, security rules, JSON backup/restore, import from the original app |
| Gear | ✅ | Cameras and lenses; their ranges drive the pickers; retire instead of delete |
| Film fridge | ✅ | Stock, expiry warnings, price per roll; loading a roll takes one from stock |
| Roll tracking | ✅ | Loaded → Finished → At lab → Developed → Scanned with dates, lab, costs, tags |
| Shot logging | ✅ | One-tap Shoot screen with carried-over settings, GPS, compass heading, reference photos (offline queue), frame editor |
| Home-screen shortcut | ✅ | "Log a frame" opens the loaded roll's Shoot screen |
| Sleeve labels | ✅ | Printable index card or strip with a QR code back to the roll |
| Map | ✅ | Clustered map of every located frame, filters, per-roll path map |
| Stats | ✅ | Monthly frames, shooting calendar, gear and film usage, exposure habits, time of day, ISO, spend, turnaround |
| Year in review | ✅ | Shareable summary card, most-shot place, first and last frames |

Decisions made along the way:
- **Frames collection:** frames are a flat `users/{uid}/frames` collection with a `rollId`, so the map and stats read everything without collection-group indexes.
- **Map tiles:** standard OpenStreetMap, inverted for dark mode, because CARTO's basemaps now need an API key.
- **Bracketing:** left out, as requested.

## Data model

```
users/{uid}                currency, legacyImportedAt
users/{uid}/cameras/{id}   name, format, slowest/fastest shutter, shutterStops, bulb, autoExposure, defaultLensId, retired
users/{uid}/lenses/{id}    name, mount, focalMin/Max, maxAperture, minAperture, apertureStops, retired
users/{uid}/films/{id}     brand, name, iso, format, process, exposures, stock, expiresOn, pricePerRoll
users/{uid}/rolls/{id}     status, cameraId, lensId, filmId, film snapshot, ratedIso, exposures, format,
                           loadedAt/finishedAt/developingAt/developedAt/scannedAt, lab, devNotes, notes, tags, costs
users/{uid}/frames/{id}    rollId, number, takenAt, status (shot|skipped), location {lat,lng,accuracy,altitude},
                           heading, aperture, shutter, lensId, focalLength, exposureComp, flash, filter, notes, photo
```

## Next

- **Lightroom:** export per roll (ExifTool CSV and/or XMP sidecars named by frame number), then a Lightroom Classic plugin that matches frames to scans in order and writes date, GPS, camera, lens, ISO, aperture and shutter.
- **Scan linking:** attach low-res scans to frames, mark favourites, and track keeper rate by film and camera.
- **Place names:** reverse-geocoded names for frames and in Year in review.
- **Sharing:** a read-only page for a single roll.
