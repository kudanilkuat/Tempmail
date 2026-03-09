"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Mail, Clock, Trash2 } from "lucide-react"
import type { Email } from "@/lib/db"

interface EmailViewerProps {
  email: Email
  onBack: () => void
}

export function EmailViewer({ email, onBack }: EmailViewerProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this email?")) return
    
    setIsDeleting(true)
    try {
      await fetch(`/api/emails/${email.id}`, { method: "DELETE" })
      onBack()
    } catch (err) {
      console.error("Error deleting email:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Inbox
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Email Header */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              {email.subject || "(No subject)"}
            </h2>
            
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">From:</span>
                <span className="font-medium text-foreground">{email.sender}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <Badge variant="secondary">{formatDate(email.created_at)}</Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">To:</span>
              <span className="font-mono text-foreground">{email.recipient}</span>
            </div>
          </div>

          {/* Email Body */}
          <Tabs defaultValue={email.html_body ? "html" : "text"} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="text" disabled={!email.text_body}>
                Plain Text
              </TabsTrigger>
              <TabsTrigger value="html" disabled={!email.html_body}>
                HTML
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="text">
              <ScrollArea className="h-[400px] rounded-lg border border-border bg-muted/30 p-4">
                <pre className="whitespace-pre-wrap font-mono text-sm text-foreground">
                  {email.text_body || "No text content available."}
                </pre>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="html">
              <ScrollArea className="h-[400px] rounded-lg border border-border bg-background">
                {email.html_body ? (
                  <iframe
                    srcDoc={email.html_body}
                    title="Email content"
                    className="w-full h-full min-h-[400px] border-0"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <p className="p-4 text-muted-foreground">No HTML content available.</p>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}
