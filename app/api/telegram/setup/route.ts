import { NextRequest, NextResponse } from 'next/server'
import { telegram } from '@/lib/telegram'

export async function GET(req: NextRequest) {
  const adminPassword = req.headers.get('authorization')?.split(' ')[1] 
                       || req.nextUrl.searchParams.get('pwd')

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 })
  }

  // Use the safe backend URL configured to avoid proxy subdomains
  const backendEnv = process.env.NEXT_BACKEND || 'https://gakmail.edgeone.dev/api/webhook'
  const baseDomain = backendEnv.replace('/api/webhook', '')
  
  const webhookUrl = `${baseDomain}/api/telegram/webhook`
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET

  if (!secretToken) {
    return NextResponse.json({ error: 'TELEGRAM_WEBHOOK_SECRET is not configured on the server.' }, { status: 500 })
  }

  const result = await telegram.setWebhook(webhookUrl, secretToken)

  return NextResponse.json({ 
    success: true, 
    webhook_url: webhookUrl,
    telegram_response: result 
  })
}
