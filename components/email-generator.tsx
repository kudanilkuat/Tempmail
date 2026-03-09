"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, RefreshCw, Check, Mail, ChevronDown } from "lucide-react"

interface DomainOption {
  id: string
  domain: string
}

interface EmailGeneratorProps {
  domain: string
  availableDomains?: DomainOption[]
  onEmailChange: (email: string) => void
}

export function EmailGenerator({ domain, availableDomains = [], onEmailChange }: EmailGeneratorProps) {
  const [username, setUsername] = useState("")
  const [selectedDomain, setSelectedDomain] = useState(domain)
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const fullEmail = username ? `${username}@${selectedDomain}` : ""

  useEffect(() => {
    // Load saved email from localStorage
    const savedEmail = localStorage.getItem("tempmail_active_email")
    if (savedEmail) {
      const [savedUsername] = savedEmail.split("@")
      setUsername(savedUsername)
      onEmailChange(savedEmail)
    } else {
      // Generate a random email on first load
      generateRandomEmail()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (fullEmail) {
      localStorage.setItem("tempmail_active_email", fullEmail)
      onEmailChange(fullEmail)
    }
  }, [fullEmail, onEmailChange])

  const generateRandomEmail = () => {
    setIsGenerating(true)
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    let randomUsername = ""
    for (let i = 0; i < 10; i++) {
      randomUsername += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setTimeout(() => {
      setUsername(randomUsername)
      setIsGenerating(false)
    }, 300)
  }

  const copyToClipboard = async () => {
    if (fullEmail) {
      await navigator.clipboard.writeText(fullEmail)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Your Temporary Email</h2>
            <p className="text-sm text-muted-foreground">Use this email to receive messages</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1 flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
              placeholder="username"
              className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-foreground font-mono"
            />
            <span className="text-muted-foreground font-mono">@</span>
            {availableDomains.length > 0 ? (
              <select 
                className="bg-transparent text-muted-foreground font-mono focus:outline-none focus:ring-0 appearance-none text-right pr-4 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1em_1em] bg-no-repeat bg-[position:right_center]"
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
              >
                <option value={domain}>{domain}</option>
                {availableDomains.map(d => (
                  <option key={d.id} value={d.domain}>{d.domain}</option>
                ))}
              </select>
            ) : (
              <span className="text-muted-foreground font-mono">{domain}</span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={generateRandomEmail}
              disabled={isGenerating}
              className="shrink-0"
              title="Generate random email"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
            </Button>
            <Button
              onClick={copyToClipboard}
              disabled={!fullEmail}
              className="shrink-0 gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Ad Slot */}
        <div className="mt-4 p-4 rounded-lg border border-dashed border-border bg-muted/30 text-center text-sm text-muted-foreground">
          Advertisement Space
        </div>
      </CardContent>
    </Card>
  )
}
