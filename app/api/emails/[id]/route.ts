import { NextRequest, NextResponse } from 'next/server'
import { sql, type Email } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch specific email by ID
    const emails = await sql`
      SELECT id, recipient, sender, subject, text_body, html_body, created_at, expires_at
      FROM emails
      WHERE id = ${id}
        AND expires_at > NOW()
      LIMIT 1
    `

    if (emails.length === 0) {
      return NextResponse.json(
        { error: 'Email not found or expired' },
        { status: 404 }
      )
    }

    return NextResponse.json({ email: emails[0] })
  } catch (error) {
    console.error('Error fetching email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await sql`DELETE FROM emails WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
