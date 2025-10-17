/**
 * Custom hook for managing chat state and interactions
 */

import { create } from 'zustand'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface ChatStore {
  // Current session
  currentSessionId: string | null
  sessions: ChatSession[]
  isLoading: boolean
  error: string | null

  // Actions
  createNewSession: () => void
  addMessage: (sessionId: string, message: Omit<Message, 'id' | 'timestamp'>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  switchSession: (sessionId: string) => void
  getCurrentSession: () => ChatSession | null
  deleteSession: (sessionId: string) => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  currentSessionId: null,
  sessions: [],
  isLoading: false,
  error: null,

  createNewSession: () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    set((state) => ({
      sessions: [newSession, ...state.sessions],
      currentSessionId: newSession.id,
      error: null,
    }))
  },

  addMessage: (sessionId, message) => {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    }

    set((state) => ({
      sessions: state.sessions.map((session) => {
        if (session.id === sessionId) {
          // Update title based on first user message
          const title =
            session.messages.length === 0 && message.role === 'user'
              ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
              : session.title

          return {
            ...session,
            title,
            messages: [...session.messages, newMessage],
            updatedAt: new Date(),
          }
        }
        return session
      }),
    }))
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  switchSession: (sessionId) => {
    set({ currentSessionId: sessionId, error: null })
  },

  getCurrentSession: () => {
    const { currentSessionId, sessions } = get()
    return sessions.find((s) => s.id === currentSessionId) || null
  },

  deleteSession: (sessionId) => {
    set((state) => {
      const filteredSessions = state.sessions.filter((s) => s.id !== sessionId)
      const newCurrentId =
        state.currentSessionId === sessionId
          ? filteredSessions[0]?.id || null
          : state.currentSessionId

      return {
        sessions: filteredSessions,
        currentSessionId: newCurrentId,
      }
    })
  },
}))

// Initialize with one empty session on first load
if (typeof window !== 'undefined') {
  const store = useChatStore.getState()
  if (store.sessions.length === 0) {
    store.createNewSession()
  }
}
