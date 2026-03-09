import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { telegram } from '@/lib/telegram'
import { generateRandomEmail } from '@/lib/utils'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  // 1. Verify standard Webhook Secret Token 
  const secretToken = req.headers.get('x-telegram-bot-api-secret-token')
  if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const update = await req.json()

    // We only process distinct text messages for now.
    if (!update.message || !update.message.text) {
      return NextResponse.json({ status: 'ignored' }, { status: 200 })
    }

    const chatId = update.message.chat.id
    const text = update.message.text.trim()

    // Parse commands
    if (text.startsWith('/start') || text.startsWith('/new')) {
      await handleNewEmailCommand(chatId)
    } else if (text.startsWith('/check')) {
      await handleCheckCommand(chatId)
    } else if (text.startsWith('/info')) {
      await handleInfoCommand(chatId)
    } else {
      await sendHelpMenu(chatId)
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (error) {
    console.error('Telegram Webhook Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// Handler functions for Bot Commands
async function handleNewEmailCommand(chatId: number) {
  const newEmail = generateRandomEmail()
  const ownerToken = crypto.randomUUID()

  // Upsert the telegram user session
  await sql`
    INSERT INTO telegram_users (chat_id, active_email, owner_token)
    VALUES (${chatId}, ${newEmail}, ${ownerToken})
    ON CONFLICT (chat_id) 
    DO UPDATE SET 
      active_email = ${newEmail},
      owner_token = ${ownerToken},
      updated_at = NOW()
  `

  const message = `
🎉 <b>New Email Address Generated!</b>

📧 <code>${newEmail}</code>
(Tap to copy)

<i>Any emails sent to this address will automatically appear here when you type /check</i>
`
  await telegram.sendMessage(chatId, message)
}

async function handleCheckCommand(chatId: number) {
  // Get active session
  const users = await sql`SELECT active_email FROM telegram_users WHERE chat_id = ${chatId}`
  if (users.length === 0) {
    return telegram.sendMessage(chatId, "⚠️ You don't have an active email yet. Send /new to create one!")
  }

  const activeEmail = users[0].active_email

  // Fetch emails
  const emails = await sql`
    SELECT sender, subject, text_body, created_at
    FROM emails
    WHERE recipient = ${activeEmail}
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 5
  `

  if (emails.length === 0) {
    return telegram.sendMessage(chatId, `📭 <b>Inbox is empty!</b>\n\nNo emails received yet for:\n<code>${activeEmail}</code>`)
  }

  let message = `📬 <b>Inbox for:</b>\n<code>${activeEmail}</code>\n\n`
  
  emails.forEach((email, index) => {
    const time = new Date(email.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    message += `<b>${index + 1}. From:</b> ${email.sender.replace(/</g, '&lt;').replace(/>/g, '&gt;')}\n`
    message += `<b>Subject:</b> ${email.subject || '(No Subject)'}\n`
    message += `<b>Time:</b> ${time}\n`
    message += `<b>Preview:</b> <i>${(email.text_body || 'No preview').substring(0, 50).replace(/</g, '&lt;').replace(/>/g, '&gt;')}...</i>\n`
    message += `---------------------------\n`
  })

  await telegram.sendMessage(chatId, message)
}

async function handleInfoCommand(chatId: number) {
   const users = await sql`SELECT active_email, created_at FROM telegram_users WHERE chat_id = ${chatId}`
  if (users.length === 0) {
    return telegram.sendMessage(chatId, "⚠️ You don't have an active email yet. Send /new to create one!")
  }
   const activeEmail = users[0].active_email

   await telegram.sendMessage(chatId, `ℹ️ <b>Your Current Address</b>\n\n📧 <code>${activeEmail}</code>\n\nSend /check to read the inbox.`)
}

async function sendHelpMenu(chatId: number) {
  const message = `
🤖 <b>Welcome to GakMail Bot</b>
Create temporary disposable emails instantly!

<b>Commands:</b>
/new - 🆕 Generate a brand new email address
/check - 📥 Read your latest emails
/info - ℹ️ View your current active email
/help - ❔ Show this help menu
`
  await telegram.sendMessage(chatId, message)
}
