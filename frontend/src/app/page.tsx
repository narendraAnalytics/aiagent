import { auth } from '@clerk/nextjs/server'
import { SignedOut, SignedIn, UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import SignInButton from '@/components/SignInButton'
import GoToDashboardButton from '@/components/GoToDashboardButton'

export default async function Home() {
  const { userId } = await auth()

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Banner Background Image */}
      <Image
        src="/images/bannerImage.png"
        alt="Research Assistant Background"
        fill
        className="object-cover -z-20"
        priority
      />
      {/* Dark Overlay for text readability */}
      <div className="fixed inset-0 bg-black/70 -z-10"></div>

      {/* Header with UserButton */}
      <header className="w-full animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent hover:scale-110 transition-all duration-300 cursor-default drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] animate-gradient-x">
            AI Research Agent
          </h2>
          <SignedIn>
            <div className="scale-110 hover:scale-125 transition-transform duration-300">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 pt-8">
        <div className="max-w-4xl w-full text-center space-y-8">

          {/* Logo with Float Animation */}
          <div className="flex justify-center mb-6 animate-float">
            <div className="relative w-32 h-32 drop-shadow-2xl">
              <Image
                src="/images/logo.png"
                alt="AI Research Agent Logo"
                width={128}
                height={128}
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Title with Gradient and Shimmer */}
          <div className="animate-slide-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-4">
              <span className="bg-gradient-to-r from-cyan-200 via-teal-100 to-emerald-200 bg-clip-text text-transparent drop-shadow-lg">
                Personal Research Assistant
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <div className="animate-slide-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
            <p className="text-xl md:text-2xl bg-gradient-to-r from-purple-200 via-pink-200 to-cyan-200 bg-clip-text text-transparent font-medium">
              AI-powered research with long-term memory using Gemini 2.5-flash
            </p>
          </div>

          {/* Signed Out - Show Sign In Button */}
          <SignedOut>
            <div className="flex gap-4 justify-center mt-10 animate-slide-up" style={{ animationDelay: '0.6s', opacity: 0 }}>
              <SignInButton />
            </div>
          </SignedOut>

          {/* Signed In - Show Welcome Message and Dashboard Button */}
          <SignedIn>
            <div className="space-y-6 mt-10 animate-slide-up" style={{ animationDelay: '0.6s', opacity: 0 }}>
              <p className="text-xl md:text-2xl bg-gradient-to-r from-emerald-200 to-cyan-200 bg-clip-text text-transparent font-semibold">
                Welcome back! Ready to continue your research?
              </p>
              <GoToDashboardButton />
            </div>
          </SignedIn>

          {/* Feature Cards */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left animate-slide-up" style={{ animationDelay: '0.8s', opacity: 0 }}>
            <div className="glass-card p-6 rounded-2xl hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 group">
              <h3 className="font-bold text-xl mb-3 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent flex items-center gap-2">
                <span className="text-3xl group-hover:scale-125 transition-transform duration-300">🧠</span>
                Smart Memory
              </h3>
              <p className="text-sm text-purple-100/90 leading-relaxed">
                Remembers your previous research and provides context-aware answers
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/30 transition-all duration-300 group" style={{ animationDelay: '0.9s' }}>
              <h3 className="font-bold text-xl mb-3 bg-gradient-to-r from-cyan-200 to-teal-200 bg-clip-text text-transparent flex items-center gap-2">
                <span className="text-3xl group-hover:scale-125 transition-transform duration-300">🔍</span>
                Google Search
              </h3>
              <p className="text-sm text-cyan-100/90 leading-relaxed">
                Real-time web search powered by Gemini with up-to-date information
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 group" style={{ animationDelay: '1s' }}>
              <h3 className="font-bold text-xl mb-3 bg-gradient-to-r from-emerald-200 to-green-200 bg-clip-text text-transparent flex items-center gap-2">
                <span className="text-3xl group-hover:scale-125 transition-transform duration-300">🔒</span>
                Secure
              </h3>
              <p className="text-sm text-emerald-100/90 leading-relaxed">
                Protected with Clerk authentication and encrypted data storage
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/30 transition-all duration-300 group" style={{ animationDelay: '1.1s' }}>
              <h3 className="font-bold text-xl mb-3 bg-gradient-to-r from-pink-200 to-orange-200 bg-clip-text text-transparent flex items-center gap-2">
                <span className="text-3xl group-hover:scale-125 transition-transform duration-300">💼</span>
                LinkedIn Posts
              </h3>
              <p className="text-sm text-pink-100/90 leading-relaxed">
                Transform research responses into engaging LinkedIn posts with nice emojis and formatting
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
