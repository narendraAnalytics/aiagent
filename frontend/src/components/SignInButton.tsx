'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn } from 'lucide-react'

export default function SignInButton() {
  const [isSigningIn, setIsSigningIn] = useState(false)
  const router = useRouter()

  const handleSignIn = () => {
    setIsSigningIn(true)
    router.push('/sign-in')
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={isSigningIn}
      className="group relative px-10 py-4 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-white rounded-2xl text-lg font-bold shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-110 hover:rotate-1 disabled:opacity-75 disabled:cursor-not-allowed"
    >
      <span className="relative z-10 flex items-center gap-2">
        <LogIn className={`w-5 h-5 transition-transform duration-500 ${
          isSigningIn ? 'animate-spin' : 'group-hover:translate-x-1'
        }`} />
        {isSigningIn ? 'Signing In...' : 'Sign In'}
      </span>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
    </button>
  )
}
