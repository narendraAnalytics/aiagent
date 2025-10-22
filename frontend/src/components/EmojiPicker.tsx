/**
 * EmojiPicker Component
 * Simple emoji picker with categorized emojis
 */

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smile } from 'lucide-react'

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
}

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐'],
  'Objects': ['💡', '🔥', '⭐', '✨', '💫', '🎯', '🎪', '🎨', '🎭', '🎬', '📱', '💻', '⌨️', '🖥', '🖨', '🖱'],
  'Symbols': ['❤️', '💙', '💚', '💛', '💜', '🖤', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✅'],
  'Business': ['📊', '📈', '📉', '💼', '📁', '📂', '📅', '📆', '🗓', '📇', '🗂', '📋', '📌', '📍', '📎', '🖇'],
  'Tech': ['💻', '🖥', '⌨️', '🖱', '🖨', '💾', '💿', '📀', '🧮', '🔌', '🔋', '💡', '🔦', '🕯', '🗜', '⚙️'],
}

export default function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('Smileys')

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="Insert emoji"
      >
        <Smile className="w-5 h-5 text-gray-600" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Emoji Picker Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50 w-80"
            >
              {/* Category Tabs */}
              <div className="flex gap-1 mb-3 overflow-x-auto pb-2 border-b border-gray-200">
                {Object.keys(EMOJI_CATEGORIES).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Emoji Grid */}
              <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                {EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-2xl p-2 hover:bg-gray-100 rounded-md transition-colors"
                    title={`Insert ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 text-center">
                Click an emoji to insert it
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
