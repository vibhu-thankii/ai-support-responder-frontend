// src/app/login/page.tsx  (This is the final version)

import { Suspense } from 'react'
import LoginView from './login-view' // Import the component you just created

export default function LoginPage() {
  return (
    <Suspense fallback={
        <div className="flex justify-center items-center h-screen bg-slate-100 dark:bg-slate-900">
            <p className="text-slate-100">Loading...</p>
        </div>
    }>
      <LoginView />
    </Suspense>
  )
}
