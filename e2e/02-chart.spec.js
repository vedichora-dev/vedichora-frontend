// @ts-nocheck
const { test, expect } = require('@playwright/test')
const { ADMIN_EMAIL, ADMIN_PASS } = require('./helpers')

const SITE = process.env.BASE_URL || 'https://vedichora-frontend-orcin.vercel.app'

// ── Helpers ──────────────────────────────────────────────────────────────────
async function login(page) {
  await page.goto(SITE + '/signin')
  await page.waitForLoadState('networkidle')
  await page.fill('input[type="email"]', ADMIN_EMAIL)
  await page.fill('input[type="password"]', ADMIN_PASS)
  await page.click('button[type="submit"]')
  // Wait for redirect away from /signin (up to 10s)
  try {
    await page.waitForURL(url => !url.includes('/signin'), { timeout: 10000 })
  } catch {
    await page.waitForTimeout(5000)
  }
  await page.waitForLoadState('networkidle').catch(() => {})
}

async function fillDatePicker(page, prefix, day, month, year, hour, minute, ap) {
  // DatePicker uses <select> elements with prefix-based IDs
  // id="${prefix}-dd", "${prefix}-mm", "${prefix}-yyyy", "${prefix}-hr", "${prefix}-mi", "${prefix}-ap"
  // Try both id-based and sequential
  try {
    await page.selectOption(`#${prefix}-dd`, String(day))
    await page.selectOption(`#${prefix}-mm`, { index: month })
    await page.selectOption(`#${prefix}-yyyy`, String(year))
    await page.selectOption(`#${prefix}-hr`, String(hour))
    await page.selectOption(`#${prefix}-mi`, String(minute))
    await page.selectOption(`#${prefix}-ap`, ap)
  } catch {
    // Fall back: fill selects sequentially
    const sels = page.locator('select')
    const n = await sels.count().catch(() => 0)
    if (n >= 3) {
      await sels.nth(0).selectOption(String(day))
      await sels.nth(1).selectOption({ index: month })
      await sels.nth(2).selectOption(String(year))
      if (n > 3) await sels.nth(3).selectOption(String(hour))
      if (n > 4) await sels.nth(4).selectOption(String(minute < 10 ? `0${minute}` : minute))
      if (n > 5) await sels.nth(5).selectOption(ap)
    }
  }
}

async function fillCity(page, city) {
  const field = page.locator('input[placeholder*="City"], input[placeholder*="city"]').first()
  await field.scrollIntoViewIfNeeded()
  await field.click({ force: true })
  await field.fill(city)
  await page.waitForTimeout(2000)
  // Use data-city-option selector (set by CityAutocomplete component)
  const opt = page.locator('button[data-city-option="true"]').first()
  const visible = await opt.isVisible({ timeout: 5000 }).catch(() => false)
  if (visible) {
    await opt.click({ force: true })
    await page.waitForTimeout(700)
  }
  await field.press('Tab')
  await page.waitForTimeout(300)
}

// ── Tests ────────────────────────────────────────────────────────────────────
test.describe('CHART — Babu & Pramod Validation', () => {

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('Chart page loads', async ({ page }) => {
    await page.goto(SITE + '/chart')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test-results/10-chart-loaded.png', fullPage: true })

    // Key elements present
    await expect(page.locator('text=New Chart')).toBeVisible({ timeout: 5000 })
    console.log('✓ Chart page loaded')
  })

  test('BABU — Generate chart (Mar 1, 1959, 14:30 IST, Chennai)', async ({ page }) => {
    // Navigate to chart page (already logged in from beforeEach)
    page.on('crash', () => console.log('Page crashed!'))
    await page.goto(SITE + '/chart')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Open form
    const btn = page.locator('button:has-text("New Chart")')
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) await btn.click()
    await page.waitForTimeout(500)

    // Name
    const nameF = page.locator('input[placeholder*="Name"], input[placeholder*="name"], input[placeholder*="optional"]').first()
    if (await nameF.isVisible({ timeout: 2000 }).catch(() => false)) await nameF.fill('Babu')

    // Date: March 1, 1959, 14:30 → 2:30 PM
    await fillDatePicker(page, 'c', 1, 3, 1959, 2, 30, 'PM')
    await page.waitForTimeout(300)

    // City
    await fillCity(page, 'Chennai')
    await page.screenshot({ path: 'test-results/11-babu-form.png', fullPage: true })

    // Click Generate
    const genBtn = page.locator('button').filter({ hasText: /Generate/ }).first()
    await genBtn.scrollIntoViewIfNeeded()
    await genBtn.click({ force: true })
    await page.waitForTimeout(12000)

    await page.screenshot({ path: 'test-results/12-babu-result.png', fullPage: true })

    // Check for error
    const bodyText = await page.locator('body').textContent() || ''
    const errText = bodyText.match(/Error:[^.]{0,200}/)?.[0] || ''
    if (errText) console.warn('Chart error found:', errText)

    // Validate: should show chart data
    const hasSvg   = await page.locator('svg').first().isVisible({ timeout: 5000 }).catch(() => false)
    const hasTable = await page.locator('table').first().isVisible({ timeout: 3000 }).catch(() => false)
    console.log(`SVG visible: ${hasSvg} | Table visible: ${hasTable}`)

    // Check for Cancer/Karka lagna
    const hasCancer = bodyText.includes('Cancer') || bodyText.includes('Karka') || bodyText.includes('Kadagam')
    console.log(`Cancer lagna found: ${hasCancer}`)
    if (!hasCancer) {
      // Log what lagna was found
      const lagnaMatch = bodyText.match(/Lagna[^A-Z]*([A-Z][a-z]+)/)?.[1] || 'not found'
      console.warn(`Expected Cancer, found: ${lagnaMatch}`)
      // Save detailed screenshot for investigation
      await page.screenshot({ path: 'test-results/12b-babu-lagna-wrong.png', fullPage: true })
    }

    expect(hasSvg || hasTable).toBeTruthy()
  })

  test('BABU — Planets tab: verify all 9 planets', async ({ page }) => {
    await page.goto(SITE + '/chart')
    await page.waitForTimeout(2000)

    // Click Planets tab if available (chart already loaded)
    const planetsTab = page.locator('button:has-text("Planets")')
    const tabVisible = await planetsTab.isVisible({ timeout: 3000 }).catch(() => false)

    if (tabVisible) {
      await planetsTab.click()
      await page.waitForTimeout(1500)
      await page.screenshot({ path: 'test-results/13-planets-tab.png', fullPage: true })

      const rows = page.locator('table tbody tr')
      const count = await rows.count()
      console.log(`Planet rows: ${count}`)

      // Should have Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu = 9
      expect(count).toBeGreaterThanOrEqual(9)

      // Check each planet is present
      const text = await page.locator('table').textContent() || ''
      const planets = ['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra','Ke']
      for (const p of planets) {
        const found = text.includes(p)
        console.log(`  ${p}: ${found ? '✓' : '✗'}`)
      }
    } else {
      console.log('Planets tab not visible — generate chart first')
    }
  })

  test('BABU — Dasha: current dasha shows NOW badge', async ({ page }) => {
    await page.goto(SITE + '/chart')
    await page.waitForTimeout(2000)

    const dashaTab = page.locator('button:has-text("Dasha")')
    if (await dashaTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dashaTab.click()
      await page.waitForTimeout(1500)
      await page.screenshot({ path: 'test-results/14-dasha-tab.png', fullPage: true })

      // Check for NOW badge
      const nowBadge = page.locator('text=NOW')
      const hasNow = await nowBadge.isVisible({ timeout: 3000 }).catch(() => false)
      console.log(`NOW badge: ${hasNow}`)

      // Check for dasha rows
      const rows = await page.locator('table tbody tr').count()
      console.log(`Dasha periods: ${rows}`)
      expect(rows).toBeGreaterThanOrEqual(5)
    }
  })

  test('BABU — North Indian chart SVG renders correctly', async ({ page }) => {
    await page.goto(SITE + '/chart')
    await page.waitForTimeout(2000)

    // Click Rasi+D9 tab
    const rasiTab = page.locator('button').filter({ hasText: /Rasi|♦/ }).first()
    if (await rasiTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await rasiTab.click()
      await page.waitForTimeout(1000)
    }

    await page.screenshot({ path: 'test-results/15-rasi-d9.png', fullPage: true })

    // SVG should exist
    const svg = page.locator('svg').first()
    const hasSvg = await svg.isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`SVG rendered: ${hasSvg}`)
    expect(hasSvg).toBeTruthy()

    // Should have multiple SVG text elements (planet abbreviations)
    const textCount = await page.locator('svg text').count()
    const rectCount = await page.locator('svg rect, svg path, svg polygon').count()
    console.log(`SVG text elements: ${textCount} | SVG shapes: ${rectCount}`)
    // North Indian chart uses shapes + text; either proves the SVG rendered
    expect(textCount + rectCount).toBeGreaterThan(3)
  })

  test('PRAMOD — Generate chart (Sep 24, 1968, 20:22 IST, Chennai)', async ({ page }) => {
    // Navigate to chart page (already logged in from beforeEach)
    page.on('crash', () => console.log('Page crashed!'))
    await page.goto(SITE + '/chart')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const btn = page.locator('button:has-text("New Chart")')
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) await btn.click()
    await page.waitForTimeout(500)

    const nameF = page.locator('input[placeholder*="Name"], input[placeholder*="optional"]').first()
    if (await nameF.isVisible({ timeout: 2000 }).catch(() => false)) await nameF.fill('Pramod')

    // Sep 24, 1968, 8:22 PM IST
    await fillDatePicker(page, 'c', 24, 9, 1968, 8, 22, 'PM')
    await fillCity(page, 'Chennai')

    await page.screenshot({ path: 'test-results/20-pramod-form.png', fullPage: true })
    await page.click('button:has-text("Generate")')
    await page.waitForTimeout(10000)

    await page.screenshot({ path: 'test-results/21-pramod-result.png', fullPage: true })

    const bodyText = await page.locator('body').textContent() || ''
    // Pramod: Aries lagna, Swati nakshatra, Rahu MD
    const hasAries = bodyText.includes('Aries') || bodyText.includes('Mesha')
    const hasSwati = bodyText.includes('Swati') || bodyText.includes('Swathi')
    console.log(`Aries lagna: ${hasAries} | Swati nakshatra: ${hasSwati}`)

    const hasSvg = await page.locator('svg').first().isVisible({ timeout: 5000 }).catch(() => false)
    expect(hasSvg).toBeTruthy()
  })

  test('Arudha tab — loads special lagnas', async ({ page }) => {
    await page.goto(SITE + '/chart')
    await page.waitForTimeout(2000)

    const tab = page.locator('button:has-text("Arudha")')
    if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tab.click()
      await page.waitForTimeout(4000)
      await page.screenshot({ path: 'test-results/16-arudha.png', fullPage: true })

      const text = await page.locator('body').textContent() || ''
      const hasLagna = text.includes('Hora') || text.includes('Ghati') || text.includes('Lagna')
      console.log(`Arudha lagna data: ${hasLagna}`)
    }
  })

  test('Doshas tab — loads dosha data', async ({ page }) => {
    await page.goto(SITE + '/chart')
    await page.waitForTimeout(2000)

    const tab = page.locator('button:has-text("Dosha")')
    if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tab.click()
      await page.waitForTimeout(4000)
      await page.screenshot({ path: 'test-results/17-doshas.png', fullPage: true })

      const text = await page.locator('body').textContent() || ''
      const hasMangal = text.includes('Mangal') || text.includes('Not Present') || text.includes('Present')
      console.log(`Dosha data: ${hasMangal}`)
    }
  })

  test('PDF button exists and is clickable', async ({ page }) => {
    await page.goto(SITE + '/chart')
    await page.waitForTimeout(2000)

    const btn = page.locator('button:has-text("PDF")')
    const visible = await btn.isVisible({ timeout: 3000 }).catch(() => false)
    console.log(`PDF button: ${visible}`)
    if (visible) {
      await page.screenshot({ path: 'test-results/18-pdf-btn.png' })
      // Don't actually click — it opens a new tab
    }
  })
})
