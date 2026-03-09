import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/db'

async function isAuthenticated() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  return !!session?.value
}

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Get total email count
    const totalResult = await sql`SELECT COUNT(*) as count FROM emails`
    const totalEmails = parseInt(totalResult[0]?.count || '0')

    // Get expired email count (older than 24 hours)
    const expiredResult = await sql`
      SELECT COUNT(*) as count FROM emails 
      WHERE expires_at < NOW()
    `
    const expiredEmails = parseInt(expiredResult[0]?.count || '0')

    // Get emails from last 24 hours
    const recentResult = await sql`
      SELECT COUNT(*) as count FROM emails 
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `
    const recentEmails = parseInt(recentResult[0]?.count || '0')

    // Get unique recipients count
    const uniqueResult = await sql`
      SELECT COUNT(DISTINCT recipient) as count FROM emails
    `
    const uniqueRecipients = parseInt(uniqueResult[0]?.count || '0')

    return NextResponse.json({
      totalEmails,
      expiredEmails,
      recentEmails,
      uniqueRecipients,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
