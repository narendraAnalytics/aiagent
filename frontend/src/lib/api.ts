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
      timeout: 90000,
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
 * @param style - Post style (professional, casual, storytelling)
 * @param tone - Post tone (educational, promotional, thought_leadership, inspirational)
 * @param targetLength - Target length (short, medium, long)
 * @returns Generated LinkedIn post data
 */
export async function generateLinkedInPost(
  content: string,
  token: string,
  style: string = 'professional',
  tone: string = 'educational',
  targetLength: string = 'medium'
): Promise<LinkedInPostResponse> {
  const response = await axios.post<LinkedInPostResponse>(
    `${API_BASE_URL}/api/linkedin/generate`,
    { content, style, tone, target_length: targetLength },
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

export interface SaveLinkedInPostRequest {
  original_content: string
  hook: string
  main_content: string
  cta: string
  hashtags: string[]
  full_post: string
  emojis_used: string[]
  character_count: number
  session_id?: string
  post_style?: string
  tone?: string
  target_length?: string
}

export interface LinkedInPostSavedResponse {
  id: number
  user_id: string
  full_post: string
  character_count: number
  created_at: string
}

export interface LinkedInPostHistoryResponse {
  posts: LinkedInPostSavedResponse[]
}

/**
 * Save a LinkedIn post to the database
 * @param postData - Post data to save
 * @param token - Clerk authentication token
 * @returns Saved post response
 */
export async function saveLinkedInPostToDatabase(
  postData: SaveLinkedInPostRequest,
  token: string
): Promise<LinkedInPostSavedResponse> {
  const response = await axios.post<LinkedInPostSavedResponse>(
    `${API_BASE_URL}/api/linkedin/save`,
    postData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 90000,
    }
  )

  return response.data
}

/**
 * Get LinkedIn post history for the authenticated user
 * @param token - Clerk authentication token
 * @param limit - Maximum number of posts to return
 * @param offset - Offset for pagination
 * @returns Post history
 */
export async function getLinkedInPostHistory(
  token: string,
  limit: number = 50,
  offset: number = 0
): Promise<LinkedInPostHistoryResponse> {
  const response = await axios.get<LinkedInPostHistoryResponse>(
    `${API_BASE_URL}/api/linkedin/history`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: { limit, offset },
      timeout: 90000,
    }
  )

  return response.data
}
