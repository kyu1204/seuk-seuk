import { supabase } from './supabase'
import { createClient } from './supabase-server'
import type { User, AuthError } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  name?: string
  avatar?: string
}

export interface SignUpData {
  email: string
  password: string
  name?: string
}

export interface SignInData {
  email: string
  password: string
}

// Client-side auth functions
export async function signUp({ email, password, name }: SignUpData) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || '',
        }
      }
    })

    if (error) {
      throw error
    }

    return { user: data.user, error: null }
  } catch (error) {
    return { user: null, error: error as AuthError }
  }
}

export async function signIn({ email, password }: SignInData) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      throw error
    }

    return { user: data.user, error: null }
  } catch (error) {
    return { user: null, error: error as AuthError }
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
    return { error: null }
  } catch (error) {
    return { error: error as AuthError }
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      throw error
    }
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function updateUserProfile(updates: { name?: string; email?: string }) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    })

    if (error) {
      throw error
    }

    return { user: data.user, error: null }
  } catch (error) {
    return { user: null, error: error as AuthError }
  }
}

export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      throw error
    }

    return { error: null }
  } catch (error) {
    return { error: error as AuthError }
  }
}

// Server-side auth functions
export async function getServerUser() {
  const supabase = createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      throw error
    }
    return user
  } catch (error) {
    console.error('Error getting server user:', error)
    return null
  }
}

export async function getServerSession() {
  const supabase = createClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      throw error
    }
    return session
  } catch (error) {
    console.error('Error getting server session:', error)
    return null
  }
}

// Social auth functions
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as AuthError }
  }
}

export async function signInWithGithub() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as AuthError }
  }
}

// Utility function to check if user is authenticated
export function isAuthenticated(user: User | null): boolean {
  return user !== null
}

// Utility function to get user display name
export function getUserDisplayName(user: User | null): string {
  if (!user) return 'Anonymous'
  
  return user.user_metadata.name || 
         user.user_metadata.full_name || 
         user.email?.split('@')[0] || 
         'User'
}