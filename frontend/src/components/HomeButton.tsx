/**
 * Animated Home Button Component
 * Displays a bright gradient animated home icon that links to the home page
 */

'use client'

import Link from 'next/link'
import { Home } from 'lucide-react'
import { motion } from 'framer-motion'

export default function HomeButton() {
  return (
    <Link href="/">
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="relative group"
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg blur-sm opacity-75 group-hover:opacity-100 animate-gradient-xy transition-opacity" />

        {/* Button content */}
        <div className="relative p-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-lg shadow-md hover:shadow-lg transition-all">
          <Home className="w-5 h-5 text-white" />
        </div>
      </motion.div>
    </Link>
  )
}
