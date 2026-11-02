import {
  Anchor,
  Button,
  Card,
  Center,
  Divider,
  Image,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { GoogleLogo } from '@phosphor-icons/react'
import { FirebaseError } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth'
import { useState } from 'react'
import { auth } from '../lib/firebase'

const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/user-not-found': 'No account with that email.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/email-already-in-use': 'An account with that email already exists. Sign in instead.',
  'auth/weak-password': 'Use at least 6 characters.',
  'auth/operation-not-allowed': 'This sign-in method isn’t enabled for the app yet.',
  'auth/configuration-not-found': 'This sign-in method isn’t enabled for the app yet.',
  'auth/network-request-failed': 'No connection. You need to be online to sign in the first time.',
}

const describe = (err: unknown) =>
  err instanceof FirebaseError ? (MESSAGES[err.code] ?? err.message) : String(err)

export function SignInPage() {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : 'Enter a valid email'),
      password: (v) => (v.length >= 6 ? null : 'At least 6 characters'),
    },
  })

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      await fn()
    } catch (err) {
      if (!(err instanceof FirebaseError && err.code === 'auth/popup-closed-by-user')) setError(describe(err))
    } finally {
      setBusy(false)
    }
  }

  const google = () =>
    run(async () => {
      const provider = new GoogleAuthProvider()
      try {
        await signInWithPopup(auth, provider)
      } catch (err) {
        if (err instanceof FirebaseError && err.code === 'auth/popup-blocked') {
          await signInWithRedirect(auth, provider)
        } else throw err
      }
    })

  const submit = form.onSubmit(({ email, password }) =>
    run(() =>
      mode === 'signIn'
        ? signInWithEmailAndPassword(auth, email, password)
        : createUserWithEmailAndPassword(auth, email, password),
    ),
  )

  const reset = () => {
    if (form.validateField('email').hasError) return
    void run(async () => {
      await sendPasswordResetEmail(auth, form.values.email)
      setInfo('Password reset email sent.')
    })
  }

  return (
    <Center mih="100dvh" p="md">
      <Stack w="100%" maw={380} gap="lg">
        <Stack align="center" gap={6}>
          <Image src={`${import.meta.env.BASE_URL}pwa-192x192.png`} w={72} h={72} alt="" />
          <Title order={2}>FilmEXIF</Title>
          <Text c="dimmed" ta="center" size="sm">
            Log every roll and every frame. Settings, location and time, even offline.
          </Text>
        </Stack>
        <Card p="lg">
          <Stack>
            <Button
              size="md"
              variant="default"
              leftSection={<GoogleLogo size={20} weight="bold" />}
              onClick={google}
              loading={busy}
            >
              Continue with Google
            </Button>
            <Divider label="or use email" />
            <form onSubmit={submit}>
              <Stack gap="sm">
                <TextInput
                  label="Email"
                  type="email"
                  autoComplete="email"
                  {...form.getInputProps('email')}
                />
                <PasswordInput
                  label="Password"
                  autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                  {...form.getInputProps('password')}
                />
                {error && (
                  <Text c="red" size="sm">
                    {error}
                  </Text>
                )}
                {info && (
                  <Text c="teal" size="sm">
                    {info}
                  </Text>
                )}
                <Button type="submit" loading={busy}>
                  {mode === 'signIn' ? 'Sign in' : 'Create account'}
                </Button>
              </Stack>
            </form>
            <Text size="sm" ta="center" c="dimmed">
              {mode === 'signIn' ? 'New here? ' : 'Have an account? '}
              <Anchor component="button" size="sm" onClick={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}>
                {mode === 'signIn' ? 'Create an account' : 'Sign in'}
              </Anchor>
              {mode === 'signIn' && (
                <>
                  {' · '}
                  <Anchor component="button" size="sm" onClick={reset}>
                    Forgot password
                  </Anchor>
                </>
              )}
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Center>
  )
}
