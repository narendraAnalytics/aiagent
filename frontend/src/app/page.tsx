import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { SignedOut, SignedIn, UserButton } from '@clerk/nextjs'

export default async function Home() {
  const { userId } = await auth()

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header with UserButton for signed-in users */}
      <header className="w-full border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Research Assistant</h2>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-2xl text-center space-y-6">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            Personal Research Assistant
          </h1>
          <p className="text-xl text-gray-600">
            AI-powered research with long-term memory using Gemini 2.5-flash
          </p>

          {/* Signed Out - Show Sign In Button */}
          <SignedOut>
            <div className="flex gap-4 justify-center mt-8">
              <Link
                href="/sign-in"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors shadow-md"
              >
                Sign In
              </Link>
            </div>
          </SignedOut>

          {/* Signed In - Show Welcome Message and Dashboard Button */}
          <SignedIn>
            <div className="space-y-4 mt-8">
              <p className="text-lg text-gray-700">
                Welcome back! Ready to continue your research?
              </p>
              <Link
                href="/dashboard"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors shadow-md"
              >
                Go to Dashboard
              </Link>
            </div>
          </SignedIn>

          {/* Feature Cards - Always Visible */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-lg mb-2">🧠 Smart Memory</h3>
              <p className="text-sm text-gray-600">
                Remembers your previous research and provides context-aware answers
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-lg mb-2">🔍 Google Search</h3>
              <p className="text-sm text-gray-600">
                Real-time web search powered by Gemini with up-to-date information
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-lg mb-2">🔒 Secure</h3>
              <p className="text-sm text-gray-600">
                Protected with Clerk authentication and encrypted data storage
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
