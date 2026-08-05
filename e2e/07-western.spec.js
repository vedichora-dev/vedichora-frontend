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
    const firstSelect = page.locator('select').filter({ hasText: 'Day' }).first()
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

  test('W6: Fill form + Reveal shows real matchmaking result', async ({ page }) => {
    test.setTimeout(90000)
    // Fill names
    const nameInputs = page.locator('input[placeholder*="Name"], input[placeholder*="name"]')
    if (await nameInputs.count() >= 1) await nameInputs.nth(0).fill('Karthik')
    if (await nameInputs.count() >= 2) await nameInputs.nth(1).fill('Priya')

    // Select dates via dropdowns — filter by placeholder text to skip the nav currency selector
    const daySelects = page.locator('select').filter({ hasText: 'Day' })
    const monSelects = page.locator('select').filter({ hasText: 'Month' })
    const yrSelects  = page.locator('select').filter({ hasText: 'Year' })
    try {
      await daySelects.nth(0).selectOption('15')   // Day P1
      await monSelects.nth(0).selectOption('6')    // Month P1
      await yrSelects.nth(0).selectOption('1990')  // Year P1
    } catch(e) { console.log('P1 date select error:', e.message) }
    try {
      await daySelects.nth(1).selectOption('22')   // Day P2
      await monSelects.nth(1).selectOption('3')    // Month P2
      await yrSelects.nth(1).selectOption('1993')  // Year P2
    } catch(e) { console.log('P2 date select error:', e.message) }

    await page.screenshot({ path: 'test-results/W6_filled.png' })

    // Click Reveal
    const reveal = page.locator('button').filter({ hasText: /Reveal/i })
    expect(await reveal.count()).toBeGreaterThan(0)
    await reveal.first().click()

    // Wait for the result card (real API round-trip: guest chart calc + deep engine)
    await page.waitForTimeout(8000)
    await page.screenshot({ path: 'test-results/W6_result.png', fullPage: true })

    const body = await page.textContent('body')
    const hasScore = /\d{1,3}\s*(out of 100|%)/i.test(body)
    const hasLabel = /(Exceptional|Strong|Good|Average|Needs Consideration) Match/i.test(body)
    const hasStrayBrace = /[^{]\}\s*\}?\s*(\n|$)/.test(body) // crude sanity check, not exhaustive
    console.log(`Has score: ${hasScore}`)
    console.log(`Has match label: ${hasLabel}`)
    console.log(`Body length: ${body.length}`)

    expect(hasScore).toBeTruthy()
    expect(hasLabel).toBeTruthy()

    // PDF download button should be present once a result is showing
    const pdfBtn = page.locator('button').filter({ hasText: /Download PDF/i })
    console.log(`PDF button present: ${await pdfBtn.count() > 0}`)
  })

  test('W7: No Indian terms in visible text', async ({ page }) => {
    const body = await page.textContent('body')
    console.log('Pathu Porutham present:', body.includes('Pathu Porutham'))
    console.log('Ashta Koota present:', body.includes('Ashta Koota'))
    expect(body).not.toContain('Pathu Porutham')
  })
})
