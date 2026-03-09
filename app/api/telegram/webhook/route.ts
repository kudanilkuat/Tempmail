import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { telegram } from '@/lib/telegram'
import { generateRandomEmail } from '@/lib/utils'
import crypto from 'crypto'

// Persistent keyboard layout (always visible at the bottom of the chat)
const MAIN_KEYBOARD = {
  keyboard: [
    [{ text: "📧 New Email" }],
    [{ text: "📥 Check Inbox" }, { text: "ℹ️ Info" }],
    [{ text: "🔄 Refresh" }, { text: "📋 Menu" }],
  ],
  resize_keyboard: true,
  is_persistent: true,
}

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

    // Parse slash commands AND keyboard button texts
    if (text.startsWith('/start')) {
      await handleStartCommand(chatId, update.message.from?.first_name || 'User')
    } else if (text.startsWith('/new') || text === '📧 New Email') {
      await handleNewEmailCommand(chatId)
    } else if (text.startsWith('/check') || text === '📥 Check Inbox' || text === '🔄 Refresh') {
      await handleCheckCommand(chatId)
    } else if (text.startsWith('/info') || text === 'ℹ️ Info') {
      await handleInfoCommand(chatId)
    } else if (text.startsWith('/help') || text === '📋 Menu') {
      await sendHelpMenu(chatId)
    } else {
      await sendHelpMenu(chatId)
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (error) {
    console.error('Telegram Webhook Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// /start - Welcome message with auto-generated email
async function handleStartCommand(chatId: number, firstName: string) {
  const newEmail = generateRandomEmail()
  const ownerToken = crypto.randomUUID()

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
👋 <b>Welcome to GakMail, ${firstName}!</b>

Your disposable email is ready:

📧 <code>${newEmail}</code>
<i>(Tap to copy)</i>

Emails sent to this address will appear when you tap <b>📥 Check Inbox</b> below.

Use the buttons to navigate:
• <b>📧 New Email</b> - Generate a fresh address
• <b>📥 Check Inbox</b> - Read your messages
• <b>🔄 Refresh</b> - Reload inbox
• <b>ℹ️ Info</b> - View current email
• <b>📋 Menu</b> - Show help
`
  await telegram.sendMessage(chatId, message, 'HTML', MAIN_KEYBOARD)
}

// /new - Generate a new email
async function handleNewEmailCommand(chatId: number) {
  const newEmail = generateRandomEmail()
  const ownerToken = crypto.randomUUID()

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
<i>(Tap to copy)</i>

Any emails sent here will appear when you tap <b>📥 Check Inbox</b>.
`
  await telegram.sendMessage(chatId, message, 'HTML', MAIN_KEYBOARD)
}

// /check - Read inbox
async function handleCheckCommand(chatId: number) {
  const users = await sql`SELECT active_email FROM telegram_users WHERE chat_id = ${chatId}`
  if (users.length === 0) {
    return telegram.sendMessage(chatId, "⚠️ You don't have an active email yet.\nTap <b>📧 New Email</b> to create one!", 'HTML', MAIN_KEYBOARD)
  }

  const activeEmail = users[0].active_email

  const emails = await sql`
    SELECT sender, subject, text_body, created_at
    FROM emails
    WHERE recipient = ${activeEmail}
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 5
  `

  if (emails.length === 0) {
    return telegram.sendMessage(chatId, `📭 <b>Inbox is empty!</b>\n\nNo emails received yet for:\n<code>${activeEmail}</code>\n\nTap <b>🔄 Refresh</b> to check again.`, 'HTML', MAIN_KEYBOARD)
  }

  let message = `📬 <b>Inbox for:</b>\n<code>${activeEmail}</code>\n\n`
  
  emails.forEach((email, index) => {
    const time = new Date(email.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    message += `<b>${index + 1}. From:</b> ${escapeHtml(email.sender)}\n`
    message += `<b>Subject:</b> ${escapeHtml(email.subject || '(No Subject)')}\n`
    message += `<b>Time:</b> ${time}\n`
    message += `<b>Preview:</b> <i>${escapeHtml((email.text_body || 'No preview').substring(0, 50))}...</i>\n`
    message += `───────────────\n`
  })

  await telegram.sendMessage(chatId, message, 'HTML', MAIN_KEYBOARD)
}

// /info - Show current email
async function handleInfoCommand(chatId: number) {
  const users = await sql`SELECT active_email, created_at FROM telegram_users WHERE chat_id = ${chatId}`
  if (users.length === 0) {
    return telegram.sendMessage(chatId, "⚠️ You don't have an active email yet.\nTap <b>📧 New Email</b> to create one!", 'HTML', MAIN_KEYBOARD)
  }
  const activeEmail = users[0].active_email

  await telegram.sendMessage(chatId, `ℹ️ <b>Your Current Address</b>\n\n📧 <code>${activeEmail}</code>\n\nTap <b>📥 Check Inbox</b> to read messages.`, 'HTML', MAIN_KEYBOARD)
}

// /help or Menu button
async function sendHelpMenu(chatId: number) {
  const message = `
🤖 <b>GakMail Bot — Help Menu</b>
Create temporary disposable emails instantly!

<b>Available Actions:</b>
📧 <b>New Email</b> — Generate a brand new address
📥 <b>Check Inbox</b> — Read your latest emails
🔄 <b>Refresh</b> — Reload your inbox
ℹ️ <b>Info</b> — View your current active email
📋 <b>Menu</b> — Show this help menu

<b>Slash Commands:</b>
/new  /check  /info  /help

🌐 <a href="https://gakmail.edgeone.dev">Visit GakMail Web</a>
`
  await telegram.sendMessage(chatId, message, 'HTML', MAIN_KEYBOARD)
}

// Utility: escape HTML special characters for Telegram
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
