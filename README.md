# 📧 GakMail - Open Source Disposable Email Service

[![Website Status](https://img.shields.io/website-up-down-green-red/https/gakmail.edgeone.dev.svg)](https://gakmail.edgeone.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**GakMail** is a modern, fast, and secure open-source temporary email service (Temp Mail) built with [Next.js](https://nextjs.org/) and powered by [Neon Serverless Postgres](https://neon.tech/) and [Cloudflare Email Routing](https://cloudflare.com/). 

Protect your privacy, avoid spam, and keep your personal inbox clean. No registration required!

🌐 **Live Demo & Official App:** [**https://gakmail.edgeone.dev**](https://gakmail.edgeone.dev)

---

## ✨ Key Features

- **Instant Email Generation:** Get a unique inbox with one click.
- **Custom Domains Integration:** Users have the power to add & verify their **own custom domains** directly from the UI over Cloudflare API integrations.
- **Private & Public Domains:** Choose whether domains added are accessible to anyone or locked to specific users.
- **Auto-Cleanup (24 hours):** All emails automatically self-destruct after 24 hours to ensure server health and privacy.
- **Admin Dashboard:** Built-in statistics page to monitor email volume and trigger manual database cleanups.
- **Modern UI/UX:** Built cleanly using Tailwind CSS and structured components.

## 🚀 Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TailwindCSS, Lucide Icons
- **Backend API:** Next.js Route Handlers
- **Database:** Neon Serverless PostgreSQL
- **Email Processing:** Cloudflare Email Workers + Webhooks
- **Hosting / Edge:** Vercel / EdgeOne

## ⚙️ How It Works (The Architecture)

1. A sender sends an email to \`anything@gakmail.edgeone.dev\`.
2. **Cloudflare Email Routing** catches the email because of a Catch-all rule.
3. A lightweight **Cloudflare Worker** parses the raw MIME email stream.
4. The worker securely forwards the parsed JSON payload (Subject, HTML Body, Sender) to the \`POST /api/webhook\` route in Next.js.
5. Next.js saves it into the **Neon Postgres Database**.
6. The user's browser regularly polls the database and reads the emails linked to their active recipient address.

---

## 🛠️ Deploy Your Own

If you'd like to run your own instance of GakMail, follow these steps:

### 1. Prerequisites
- Node.js >= 18.x
- A [Neon](https://neon.tech) PostgreSQL Database account
- A [Cloudflare](https://cloudflare.com) account (for email routing)

### 2. Setup Environment Variables
Clone this repository and create a \`.env.local\` file:

\`\`\`env
DATABASE_URL="postgresql://user:password@hostname.neon.tech/neondb?sslmode=require"
NEXT_PUBLIC_EMAIL_DOMAIN="yourdomain.com"
WEBHOOK_SECRET="your_secure_random_string"
ADMIN_PASSWORD="your_admin_password"

# For Automated Custom Domain Support (Optional)
CLOUDFLARE_API_TOKEN="your_cf_api_token"
CLOUDFLARE_ACCOUNT_ID="your_cf_account_id"
\`\`\`

### 3. Database Migration
Run the SQL scripts located in the \`scripts/\` folder inside your Neon SQL Editor in the following order:
1. \`001-create-tables.sql\`
2. \`002-add-domains.sql\`
3. \`003-update-domains-ns.sql\`

### 4. Setup Cloudflare Worker
Deploy the script inside \`cloudflare-worker/worker.js\` as a Cloudflare Worker, set its environment variables to point to your Next.js webhook route, and assign a Catch-All Email Routing rule to it.

### 5. Run Locally
\`\`\`bash
npm install
npm run dev
\`\`\`

---

## 🤝 Contribution & Backlinks

Feel free to fork this repository, submit Pull Requests, or open Issues for bugs and feature requests.

If you find this project useful or build upon it, we would highly appreciate a shoutout or a backlink to the official website!
👉 **[GakMail - Disposable Email](https://gakmail.edgeone.dev)**

---
Developed by [kudanilkuat](https://github.com/kudanilkuat)
