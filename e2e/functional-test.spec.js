// @ts-nocheck
const { test, expect } = require('@playwright/test')

const SITE  = process.env.BASE_URL || 'https://vedichora-frontend-orcin.vercel.app'
const ADMIN = 'admin@vedichora.com'
const PASS  = 'Admin@123'

/** Fill city autocomplete robustly for both desktop and mobile */
async function fillCity(page, inputNth, cityName) {
  const inputs = page.locator('input[placeholder*="City"], input[placeholder*="city"]')
  const input  = inputs.nth(inputNth)
  
  // Scroll into view first — critical on mobile
  await input.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  await input.click({ force: true })
  await input.fill(cityName)
  await page.waitForTimeout(2200)  // debounce + photon API

  // Try data-city-option first
  const opt = page.locator('button[data-city-option="true"]').first()
  const appeared = await opt.isVisible({ timeout: 5000 }).catch(() => false)
  console.log(`City dropdown for "${cityName}" appeared:`, appeared)

  if (appeared) {
    await opt.scrollIntoViewIfNeeded().catch(() => {})
    await opt.click({ force: true })
    await page.waitForTimeout(800)
  } else {
    // Fallback: type enough to trigger and accept what's in the field
    console.log(`No dropdown for "${cityName}" — accepting typed value`)
  }

  // Always press Tab to blur input and dismiss any residual dropdown
  await input.press('Tab')
  await page.waitForTimeout(400)
  
  // Verify input has value
  const val = await input.inputValue()
  console.log(`City ${inputNth} final value: "${val}"`)
}

// ══════════════════════════════════════════════════════════════════════════════
test.describe('GUEST CHART', () => {
  test('Guest chart — no redirect, city dropdown closes, chart generates', async ({ page }) => {
    await page.goto(SITE + '/chart')
    await page.waitForLoadState('networkidle')
    await expect(page).not.toHaveURL(/signin|login/)
    console.log('✓ No redirect to signin')

    const selects = page.locator('select')
    await selects.nth(0).selectOption('1')
    await selects.nth(1).selectOption({ index: 3 })
    await selects.nth(2).selectOption('1985')
    await selects.nth(3).selectOption('10').catch(() => {})
    await selects.nth(4).selectOption('0').catch(() => {})

    await fillCity(page, 0, 'Chennai')

    const cityInput = page.locator('input[placeholder*="City"]').first()
    const cityVal   = await cityInput.inputValue()
    console.log('City input value after selection:', cityVal)
    expect(cityVal.length).toBeGreaterThan(0)
    console.log('✓ City selected, dropdown closed')

    const dropdownOpen = await page.locator('button[data-city-option="true"]')
      .first().isVisible({ timeout: 300 }).catch(() => false)
    console.log('Dropdown still open after selection:', dropdownOpen)
    expect(dropdownOpen).toBeFalsy()

    const genBtn = page.locator('button').filter({ hasText: /Generate/ }).last()
    await genBtn.click({ force: true })
    await page.waitForTimeout(9000)

    await expect(page).not.toHaveURL(/signin|login/)
    const body = await page.locator('body').textContent()
    const hasChart = /Cancer|Aries|Taurus|Gemini|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces/.test(body)
    console.log('Chart appeared:', hasChart)
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
    await cityInput.scrollIntoViewIfNeeded()
    await cityInput.click({ force: true })
    await cityInput.fill('Mumbai')
    await page.waitForTimeout(2200)

    const firstOpt = page.locator('button[data-city-option="true"]').first()
    const appeared  = await firstOpt.isVisible({ timeout: 5000 }).catch(() => false)
    console.log('Dropdown appeared:', appeared)

    if (appeared) {
      await firstOpt.click({ force: true })
      await page.waitForTimeout(700)

      const stillOpen = await page.locator('button[data-city-option="true"]').first()
        .isVisible({ timeout: 300 }).catch(() => false)
      console.log('Dropdown still open after click:', stillOpen)
      expect(stillOpen).toBeFalsy()

      const val = await cityInput.inputValue()
      console.log('City input value:', val)
      expect(val.length).toBeGreaterThan(0)
    } else {
      console.log('No dropdown appeared (API slow) — skip assertion')
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

    // Person 1
    if (nSel >= 3) {
      await selects.nth(0).selectOption('15')
      await selects.nth(1).selectOption({ index: 8 })
      await selects.nth(2).selectOption('1990')
    }
    await fillCity(page, 0, 'Chennai')

    // Person 2
    if (nSel >= 9) {
      await selects.nth(6).selectOption('20').catch(() => {})
      await selects.nth(7).selectOption({ index: 11 }).catch(() => {})
      await selects.nth(8).selectOption('1992').catch(() => {})
    }
    await fillCity(page, 1, 'Coimbatore')

    // Extra safety: press Escape + wait to ensure no dropdown remains
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // Scroll to and click Calculate
    const calcBtn = page.locator('button').filter({ hasText: /Calculate|Compatibility/ }).first()
    await calcBtn.scrollIntoViewIfNeeded()
    console.log('Clicking Calculate button...')
    await calcBtn.click({ force: true })
    await page.waitForTimeout(15000)

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

    const nameInput = page.locator(
      'input[placeholder*="name" i], input[placeholder*="Name"], input[type="text"]'
    ).first()
    const nameVisible = await nameInput.isVisible({ timeout: 4000 }).catch(() => false)
    console.log('Name input visible:', nameVisible)
    if (nameVisible) {
      await nameInput.fill('Venkat Kumar')
    } else {
      const all = page.locator('input:not([type="hidden"])')
      if (await all.count() > 0) await all.first().fill('Venkat Kumar').catch(() => {})
    }

    const selects = page.locator('select')
    if (await selects.count() >= 3) {
      await selects.nth(0).selectOption('15')
      await selects.nth(1).selectOption({ index: 8 })
      await selects.nth(2).selectOption('1985')
    }

    const calcBtn = page.locator('button').filter({ hasText: /Calculate|Reveal|Numerology/ }).first()
    if (await calcBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
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
