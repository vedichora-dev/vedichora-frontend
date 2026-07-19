// @ts-nocheck
import { Page } from '@playwright/test'

export const SITE = process.env.BASE_URL || 'https://vedichora-frontend-orcin.vercel.app'
export const ADMIN_EMAIL   = 'admin@vedichora.com'
export const ADMIN_PASS    = 'Admin@123'
export const TEST_PASSWORD = 'TestPass@123'

// Known validation charts
export const BABU = {
  name: 'Babu',
  day: 1, month: 3, year: 1959, hour: 2, minute: 30, ap: 'PM' as const,
  place: 'Chennai',
  expectedLagna:     'Cancer',
  expectedMoon:      'Scorpio',
  expectedNakshatra: 'Anuradha',
  expectedDasha:     'Moon',
}

export const PRAMOD = {
  name: 'Pramod',
  day: 24, month: 9, year: 1968, hour: 8, minute: 22, ap: 'PM' as const,
  place: 'Chennai',
  expectedLagna:     'Aries',
  expectedNakshatra: 'Swati',
  expectedDasha:     'Rahu',
}

/** Login via UI */
export async function loginUI(page: Page, email = ADMIN_EMAIL, pass = ADMIN_PASS) {
  await page.goto('/signin')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', pass)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(5000)
}

/** Fill DatePicker — uses custom <select> elements prefixed by `prefix` */
export async function fillDate(
  page: Page,
  prefix: string,
  day: number, month: number, year: number,
  hour: number, minute: number, ap: 'AM'|'PM'
) {
  // Try by index (most reliable across environments)
  const sels = page.locator('select')
  const n    = await sels.count()
  if (n >= 3) {
    await sels.nth(0).selectOption(String(day))
    await sels.nth(1).selectOption({ index: month })
    await sels.nth(2).selectOption(String(year))
    if (n > 3) await sels.nth(3).selectOption(String(hour)).catch(() => {})
    if (n > 4) await sels.nth(4).selectOption(String(minute < 10 ? `0${minute}` : minute)).catch(() => {})
    if (n > 5) await sels.nth(5).selectOption(ap).catch(() => {})
  }
}

/** Fill city with autocomplete */
export async function fillCity(page: Page, city: string) {
  const field = page.locator('input[placeholder*="City"], input[placeholder*="city"]').first()
  await field.fill(city)
  await page.waitForTimeout(700)
  const drop = page.locator(`button:has-text("${city}")`).first()
  if (await drop.isVisible({ timeout: 2000 }).catch(() => false)) await drop.click()
}
