/**
 * ChatSidebar Component
 * Displays chat history and allows switching between conversations
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquarePlus, Trash2, X, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useChatStore } from '@/hooks/useChat'
import { useState } from 'react'

export default function ChatSidebar() {
  const {
    sessions,
    currentSessionId,
    createNewSession,
    switchSession,
    deleteSession,
  } = useChatStore()

  const [isOpen, setIsOpen] = useState(true)

  const handleNewChat = () => {
    createNewSession()
  }

  const handleNewChatMobile = () => {
    createNewSession()
    setIsOpen(false)
  }

  const handleSwitchSession = (sessionId: string) => {
    switchSession(sessionId)
  }

  const handleSwitchSessionMobile = (sessionId: string) => {
    switchSession(sessionId)
    setIsOpen(false)
  }

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    if (confirm('Delete this conversation?')) {
      deleteSession(sessionId)
    }
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/30 z-40"
            />

            {/* Sidebar content */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 flex flex-col shadow-lg"
            >
              {/* New Chat Button */}
              <div className="p-4 border-b border-gray-200">
                <button
                  onClick={handleNewChatMobile}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                >
                  <MessageSquarePlus className="w-5 h-5" />
                  <span className="font-medium">New Chat</span>
                </button>
              </div>

              {/* Chat History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Recent Chats
                </h3>

                {sessions.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    No conversations yet
                  </p>
                ) : (
                  sessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSwitchSessionMobile(session.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSwitchSessionMobile(session.id)
                        }
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-all group relative cursor-pointer ${
                        currentSessionId === session.id
                          ? 'bg-blue-50 border border-blue-200 shadow-sm'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              currentSessionId === session.id
                                ? 'text-blue-900'
                                : 'text-gray-700'
                            }`}
                          >
                            {session.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {session.messages.length} messages
                          </p>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDelete(e, session.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                          title="Delete conversation"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer Info */}
              <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
                <p className="text-center">
                  Powered by Gemini 2.5 Flash
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - Collapsible on large screens */}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 288 : 64 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex bg-white border-r border-gray-200 flex-col shadow-lg relative"
      >
        {/* Toggle Button - Always visible */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? (
              <PanelLeftClose className="w-5 h-5 text-gray-600" />
            ) : (
              <PanelLeftOpen className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Content - Only show when expanded */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              {/* New Chat Button */}
              <div className="p-4 border-b border-gray-200">
                <button
                  onClick={handleNewChat}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                >
                  <MessageSquarePlus className="w-5 h-5" />
                  <span className="font-medium">New Chat</span>
                </button>
              </div>

              {/* Chat History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Recent Chats
                </h3>

                {sessions.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    No conversations yet
                  </p>
                ) : (
                  sessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSwitchSession(session.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSwitchSession(session.id)
                        }
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-all group relative cursor-pointer ${
                        currentSessionId === session.id
                          ? 'bg-blue-50 border border-blue-200 shadow-sm'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              currentSessionId === session.id
                                ? 'text-blue-900'
                                : 'text-gray-700'
                            }`}
                          >
                            {session.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {session.messages.length} messages
                          </p>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDelete(e, session.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                          title="Delete conversation"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer Info */}
              <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
                <p className="text-center">
                  Powered by Gemini 2.5 Flash
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </>
  )
}
