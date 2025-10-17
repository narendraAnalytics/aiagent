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

/**
 * Send a research query to the backend
 * @param query - The user's research question
 * @param token - Clerk authentication token
 * @returns Research response from AI
 */
export async function sendResearchQuery(
  query: string,
  token: string
): Promise<ResearchResponse> {
  const response = await axios.post<ResearchResponse>(
    `${API_BASE_URL}/api/research`,
    { query },
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
