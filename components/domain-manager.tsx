"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Globe, Lock, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react"

interface DomainManagerProps {
  onDomainsUpdated: () => void
}

export function DomainManager({ onDomainsUpdated }: DomainManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [domains, setDomains] = useState<any[]>([])
  const [newDomain, setNewDomain] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copiedToken, setCopiedToken] = useState("")

  useEffect(() => {
    if (isOpen) {
      fetchDomains()
    }
  }, [isOpen])

  const fetchDomains = async () => {
    try {
      setLoading(true)
      const ownerTokensStr = localStorage.getItem("tempmail_owner_tokens")
      let headers: HeadersInit = {}
      if (ownerTokensStr) {
        const tokens = JSON.parse(ownerTokensStr)
        const tokenValues = Object.values(tokens) as string[]
        if (tokenValues.length > 0) {
          headers["x-owner-tokens"] = tokenValues.join(',')
        }
      }
      
      const res = await fetch("/api/domains", { headers })
      const data = await res.json()
      
      if (res.ok && data.domains) {
        // Find domains that belong to us or are public
        setDomains(data.domains)
      }
    } catch (err) {
      console.error("Failed to fetch domains", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDomain = async () => {
    setError("")
    if (!newDomain) return

    setLoading(true)
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain, isPublic }),
      })
      const data = await res.json()

      if (res.ok) {
        // Save owner token
        const ownerTokensStr = localStorage.getItem("tempmail_owner_tokens")
        const ownerTokens = ownerTokensStr ? JSON.parse(ownerTokensStr) : {}
        ownerTokens[data.domain.domain] = data.domain.owner_token
        localStorage.setItem("tempmail_owner_tokens", JSON.stringify(ownerTokens))

        setNewDomain("")
        setIsPublic(false)
        fetchDomains()
        onDomainsUpdated()
      } else {
        setError(data.error || "Failed to add domain")
      }
    } catch (err) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const verifyDomain = async (domain: string) => {
    setLoading(true)
    try {
      const ownerTokensStr = localStorage.getItem("tempmail_owner_tokens")
      const ownerTokens = ownerTokensStr ? JSON.parse(ownerTokensStr) : {}
      const ownerToken = ownerTokens[domain]

      const res = await fetch("/api/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, ownerToken }),
      })
      const data = await res.json()

      if (res.ok && data.verified) {
        fetchDomains()
        onDomainsUpdated()
      } else {
        setError(data.message || data.error || "Verification failed. DNS might need more time.")
      }
    } catch (err) {
      setError("Network error during verification")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedToken(id)
    setTimeout(() => setCopiedToken(""), 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="w-4 h-4" />
          Custom Domains
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Custom Domains</DialogTitle>
          <DialogDescription>
            Add your own domain to receive temporary emails. You'll need to configure DNS records.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Add New Domain</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Input 
                    placeholder="example.com" 
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value.toLowerCase())}
                  />
                  <Button onClick={handleAddDomain} disabled={loading || !newDomain}>
                    <Plus className="w-4 h-4 mr-2" /> Add
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="public" 
                    checked={isPublic} 
                    onCheckedChange={(c) => setIsPublic(c === true)} 
                  />
                  <label htmlFor="public" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Make public (anyone can use this domain)
                  </label>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Your Domains</h3>
            {domains.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground text-center py-4">No custom domains found.</p>
            )}
            
            {domains.map((domain) => {
              const ownerTokensStr = localStorage.getItem("tempmail_owner_tokens")
              const ownerTokens = ownerTokensStr ? JSON.parse(ownerTokensStr) : {}
              const isOwner = !!ownerTokens[domain.domain]

              if (!isOwner && !domain.is_public) return null; // Don't show private domains we don't own

              return (
                <Card key={domain.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{domain.domain}</span>
                        {domain.is_public ? (
                          <span className="flex items-center text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            <Globe className="w-3 h-3 mr-1" /> Public
                          </span>
                        ) : (
                          <span className="flex items-center text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            <Lock className="w-3 h-3 mr-1" /> Private
                          </span>
                        )}
                        
                        {domain.is_verified ? (
                          <span className="flex items-center text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                          </span>
                        ) : (
                          <span className="flex items-center text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3 mr-1" /> Unverified
                          </span>
                        )}
                      </div>
                      
                      {!domain.is_verified && isOwner && (
                        <Button size="sm" variant="outline" onClick={() => verifyDomain(domain.domain)} disabled={loading}>
                          Verify DNS
                        </Button>
                      )}
                    </div>

                    {!domain.is_verified && isOwner && (
                      <div className="mt-4 p-3 bg-muted rounded-md text-sm border">
                        <p className="mb-2 font-medium">To verify, add this TXT record to your DNS:</p>
                        <div className="grid grid-cols-[100px_1fr_auto] gap-2 items-center mb-2">
                          <span className="text-muted-foreground">Type:</span>
                          <code className="bg-background px-2 py-1 rounded">TXT</code>
                        </div>
                        <div className="grid grid-cols-[100px_1fr_auto] gap-2 items-center mb-2">
                          <span className="text-muted-foreground">Name:</span>
                          <code className="bg-background px-2 py-1 rounded">@</code>
                        </div>
                        <div className="grid grid-cols-[100px_1fr_auto] gap-2 items-center">
                          <span className="text-muted-foreground">Value:</span>
                          <code className="bg-background px-2 py-1 rounded truncate">tempmail-verification={domain.verification_token}</code>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(`tempmail-verification=${domain.verification_token}`, domain.id)}>
                            {copiedToken === domain.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
