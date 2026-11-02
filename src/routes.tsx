import { lazy, Suspense } from 'react'
import { Navigate, Outlet, type RouteObject } from 'react-router'
import { AppLayout } from './components/AppLayout'
import { PageLoader } from './components/PageLoader'
import { useData } from './data/DataProvider'
import RollDetailPage from './pages/rolls/RollDetailPage'
import RollsPage from './pages/rolls/RollsPage'
import ShootPage from './pages/shoot/ShootPage'

const RollFormPage = lazy(() => import('./pages/rolls/RollFormPage'))
const FrameDrawer = lazy(() => import('./pages/rolls/FrameDrawer'))
const LabelPage = lazy(() => import('./pages/rolls/LabelPage'))
const ShootRedirect = lazy(() => import('./pages/shoot/ShootRedirect'))
const GearPage = lazy(() => import('./pages/gear/GearPage'))
const FridgePage = lazy(() => import('./pages/fridge/FridgePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const MapPage = lazy(() => import('./pages/map/MapPage'))
const StatsPage = lazy(() => import('./pages/stats/StatsPage'))
const YearReviewPage = lazy(() => import('./pages/stats/YearReviewPage'))

/** For pages outside the app shell: wait for data before rendering. */
function Bare() {
  const { loading } = useData()
  return <Suspense fallback={<PageLoader />}>{loading ? <PageLoader /> : <Outlet />}</Suspense>
}

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <RollsPage /> },
      { path: 'rolls/new', element: <RollFormPage /> },
      {
        path: 'rolls/:rollId',
        element: <RollDetailPage />,
        children: [{ path: 'frames/:frameId', element: <FrameDrawer /> }],
      },
      { path: 'rolls/:rollId/edit', element: <RollFormPage /> },
      { path: 'rolls/:rollId/shoot', element: <ShootPage /> },
      { path: 'shoot', element: <ShootRedirect /> },
      { path: 'fridge', element: <FridgePage /> },
      { path: 'gear', element: <GearPage /> },
      { path: 'map', element: <MapPage /> },
      { path: 'stats', element: <StatsPage /> },
      { path: 'year', element: <YearReviewPage /> },
      { path: 'year/:year', element: <YearReviewPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
  {
    element: <Bare />,
    children: [{ path: 'rolls/:rollId/label', element: <LabelPage /> }],
  },
]
