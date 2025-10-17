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
  loadHistoryFromDatabase: (historyItems: any[]) => void
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

  loadHistoryFromDatabase: (historyItems) => {
    // Convert database records to chat sessions
    // Each query/response pair becomes a session
    const sessions: ChatSession[] = historyItems.map((item) => {
      const createdAt = new Date(item.created_at)

      return {
        id: `session-db-${item.id}`,
        title: item.query.slice(0, 50) + (item.query.length > 50 ? '...' : ''),
        messages: [
          {
            id: `msg-db-${item.id}-user`,
            role: 'user' as const,
            content: item.query,
            timestamp: createdAt,
          },
          {
            id: `msg-db-${item.id}-assistant`,
            role: 'assistant' as const,
            content: item.response,
            timestamp: createdAt,
          },
        ],
        createdAt,
        updatedAt: createdAt,
      }
    })

    set({
      sessions,
      currentSessionId: sessions[0]?.id || null,
    })
  },
}))

// Note: We no longer auto-create a session on load
// Instead, we'll load history from the database in ChatInterface
