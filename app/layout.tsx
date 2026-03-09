import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://gakmail.edgeone.dev'),
  title: 'GakMail - Free Disposable Temporary Email',
  description: 'Create free temporary email addresses instantly. Protect your privacy from spam and unwanted emails. No registration required. Emails auto-delete after 24 hours.',
  keywords: ['temp mail', 'temporary email', 'disposable email', 'fake email', 'anonymous email', 'free email', 'gakmail'],
  openGraph: {
    title: 'GakMail - Free Disposable Temporary Email',
    description: 'Create free temporary email addresses instantly. Protect your privacy from spam and unwanted emails.',
    url: 'https://gakmail.edgeone.dev',
    siteName: 'GakMail',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GakMail - Free Disposable Temporary Email',
    description: 'Create free temporary email addresses instantly. Protect your privacy from spam.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
