import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { cloudflare } from '@/lib/cloudflare'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domainId } = body
    
    // Auth check via headers
    const ownerTokensHeader = request.headers.get('x-owner-tokens')
    if (!ownerTokensHeader) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tokens = ownerTokensHeader.split(',').map(t => t.trim()).filter(Boolean)

    if (!domainId || typeof domainId !== 'number') {
      return NextResponse.json({ error: 'Valid domainId is required' }, { status: 400 })
    }

    // 1. Fetch domain from DB to ensure user owns it and get Zone ID
    const domains = await sql`
      SELECT id, domain, cloudflare_zone_id, is_verified 
      FROM domains 
      WHERE id = ${domainId} AND owner_token = ANY(${tokens}::text[])
      LIMIT 1
    `

    if (domains.length === 0) {
      return NextResponse.json({ error: 'Domain not found or unauthorized' }, { status: 404 })
    }

    const domainRecord = domains[0]
    
    if (domainRecord.is_verified) {
       return NextResponse.json({ message: 'Domain is already verified', verified: true })
    }
    
    if (!domainRecord.cloudflare_zone_id) {
       return NextResponse.json({ error: 'Missing Cloudflare Zone ID for this domain.' }, { status: 400 })
    }

    // 2. Check if Zone is active
    const isActive = await cloudflare.checkZoneActivation(domainRecord.cloudflare_zone_id)
    if (!isActive) {
      return NextResponse.json({ 
        message: 'Nameservers have not propagated yet. Please ensure you have set them at your registrar and wait up to 24 hours.', 
        verified: false 
      })
    }

    // 3. Zone is active, let's setup Email Routing Catch-all
    try {
      // The destination address must be configured. For now we assume a hardcoded app-wide catchall address
      // e.g catchall@wibuhub.qzz.io that is processed by your worker.
      const rawDomainEnv = process.env.NEXT_PUBLIC_EMAIL_DOMAIN || "gakmail.edgeone.dev"
      const mainDomain = rawDomainEnv.split(',').map(d => d.trim())[0]
      const destinationEmail = `catchall@${mainDomain}`
      await cloudflare.setupEmailRouting(domainRecord.cloudflare_zone_id, destinationEmail)
    } catch (cfError: any) {
        return NextResponse.json({ error: `Routing Setup Error: ${cfError.message}` }, { status: 500 })
    }

    // 4. Update the Database marking it as verified
    await sql`
      UPDATE domains 
      SET is_verified = true 
      WHERE id = ${domainId}
    `

    return NextResponse.json({ success: true, verified: true })
  } catch (error) {
    console.error('Error verifying nameservers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
