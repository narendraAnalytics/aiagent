/**
 * LinkedIn Post Generator Client Component
 * Handles client-side logic for LinkedIn post generation
 */

'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import LinkedInPostPreview from '@/components/LinkedInPostPreview'
import LinkedInHistorySidebar from '@/components/LinkedInHistorySidebar'
import { generateLinkedInPost, saveLinkedInPostToDatabase } from '@/lib/api'

interface LinkedInPostClientProps {
  firstName: string
}

export default function LinkedInPostClient({ firstName }: LinkedInPostClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { getToken } = useAuth()
  const [originalContent, setOriginalContent] = useState('')
  const [linkedInPost, setLinkedInPost] = useState('')
  const [postData, setPostData] = useState<any>(null)
  const [isOriginalExpanded, setIsOriginalExpanded] = useState(false)
  const [isGenerating, setIsGenerating] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Style, tone, and length preferences
  const [style, setStyle] = useState('professional')
  const [tone, setTone] = useState('educational')
  const [targetLength, setTargetLength] = useState('medium')

  useEffect(() => {
    // Delay to ensure sessionStorage is ready after navigation
    const timer = setTimeout(() => {
      const content = sessionStorage.getItem('linkedin-post-content')
      const messageId = sessionStorage.getItem('linkedin-post-messageId')

      console.log('🔍 Checking sessionStorage:', {
        hasContent: !!content,
        contentLength: content?.length
      })

      if (content) {
        console.log('✅ Content found, generating LinkedIn post...')
        setOriginalContent(content)
        // Generate LinkedIn post from content using real API
        generatePost(content)

        // Clean up sessionStorage after reading
        sessionStorage.removeItem('linkedin-post-content')
        sessionStorage.removeItem('linkedin-post-messageId')
      } else {
        console.error('❌ No content in sessionStorage, redirecting to dashboard')
        // No content provided, redirect back to dashboard
        router.push('/dashboard')
      }
    }, 200) // 200ms delay for sessionStorage to be ready

    // Cleanup timer on unmount
    return () => clearTimeout(timer)
  }, []) // Empty deps - only run once

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
      const generatedPost = await generateLinkedInPost(content, token, style, tone, targetLength)

      // Set the generated post
      setLinkedInPost(generatedPost.full_post)
      setPostData(generatedPost)
      setIsGenerating(false)

      // Auto-save to database
      try {
        setIsSaving(true)
        await saveLinkedInPostToDatabase(
          {
            original_content: content,
            hook: generatedPost.hook,
            main_content: generatedPost.main_content,
            cta: generatedPost.cta,
            hashtags: generatedPost.hashtags,
            full_post: generatedPost.full_post,
            emojis_used: generatedPost.emojis_used,
            character_count: generatedPost.character_count,
            post_style: style,
            tone: tone,
            target_length: targetLength,
          },
          token
        )
        setSaved(true)
        console.log('✅ LinkedIn post auto-saved to database')
      } catch (saveError: any) {
        console.error('Failed to auto-save post:', saveError)
        // Don't show error to user, just log it
      } finally {
        setIsSaving(false)
      }
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
      {/* History Sidebar */}
      <LinkedInHistorySidebar />
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

            {/* Style, Tone, Length Selectors */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Customize Post
              </h3>

              {/* Style Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['professional', 'casual', 'storytelling'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                        style === s
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['educational', 'promotional', 'thought_leadership', 'inspirational'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                        tone === t
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Length Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Length
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'short', label: 'Short', desc: '500-800' },
                    { key: 'medium', label: 'Medium', desc: '1000-1500' },
                    { key: 'long', label: 'Long', desc: '2000-3000' }
                  ].map((l) => (
                    <button
                      key={l.key}
                      onClick={() => setTargetLength(l.key)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                        targetLength === l.key
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div>{l.label}</div>
                      <div className="text-xs opacity-70">{l.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Regenerate Button */}
              <button
                onClick={() => {
                  if (originalContent) {
                    generatePost(originalContent)
                  }
                }}
                disabled={isGenerating}
                className="w-full mt-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Regenerating...' : 'Regenerate with New Settings'}</span>
              </button>
            </motion.div>

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
                  <LinkedInPostPreview content={linkedInPost} saved={false} />
                </div>
              </div>
            ) : (
              <>
                <LinkedInPostPreview content={linkedInPost} saved={saved} />
                {saved && !isSaving && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-green-800 font-medium">Saved to history</p>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
