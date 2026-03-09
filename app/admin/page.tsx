"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { 
  Mail, 
  Trash2, 
  RefreshCw, 
  LogOut, 
  Lock,
  Users,
  Clock,
  AlertTriangle
} from "lucide-react"

interface Stats {
  totalEmails: number
  expiredEmails: number
  recentEmails: number
  uniqueRecipients: number
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [stats, setStats] = useState<Stats | null>(null)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      if (response.ok) {
        setIsAuthenticated(true)
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Auth check error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        setIsAuthenticated(true)
        setPassword("")
        await fetchStats()
      } else {
        setLoginError("Invalid password")
      }
    } catch (error) {
      setLoginError("Login failed. Please try again.")
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" })
      setIsAuthenticated(false)
      setStats(null)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Stats fetch error:", error)
    }
  }

  const handleCleanup = async () => {
    if (!confirm("Are you sure you want to delete all expired emails?")) return

    setIsCleaningUp(true)
    setCleanupResult(null)

    try {
      const response = await fetch("/api/admin/cleanup", { method: "POST" })
      if (response.ok) {
        const data = await response.json()
        setCleanupResult(`Successfully deleted ${data.deletedCount} expired emails`)
        await fetchStats()
      } else {
        setCleanupResult("Cleanup failed. Please try again.")
      }
    } catch (error) {
      setCleanupResult("Cleanup failed. Please try again.")
      console.error("Cleanup error:", error)
    } finally {
      setIsCleaningUp(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>
              Enter your password to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                />
              </div>
              {loginError && (
                <p className="text-sm text-destructive">{loginError}</p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Spinner className="w-4 h-4" /> : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-foreground">TempMail Admin</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats?.totalEmails || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Emails</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats?.expiredEmails || 0}</p>
                    <p className="text-sm text-muted-foreground">Expired</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats?.recentEmails || 0}</p>
                    <p className="text-sm text-muted-foreground">Last 24h</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats?.uniqueRecipients || 0}</p>
                    <p className="text-sm text-muted-foreground">Unique Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Database Maintenance</CardTitle>
              <CardDescription>
                Manage and clean up expired emails from the database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  onClick={fetchStats}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Stats
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCleanup}
                  disabled={isCleaningUp || (stats?.expiredEmails || 0) === 0}
                  className="gap-2"
                >
                  {isCleaningUp ? (
                    <Spinner className="w-4 h-4" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Clear Expired Emails ({stats?.expiredEmails || 0})
                </Button>
              </div>
              {cleanupResult && (
                <Badge variant="secondary" className="text-sm">
                  {cleanupResult}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Environment variables and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Email Domain</span>
                  <span className="font-mono text-foreground">
                    {process.env.NEXT_PUBLIC_EMAIL_DOMAIN || "Not configured"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Email Retention</span>
                  <span className="font-mono text-foreground">24 hours</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Auto-Refresh Interval</span>
                  <span className="font-mono text-foreground">10 seconds</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
