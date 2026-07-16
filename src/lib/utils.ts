import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function to24Hour(h: number, m: number, ap: 'AM'|'PM'): { hour: number; minute: number } {
  let hour = h % 12
  if (ap === 'PM') hour += 12
  return { hour, minute: Math.min(59, m) }
}

export function scoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-600'
  if (score >= 55) return 'text-amber-600'
  return 'text-red-500'
}

export function scoreDot(score: number): string {
  if (score >= 75) return 'bg-emerald-500'
  if (score >= 55) return 'bg-amber-400'
  return 'bg-red-400'
}

export function formatCurrency(amount: number, code: string): string {
  const syms: Record<string,string> = { INR:'₹',USD:'$',GBP:'£',SGD:'S$',MYR:'RM',AED:'AED',AUD:'A$',CAD:'C$',LKR:'Rs' }
  const sym = syms[code] || code
  return `${sym}${amount.toLocaleString()}`
}

export function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0,2).toUpperCase()
}
