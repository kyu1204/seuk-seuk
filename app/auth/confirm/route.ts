import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const token = searchParams.get('token')
  const code = searchParams.get('code')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  console.log('Auth confirm params:', { token_hash, token, code, type, next })

  const supabase = await createServerSupabase()

  // Handle different auth flows
  if (code) {
    // Handle PKCE flow with authorization code
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      console.log('Code exchange successful')
      redirect(next)
    } else {
      console.error('Code exchange error:', error)
    }
  } else if (token_hash && type) {
    // Handle token_hash flow
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      console.log('Token hash verification successful')
      redirect(next)
    } else {
      console.error('Token hash verification error:', error)
    }
  } else if (token && type) {
    // Handle token flow
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: token,
    })

    if (!error) {
      console.log('Token verification successful')
      redirect(next)
    } else {
      console.error('Token verification error:', error)
    }
  }

  console.log('Auth confirmation failed, redirecting to error')
  // redirect the user to an error page with some instructions
  redirect('/error')
}