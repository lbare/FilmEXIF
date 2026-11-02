import { collection, doc, onSnapshot } from 'firebase/firestore'
import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react'
import { db } from '../lib/firebase'
import { defaultCurrency } from '../lib/format'
import { createApi, type Api } from './api'
import type { Camera, CollectionName, CollectionTypes, FilmStock, Frame, Lens, Profile, Roll } from './types'

interface Collections {
  cameras: Camera[]
  lenses: Lens[]
  films: FilmStock[]
  rolls: Roll[]
  frames: Frame[]
}

export interface DataState extends Collections {
  loading: boolean
  /** Some local writes haven't reached the server yet. */
  pendingWrites: boolean
  profile: Profile
  cameraById: Map<string, Camera>
  lensById: Map<string, Lens>
  filmById: Map<string, FilmStock>
  rollById: Map<string, Roll>
  /** Frames per roll, sorted by frame number. */
  framesByRoll: Map<string, Frame[]>
}

interface DataContextValue {
  data: DataState
  api: Api
}

const DataContext = createContext<DataContextValue | null>(null)

const NAMES: CollectionName[] = ['cameras', 'lenses', 'films', 'rolls', 'frames']

const byId = <T extends { id: string }>(items: T[]) => new Map(items.map((i) => [i.id, i]))

/**
 * Subscribes to all of the user's data once. A personal film log is small (thousands of frames at most),
 * so keeping everything in memory makes the map, stats and lists simple and instant, and Firestore's
 * offline cache means it all works without a connection.
 */
/** Remount per user (`key={uid}`) so state from a previous account never leaks. */
export function DataProvider({ uid, children }: { uid: string; children: ReactNode }) {
  const [collections, setCollections] = useState<Partial<Collections>>({})
  const [pending, setPending] = useState<Partial<Record<CollectionName, boolean>>>({})
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    const unsubs = NAMES.map((name) =>
      onSnapshot(
        collection(db, 'users', uid, name),
        { includeMetadataChanges: true },
        (snap) => {
          setCollections((prev) => ({
            ...prev,
            [name]: snap.docs.map((d) => d.data() as CollectionTypes[typeof name]),
          }))
          setPending((prev) => ({ ...prev, [name]: snap.metadata.hasPendingWrites }))
        },
        (err) => {
          console.error(`Failed to load ${name}`, err)
          setCollections((prev) => ({ ...prev, [name]: prev[name] ?? [] }))
        },
      ),
    )
    const defaults: Profile = { currency: defaultCurrency(), legacyImportedAt: null }
    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid),
        (snap) => setProfile({ ...defaults, ...(snap.data() as Partial<Profile> | undefined) }),
        (err) => {
          console.error('Failed to load profile', err)
          setProfile((prev) => prev ?? defaults)
        },
      ),
    )
    return () => unsubs.forEach((u) => u())
  }, [uid])

  const api = useMemo(() => createApi(uid), [uid])

  const data = useMemo<DataState>(() => {
    const cameras = sortByName(collections.cameras ?? [])
    const lenses = sortByName(collections.lenses ?? [])
    const films = [...(collections.films ?? [])].sort((a, b) =>
      `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`),
    )
    const rolls = [...(collections.rolls ?? [])].sort((a, b) => b.loadedAt.localeCompare(a.loadedAt))
    const frames = collections.frames ?? []
    const framesByRoll = new Map<string, Frame[]>()
    for (const f of frames) {
      const list = framesByRoll.get(f.rollId)
      if (list) list.push(f)
      else framesByRoll.set(f.rollId, [f])
    }
    for (const list of framesByRoll.values()) {
      list.sort((a, b) => a.number - b.number || a.takenAt.localeCompare(b.takenAt))
    }
    return {
      loading: NAMES.some((n) => collections[n] === undefined) || profile === null,
      pendingWrites: Object.values(pending).some(Boolean),
      profile: profile ?? { currency: defaultCurrency(), legacyImportedAt: null },
      cameras,
      lenses,
      films,
      rolls,
      frames,
      cameraById: byId(cameras),
      lensById: byId(lenses),
      filmById: byId(films),
      rollById: byId(rolls),
      framesByRoll,
    }
  }, [collections, pending, profile])

  const value = useMemo(() => ({ data, api }), [data, api])
  return <DataContext value={value}>{children}</DataContext>
}

function sortByName<T extends { name: string; retired: boolean }>(items: T[]) {
  return [...items].sort((a, b) => Number(a.retired) - Number(b.retired) || a.name.localeCompare(b.name))
}

function useDataContext() {
  const ctx = use(DataContext)
  if (!ctx) throw new Error('useData must be used inside <DataProvider>')
  return ctx
}

export const useData = () => useDataContext().data
export const useApi = () => useDataContext().api
