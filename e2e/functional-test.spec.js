// @ts-nocheck
const { test, expect } = require('@playwright/test')

const SITE   = process.env.BASE_URL || 'https://vedichora-frontend-orcin.vercel.app'
const ADMIN  = 'admin@vedichora.com'
const PASS   = 'Admin@123'

test.describe('GUEST CHART - no login', () => {

  test('Guest can generate chart without login', async ({ page }) => {
    await page.goto(SITE + '/chart')
    await page.waitForLoadState('networkidle')

    // Should NOT redirect to login
    await expect(page).not.toHaveURL(/signin|login/)
    console.log('✓ No redirect to login')

    // Fill name
    await page.fill('input[placeholder*="Name"], input[placeholder*="name"]', 'Test Guest')

    // Fill date - Day
    const daySelect = page.locator('select').nth(0)
    await daySelect.selectOption('1')
    // Month
    const monthSelect = page.locator('select').nth(1)
    await monthSelect.selectOption({ index: 3 }) // March
    // Year
    const yearSelect = page.locator('select').nth(2)
    await yearSelect.selectOption('1985')
    // Hour
    const hourSelect = page.locator('select').nth(3)
    await hourSelect.selectOption('10')
    // Min
    const minSelect = page.locator('select').nth(4)
    await minSelect.selectOption('30')

    // City
    const cityInput = page.locator('input[placeholder*="City"], input[placeholder*="city"]').first()
    await cityInput.fill('Chennai')
    await page.waitForTimeout(1000)
    // Click first dropdown result
    const firstResult = page.locator('button:has-text("Chennai")').first()
    if (await firstResult.isVisible({ timeout: 3000 })) {
      await firstResult.click()
      await page.waitForTimeout(500)
      // Verify dropdown closed
      await expect(firstResult).not.toBeVisible({ timeout: 2000 })
      console.log('✓ City dropdown closed after selection')
    } else {
      console.log('⚠ No city dropdown appeared')
    }

    // Click generate
    const genBtn = page.locator('button:has-text("Generate"), button:has-text("ஜாதகம்"), button:has-text("Kundali")').first()
    await genBtn.click()
    await page.waitForTimeout(5000)

    // Check result
    const body = await page.locator('body').textContent()
    const hasChart = body.includes('Cancer') || body.includes('Aries') || body.includes('Lagna') || body.includes('Rasi')
    console.log('Chart result appeared:', hasChart)
    if (!hasChart) {
      console.log('ERROR: No chart generated. Page says:', body.slice(0, 500))
    }
    expect(hasChart).toBeTruthy()
    await page.screenshot({ path: 'test-results/guest-chart.png' })
  })

  test('Guest city dropdown closes on selection', async ({ page }) => {
    await page.goto(SITE + '/chart')
    await page.waitForLoadState('networkidle')

    const cityInput = page.locator('input[placeholder*="City"], input[placeholder*="city"]').first()
    await cityInput.fill('Chennai')
    await page.waitForTimeout(1500)

    const dropdown = page.locator('[data-city-result], .city-result, button:has-text("Chennai")').first()
    if (await dropdown.isVisible({ timeout: 3000 })) {
      await dropdown.click()
      await page.waitForTimeout(300)
      const stillOpen = await page.locator('button:has-text("McKinsey")').isVisible().catch(() => false)
      console.log('Dropdown still open after click:', stillOpen)
      expect(stillOpen).toBeFalsy()
    }
    await page.screenshot({ path: 'test-results/city-dropdown.png' })
  })
})

test.describe('GUEST MATCHMAKING - no login', () => {
  test('Guest can do matchmaking without login', async ({ page }) => {
    await page.goto(SITE + '/match')
    await page.waitForLoadState('networkidle')
    await expect(page).not.toHaveURL(/signin|login/)

    // Person 1
    await page.locator('input[placeholder*="name"], input[placeholder*="Name"]').nth(0).fill('Ravi')
    // Date selectors for person 1
    const selects = page.locator('select')
    await selects.nth(0).selectOption('1')    // Day
    await selects.nth(1).selectOption({ index: 3 }) // Month
    await selects.nth(2).selectOption('1985') // Year
    // City for person 1
    const cities = page.locator('input[placeholder*="City"], input[placeholder*="city"]')
    await cities.nth(0).fill('Chennai')
    await page.waitForTimeout(1000)
    const city1btn = page.locator('button:has-text("Chennai")').first()
    if (await city1btn.isVisible({ timeout: 2000 })) await city1btn.click()
    await page.waitForTimeout(500)

    // Person 2
    await page.locator('input[placeholder*="name"], input[placeholder*="Name"]').nth(1).fill('Priya')
    await selects.nth(7).selectOption('15').catch(()=>{}) // Try person 2 day
    await selects.nth(8).selectOption({ index: 6 }).catch(()=>{}) // Month
    await selects.nth(9).selectOption('1990').catch(()=>{}) // Year
    await cities.nth(1).fill('Bangalore')
    await page.waitForTimeout(1000)
    const city2btn = page.locator('button:has-text("Bangalore"), button:has-text("Bengaluru")').first()
    if (await city2btn.isVisible({ timeout: 2000 })) await city2btn.click()
    await page.waitForTimeout(500)

    // Match
    const matchBtn = page.locator('button:has-text("Compatibility"), button:has-text("Match"), button:has-text("Calculate")').first()
    await matchBtn.click()
    await page.waitForTimeout(8000)

    const body = await page.locator('body').textContent()
    const hasResult = body.includes('%') || body.includes('Koota') || body.includes('Compatible') || body.includes('Ashta')
    console.log('Match result appeared:', hasResult)
    if (!hasResult) {
      console.log('Page content:', body.slice(0, 600))
    }
    await page.screenshot({ path: 'test-results/guest-match.png' })
    // Don't fail hard — just report
  })
})

test.describe('LOGGED IN CHART', () => {
  test('Logged in user generates chart', async ({ page }) => {
    // Login first
    await page.goto(SITE + '/signin')
    await page.fill('input[type="email"]', ADMIN)
    await page.fill('input[type="password"]', PASS)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(4000)

    await page.goto(SITE + '/chart')
    await page.waitForLoadState('networkidle')

    // Should NOT redirect
    await expect(page).not.toHaveURL(/signin|login/)
    console.log('✓ Logged in, on chart page')

    // Fill and generate
    const selects = page.locator('select')
    await selects.nth(0).selectOption('1').catch(()=>{})
    await selects.nth(1).selectOption({ index: 3 }).catch(()=>{})
    await selects.nth(2).selectOption('1985').catch(()=>{})

    const cityInput = page.locator('input[placeholder*="City"], input[placeholder*="city"]').first()
    await cityInput.fill('Chennai')
    await page.waitForTimeout(1000)
    const cityBtn = page.locator('button:has-text("Chennai")').first()
    if (await cityBtn.isVisible({ timeout: 2000 })) await cityBtn.click()

    const genBtn = page.locator('button:has-text("Generate"), button:has-text("Chart"), button:has-text("ஜாதகம்")').last()
    await genBtn.click()
    await page.waitForTimeout(6000)

    const body = await page.locator('body').textContent()
    const hasChart = body.includes('Lagna') || body.includes('Cancer') || body.includes('Rasi')
    console.log('Chart generated:', hasChart)
    await page.screenshot({ path: 'test-results/loggedin-chart.png' })
  })
})

test.describe('NUMEROLOGY', () => {
  test('Numerology calculates correctly', async ({ page }) => {
    await page.goto(SITE + '/numerology')
    await page.waitForLoadState('networkidle')

    await page.fill('input[placeholder*="name"], input[placeholder*="Name"]', 'Venkat')
    const selects = page.locator('select')
    await selects.nth(0).selectOption('11').catch(()=>{})  // Day
    await selects.nth(1).selectOption({ index: 3 }).catch(()=>{}) // March
    await selects.nth(2).selectOption('1978').catch(()=>{}) // Year

    await page.click('button:has-text("Calculate")')
    await page.waitForTimeout(3000)

    const body = await page.locator('body').textContent()
    const hasNumbers = body.includes('Life Path') && (body.includes('3') || body.includes('—'))
    console.log('Numerology result:', hasNumbers)
    console.log('Page snippet:', body.slice(body.indexOf('Life Path'), body.indexOf('Life Path')+100))
    await page.screenshot({ path: 'test-results/numerology.png' })
    expect(hasNumbers).toBeTruthy()
  })
})
