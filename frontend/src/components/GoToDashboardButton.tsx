'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

export default function GoToDashboardButton() {
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()

  const handleClick = () => {
    setIsNavigating(true)
    router.push('/dashboard')
  }

  return (
    <button
      onClick={handleClick}
      disabled={isNavigating}
      className="group relative inline-block px-10 py-4 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-white rounded-2xl text-lg font-bold shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-110 hover:-rotate-1 disabled:opacity-75 disabled:cursor-not-allowed"
    >
      <span className="relative z-10 flex items-center gap-2">
        {isNavigating ? 'Loading...' : 'Go to Dashboard'}
        <ArrowRight className={`w-5 h-5 transition-transform duration-500 ${
          isNavigating ? 'animate-spin' : 'group-hover:translate-x-1'
        }`} />
      </span>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
    </button>
  )
}
