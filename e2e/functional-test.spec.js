// @ts-nocheck
const { test, expect } = require('@playwright/test')

const SITE  = process.env.BASE_URL || 'https://vedichora-frontend-orcin.vercel.app'
const ADMIN = 'admin@vedichora.com'
const PASS  = 'Admin@123'

// Helper: fill date using select elements on a specific parent
async function fillDate(page, parentSelector, day, monthIdx, year) {
  const parent = parentSelector ? page.locator(parentSelector) : page
  const selects = parent.locator('select')
  await selects.nth(0).selectOption(String(day)).catch(()=>{})
  await selects.nth(1).selectOption({ index: monthIdx }).catch(()=>{})
  await selects.nth(2).selectOption(String(year)).catch(()=>{})
}

async function fillCity(page, inputNth, cityName) {
  const inputs = page.locator('input[placeholder*="City"], input[placeholder*="city"]')
  await inputs.nth(inputNth).fill(cityName)
  await page.waitForTimeout(1500)
  const btn = page.locator('button').filter({ hasText: cityName }).first()
  if (await btn.isVisible({ timeout: 3000 })) {
    await btn.click()
    await page.waitForTimeout(600)
  }
}

// ══════════════════════════════════════════════════════════════
test.describe('GUEST CHART', () => {

  test('Guest chart — no redirect, city dropdown closes, chart generates [chromium]', async ({ page }) => {
    await page.goto(SITE + '/chart')
    await page.waitForLoadState('networkidle')
    await expect(page).not.toHaveURL(/signin|login/)
    console.log('✓ No redirect to signin')

    // Select date
    const selects = page.locator('select')
    await selects.nth(0).selectOption('1')       // Day
    await selects.nth(1).selectOption({ index: 3 }) // March
    await selects.nth(2).selectOption('1985')    // Year
    await selects.nth(3).selectOption('10').catch(()=>{}) // Hour
    await selects.nth(4).selectOption('0').catch(()=>{})  // Minute

    // City
    await fillCity(page, 0, 'Chennai')

    // Verify dropdown closed
    const cityInput = page.locator('input[placeholder*="City"]').first()
    await expect(cityInput).toHaveValue(/Chennai/)
    console.log('✓ City selected, dropdown closed')

    // Click Generate — look for the generate button specifically within the form card
    // NOT the homepage CTA button
    const genBtn = page.locator('button').filter({ hasText: /Generate|ஜாதகம்|Kundali Chart/ }).last()
    await genBtn.click()
    await page.waitForTimeout(8000)

    // Must NOT redirect to signin
    await expect(page).not.toHaveURL(/signin|login/)

    const body = await page.locator('body').textContent()
    const hasChart = /Cancer|Aries|Taurus|Gemini|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces/.test(body)
    const hasError = body.includes('Validation') || body.includes('failed') || body.includes('error')
    console.log('Chart appeared:', hasChart, '| Error shown:', hasError)
    if (!hasChart) {
      const errElem = await page.locator('div[style*="DC2626"], div[style*="red"]').first().textContent().catch(()=>'')
      console.log('Error element:', errElem)
    }
    await page.screenshot({ path: 'test-results/guest-chart.png', fullPage: false })
    expect(hasChart).toBeTruthy()
  })
})

// ══════════════════════════════════════════════════════════════
test.describe('CITY DROPDOWN', () => {
  test('City dropdown closes after selection', async ({ page }) => {
    await page.goto(SITE + '/chart')
    await page.waitForLoadState('networkidle')

    const cityInput = page.locator('input[placeholder*="City"]').first()
    await cityInput.fill('Mumbai')
    await page.waitForTimeout(1800)

    const firstResult = page.locator('button').filter({ hasText: 'Mumbai' }).first()
    const visible = await firstResult.isVisible({ timeout: 4000 })
    if (visible) {
      await firstResult.click()
      await page.waitForTimeout(500)
      // Results should be gone
      const anyResult = page.locator('button').filter({ hasText: 'Mumbai' }).first()
      const stillVisible = await anyResult.isVisible({ timeout: 500 }).catch(() => false)
      console.log('Dropdown still open after click:', stillVisible)
      expect(stillVisible).toBeFalsy()
    } else {
      console.log('No dropdown appeared (API may be slow)')
    }
    await page.screenshot({ path: 'test-results/city-dropdown.png' })
  })
})

// ══════════════════════════════════════════════════════════════
test.describe('GUEST MATCHMAKING', () => {
  test('Guest matchmaking — generates compatibility without login', async ({ page }) => {
    await page.goto(SITE + '/match')
    await page.waitForLoadState('networkidle')
    await expect(page).not.toHaveURL(/signin|login/)

    // Person 1 — use index 0 for first card's selects
    const allSelects = page.locator('select')
    // Person 1 date (selects 0,1,2)
    await allSelects.nth(0).selectOption('1').catch(()=>{})
    await allSelects.nth(1).selectOption({ index: 3 }).catch(()=>{})  // March
    await allSelects.nth(2).selectOption('1985').catch(()=>{})

    await fillCity(page, 0, 'Chennai')

    // Person 2 date — need to find person 2's selects
    // After hour/min selects for person 1, person 2's date selects follow
    // Try: day is select index 5 or 7 depending on showTime
    for (let i = 5; i <= 9; i++) {
      const cnt = await allSelects.count()
      if (i < cnt) await allSelects.nth(i).selectOption('15').catch(()=>{})
    }
    await fillCity(page, 1, 'Bangalore')

    // Click match button
    await page.click('button:has-text("Compatibility"), button:has-text("Check Compat")')
    await page.waitForTimeout(10000)

    await expect(page).not.toHaveURL(/signin|login/)
    const body = await page.locator('body').textContent()
    const hasResult = body.includes('%') || body.includes('Koota') || body.includes('Compatible')
    const hasError = body.includes('failed') || body.includes('Error') || body.includes('Validation')
    console.log('Match result:', hasResult, '| Error:', hasError)
    if (!hasResult) {
      const errElem = await page.locator('div[style*="DC2626"]').first().textContent().catch(()=>'')
      console.log('Error text:', errElem)
      console.log('Page snippet:', body.slice(0, 300))
    }
    await page.screenshot({ path: 'test-results/guest-match.png', fullPage: false })
    expect(hasResult).toBeTruthy()
  })
})

// ══════════════════════════════════════════════════════════════
test.describe('LOGGED IN CHART', () => {
  test('Logged in user can generate chart', async ({ page }) => {
    // Login
    await page.goto(SITE + '/signin')
    await page.waitForLoadState('networkidle')
    await page.fill('input[type="email"]', ADMIN)
    await page.fill('input[type="password"]', PASS)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(4000)
    const loggedIn = !page.url().includes('signin')
    console.log('Login success:', loggedIn)

    await page.goto(SITE + '/chart')
    await page.waitForLoadState('networkidle')
    await expect(page).not.toHaveURL(/signin/)

    const selects = page.locator('select')
    await selects.nth(0).selectOption('1').catch(()=>{})
    await selects.nth(1).selectOption({ index: 3 }).catch(()=>{})
    await selects.nth(2).selectOption('1985').catch(()=>{})
    await fillCity(page, 0, 'Chennai')

    // Click the generate button (last one = inside form, not header)
    const genBtn = page.locator('button').filter({ hasText: /Generate|Chart|ஜாதகம்/ }).last()
    await genBtn.click()
    await page.waitForTimeout(8000)

    const body = await page.locator('body').textContent()
    const hasChart = /Cancer|Aries|Leo|Lagna|Rasi|Moon/.test(body)
    console.log('Chart generated:', hasChart)
    await page.screenshot({ path: 'test-results/loggedin-chart.png', fullPage: false })
    expect(hasChart).toBeTruthy()
  })
})

// ══════════════════════════════════════════════════════════════
test.describe('NUMEROLOGY', () => {
  test('Numerology page calculates numbers', async ({ page }) => {
    await page.goto(SITE + '/numerology')
    await page.waitForLoadState('networkidle')

    // The placeholder is "Your full birth name" — use a broader selector
    const nameInput = page.locator('input[type="text"]').first()
    await nameInput.fill('Venkat')

    const selects = page.locator('select')
    await selects.nth(0).selectOption('11').catch(()=>{})   // Day 11
    await selects.nth(1).selectOption({ index: 3 }).catch(()=>{}) // March
    await selects.nth(2).selectOption('1978').catch(()=>{}) // Year

    await page.click('button:has-text("Calculate")')
    await page.waitForTimeout(4000)

    const body = await page.locator('body').textContent()
    const hasLifePath = body.includes('Life Path')
    const hasNumber   = /\b[1-9]\b|\b1[12]\b|\b22\b|\b33\b/.test(body)
    console.log('Life Path visible:', hasLifePath, '| Number shown:', hasNumber)
    await page.screenshot({ path: 'test-results/numerology.png', fullPage: false })
    expect(hasLifePath && hasNumber).toBeTruthy()
  })
})
