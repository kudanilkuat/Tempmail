-- Create emails table for storing incoming emails
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient VARCHAR(255) NOT NULL,
  sender VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  text_body TEXT,
  html_body TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create settings table for admin configuration
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_emails_recipient ON emails(recipient);
CREATE INDEX IF NOT EXISTS idx_emails_expires_at ON emails(expires_at);
CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at DESC);

-- Insert default webhook secret (you should change this in production)
INSERT INTO settings (key, value) 
VALUES ('WEBHOOK_SECRET_TOKEN', 'your-secret-token-change-me')
ON CONFLICT (key) DO NOTHING;
