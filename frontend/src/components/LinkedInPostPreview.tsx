/**
 * LinkedInPostPreview Component
 * Displays a preview of the generated LinkedIn post
 */

'use client'

import { motion } from 'framer-motion'
import { Copy, Check, Edit2 } from 'lucide-react'
import { useState } from 'react'

interface LinkedInPostPreviewProps {
  content: string
  onCopy?: () => void
}

export default function LinkedInPostPreview({ content, onCopy }: LinkedInPostPreviewProps) {
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onCopy?.()
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
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title={isEditing ? 'Preview mode' : 'Edit mode'}
        >
          <Edit2 className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Post Content */}
      <div className="min-h-[300px]">
        {isEditing ? (
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
