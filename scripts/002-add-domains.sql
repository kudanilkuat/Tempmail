-- Create domains table for storing custom domains
CREATE TABLE IF NOT EXISTS domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(255) UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT false,
  verification_token VARCHAR(255) NOT NULL,
  owner_token VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance optimization
CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain);
CREATE INDEX IF NOT EXISTS idx_domains_is_verified ON domains(is_verified);
CREATE INDEX IF NOT EXISTS idx_domains_is_public ON domains(is_public);
