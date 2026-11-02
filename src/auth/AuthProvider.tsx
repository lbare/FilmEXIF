import { onAuthStateChanged, type User } from 'firebase/auth'
import { createContext, use, useEffect, useState, type ReactNode } from 'react'
import { auth } from '../lib/firebase'

interface AuthState {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthState>({ user: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: auth.currentUser, loading: true })

  useEffect(() => onAuthStateChanged(auth, (user) => setState({ user, loading: false })), [])

  return <AuthContext value={state}>{children}</AuthContext>
}

export const useAuth = () => use(AuthContext)
