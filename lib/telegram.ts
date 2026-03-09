const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

export class TelegramApi {
  private async request(method: string, data: any) {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.error("TELEGRAM_BOT_TOKEN is not set.")
      return null
    }

    try {
      const response = await fetch(`${TELEGRAM_API_URL}/${method}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      if (!result.ok) {
        console.error(`Telegram API error (${method}):`, result.description)
      }
      return result
    } catch (error) {
      console.error(`Failed to call Telegram API (${method}):`, error)
      return null
    }
  }

  /**
   * Sends a message to a specific Telegram chat ID.
   * Can format text as HTML or MarkdownV2.
   */
  async sendMessage(chatId: number, text: string, parseMode: 'HTML' | 'MarkdownV2' = 'HTML', replyMarkup?: any) {
    return this.request('sendMessage', {
      chat_id: chatId,
      text: text,
      parse_mode: parseMode,
      reply_markup: replyMarkup
    })
  }

  /**
   * Sets the webhook URL for the bot
   */
  async setWebhook(url: string, secretToken: string) {
    return this.request('setWebhook', {
      url: url,
      secret_token: secretToken
    })
  }
}

export const telegram = new TelegramApi()
