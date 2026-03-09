import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import crypto from 'crypto'
import { cloudflare } from '@/lib/cloudflare'

export async function GET(request: NextRequest) {
  try {
    const ownerTokensHeader = request.headers.get('x-owner-tokens')

    let domains;
    if (ownerTokensHeader) {
      const tokens = ownerTokensHeader.split(',').map(t => t.trim()).filter(Boolean)
      if (tokens.length > 0) {
        domains = await sql`
          SELECT id, domain, is_public, is_verified, created_at, nameservers 
          FROM domains 
          WHERE is_public = true OR owner_token = ANY(${tokens}::text[])
          ORDER BY created_at DESC
        `
      } else {
        domains = await sql`
          SELECT id, domain, is_public, is_verified, created_at, nameservers 
          FROM domains 
          WHERE is_public = true
          ORDER BY created_at DESC
        `
      }
    } else {
      domains = await sql`
        SELECT id, domain, is_public, is_verified, created_at, nameservers 
        FROM domains 
        WHERE is_public = true
        ORDER BY created_at DESC
      `
    }

    return NextResponse.json({ domains })
  } catch (error) {
    console.error('Error fetching domains:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain, isPublic } = body

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { error: 'Invalid domain name' },
        { status: 400 }
      )
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/
    if (!domainRegex.test(domain.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      )
    }

    // Check if domain already exists
    const existing = await sql`SELECT id FROM domains WHERE domain = ${domain.toLowerCase()}`
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Domain already registered' },
        { status: 400 }
      )
    }

    // Call Cloudflare to create the zone
    let cfData;
    try {
      cfData = await cloudflare.createZone(domain.toLowerCase());
    } catch (cfError: any) {
      return NextResponse.json(
        { error: `Cloudflare Error: ${cfError.message}` },
        { status: 400 }
      )
    }

    // Generate tokens
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const ownerToken = crypto.randomBytes(32).toString('hex')

    // Insert into DB
    const result = await sql`
      INSERT INTO domains (domain, is_public, verification_token, owner_token, cloudflare_zone_id, nameservers)
      VALUES (${domain.toLowerCase()}, ${Boolean(isPublic)}, ${verificationToken}, ${ownerToken}, ${cfData.zoneId}, ${cfData.nameServers})
      RETURNING id, domain, is_public, verification_token, owner_token, is_verified, created_at, cloudflare_zone_id, nameservers
    `

    return NextResponse.json({ domain: result[0] }, { status: 201 })
  } catch (error) {
    console.error('Error adding domain:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
