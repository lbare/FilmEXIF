import { lazy } from 'react'
import { Navigate, type RouteObject } from 'react-router'
import { AppLayout } from './components/AppLayout'
import RollsPage from './pages/rolls/RollsPage'

const GearPage = lazy(() => import('./pages/gear/GearPage'))
const FridgePage = lazy(() => import('./pages/fridge/FridgePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <RollsPage /> },
      { path: 'fridge', element: <FridgePage /> },
      { path: 'gear', element: <GearPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]
