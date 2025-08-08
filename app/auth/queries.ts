import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

export async function getCurrentUser() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting current user:', error)
    return null
  }
  
  return user
}

export async function getCurrentUserClient() {
  const supabase = createBrowserClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting current user:', error)
    return null
  }
  
  return user
}

export async function signOut() {
  const supabase = createBrowserClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) {
    console.error('Error signing in:', error)
    throw error
  }
  
  return data
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })
  
  if (error) {
    console.error('Error signing up:', error)
    throw error
  }
  
  return data
}

export async function signInWithOAuth(provider: 'google' | 'github') {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  
  if (error) {
    console.error('Error signing in with OAuth:', error)
    throw error
  }
  
  return data
}