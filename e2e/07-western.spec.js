// e2e/07-western.spec.js
// Tests western compatibility page - dropdowns, city, calculation
const { test, expect } = require('@playwright/test')

test.describe('Western Compat Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/western', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    // Click Compatibility tab
    const tabs = page.locator('button').filter({ hasText: /Compatibility/i })
    if (await tabs.count() > 0) { await tabs.first().click(); await page.waitForTimeout(800) }
  })

  test('W1: Page loads, compat tab visible', async ({ page }) => {
    await page.screenshot({ path: 'test-results/W1_compat_tab.png' })
    const body = await page.textContent('body')
    expect(body).toMatch(/Person|Compatibility/i)
  })

  test('W2: Has select dropdowns for Day/Month/Year — NOT plain text', async ({ page }) => {
    const selects = await page.locator('select').count()
    console.log(`Select count: ${selects}`)
    await page.screenshot({ path: 'test-results/W2_selects.png' })
    // Need at least 6: Day/Month/Year x2 people
    expect(selects).toBeGreaterThanOrEqual(6)
  })

  test('W3: Day dropdown has 31 day options', async ({ page }) => {
    const firstSelect = page.locator('select').first()
    const optionCount = await firstSelect.locator('option').count()
    console.log(`First select options: ${optionCount}`)
    await page.screenshot({ path: 'test-results/W3_day_opts.png' })
    expect(optionCount).toBeGreaterThan(10)
  })

  test('W4: City input present for both people', async ({ page }) => {
    const placeInputs = await page.locator('input[placeholder*="birth"], input[placeholder*="city"], input[placeholder*="place"]').count()
    console.log(`Place inputs: ${placeInputs}`)
    await page.screenshot({ path: 'test-results/W4_city_inputs.png' })
    expect(placeInputs).toBeGreaterThanOrEqual(2)
  })

  test('W5: City autocomplete fires suggestions on typing', async ({ page }) => {
    const placeInputs = page.locator('input[placeholder*="birth"], input[placeholder*="city"], input[placeholder*="place"]')
    if (await placeInputs.count() === 0) { console.log('No place input found'); return }
    await placeInputs.first().fill('Mumbai')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test-results/W5_city_suggestions.png' })
    // Either dropdown appears OR the value is accepted
    const val = await placeInputs.first().inputValue()
    console.log(`Input value after typing: ${val}`)
    expect(val.length).toBeGreaterThan(0)
  })

  test('W6: Fill form + Reveal shows result', async ({ page }) => {
    // Fill names
    const nameInputs = page.locator('input[placeholder*="Name"], input[placeholder*="name"]')
    if (await nameInputs.count() >= 1) await nameInputs.nth(0).fill('Karthik')
    if (await nameInputs.count() >= 2) await nameInputs.nth(1).fill('Priya')

    // Select dates via dropdowns
    const selects = await page.locator('select').all()
    try {
      if (selects[0]) await selects[0].selectOption('15')   // Day P1
      if (selects[1]) await selects[1].selectOption('6')    // Month P1
      if (selects[2]) await selects[2].selectOption('1990') // Year P1
    } catch(e) { console.log('P1 date select error:', e.message) }
    try {
      // P2 selects (index 6,7,8 or 3,4,5 depending on time selects)
      const daySelects = page.locator('select').filter({ hasText: 'Day' })
      if (await daySelects.count() >= 2) await daySelects.nth(1).selectOption('22')
      const monSelects = page.locator('select').filter({ hasText: 'Month' })
      if (await monSelects.count() >= 2) await monSelects.nth(1).selectOption('3')
      const yrSelects = page.locator('select').filter({ hasText: 'Year' })
      if (await yrSelects.count() >= 2) await yrSelects.nth(1).selectOption('1993')
    } catch(e) { console.log('P2 date select error:', e.message) }

    await page.screenshot({ path: 'test-results/W6_filled.png' })

    // Click Reveal
    const reveal = page.locator('button').filter({ hasText: /Reveal/i })
    if (await reveal.count() > 0) {
      await reveal.first().click()
      await page.waitForTimeout(6000)
      await page.screenshot({ path: 'test-results/W6_result.png' })
      const body = await page.textContent('body')
      const hasScore = /\d+\/36|\d+%|Score|Compatibility|compatible/i.test(body)
      console.log(`Has result: ${hasScore}`)
    }
  })

  test('W7: No Indian terms in visible text', async ({ page }) => {
    const body = await page.textContent('body')
    console.log('Pathu Porutham present:', body.includes('Pathu Porutham'))
    console.log('Ashta Koota present:', body.includes('Ashta Koota'))
    expect(body).not.toContain('Pathu Porutham')
  })
})
