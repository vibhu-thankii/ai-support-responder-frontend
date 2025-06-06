// src/app/login/page.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useRouter, useSearchParams } from 'next/navigation' // Import useSearchParams
import { useEffect } from 'react'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams() // Get search params

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check for a redirect_path from query parameters
        const redirectPath = searchParams.get('redirect_path');
        if (redirectPath) {
          router.push(redirectPath); // Redirect to the specified path
        } else {
          router.push('/'); // Default redirect to dashboard or root
        }
        router.refresh(); // Refresh to ensure new auth state is reflected everywhere
      }
      // Note: SIGNED_UP usually requires email confirmation before SIGNED_IN event fires for email/password.
      // For social logins, SIGNED_IN fires immediately.
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase.auth, searchParams]); // Add searchParams to dependency array

  // Check if user is already logged in on initial load
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const redirectPath = searchParams.get('redirect_path');
        if (redirectPath) {
          router.push(redirectPath);
        } else {
          router.push('/'); 
        }
      }
    };
    checkSession();
  }, [router, supabase.auth, searchParams]);


  // Construct the redirectTo URL for Supabase Auth UI (for social logins)
  // It should point back to an auth callback handler or a page that processes the login.
  // For this flow, if social login is used, it will eventually trigger the SIGNED_IN event above.
  const getRedirectTo = () => {
    if (typeof window !== 'undefined') {
      // If there's a redirect_path from an invitation, we want the user to ultimately land there
      // AFTER Supabase handles its own social auth callback.
      // So, the redirectTo for Supabase should be its standard auth callback.
      // The onAuthStateChange listener will then handle the final redirect_path.
      return `${window.location.origin}/auth/callback`; // Standard Supabase callback path
    }
    return 'http://localhost:3000/auth/callback'; // Fallback for SSR or if window is not defined
  };

  return (
    <div className="flex justify-center items-center h-screen bg-slate-100 dark:bg-slate-900 p-4">
      <div className="w-full max-w-sm p-8 bg-white dark:bg-slate-800/80 rounded-lg shadow-xl dark:border-slate-700/60">
        <h1 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-6">
          Welcome to AI Responder
        </h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))', // Use your primary color
                  brandAccent: 'hsl(var(--primary) / 0.8)',
                },
              },
            },
          }}
          theme="dark" // Supabase UI theme variant
          providers={['github', 'google']} // Optional: Add social logins
          redirectTo={getRedirectTo()} // For social logins
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email address',
                password_label: 'Password',
              },
              sign_up: {
                email_label: 'Email address',
                password_label: 'Create a password',
              }
            }
          }}
        />
      </div>
    </div>
  )
}
