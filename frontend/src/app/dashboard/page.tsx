import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import UserSync from '@/components/UserSync'

export default async function DashboardPage() {
  const { userId } = await auth()

  // Protect route - redirect to sign-in if not authenticated
  if (!userId) {
    redirect('/sign-in')
  }

  const user = await currentUser()
  const firstName = user?.firstName || 'there'

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sync user to database automatically */}
      <UserSync />

      {/* Header */}
      <header className="w-full border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Research Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome back, {firstName}!</p>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Placeholder for ChatInterface Component */}
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Chat Interface Coming Soon
            </h2>
            <p className="text-gray-600">
              This is where the AI research assistant chat interface will be integrated.
            </p>
            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>User ID:</strong> {userId}
              </p>
              <p className="text-sm text-blue-800 mt-2">
                <strong>Authentication:</strong> Working! ✅
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
