/**
 * Custom hook for managing chat state and interactions
 */

import { create } from 'zustand'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  tools_used?: string[]  // Tools used to generate this response (e.g., ['google_search', 'arxiv_search'])
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
    // Group history items by session_id
    const sessionGroups: { [key: string]: any[] } = {}

    historyItems.forEach((item) => {
      const sessionKey = item.session_id || `single-${item.id}`
      if (!sessionGroups[sessionKey]) {
        sessionGroups[sessionKey] = []
      }
      sessionGroups[sessionKey].push(item)
    })

    // Convert grouped items to chat sessions
    const sessions: ChatSession[] = Object.entries(sessionGroups).map(([sessionKey, items]) => {
      // Sort items by created_at to maintain chronological order
      items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

      const firstItem = items[0]
      const createdAt = new Date(firstItem.created_at)

      // Build messages from all items in this session
      const messages: Message[] = []
      items.forEach((item) => {
        const timestamp = new Date(item.created_at)
        messages.push(
          {
            id: `msg-db-${item.id}-user`,
            role: 'user' as const,
            content: item.query,
            timestamp: timestamp,
          },
          {
            id: `msg-db-${item.id}-assistant`,
            role: 'assistant' as const,
            content: item.response,
            timestamp: timestamp,
          }
        )
      })

      return {
        id: sessionKey,
        title: firstItem.query.slice(0, 50) + (firstItem.query.length > 50 ? '...' : ''),
        messages,
        createdAt,
        updatedAt: new Date(items[items.length - 1].created_at),
      }
    })

    // Sort sessions by most recent first
    sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

    set({
      sessions,
      currentSessionId: sessions[0]?.id || null,
    })
  },
}))

// Note: We no longer auto-create a session on load
// Instead, we'll load history from the database in ChatInterface
