'use client'

import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

export default function UserSync() {
  const { userId, getToken, isLoaded } = useAuth()
  const [synced, setSynced] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const syncUser = async () => {
      console.log('🔍 UserSync: Starting sync check...', {
        isLoaded,
        userId: userId ? `${userId.substring(0, 10)}...` : 'null',
        synced,
        retryCount
      })

      // Wait for Clerk to load and user to be available
      if (!isLoaded) {
        console.log('⏳ Clerk not loaded yet, waiting...')
        return
      }

      if (!userId) {
        console.log('⏳ No userId yet, waiting...')
        return
      }

      if (synced) {
        console.log('✅ Already synced, skipping')
        return
      }

      // Don't retry more than 3 times
      if (retryCount >= 3) {
        console.error('❌ User sync failed after 3 attempts. Please refresh the page.')
        return
      }

      try {
        console.log(`🔄 Attempt ${retryCount + 1}/3: Syncing user to database...`)
        console.log('📋 User ID:', userId)

        // Step 1: Get Clerk token
        console.log('🔑 Requesting Clerk token...')
        const token = await getToken()

        if (!token) {
          console.error('❌ FAILED: No Clerk token returned from getToken()')
          console.error('   This usually means Clerk session is invalid or expired')
          console.error('   Try signing out and signing in again')
          return
        }

        console.log('✅ Token received:', token.substring(0, 20) + '...')

        // Step 2: Prepare request
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const syncUrl = `${apiUrl}/api/auth/sync-user`

        console.log('📡 API URL:', apiUrl)
        console.log('📡 Sync endpoint:', syncUrl)

        // Step 3: Test backend connectivity first
        console.log('🔌 Testing backend connectivity...')
        try {
          const healthCheck = await fetch(`${apiUrl}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
          })
          console.log('✅ Backend is reachable:', healthCheck.ok ? 'OK' : 'Not OK')
        } catch (connectError) {
          console.error('❌ FAILED: Cannot reach backend!')
          console.error('   Error:', connectError)
          console.error('   Make sure backend is running on:', apiUrl)
          return
        }

        // Step 4: Make sync request
        console.log('📤 Sending sync request...')
        console.log('   Headers:', {
          'Authorization': 'Bearer ' + token.substring(0, 10) + '...',
          'Content-Type': 'application/json'
        })

        const response = await fetch(syncUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        })

        console.log('📥 Response received:')
        console.log('   Status:', response.status)
        console.log('   Status Text:', response.statusText)
        console.log('   OK:', response.ok)
        console.log('   Headers:', Object.fromEntries(response.headers.entries()))

        if (response.ok) {
          const data = await response.json()
          console.log('✅ SUCCESS! User synced to database!')
          console.log('📊 User data:', {
            clerk_user_id: data.clerk_user_id,
            email: data.email,
            first_name: data.first_name,
            last_name: data.last_name,
            username: data.username,
          })
          setSynced(true)
        } else {
          // Not OK response
          let errorText = ''
          let errorJson = null

          try {
            errorText = await response.text()
            try {
              errorJson = JSON.parse(errorText)
            } catch {
              // Not JSON
            }
          } catch (readError) {
            console.error('   Could not read error response:', readError)
          }

          console.error('❌ FAILED: Server returned error')
          console.error('   Status:', response.status, response.statusText)
          console.error('   Response body:', errorText || '(empty)')
          if (errorJson) {
            console.error('   Error details:', errorJson)
          }

          // Specific error messages
          if (response.status === 401) {
            console.error('   🔐 Authentication failed - token might be invalid')
          } else if (response.status === 403) {
            console.error('   🚫 Access forbidden - check permissions')
          } else if (response.status === 500) {
            console.error('   💥 Server error - check backend logs')
          }

          // Retry after 2 seconds
          if (retryCount < 2) {
            console.log(`⏳ Will retry in 2 seconds... (Next attempt: ${retryCount + 2}/3)`)
            setTimeout(() => {
              setRetryCount(prev => prev + 1)
            }, 2000)
          }
        }
      } catch (error) {
        console.error('❌ EXCEPTION caught during sync:')
        console.error('   Error type:', error?.constructor?.name || typeof error)
        console.error('   Error message:', error?.message || 'No message')
        console.error('   Error object:', error)

        // Check for specific error types
        if (error?.name === 'AbortError' || error?.name === 'TimeoutError') {
          console.error('   ⏱️ Request timed out - backend might be slow or unresponsive')
        } else if (error?.message?.includes('fetch')) {
          console.error('   🌐 Network error - check if backend is running')
        }

        // Full error details
        console.error('   Full error stack:', error?.stack)

        // Retry after 2 seconds
        if (retryCount < 2) {
          console.log(`⏳ Will retry in 2 seconds... (Next attempt: ${retryCount + 2}/3)`)
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
          }, 2000)
        }
      }
    }

    syncUser()
  }, [userId, getToken, isLoaded, synced, retryCount])

  // This component doesn't render anything visible
  return null
}
