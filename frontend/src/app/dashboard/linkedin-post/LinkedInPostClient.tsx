/**
 * LinkedIn Post Generator Client Component
 * Handles client-side logic for LinkedIn post generation
 */

'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import LinkedInPostPreview from '@/components/LinkedInPostPreview'
import { generateLinkedInPost } from '@/lib/api'

interface LinkedInPostClientProps {
  firstName: string
}

export default function LinkedInPostClient({ firstName }: LinkedInPostClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { getToken } = useAuth()
  const [originalContent, setOriginalContent] = useState('')
  const [linkedInPost, setLinkedInPost] = useState('')
  const [isOriginalExpanded, setIsOriginalExpanded] = useState(false)
  const [isGenerating, setIsGenerating] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get content from URL params
    const content = searchParams.get('content')
    if (content) {
      setOriginalContent(decodeURIComponent(content))
      // Generate LinkedIn post from content using real API
      generatePost(decodeURIComponent(content))
    } else {
      // No content provided, redirect back to dashboard
      router.push('/dashboard')
    }
  }, [searchParams, router])

  const generatePost = async (content: string) => {
    setIsGenerating(true)
    setError(null)

    try {
      // Get authentication token
      const token = await getToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      // Call backend API to generate LinkedIn post
      const postData = await generateLinkedInPost(content, token)

      // Set the generated post
      setLinkedInPost(postData.full_post)
      setIsGenerating(false)
    } catch (err: any) {
      console.error('Failed to generate LinkedIn post:', err)
      setError(err.message || 'Failed to generate LinkedIn post')
      setIsGenerating(false)

      // Fallback to simple generation if API fails
      const fallbackPost = createFallbackPost(content)
      setLinkedInPost(fallbackPost)
    }
  }

  const createFallbackPost = (content: string): string => {
    // Simple fallback if API fails
    const firstLine = content.split('\n')[0]?.slice(0, 100) || 'Insights from recent research'

    return `💡 ${firstLine}

Here's what you need to know:

→ Key insights from the research
→ Important implications for the field
→ Practical applications

What are your thoughts on this? 💭

#Research #Innovation #Insights`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="w-full border-b bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                LinkedIn Post Generator
              </h1>
              <p className="text-xs text-gray-600">
                Transform your research into engaging content
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Original Research */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsOriginalExpanded(!isOriginalExpanded)}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900">
                    Original Research Response
                  </h2>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  {isOriginalExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>

              {isOriginalExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {originalContent}
                    </p>
                  </div>
                </motion.div>
              )}

              {!isOriginalExpanded && (
                <p className="text-sm text-gray-500 mt-2">
                  Click to expand and view the original response
                </p>
              )}
            </div>

            {/* Tips Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6"
            >
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                LinkedIn Best Practices
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>Start with a hook that grabs attention in 2-3 seconds</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>Use white space and line breaks for readability</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>Include 3-5 relevant hashtags for discoverability</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>End with a question to encourage engagement</span>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Right Panel - LinkedIn Post Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {isGenerating ? (
              <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mb-4"></div>
                <p className="text-gray-600 font-medium">Generating your LinkedIn post...</p>
                <p className="text-sm text-gray-400 mt-2">Using AI to analyze content and create engaging format</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center min-h-[400px]">
                <div className="text-red-600 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium mb-2">Generation Error</p>
                <p className="text-sm text-gray-500">{error}</p>
                <p className="text-xs text-gray-400 mt-2">Showing fallback content below</p>
                <div className="mt-6 w-full">
                  <LinkedInPostPreview content={linkedInPost} />
                </div>
              </div>
            ) : (
              <LinkedInPostPreview content={linkedInPost} />
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
