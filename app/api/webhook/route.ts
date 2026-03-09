import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// Webhook secret for authentication
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-secret-token-change-me'

export async function POST(request: NextRequest) {
  try {
    // Verify the authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse the incoming email data
    const body = await request.json()
    const { recipient, sender, subject, textBody, htmlBody } = body

    // Validate required fields
    if (!recipient || !sender || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: recipient, sender, subject' },
        { status: 400 }
      )
    }

    // Calculate expiration time (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // Insert the email into the database
    const result = await sql`
      INSERT INTO emails (recipient, sender, subject, text_body, html_body, expires_at)
      VALUES (${recipient.toLowerCase()}, ${sender}, ${subject}, ${textBody || null}, ${htmlBody || null}, ${expiresAt})
      RETURNING id
    `

    return NextResponse.json(
      { success: true, id: result[0].id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
