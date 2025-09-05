'use client'

import { createClient } from '@/lib/supabase/client'
import { Auth } from '@supabase/auth-ui-react'
import { useRouter } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import { Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'

// Separate component to handle search params within Suspense
function LoginContent() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const redirectPath = searchParams.get('redirect_path')
        router.push(redirectPath || '/dashboard-overview')
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase.auth, searchParams])

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const redirectPath = searchParams.get('redirect_path')
        router.push(redirectPath || '/dashboard-overview')
      }
    }
    checkSession()
  }, [router, supabase.auth, searchParams])

  const getRedirectTo = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/callback`
    }
    return 'http://localhost:3000/auth/callback'
  }

  const customTheme = {
    default: {
      colors: {
        brand: 'hsl(236, 72%, 64%)',
        brandAccent: 'hsl(236, 72%, 58%)',
        brandButtonText: 'white',
        defaultButtonBackground: 'rgba(255, 255, 255, 0.05)',
        defaultButtonBackgroundHover: 'rgba(255, 255, 255, 0.1)',
        defaultButtonBorder: 'rgba(255, 255, 255, 0.1)',
        defaultButtonText: 'white',
        dividerBackground: 'rgba(255, 255, 255, 0.1)',
        inputBackground: 'rgba(0, 0, 0, 0.2)',
        inputBorder: 'rgba(255, 255, 255, 0.1)',
        inputBorderHover: 'rgba(255, 255, 255, 0.2)',
        inputBorderFocus: 'hsl(180, 82%, 55%)',
        inputText: 'white',
        inputLabelText: 'rgb(156 163 175)',
        inputPlaceholder: 'rgb(100 116 139)',
        messageText: 'white',
        messageTextDanger: 'rgb(239 68 68)',
        anchorTextColor: 'rgb(147 197 253)',
        anchorTextHoverColor: 'white',
      },
      radii: {
        borderRadiusButton: '9999px',
        buttonBorderRadius: '9999px',
        inputBorderRadius: '0.5rem',
      },
    },
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <header className="absolute top-0 left-0 w-full z-10">
        <div className="container mx-auto px-6 sm:px-8 py-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <Sparkles className="h-8 w-8 text-cyan-400" />
              <div className="absolute inset-0 h-8 w-8 bg-cyan-400 blur-xl opacity-50"></div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Responder AI
            </span>
          </Link>
          <Button asChild variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="w-full max-w-md p-8 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl shadow-purple-500/10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-slate-400">Sign in or create an account to continue.</p>
          </div>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: customTheme,
              variables: customTheme
            }}
            providers={['github', 'google']}
            redirectTo={getRedirectTo()}
            localization={{
              variables: {
                sign_in: { email_label: 'Email address', password_label: 'Password' },
                sign_up: { email_label: 'Email address', password_label: 'Create a password' }
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
