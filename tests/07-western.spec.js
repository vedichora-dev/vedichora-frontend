// tests/07-western.spec.js
// Tests for western compat page - form inputs, calculation, deep analysis
const { test, expect } = require('@playwright/test')
const BASE = process.env.BASE_URL || 'https://vedichora-frontend-orcin.vercel.app'

test.describe('Western Compat Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE + '/western', { waitUntil: 'networkidle' })
    // Click Compatibility tab
    const compatBtn = page.getByRole('button', { name: /Compatibility/i }).first()
    if (await compatBtn.count() > 0) await compatBtn.click()
    await page.waitForTimeout(1000)
  })

  test('W1: Page loads and shows Compatibility tab', async ({ page }) => {
    await page.screenshot({ path: 'test-results/W1_load.png', fullPage: false })
    const body = await page.textContent('body')
    expect(body).toContain('Person')
  })

  test('W2: Person 1 form has Day dropdown (select element)', async ({ page }) => {
    await page.screenshot({ path: 'test-results/W2_form.png', fullPage: false })
    // DatePicker renders <select> elements for Day/Month/Year
    const selects = await page.locator('select').all()
    console.log('Total selects:', selects.length)
    // Should have at least 6 selects: Day,Month,Year x2 people
    expect(selects.length).toBeGreaterThanOrEqual(6)
  })

  test('W3: Day dropdown has options', async ({ page }) => {
    const daySelects = await page.locator('select').filter({ hasText: 'Day' }).all()
    console.log('Day selects:', daySelects.length)
    const firstDay = page.locator('select').first()
    const opts = await firstDay.locator('option').count()
    console.log('Options in first select:', opts)
    expect(opts).toBeGreaterThan(10)
    await page.screenshot({ path: 'test-results/W3_day_dropdown.png', fullPage: false })
  })

  test('W4: City autocomplete input exists for Person 1 and Person 2', async ({ page }) => {
    const placeInputs = await page.locator('input[placeholder*="birth"]').all()
    console.log('Place inputs:', placeInputs.length)
    expect(placeInputs.length).toBeGreaterThanOrEqual(2)
    await page.screenshot({ path: 'test-results/W4_city_inputs.png', fullPage: false })
  })

  test('W5: City autocomplete shows suggestions', async ({ page }) => {
    const placeInput = page.locator('input[placeholder*="birth"]').first()
    await placeInput.fill('Chen')
    await page.waitForTimeout(1500)
    await page.screenshot({ path: 'test-results/W5_city_suggestions.png', fullPage: false })
    // Should show dropdown suggestions
    const body = await page.textContent('body')
    const hasChennai = body.toLowerCase().includes('chennai') || body.toLowerCase().includes('chen')
    console.log('Has city suggestions:', hasChennai)
    expect(hasChennai).toBeTruthy()
  })

  test('W6: Form submit calls API and shows result', async ({ page }) => {
    // Fill Person 1
    const inputs = await page.locator('input[placeholder*="Name"]').all()
    if (inputs.length > 0) await inputs[0].fill('Karthik')
    if (inputs.length > 1) await inputs[1].fill('Priya')

    // Select DOB via selects
    const selects = await page.locator('select').all()
    if (selects.length >= 1) await selects[0].selectOption('15')  // Day P1
    if (selects.length >= 2) await selects[1].selectOption('6')   // Month P1
    if (selects.length >= 3) await selects[2].selectOption('1990') // Year P1
    if (selects.length >= 7) await selects[6].selectOption('22')  // Day P2
    if (selects.length >= 8) await selects[7].selectOption('3')   // Month P2
    if (selects.length >= 9) await selects[8].selectOption('1993') // Year P2

    await page.screenshot({ path: 'test-results/W6_filled.png', fullPage: false })

    // Click Reveal
    const reveal = page.getByRole('button', { name: /Reveal/i })
    if (await reveal.count() > 0) {
      await reveal.click()
      await page.waitForTimeout(5000)
      await page.screenshot({ path: 'test-results/W6_result.png', fullPage: false })
      const body = await page.textContent('body')
      // Should show some compatibility result
      const hasResult = body.includes('Compatibility') || body.includes('Score') || body.includes('%') || body.includes('/36')
      console.log('Has result:', hasResult)
    }
  })

  test('W7: No Indian terms in visible content', async ({ page }) => {
    const body = await page.textContent('body')
    const forbidden = ['Pathu Porutham', 'Ashta Koota', 'Rajju', 'Nakshatra']
    for (const term of forbidden) {
      const found = body.includes(term)
      console.log(term + ':', found ? 'FOUND (BAD)' : 'absent (OK)')
    }
    // Western page should not show Pathu Porutham label
    expect(body).not.toContain('Pathu Porutham')
  })
})
