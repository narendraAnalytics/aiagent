import { auth } from '@clerk/nextjs/server'
import { SignedOut, SignedIn, UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import SignInButton from '@/components/SignInButton'
import GoToDashboardButton from '@/components/GoToDashboardButton'
import ContactForm from '@/components/ContactForm'
import Projects from '@/components/Projects'

export default async function Home() {
  const { userId } = await auth()

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with Background Image */}
      <div className="relative overflow-hidden">
        {/* Banner Background Image - Only for hero section */}
        <Image
          src="/images/bannerImage.png"
          alt="Research Assistant Background"
          fill
          className="object-cover -z-20"
          priority
        />
        {/* Dark Overlay for text readability */}
        <div className="absolute inset-0 bg-black/70 -z-10"></div>

        {/* Header with UserButton */}
        <header className="w-full animate-fade-in relative z-10">
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

        {/* Main Hero Content */}
        <div className="flex flex-col items-center justify-center p-4 pt-8 pb-16 relative z-10">
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

      {/* Projects Section */}
      <Projects />

      {/* Contact Me Section */}
      <section className="relative bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-12 animate-slide-up">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent">
              Get In Touch
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Have questions or want to collaborate? Feel free to reach out!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <ContactForm />

            {/* Contact Info & Social Links */}
            <div className="space-y-8 animate-slide-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
              {/* Info Cards */}
              <div className="bg-white rounded-3xl shadow-lg p-8 hover:shadow-2xl transition-shadow duration-300">
                <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Email</p>
                      <p className="text-gray-600">narendra.insights@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Location</p>
                      <p className="text-gray-600">AMARAVATHI</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="bg-white rounded-3xl shadow-lg p-8 hover:shadow-2xl transition-shadow duration-300">
                <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  Connect With Us
                </h3>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white hover:scale-110 transition-transform duration-300 shadow-md"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-sky-500 to-sky-600 flex items-center justify-center text-white hover:scale-110 transition-transform duration-300 shadow-md"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-white hover:scale-110 transition-transform duration-300 shadow-md"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.441 16.892c-2.102.144-6.784.144-8.883 0C5.282 16.736 5.017 15.622 5 12c.017-3.629.285-4.736 2.558-4.892 2.099-.144 6.782-.144 8.883 0C18.718 7.264 18.982 8.378 19 12c-.018 3.629-.285 4.736-2.559 4.892zM10 9.658l4.917 2.338L10 14.342V9.658z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/nk-analytics"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center text-white hover:scale-110 transition-transform duration-300 shadow-md"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
