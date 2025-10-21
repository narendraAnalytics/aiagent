import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import UserSync from '@/components/UserSync'
import ChatInterface from '@/components/ChatInterface'
import HomeButton from '@/components/HomeButton'

export default async function DashboardPage() {
  const { userId } = await auth()

  // Protect route - redirect to sign-in if not authenticated
  if (!userId) {
    redirect('/sign-in')
  }

  const user = await currentUser()
  const firstName = user?.firstName || 'there'

  return (
    <div className="flex flex-col h-screen">
      {/* Sync user to database automatically */}
      <UserSync />

      {/* Header */}
      <header className="w-full border-b bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <HomeButton />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">Research Dashboard</h1>
              <p className="text-xs bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent animate-fade-in">Welcome back, {firstName}!</p>
            </div>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  )
}
