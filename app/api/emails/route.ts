import { NextRequest, NextResponse } from 'next/server'
import { sql, type Email } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recipient = searchParams.get('recipient')
    const ownerToken = request.headers.get('x-owner-token')

    if (!recipient) {
      return NextResponse.json(
        { error: 'Missing recipient parameter' },
        { status: 400 }
      )
    }

    const domainPart = recipient.split('@')[1]?.toLowerCase()
    
    // Check if it's a registered custom domain
    if (domainPart) {
      const domainRecords = await sql`SELECT id, is_public, owner_token FROM domains WHERE domain = ${domainPart}`
      if (domainRecords.length > 0) {
        const domainRecord = domainRecords[0]
        
        // If domain is private, enforce owner_token check
        if (!domainRecord.is_public && domainRecord.owner_token !== ownerToken) {
          return NextResponse.json(
            { error: 'Unauthorized to view emails for this private domain' },
            { status: 401 }
          )
        }
      }
    }

    // Fetch emails for the given recipient that haven't expired
    const emails = await sql`
      SELECT id, recipient, sender, subject, text_body, html_body, created_at, expires_at
      FROM emails
      WHERE recipient = ${recipient.toLowerCase()}
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 50
    `

    return NextResponse.json({ emails })
  } catch (error) {
    console.error('Error fetching emails:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

