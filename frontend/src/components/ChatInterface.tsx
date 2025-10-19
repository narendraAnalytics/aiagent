/**
 * ChatInterface Component
 * Main chat interface with input, messages, and real-time interaction
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { useChatStore } from '@/hooks/useChat'
import { sendResearchQuery, fetchResearchHistory } from '@/lib/api'
import ChatMessage from './ChatMessage'
import ChatSidebar from './ChatSidebar'

export default function ChatInterface() {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { getToken } = useAuth()
  const {
    getCurrentSession,
    addMessage,
    isLoading,
    setLoading,
    error,
    setError,
    currentSessionId,
    sessions,
    loadHistoryFromDatabase,
    createNewSession,
  } = useChatStore()

  const currentSession = getCurrentSession()

  // Load chat history from database on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const token = await getToken()
        if (!token) return

        // Only load if we don't have any sessions yet
        if (sessions.length === 0) {
          const historyData = await fetchResearchHistory(token)

          if (historyData.history.length > 0) {
            loadHistoryFromDatabase(historyData.history)
          } else {
            // No history, create a new empty session
            createNewSession()
          }
        }
      } catch (err) {
        console.error('Failed to load chat history:', err)
        // If loading fails, create a new session
        if (sessions.length === 0) {
          createNewSession()
        }
      }
    }

    loadHistory()
  }, []) // Only run once on mount

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentSession?.messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading || !currentSessionId) return

    const userMessage = input.trim()
    setInput('')
    setError(null)

    // Add user message
    addMessage(currentSessionId, {
      role: 'user',
      content: userMessage,
    })

    // Get AI response
    setLoading(true)

    try {
      const token = await getToken()

      if (!token) {
        throw new Error('Authentication token not found')
      }

      const response = await sendResearchQuery(userMessage, token, currentSessionId)

      // Add AI response
      addMessage(currentSessionId, {
        role: 'assistant',
        content: response.response,
      })
    } catch (err: any) {
      console.error('Chat error:', err)
      setError(err.response?.data?.detail || err.message || 'Failed to get response')

      // Add error message to chat
      addMessage(currentSessionId, {
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${err.response?.data?.detail || err.message || 'Unknown error'}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex h-full bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <ChatSidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {!currentSession || currentSession.messages.length === 0 ? (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex flex-col items-center justify-center p-4 text-center"
            >
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-2xl mb-4">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Research Assistant
              </h2>
              <p className="text-base text-gray-600 mb-6 max-w-md">
                Ask me anything! I can search the web, remember our conversations, and provide detailed research.
              </p>

              {/* Example Prompts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full px-4">
                <button
                  onClick={() =>
                    setInput('What are the latest developments in AI?')
                  }
                  className="p-3 bg-white rounded-lg shadow-md hover:shadow-lg transition-all text-left border border-gray-200 hover:border-blue-300"
                >
                  <p className="text-sm font-medium text-gray-900">
                    🤖 Latest AI developments
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Get the latest news on AI technology
                  </p>
                </button>

                <button
                  onClick={() =>
                    setInput('Explain quantum computing in simple terms')
                  }
                  className="p-3 bg-white rounded-lg shadow-md hover:shadow-lg transition-all text-left border border-gray-200 hover:border-blue-300"
                >
                  <p className="text-sm font-medium text-gray-900">
                    ⚛️ Quantum computing basics
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Learn about quantum technology
                  </p>
                </button>

                <button
                  onClick={() =>
                    setInput('Best programming languages to learn in 2025')
                  }
                  className="p-3 bg-white rounded-lg shadow-md hover:shadow-lg transition-all text-left border border-gray-200 hover:border-blue-300"
                >
                  <p className="text-sm font-medium text-gray-900">
                    💻 Programming languages
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    What to learn this year
                  </p>
                </button>

                <button
                  onClick={() =>
                    setInput('How does climate change affect global economics?')
                  }
                  className="p-3 bg-white rounded-lg shadow-md hover:shadow-lg transition-all text-left border border-gray-200 hover:border-blue-300"
                >
                  <p className="text-sm font-medium text-gray-900">
                    🌍 Climate & economics
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Research environmental impact
                  </p>
                </button>
              </div>
            </motion.div>
          ) : (
            /* Messages */
            <div className="max-w-4xl mx-auto w-full p-4 space-y-4">
              {currentSession.messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4 p-6 bg-gray-50/50 rounded-lg"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Research Assistant
                    </p>
                    <div className="flex gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto w-full p-4">
            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </motion.div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={isLoading}
                rows={1}
                className="w-full resize-none rounded-2xl border border-gray-300 bg-white px-4 py-3 pr-14 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm max-h-40 scrollbar-hide"
              />

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-3 bottom-3 p-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:shadow-none"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>

            {/* Helper Text */}
            <p className="text-xs text-gray-400 text-center mt-3">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
