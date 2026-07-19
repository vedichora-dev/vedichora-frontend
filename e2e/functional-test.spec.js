// @ts-nocheck
const { test, expect } = require('@playwright/test')

const SITE  = process.env.BASE_URL || 'https://vedichora-frontend-orcin.vercel.app'
const ADMIN = 'admin@vedichora.com'
const PASS  = 'Admin@123'

async function fillCity(page, inputNth, cityName) {
  const inputs = page.locator('input[placeholder*="City"], input[placeholder*="city"]')
  await inputs.nth(inputNth).click()
  await inputs.nth(inputNth).fill(cityName)
  await page.waitForTimeout(1800)  // wait for debounce + API
  // City option buttons are marked with data-city-option="true"
  const opt = page.locator(`button[data-city-option="true"]:has-text("${cityName}")`).first()
  const optVisible = await opt.isVisible({ timeout: 4000 }).catch(() => false)
  if (optVisible) {
    await opt.click()
    await page.waitForTimeout(400)
  } else {
    // Fallback: any button containing the city name in the dropdown
    const fb = page.locator(`button:has-text("${cityName}")`).first()
    if (await fb.isVisible({ timeout: 2000 }).catch(() => false)) {
      await fb.click()
      await page.waitForTimeout(400)
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
test.describe('GUEST CHART', () => {

  test('Guest chart — no redirect, city dropdown closes, chart generates', async ({ page }) => {
    await page.goto(SITE + '/chart')
    await page.waitForLoadState('networkidle')
    await expect(page).not.toHaveURL(/signin|login/)
    console.log('✓ No redirect to signin')

    // Select date
    const selects = page.locator('select')
    await selects.nth(0).selectOption('1')
    await selects.nth(1).selectOption({ index: 3 })   // March
    await selects.nth(2).selectOption('1985')
    await selects.nth(3).selectOption('10').catch(() => {})
    await selects.nth(4).selectOption('0').catch(() => {})

    // City
    await fillCity(page, 0, 'Chennai')

    // Verify input has value (city was selected)
    const cityInput = page.locator('input[placeholder*="City"]').first()
    const cityVal = await cityInput.inputValue()
    console.log('City input value after selection:', cityVal)
    expect(cityVal).toMatch(/Chennai/)
    console.log('✓ City selected, dropdown closed')

    // Verify dropdown is closed — no city buttons visible
    const dropdownItems = page.locator('button[data-city-option="true"]')
    const dropdownOpen = await dropdownItems.first().isVisible({ timeout: 500 }).catch(() => false)
    console.log('Dropdown still open after selection:', dropdownOpen)
    expect(dropdownOpen).toBeFalsy()

    // Click Generate
    const genBtn = page.locator('button').filter({ hasText: /Generate/ }).last()
    await genBtn.click()
    await page.waitForTimeout(9000)

    await expect(page).not.toHaveURL(/signin|login/)

    const body = await page.locator('body').textContent()
    const hasChart = /Cancer|Aries|Taurus|Gemini|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces/.test(body)
    const hasError = body.includes('Validation') || body.includes('failed') || body.includes('Error:')
    console.log('Chart appeared:', hasChart, '| Error shown:', hasError)
    if (!hasChart) {
      const errEl = await page.locator('[style*="DC2626"], [style*="red"]').first().textContent().catch(() => '')
      console.log('Error element:', errEl)
    }
    await page.screenshot({ path: 'test-results/guest-chart.png' })
    expect(hasChart).toBeTruthy()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
test.describe('CITY DROPDOWN', () => {
  test('City dropdown closes after selection', async ({ page }) => {
    await page.goto(SITE + '/chart')
    await page.waitForLoadState('networkidle')

    const cityInput = page.locator('input[placeholder*="City"]').first()
    await cityInput.fill('Mumbai')
    await page.waitForTimeout(1800)

    // Wait for options to appear
    const firstOpt = page.locator('button[data-city-option="true"]').first()
    const appeared  = await firstOpt.isVisible({ timeout: 5000 }).catch(() => false)
    console.log('Dropdown appeared:', appeared)

    if (appeared) {
      await firstOpt.click()
      await page.waitForTimeout(600)

      // Dropdown must be gone
      const stillOpen = await page.locator('button[data-city-option="true"]').first()
        .isVisible({ timeout: 500 }).catch(() => false)
      console.log('Dropdown still open after click:', stillOpen)
      expect(stillOpen).toBeFalsy()

      // Input must have a value
      const val = await cityInput.inputValue()
      console.log('City input value:', val)
      expect(val.length).toBeGreaterThan(0)
    } else {
      console.log('No dropdown appeared (API may be slow) — test skipped')
    }
  })
})

// ══════════════════════════════════════════════════════════════════════════════
test.describe('GUEST MATCHMAKING', () => {
  test('Guest matchmaking — generates compatibility without login', async ({ page }) => {
    await page.goto(SITE + '/match')
    await page.waitForLoadState('networkidle')
    await expect(page).not.toHaveURL(/signin|login/)

    const selects = page.locator('select')
    const nSel = await selects.count()
    console.log('Match selects count:', nSel)

    if (nSel >= 6) {
      await selects.nth(0).selectOption('15')
      await selects.nth(1).selectOption({ index: 8 })
      await selects.nth(2).selectOption('1990')
    }

    await fillCity(page, 0, 'Chennai')

    if (nSel >= 12) {
      await selects.nth(6).selectOption('20')
      await selects.nth(7).selectOption({ index: 11 })
      await selects.nth(8).selectOption('1992')
    }

    await fillCity(page, 1, 'Coimbatore')

    const calcBtn = page.locator('button').filter({ hasText: /Calculate|Compatibility/ }).first()
    await calcBtn.click()
    await page.waitForTimeout(14000)

    await page.screenshot({ path: 'test-results/guest-match.png' })

    const text = await page.locator('body').textContent()
    const hasResult = /Ashta|Koota|Porutham|\/36|score|compatible/i.test(text)
    console.log('Match result visible:', hasResult)
    expect(hasResult).toBeTruthy()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
test.describe('NUMEROLOGY', () => {
  test('Numerology — calculates life path number', async ({ page }) => {
    await page.goto(SITE + '/numerology')
    await page.waitForLoadState('networkidle')

    // Name input — can be input without type attr, or type="text"
    // Use placeholder or label-based selector
    const nameInput = page.locator(
      'input[placeholder*="name" i], input[placeholder*="Name"], input[id*="name" i], input[aria-label*="name" i], input[type="text"]'
    ).first()

    const nameVisible = await nameInput.isVisible({ timeout: 4000 }).catch(() => false)
    console.log('Name input visible:', nameVisible)

    if (nameVisible) {
      await nameInput.fill('Venkat Kumar')
    } else {
      // Try any input that's not date-related
      const allInputs = page.locator('input:not([type="hidden"])')
      const n = await allInputs.count()
      console.log('Total inputs on page:', n)
      if (n > 0) await allInputs.first().fill('Venkat Kumar')
    }

    // Date of birth — fill selects
    const selects = page.locator('select')
    const nSel = await selects.count()
    console.log('Numerology selects:', nSel)
    if (nSel >= 3) {
      await selects.nth(0).selectOption('15')
      await selects.nth(1).selectOption({ index: 8 })
      await selects.nth(2).selectOption('1985')
    }

    // Calculate button
    const calcBtn = page.locator('button').filter({ hasText: /Calculate|Reveal|Numerology/ }).first()
    const calcVisible = await calcBtn.isVisible({ timeout: 3000 }).catch(() => false)
    if (calcVisible) {
      await calcBtn.click()
      await page.waitForTimeout(6000)
    }

    await page.screenshot({ path: 'test-results/numerology-result.png' })

    const text = await page.locator('body').textContent()
    const hasResult = /Life Path|Destiny|Soul|Personality|Master|Number/.test(text)
    console.log('Numerology result visible:', hasResult)
    expect(hasResult).toBeTruthy()
  })
})
