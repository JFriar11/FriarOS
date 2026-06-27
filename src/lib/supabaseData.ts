import { type AppState } from '../types'
import { isSupabaseConfigured, supabase } from './supabase'

export interface ProfileRow {
  id: string
  created_at: string
  updated_at: string
  display_name: string | null
}

export interface AppStateRow {
  id: string
  user_id: string
  data: AppState
  updated_at: string
}

export interface AuthSessionState {
  isAuthenticated: boolean
  isReady: boolean
  userId: string | null
}

function normalizeAppState(data: AppState | null | undefined): AppState {
  return data || {}
}

export async function getAuthSessionState(): Promise<AuthSessionState> {
  if (!supabase) {
    return { isAuthenticated: false, isReady: true, userId: null }
  }

  const { data: { session } } = await supabase.auth.getSession()

  return {
    isAuthenticated: Boolean(session?.user),
    isReady: true,
    userId: session?.user?.id ?? null
  }
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured')
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUpWithEmail(email: string, password: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured')
  }

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  if (!supabase) {
    return
  }

  await supabase.auth.signOut()
}

export async function syncAppState(state: AppState) {
  return saveRemoteAppState(state)
}

export async function upsertProfile(displayName: string | null) {
  if (!supabase) {
    return null
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  const { data, error } = await supabase.from('profiles').upsert({
    id: user.id,
    display_name: displayName,
    updated_at: new Date().toISOString()
  }).select().single()

  if (error) throw error
  return data as ProfileRow
}

export async function loadRemoteAppState() {
  if (!supabase || !isSupabaseConfigured()) {
    return null
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  const { data, error } = await supabase.from('app_state').select('data').eq('user_id', user.id).maybeSingle()
  if (error) throw error
  return normalizeAppState(data?.data as AppState | null)
}

export async function saveRemoteAppState(state: AppState) {
  if (!supabase || !isSupabaseConfigured()) {
    return null
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  const { data, error } = await supabase.from('app_state').upsert({
    user_id: user.id,
    data: state,
    updated_at: new Date().toISOString()
  }).select().single()

  if (error) throw error
  return data as AppStateRow
}
