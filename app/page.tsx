"use client"

import { useState, useEffect } from "react"
import { EmailGenerator } from "@/components/email-generator"
import { InboxComponent } from "@/components/inbox"
import { ThemeToggle } from "@/components/theme-toggle"
import { DomainManager } from "@/components/domain-manager"
import { Mail, Shield, Clock, Zap } from "lucide-react"

const rawDomainEnv = process.env.NEXT_PUBLIC_EMAIL_DOMAIN || "gakmail.edgeone.dev"
const EMAIL_DOMAINS = rawDomainEnv.split(',').map(d => d.trim())

export default function HomePage() {
  const [activeEmail, setActiveEmail] = useState("")
  const [availableDomains, setAvailableDomains] = useState<any[]>([])

  const fetchGlobalDomains = async () => {
    try {
      const ownerTokensStr = localStorage.getItem("GakMail_owner_tokens")
      let headers: HeadersInit = {}
      if (ownerTokensStr) {
        // Send a representative token or all tokens if we implemented it that way.
        // For simplicity, our GET /api/domains API currently expects x-owner-token only.
        // If a user has multiple domains, they might not see all of them in the main dropdown if we only send one.
        // To be thorough, we can fetch public ones, or update API to accept tokens later.
        const tokens = JSON.parse(ownerTokensStr)
        const tokenValues = Object.values(tokens) as string[]
        if (tokenValues.length > 0) {
          headers["x-owner-tokens"] = tokenValues.join(',')
        }
      }
      const res = await fetch("/api/domains", { headers })
      const data = await res.json()
      if (res.ok && data.domains) {
        // Filter out the verified domains only
        setAvailableDomains(data.domains.filter((d: any) => d.is_verified))
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchGlobalDomains()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
              <Mail className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-foreground">GakMail</span>
          </div>
          <div className="flex items-center gap-2">
            <DomainManager onDomainsUpdated={fetchGlobalDomains} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
              Disposable Temporary Email
            </h1>
            <p className="text-lg text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
              Protect your privacy with a temporary email address. No registration required.
              Receive emails instantly and they auto-delete after 24 hours.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-card border border-border">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">100% Anonymous</span>
              </div>
              <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-card border border-border">
                <Zap className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Instant Setup</span>
              </div>
              <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-card border border-border">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">24h Auto-Delete</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Email Generator */}
          <EmailGenerator
            domain={EMAIL_DOMAINS[0]}
            availableDomains={availableDomains}
            onEmailChange={setActiveEmail}
          />

          {/* Inbox */}
          <InboxComponent
            activeEmail={activeEmail}
            refreshInterval={10000} // 10 seconds
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm text-muted-foreground mb-4">
              GakMail provides temporary, disposable email addresses.
              Perfect for sign-ups, testing, and protecting your real email from spam.
            </p>
            <p className="text-xs text-muted-foreground">
              Emails are automatically deleted after 24 hours for your privacy.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
