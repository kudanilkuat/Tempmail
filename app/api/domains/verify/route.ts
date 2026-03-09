import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import dns from 'dns/promises'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain, ownerToken } = body

    if (!domain || !ownerToken) {
      return NextResponse.json(
        { error: 'Missing required fields: domain or ownerToken' },
        { status: 400 }
      )
    }

    // Fetch the domain record from DB
    const domainRecords = await sql`
      SELECT id, domain, verification_token, is_verified 
      FROM domains 
      WHERE domain = ${domain.toLowerCase()} AND owner_token = ${ownerToken}
    `

    if (domainRecords.length === 0) {
      return NextResponse.json(
        { error: 'Domain not found or unauthorized' },
        { status: 404 }
      )
    }

    const domainRecord = domainRecords[0]

    // If already verified, return success
    if (domainRecord.is_verified) {
      return NextResponse.json({ success: true, verified: true })
    }

    // Look up TXT records for verification
    const expectedTxt = `tempmail-verification=${domainRecord.verification_token}`
    let txtRecords: string[][] = []
    
    try {
      txtRecords = await dns.resolveTxt(domain)
    } catch (dnsError) {
      console.error('DNS lookup error:', dnsError)
      return NextResponse.json(
        { error: 'Failed to lookup DNS records', verified: false },
        { status: 400 }
      )
    }

    // Flatten TXT records (as they come as arrays of arrays)
    const flatTxtRecords = txtRecords.flat()
    const isVerified = flatTxtRecords.includes(expectedTxt)

    if (isVerified) {
      // Update database
      await sql`
        UPDATE domains 
        SET is_verified = true 
        WHERE id = ${domainRecord.id}
      `
      
      return NextResponse.json({ success: true, verified: true })
    } else {
      return NextResponse.json({ 
        success: false, 
        verified: false,
        message: 'TXT record not found. It may take some time for DNS propagation.'
      })
    }

  } catch (error) {
    console.error('Error verifying domain:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
