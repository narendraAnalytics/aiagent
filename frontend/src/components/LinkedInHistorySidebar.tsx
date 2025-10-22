/**
 * LinkedInHistorySidebar Component
 * Shows past LinkedIn posts with search and quick copy
 */

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, X, Copy, Check, Search, ChevronRight, ChevronLeft } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { getLinkedInPostHistory, LinkedInPostSavedResponse } from '@/lib/api'

export default function LinkedInHistorySidebar() {
  const { getToken } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [posts, setPosts] = useState<LinkedInPostSavedResponse[]>([])
  const [filteredPosts, setFilteredPosts] = useState<LinkedInPostSavedResponse[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && posts.length === 0) {
      loadHistory()
    }
  }, [isOpen])

  useEffect(() => {
    // Filter posts based on search query
    if (searchQuery.trim() === '') {
      setFilteredPosts(posts)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredPosts(
        posts.filter(post =>
          post.full_post.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, posts])

  const loadHistory = async () => {
    setIsLoading(true)
    try {
      const token = await getToken()
      if (!token) return

      const history = await getLinkedInPostHistory(token, 50, 0)
      setPosts(history.posts)
      setFilteredPosts(history.posts)
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async (post: LinkedInPostSavedResponse) => {
    await navigator.clipboard.writeText(post.full_post)
    setCopiedId(post.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return 'Yesterday'

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-6 top-24 z-30 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
        title={isOpen ? 'Close history' : 'View post history'}
      >
        {isOpen ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <History className="w-5 h-5" />
        )}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-purple-600" />
                    <h2 className="font-bold text-gray-900">Post History</h2>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search posts..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Posts List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600"></div>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                      {searchQuery ? 'No posts found' : 'No post history yet'}
                    </p>
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      {/* Post Preview */}
                      <p className="text-xs text-gray-700 line-clamp-3 mb-2">
                        {post.full_post}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          <span>{post.character_count} chars</span>
                          <span className="mx-2">•</span>
                          <span>{formatDate(post.created_at)}</span>
                        </div>

                        <button
                          onClick={() => handleCopy(post)}
                          className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors"
                        >
                          {copiedId === post.id ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500 text-center">
                  {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
                  {searchQuery && ' found'}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
