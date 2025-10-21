/**
 * API Client for Backend Communication
 * Handles all API calls to the FastAPI backend with Clerk authentication
 */

import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ResearchQuery {
  query: string
  session_id?: string
}

export interface ResearchResponse {
  response: string
  session_id?: string
}

export interface ResearchHistoryItem {
  id: number
  query: string
  response: string
  sources: string[]
  session_id?: string
  created_at: string
}

export interface ResearchHistoryResponse {
  history: ResearchHistoryItem[]
}

export interface StreamEvent {
  type: 'tool_start' | 'tool_complete' | 'final_response' | 'done' | 'error'
  tool?: string
  response?: string
  session_id?: string
  error?: string
}

/**
 * Send a research query to the backend
 * @param query - The user's research question
 * @param token - Clerk authentication token
 * @param sessionId - Optional session ID for grouping conversations
 * @returns Research response from AI
 */
export async function sendResearchQuery(
  query: string,
  token: string,
  sessionId?: string
): Promise<ResearchResponse> {
  const response = await axios.post<ResearchResponse>(
    `${API_BASE_URL}/api/research`,
    { query, session_id: sessionId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 120000, // 120 second timeout for research queries (includes arXiv search)
    }
  )

  return response.data
}

/**
 * Send a research query with streaming (SSE)
 * @param query - The user's research question
 * @param token - Clerk authentication token
 * @param sessionId - Optional session ID for grouping conversations
 * @param onEvent - Callback for each SSE event
 */
export async function sendResearchQueryStream(
  query: string,
  token: string,
  sessionId: string | undefined,
  onEvent: (event: StreamEvent) => void
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/research/stream`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, session_id: sessionId }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) {
    throw new Error('Response body is not readable')
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      // Decode the chunk
      const chunk = decoder.decode(value, { stream: true })

      // Parse SSE format (data: {json}\n\n)
      const lines = chunk.split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6) // Remove 'data: ' prefix
          try {
            const event: StreamEvent = JSON.parse(data)
            onEvent(event)

            // Stop if we receive a done or error event
            if (event.type === 'done' || event.type === 'error') {
              return
            }
          } catch (e) {
            console.error('Failed to parse SSE event:', e)
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * Fetch research history from the backend
 * @param token - Clerk authentication token
 * @returns List of past research queries and responses
 */
export async function fetchResearchHistory(
  token: string
): Promise<ResearchHistoryResponse> {
  const response = await axios.get<ResearchHistoryResponse>(
    `${API_BASE_URL}/api/research/history`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 30000,
    }
  )

  return response.data
}

/**
 * LinkedIn Post Generation
 */

export interface LinkedInPostResponse {
  hook: string
  main_content: string
  cta: string
  hashtags: string[]
  full_post: string
  emojis_used: string[]
  character_count: number
}

/**
 * Generate a LinkedIn post from research content
 * @param content - The research response content
 * @param token - Clerk authentication token
 * @returns Generated LinkedIn post data
 */
export async function generateLinkedInPost(
  content: string,
  token: string
): Promise<LinkedInPostResponse> {
  const response = await axios.post<LinkedInPostResponse>(
    `${API_BASE_URL}/api/linkedin/generate`,
    { content },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 second timeout for AI generation
    }
  )

  return response.data
}
