import { createClient } from '@/lib/supabase-server'
import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: { code?: string; error?: string; redirect?: string }
}) {
  const supabase = createClient()

  if (searchParams.error) {
    console.error('Auth callback error:', searchParams.error)
    redirect('/login?error=auth_callback_error')
  }

  if (searchParams.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(searchParams.code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      redirect('/login?error=auth_callback_error')
    }
  }

  // Redirect to the intended destination or dashboard
  const redirectTo = searchParams.redirect || '/dashboard'
  redirect(redirectTo)
}