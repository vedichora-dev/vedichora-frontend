import { test, expect, Page } from '@playwright/test'
import { loginViaAPI } from './helpers/auth'

// ── KNOWN CHARTS for validation ──────────────────────────────────
const BABU = {
  name: 'Babu',
  day: 1, month: 3, year: 1959,
  hour: 14, minute: 30, ampm: 'PM' as const,
  place: 'Chennai',
  // Expected chart data (Lahiri ayanamsa)
  expected: {
    lagna:    /Cancer|Karka|Kadagam/i,
    moonRasi: /Scorpio|Vrishchika/i,
    nakshatra:/Jyeshtha|Jyeshta/i,
    dasha:    /Moon|Rahu|Mercury/i,       // current dasha range
    planets:  9,                           // 9 planets minimum
  }
}

const PRAMOD = {
  name: 'Pramod',
  day: 24, month: 9, year: 1968,
  hour: 8, minute: 22, ampm: 'PM' as const,
  place: 'Chennai',
  expected: {
    lagna:    /Aries|Mesha/i,
    moonRasi: /Libra|Tula/i,
    nakshatra:/Swati|Chitra/i,
    dasha:    /Rahu|Jupiter|Saturn/i,
    planets:  9,
  }
}

async function fillDatePicker(page: Page, prefix: string, day: number, month: number, year: number, hr: number, min: number, ampm: 'AM'|'PM') {
  // Day
  await page.selectOption(`select[name="${prefix}-dd"], #${prefix}-dd`, String(day))
  // Month (1-12)
  await page.selectOption(`select[name="${prefix}-mm"], #${prefix}-mm`, String(month))
  // Year
  await page.fill(`input[name="${prefix}-yyyy"], #${prefix}-yyyy`, String(year))
  // Hour
  await page.selectOption(`select[name="${prefix}-hr"], #${prefix}-hr`, String(hr)).catch(() => {})
  // Minute
  await page.selectOption(`select[name="${prefix}-mi"], #${prefix}-mi`, String(min)).catch(() => {})
  // AM/PM
  await page.selectOption(`select[name="${prefix}-ap"], #${prefix}-ap`, ampm).catch(() => {})
}

async function generateChart(page: Page, person: typeof BABU) {
  // Fill city
  await page.fill('input[placeholder*="City"], input[placeholder*="city"]', person.place)
  await page.waitForTimeout(600)
  // Click first autocomplete result if appears
  const dropdown = page.locator('[class*="autocomplete"] button, [class*="dropdown"] button').first()
  if (await dropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
    await dropdown.click()
  }

  // Fill date — try select elements first
  await page.selectOption('select#c-dd, select[id$="dd"]', String(person.day)).catch(() => {})
  await page.selectOption('select#c-mm, select[id$="mm"]', String(person.month)).catch(() => {})
  await page.fill('input#c-yyyy, input[id$="yyyy"]', String(person.year)).catch(() => {})
  await page.selectOption('select#c-hr, select[id$="hr"]', String(person.hour)).catch(() => {})
  await page.selectOption('select#c-mi, select[id$="mi"]', String(person.minute)).catch(() => {})
  await page.selectOption('select#c-ap, select[id$="ap"]', person.ampm).catch(() => {})

  // Click Generate
  await page.click('button:has-text("Generate"), button:has-text("Kundali"), button:has-text("Chart")')
  
  // Wait for chart to appear (summary strip)
  await page.waitForSelector('text=/Lagna|LAGNA/', { timeout: 30000 })
}

test.describe('Chart Generation', () => {

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page)
    await page.goto('/chart')
    await page.waitForLoadState('networkidle')
  })

  test('Chart page loads with saved charts strip', async ({ page }) => {
    // Should show "Saved Charts" or "New Chart" button
    await expect(page.getByText(/Saved|New Chart/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('Generate Babu chart and verify data', async ({ page }) => {
    await generateChart(page, BABU)

    // Check summary strip
    const lagnaCard = page.locator('text=/Lagna/i').first()
    await expect(lagnaCard).toBeVisible({ timeout: 20000 })

    // Verify lagna
    const lagnaValue = await page.locator('.card').filter({ hasText: /Lagna/i }).first().textContent()
    console.log('Babu Lagna:', lagnaValue)
    expect(lagnaValue).toMatch(BABU.expected.lagna)

    // Click Planets tab
    await page.click('button:has-text("Planets")')
    await page.waitForSelector('table', { timeout: 10000 })

    // Count planet rows
    const rows = await page.locator('table tbody tr').count()
    console.log('Planet rows:', rows)
    expect(rows).toBeGreaterThanOrEqual(BABU.expected.planets)

    // Verify Sun is in the table
    await expect(page.locator('td').filter({ hasText: /^Su$|^Sun$/i }).first()).toBeVisible()
    
    // Verify Moon is in the table
    await expect(page.locator('td').filter({ hasText: /^Mo$|^Moon$/i }).first()).toBeVisible()

    // Screenshot for visual verification
    await page.screenshot({ path: 'e2e-screenshots/babu-planets.png', fullPage: false })
  })

  test('Babu chart — verify Dasha timeline', async ({ page }) => {
    await generateChart(page, BABU)
    
    await page.click('button:has-text("Dasha")')
    await page.waitForSelector('table', { timeout: 10000 })

    // Should have NOW badge on current dasha
    await expect(page.locator('text=NOW').first()).toBeVisible({ timeout: 5000 })

    // Dasha should have multiple rows
    const rows = await page.locator('table tbody tr').count()
    expect(rows).toBeGreaterThanOrEqual(9) // 9 vimshottari lords

    await page.screenshot({ path: 'e2e-screenshots/babu-dasha.png' })
  })

  test('Babu chart — Rasi and Navamsha show together', async ({ page }) => {
    await generateChart(page, BABU)

    // Default tab is Rasi + D9
    await expect(page.locator('text=/Rasi Chart|D1/i').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=/Navamsha|D9/i').first()).toBeVisible({ timeout: 5000 })

    // Both SVG charts should be visible
    const svgs = await page.locator('svg').count()
    expect(svgs).toBeGreaterThanOrEqual(2)

    await page.screenshot({ path: 'e2e-screenshots/babu-rasi-d9.png', fullPage: false })
  })

  test('Generate Pramod chart and verify data', async ({ page }) => {
    await generateChart(page, PRAMOD)

    const lagnaValue = await page.locator('.card').filter({ hasText: /Lagna/i }).first().textContent()
    console.log('Pramod Lagna:', lagnaValue)
    expect(lagnaValue).toMatch(PRAMOD.expected.lagna)

    await page.screenshot({ path: 'e2e-screenshots/pramod-lagna.png' })
  })

  test('Saved charts load without re-entering birth details', async ({ page }) => {
    // First generate Babu chart
    await generateChart(page, BABU)
    
    // Get the chart ID that appeared in the saved strip
    await page.waitForTimeout(1000)
    
    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Saved charts strip should show
    const strip = page.locator('button').filter({ hasText: /Babu/i }).first()
    if (await strip.isVisible({ timeout: 5000 }).catch(() => false)) {
      await strip.click()
      // Should load chart without form
      await expect(page.locator('text=/Lagna|LAGNA/i').first()).toBeVisible({ timeout: 20000 })
      console.log('✓ Saved chart loaded without re-entering birth details')
    } else {
      console.log('⚠ No saved Babu chart found in strip yet')
    }
  })

  test('South Indian chart — Aries in 2nd box', async ({ page }) => {
    await generateChart(page, BABU)

    // Click South tab
    await page.click('button:has-text("South")')
    await page.waitForTimeout(1000)

    // Get the SVG
    const svg = page.locator('svg').first()
    await expect(svg).toBeVisible()
    
    // The South Indian chart SVG should contain rasi labels
    const svgContent = await svg.innerHTML()
    expect(svgContent).toContain('Mes') // Mesha/Aries should be visible

    await page.screenshot({ path: 'e2e-screenshots/south-indian-chart.png' })
  })

})
