import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import UserSync from '@/components/UserSync'
import ChatInterface from '@/components/ChatInterface'

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
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Research Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome back, {firstName}!</p>
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
