import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

export const usingEmulators = import.meta.env.VITE_USE_EMULATORS === 'true'

// Firebase web config is public by design; access is controlled by firestore.rules / storage.rules.
const config = usingEmulators
  ? {
      apiKey: 'demo-key',
      authDomain: 'localhost',
      projectId: 'demo-filmexif',
      storageBucket: 'demo-filmexif.appspot.com',
      appId: 'demo-app',
    }
  : {
      apiKey: 'AIzaSyAOY73LntFR-3h3DxlXwnP7diUUfnWt85k',
      authDomain: 'filmexif-e38ff.firebaseapp.com',
      projectId: 'filmexif-e38ff',
      storageBucket: 'filmexif-e38ff.appspot.com',
      messagingSenderId: '571498923203',
      appId: '1:571498923203:web:8955ac96f5e357688f8e76',
    }

export const app = initializeApp(config)
export const auth = getAuth(app)
// Offline cache: reads come from IndexedDB and writes queue until there's a connection.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  ignoreUndefinedProperties: true,
})
export const storage = getStorage(app)

if (usingEmulators) {
  const host = window.location.hostname
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true })
  connectFirestoreEmulator(db, host, 8080)
  connectStorageEmulator(storage, host, 9199)
}
