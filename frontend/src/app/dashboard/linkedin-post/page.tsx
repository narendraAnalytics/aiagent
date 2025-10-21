/**
 * LinkedIn Post Generator Page
 * Transform research responses into engaging LinkedIn posts
 */

import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import LinkedInPostClient from './LinkedInPostClient'

export default async function LinkedInPostPage() {
  const { userId } = await auth()

  // Protect route - redirect to sign-in if not authenticated
  if (!userId) {
    redirect('/sign-in')
  }

  const user = await currentUser()
  const firstName = user?.firstName || 'there'

  return <LinkedInPostClient firstName={firstName} />
}
