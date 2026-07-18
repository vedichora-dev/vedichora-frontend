import { Page, expect } from '@playwright/test'

export const SITE = process.env.BASE_URL || 'https://vedichora-frontend-orcin.vercel.app'
export const TEST_EMAIL    = `e2e_${Date.now()}@test.vedichora.com`
export const TEST_PASSWORD = 'TestPass@123'
export const ADMIN_EMAIL   = 'admin@vedichora.com'
export const ADMIN_PASS    = 'Admin@123'

// Known validation charts
export const BABU = {
  name: 'Babu',
  day: 1, month: 3, year: 1959, hour: 14, minute: 30,
  place: 'Chennai',
  expectedLagna:    'Cancer',        // Kadagam / Karka
  expectedMoon:     'Scorpio',       // Vrischika
  expectedNakshatra:'Anuradha',
  expectedDasha:    'Moon',          // Current MD ~2036
}

export const PRAMOD = {
  name: 'Pramod',
  day: 24, month: 9, year: 1968, hour: 20, minute: 22,
  place: 'Chennai',
  expectedLagna:    'Aries',         // Mesha
  expectedNakshatra:'Swati',
  expectedDasha:    'Rahu',
}

/** Login via UI */
export async function loginUI(page: Page, email = ADMIN_EMAIL, pass = ADMIN_PASS) {
  await page.goto('/signin')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', pass)
  await page.click('button[type="submit"], button:has-text("Sign in")')
  await page.waitForURL(/chart|dashboard|\//, { timeout: 15_000 })
}

/** Generate a chart from the /chart page */
export async function generateChart(page: Page, opts: {
  name: string, day: number, month: number, year: number,
  hour: number, minute: number, place: string
}) {
  await page.goto('/chart')
  
  // Open form if collapsed
  const newBtn = page.locator('button:has-text("New Chart")')
  if (await newBtn.isVisible()) await newBtn.click()
  
  // Fill name if field visible
  const nameField = page.locator('input[placeholder*="Name"], input[placeholder*="name"]').first()
  if (await nameField.isVisible()) await nameField.fill(opts.name)

  // Select Day
  await page.selectOption('select[id*="c-dd"], select').first().selectOption(String(opts.day))
  
  // Select Month
  const months = ['','January','February','March','April','May','June',
                  'July','August','September','October','November','December']
  await page.selectOption('select').nth(1).selectOption(months[opts.month])
  
  // Select Year
  await page.selectOption('select').nth(2).selectOption(String(opts.year))

  // Time — Hour
  await page.selectOption('select').nth(3).selectOption(String(opts.hour <= 12 ? opts.hour : opts.hour - 12))
  
  // Place
  const placeField = page.locator('input[placeholder*="City"], input[placeholder*="city"]').first()
  await placeField.fill(opts.place)
  await page.waitForTimeout(600)
  const dropdown = page.locator('button:has-text("' + opts.place + '")').first()
  if (await dropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
    await dropdown.click()
  }

  // Generate
  await page.click('button:has-text("Generate")')
  
  // Wait for chart to appear
  await page.waitForSelector('[class*="card"] :text("Lagna"), text=Rasi', { timeout: 30_000 })
    .catch(() => {})
  await page.waitForTimeout(2000)
}

/** Get summary card values */
export async function getChartSummary(page: Page) {
  const cards = page.locator('.card')
  const texts = await page.locator('[class*="card"] div').allTextContents()
  return texts.join(' ')
}
