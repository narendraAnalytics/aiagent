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
      timeout: 60000, // 60 second timeout for research queries
    }
  )

  return response.data
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
