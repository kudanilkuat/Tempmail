-- Update the domains table to include nameservers and Cloudflare zone ID
ALTER TABLE domains
ADD COLUMN IF NOT EXISTS cloudflare_zone_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS nameservers TEXT[]; -- Array of strings for the assigned nameservers

-- Optionally we can drop the old verification_token since verification is now based on Nameservers
-- But keeping it is safer for backward compatibility or alternate verification methods.
