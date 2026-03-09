"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, Inbox, Clock, ChevronRight, AlertCircle } from "lucide-react"
import type { Email } from "@/lib/db"
import { EmailViewer } from "./email-viewer"

interface InboxProps {
  activeEmail: string
  refreshInterval?: number // in milliseconds
}

export function InboxComponent({ activeEmail, refreshInterval = 10000 }: InboxProps) {
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchEmails = useCallback(async () => {
    if (!activeEmail) return

    setIsLoading(true)
    setError(null)

    try {
      const domainPart = activeEmail.split('@')[1]
      let headers: HeadersInit = {}
      
      if (domainPart) {
        const ownerTokensStr = localStorage.getItem("gakmail_owner_tokens")
        if (ownerTokensStr) {
          try {
            const ownerTokens = JSON.parse(ownerTokensStr)
            if (ownerTokens[domainPart]) {
              headers["x-owner-token"] = ownerTokens[domainPart]
            }
          } catch (e) {}
        }
      }

      const response = await fetch(`/api/emails?recipient=${encodeURIComponent(activeEmail)}`, { headers })
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized: This domain is private and you don't have access.")
        }
        throw new Error("Failed to fetch emails")
      }
      const data = await response.json()
      setEmails(data.emails || [])
      setLastRefresh(new Date())
    } catch (err: any) {
      setError(err.message || "Unable to load emails. Please try again.")
      console.error("Error fetching emails:", err)
    } finally {
      setIsLoading(false)
    }
  }, [activeEmail])

  useEffect(() => {
    fetchEmails()
    
    // Set up auto-refresh
    const interval = setInterval(fetchEmails, refreshInterval)
    
    return () => clearInterval(interval)
  }, [fetchEmails, refreshInterval])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  if (selectedEmail) {
    return (
      <EmailViewer 
        email={selectedEmail} 
        onBack={() => setSelectedEmail(null)} 
      />
    )
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
            <Inbox className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Inbox</CardTitle>
            {lastRefresh && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                Last updated: {formatDate(lastRefresh.toISOString())}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchEmails}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 p-4 mb-4 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {isLoading && emails.length === 0 ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-border">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">No emails yet</h3>
            <p className="text-sm text-muted-foreground max-w-[300px]">
              Emails sent to your temporary address will appear here automatically.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {emails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className="w-full text-left p-4 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/30 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground truncate">
                          {email.sender}
                        </span>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {formatDate(email.created_at)}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-foreground truncate mb-1">
                        {email.subject || "(No subject)"}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {email.text_body?.substring(0, 100) || "No preview available"}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Ad Slot */}
        <div className="mt-4 p-4 rounded-lg border border-dashed border-border bg-muted/30 text-center text-sm text-muted-foreground">
          Advertisement Space
        </div>
      </CardContent>
    </Card>
  )
}
