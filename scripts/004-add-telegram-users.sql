-- Create telegram_users table for storing active telegram bot sessions
CREATE TABLE IF NOT EXISTS telegram_users (
  chat_id BIGINT PRIMARY KEY,
  active_email VARCHAR(255) NOT NULL,
  owner_token VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance optimization
CREATE INDEX IF NOT EXISTS idx_telegram_users_active_email ON telegram_users(active_email);
