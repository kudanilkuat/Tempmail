const CF_API_URL = "https://api.cloudflare.com/client/v4"

export class CloudflareApi {
  private token: string
  private accountId: string

  constructor() {
    this.token = process.env.CLOUDFLARE_API_TOKEN || ""
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID || ""
  }

  private get headers() {
    return {
      "Authorization": `Bearer ${this.token}`,
      "Content-Type": "application/json"
    }
  }

  /**
   * Adds a new domain as a zone to Cloudflare
   * Returns the Zone ID and the assigned Nameservers
   */
  async createZone(domainName: string): Promise<{ zoneId: string, nameServers: string[] }> {
    if (!this.token || !this.accountId) {
      throw new Error("Cloudflare credentials not configured in environment variables")
    }

    const res = await fetch(`${CF_API_URL}/zones`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        name: domainName,
        account: { id: this.accountId },
        jump_start: false,
        type: "full"
      })
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      console.error("Cloudflare createZone error:", data.errors)
      throw new Error(data.errors?.[0]?.message || "Failed to create Cloudflare zone")
    }

    return {
      zoneId: data.result.id,
      nameServers: data.result.name_servers || []
    }
  }

  /**
   * Checks if a specific zone has been activated (Nameservers changed)
   */
  async checkZoneActivation(zoneId: string): Promise<boolean> {
    const res = await fetch(`${CF_API_URL}/zones/${zoneId}`, {
      method: "GET",
      headers: this.headers
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      return false
    }

    return data.result.status === "active"
  }

  /**
   * Enables Email Routing for the Zone and sets up a Catch-All rule
   * to route to the defined destination address.
   */
  async setupEmailRouting(zoneId: string, destinationAddress: string): Promise<void> {
    // 1. Enable Email Routing & add MX records
    const enableRes = await fetch(`${CF_API_URL}/zones/${zoneId}/email/routing/enable`, {
      method: "POST",
      headers: this.headers
    })

    const enableData = await enableRes.json()
    if (!enableRes.ok && enableData.errors?.[0]?.code !== 2056) { // 2056 usually means "Already enabled"
      console.error("Failed to enable email routing:", enableData.errors)
      throw new Error("Could not enable Email Routing for this zone")
    }

    // 2. Create Destination Address (if not already exists on the account level, depends on UI)
    // For catch-all, Cloudflare often requires the destination to be verified first.
    // Assuming the destination address is already a verified destination in the user's CF account.

    // 3. Create Catch-all rule
    const ruleRes = await fetch(`${CF_API_URL}/zones/${zoneId}/email/routing/rules/catch_all`, {
      method: "PUT",
      headers: this.headers,
      body: JSON.stringify({
        matchers: [{ type: "all" }],
        actions: [{ type: "forward", value: [destinationAddress] }],
        name: "TempMail Catch-All",
        enabled: true
      })
    })

    const ruleData = await ruleRes.json()
    if (!ruleRes.ok || !ruleData.success) {
      console.error("Failed to create catch-all rule:", ruleData.errors)
      throw new Error("Could not create catch-all email routing rule")
    }
  }
}

export const cloudflare = new CloudflareApi()
