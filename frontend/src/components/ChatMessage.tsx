/**
 * ChatMessage Component
 * Displays individual chat messages with proper styling and markdown support
 */

'use client'

import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check, User, Bot, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Message } from '@/hooks/useChat'

interface ChatMessageProps {
  message: Message
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGenerateLinkedInPost = () => {
    // Navigate to LinkedIn post generator with message content
    const encodedContent = encodeURIComponent(message.content)
    router.push(`/dashboard/linkedin-post?content=${encodedContent}&messageId=${message.id}`)
  }

  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-4 p-6 ${
        isUser ? 'bg-transparent' : 'bg-gray-50/50'
      } rounded-lg`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-blue-600'
            : 'bg-gradient-to-br from-purple-500 to-purple-600'
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-900">
            {isUser ? 'You' : 'Research Assistant'}
          </span>
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
            title="Copy message"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Render user messages as plain text */}
        {isUser ? (
          <p className="text-gray-800 whitespace-pre-wrap break-words">
            {message.content}
          </p>
        ) : (
          /* Render AI messages with markdown */
          <div className="prose prose-sm max-w-none prose-p:my-2 prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-headings:mt-4 prose-headings:mb-2 prose-h1:text-transparent prose-h1:bg-clip-text prose-h1:bg-gradient-to-r prose-h1:from-blue-600 prose-h1:via-purple-600 prose-h1:to-pink-600 prose-h1:font-bold prose-h2:text-transparent prose-h2:bg-clip-text prose-h2:bg-gradient-to-r prose-h2:from-indigo-600 prose-h2:via-blue-600 prose-h2:to-cyan-600 prose-h2:font-bold prose-h3:text-transparent prose-h3:bg-clip-text prose-h3:bg-gradient-to-r prose-h3:from-purple-600 prose-h3:via-pink-600 prose-h3:to-orange-600 prose-h3:font-semibold prose-h4:text-transparent prose-h4:bg-clip-text prose-h4:bg-gradient-to-r prose-h4:from-green-600 prose-h4:via-teal-600 prose-h4:to-blue-600 prose-h4:font-semibold prose-h5:text-transparent prose-h5:bg-clip-text prose-h5:bg-gradient-to-r prose-h5:from-orange-600 prose-h5:via-red-600 prose-h5:to-pink-600 prose-h5:font-medium prose-h6:text-transparent prose-h6:bg-clip-text prose-h6:bg-gradient-to-r prose-h6:from-teal-600 prose-h6:via-green-600 prose-h6:to-lime-600 prose-h6:font-medium">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Timestamp */}
        <div className="mt-2 text-xs text-gray-400">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>

        {/* Generate LinkedIn Post Button - Only for assistant messages */}
        {!isUser && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mt-6 flex justify-center"
          >
            <button
              onClick={handleGenerateLinkedInPost}
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span>Generate LinkedIn Post</span>
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
