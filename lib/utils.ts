import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const adjectives = [
  "happy", "swift", "quiet", "brave", "clever", "bright", "cool", "calm",
  "wild", "bold", "fast", "smart", "jolly", "lucky", "proud", "noble"
]

const nouns = [
  "panda", "tiger", "eagle", "dolphin", "wolf", "fox", "owl", "bear",
  "lion", "hawk", "seal", "koala", "swan", "dove", "lynx", "puma"
]

export function generateRandomEmail(domain?: string) {
  // Generate a random string of 10 lowercase letters and numbers
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let randomString = ""
  for (let i = 0; i < 10; i++) {
    randomString += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  const selectedDomain = domain || process.env.NEXT_PUBLIC_EMAIL_DOMAIN || "gakmail.edgeone.dev"
  return `${randomString}@${selectedDomain}`
}
