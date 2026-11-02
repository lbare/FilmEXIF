import { Center, Loader, MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import { createHashRouter, RouterProvider } from 'react-router'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { SignInPage } from './auth/SignInPage'
import { DataProvider } from './data/DataProvider'
import { routes } from './routes'
import { theme } from './theme'
import { UpdatePrompt } from './components/UpdatePrompt'

const router = createHashRouter(routes)

function AuthGate() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <Center h="100dvh">
        <Loader />
      </Center>
    )
  }
  if (!user) return <SignInPage />
  return (
    <DataProvider key={user.uid} uid={user.uid}>
      <RouterProvider router={router} />
    </DataProvider>
  )
}

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications position="top-center" zIndex={1000} />
      <ModalsProvider>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </ModalsProvider>
      <UpdatePrompt />
    </MantineProvider>
  )
}
