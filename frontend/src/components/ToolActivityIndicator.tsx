/**
 * ToolActivityIndicator Component
 * Shows animated badges for active research tools (Google Search, arXiv)
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Globe, BookOpen, CheckCircle2, Loader2 } from 'lucide-react'

export type ToolName = 'google_search' | 'arxiv_search'
export type ToolStatus = 'waiting' | 'active' | 'done'

export interface ToolActivity {
  tool: ToolName
  status: ToolStatus
}

interface ToolActivityIndicatorProps {
  activities: ToolActivity[]
}

const toolConfig = {
  google_search: {
    icon: Globe,
    label: 'Google Search',
    emoji: '🌐',
  },
  arxiv_search: {
    icon: BookOpen,
    label: 'arXiv Search',
    emoji: '📚',
  },
}

export default function ToolActivityIndicator({ activities }: ToolActivityIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 mb-3"
    >
      {activities.map((activity) => {
        const config = toolConfig[activity.tool]
        const Icon = config.icon

        return (
          <motion.div
            key={activity.tool}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activity.status === 'waiting'
                ? 'bg-gray-100 text-gray-500 border border-gray-200'
                : activity.status === 'active'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                : 'bg-green-50 text-green-700 border border-green-200 shadow-sm'
            }`}
          >
            <span className="text-base">{config.emoji}</span>

            {activity.status === 'active' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-4 h-4" />
              </motion.div>
            )}

            {activity.status === 'done' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <CheckCircle2 className="w-4 h-4" />
              </motion.div>
            )}

            {activity.status === 'waiting' && <Icon className="w-4 h-4 opacity-50" />}

            <span>{config.label}</span>

            {activity.status === 'active' && (
              <motion.div className="flex gap-1">
                <motion.span
                  className="w-1 h-1 bg-blue-500 rounded-full"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                />
                <motion.span
                  className="w-1 h-1 bg-blue-500 rounded-full"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.span
                  className="w-1 h-1 bg-blue-500 rounded-full"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                />
              </motion.div>
            )}
          </motion.div>
        )
      })}
    </motion.div>
  )
}
