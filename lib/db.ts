import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export { sql }

// Email type definition
export interface Email {
  id: string
  recipient: string
  sender: string
  subject: string
  text_body: string | null
  html_body: string | null
  created_at: string
  expires_at: string
}

// Setting type definition
export interface Setting {
  id: number
  key: string
  value: string
}

// Domain type definition
export interface Domain {
  id: string
  domain: string
  is_public: boolean
  verification_token: string
  owner_token: string
  is_verified: boolean
  created_at: string
}

// Telegram User type definition
export interface TelegramUser {
  chat_id: number
  active_email: string
  owner_token: string
  created_at: string
  updated_at: string
}
