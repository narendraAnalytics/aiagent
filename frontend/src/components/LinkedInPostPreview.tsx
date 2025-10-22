/**
 * LinkedInPostPreview Component
 * Displays a preview of the generated LinkedIn post
 */

'use client'

import { motion } from 'framer-motion'
import { Copy, Check, Edit2, Hash, Eye } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import EmojiPicker from './EmojiPicker'
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface LinkedInPostPreviewProps {
  content: string
  saved?: boolean
  onCopy?: () => void
}

export default function LinkedInPostPreview({ content, saved = false, onCopy }: LinkedInPostPreviewProps) {
  const { getToken } = useAuth()
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)
  const [isRegeneratingHashtags, setIsRegeneratingHashtags] = useState(false)
  const [showLinkedInPreview, setShowLinkedInPreview] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onCopy?.()
  }

  const handleEmojiSelect = (emoji: string) => {
    // Insert emoji at cursor position or at the end
    const textarea = document.querySelector('textarea')
    if (textarea && isEditing) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = editedContent.substring(0, start) + emoji + editedContent.substring(end)
      setEditedContent(newContent)
    } else {
      setEditedContent(editedContent + emoji)
    }
  }

  const handleRegenerateHashtags = async () => {
    setIsRegeneratingHashtags(true)
    try {
      const token = await getToken()
      if (!token) return

      const response = await axios.post(
        `${API_BASE_URL}/api/linkedin/hashtags`,
        { content: editedContent, count: 5 },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      // Replace hashtags at the end of the post
      const lines = editedContent.split('\n')
      const withoutHashtags = lines.filter(line => !line.trim().startsWith('#')).join('\n')
      const newHashtags = response.data.hashtags.map((tag: string) => `#${tag}`).join(' ')
      setEditedContent(`${withoutHashtags}\n\n${newHashtags}`)
    } catch (error) {
      console.error('Failed to regenerate hashtags:', error)
    } finally {
      setIsRegeneratingHashtags(false)
    }
  }

  const characterCount = editedContent.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl shadow-lg p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            LinkedIn Post Preview
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Ready to share with your network
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLinkedInPreview(!showLinkedInPreview)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={showLinkedInPreview ? 'Show editor' : 'Show LinkedIn preview'}
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={isEditing ? 'Preview mode' : 'Edit mode'}
          >
            <Edit2 className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Action Buttons (when editing) */}
      {isEditing && (
        <div className="flex items-center gap-2 py-2 border-b border-gray-200">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          <button
            onClick={handleRegenerateHashtags}
            disabled={isRegeneratingHashtags}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <Hash className={`w-3 h-3 ${isRegeneratingHashtags ? 'animate-spin' : ''}`} />
            <span>{isRegeneratingHashtags ? 'Regenerating...' : 'Regenerate Hashtags'}</span>
          </button>
        </div>
      )}

      {/* Post Content */}
      <div className="min-h-[300px]">
        {showLinkedInPreview ? (
          /* LinkedIn-Style Preview Mockup */
          <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
            {/* LinkedIn Post Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold text-lg">
                U
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Your Name</h4>
                <p className="text-xs text-gray-500">Your Professional Title</p>
                <p className="text-xs text-gray-500">Just now • 🌐</p>
              </div>
              <button className="text-gray-500">•••</button>
            </div>

            {/* LinkedIn Post Content */}
            <div className="text-sm text-gray-900 mb-3">
              <pre className="whitespace-pre-wrap font-sans leading-relaxed">
                {editedContent.length > 300 ? (
                  <>
                    {editedContent.slice(0, 300)}...
                    <button className="text-gray-500 ml-1">see more</button>
                  </>
                ) : (
                  editedContent
                )}
              </pre>
            </div>

            {/* LinkedIn Engagement Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-gray-500">
              <button className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded text-sm">
                <span>👍</span> Like
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded text-sm">
                💬 Comment
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded text-sm">
                🔄 Repost
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded text-sm">
                ➤ Send
              </button>
            </div>
          </div>
        ) : isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-full min-h-[300px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-800"
            placeholder="Edit your LinkedIn post..."
          />
        ) : (
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
              {editedContent}
            </pre>
          </div>
        )}
      </div>

      {/* Footer with Character Count and Copy Button */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          <span className={characterCount > 3000 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
            {characterCount.toLocaleString()}
          </span>
          <span className="text-gray-400"> / 3,000 characters</span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-105"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Post</span>
            </>
          )}
        </button>
      </div>

      {/* LinkedIn Tips */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 text-xs text-gray-600">
        <p className="font-semibold mb-1">💡 LinkedIn Tips:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Posts under 1,300 characters get more engagement</li>
          <li>Use emojis strategically for visual breaks</li>
          <li>3-5 hashtags work best for reach</li>
        </ul>
      </div>
    </motion.div>
  )
}
