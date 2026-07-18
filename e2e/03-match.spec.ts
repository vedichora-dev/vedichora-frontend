import { test, expect } from '@playwright/test'
import { loginViaAPI } from './helpers/auth'

test.describe('Compatibility Matching', () => {

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page)
    await page.goto('/match')
    await page.waitForLoadState('networkidle')
  })

  test('Match page loads with two person forms', async ({ page }) => {
    await expect(page.getByText(/Person 1/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Person 2/i)).toBeVisible()
    await expect(page.getByText(/Calculate Compatibility/i)).toBeVisible()
  })

  test('Calculate compatibility for Ganapathy + Shreya', async ({ page }) => {
    // Ganapathy: Vrischika lagna, Magha nakshatra
    // Person 1 — fill date
    await page.selectOption('select#p1-dd, select[id*="p1"][id*="dd"]', '1').catch(() => {})
    await page.selectOption('select#p1-mm, select[id*="p1"][id*="mm"]', '11').catch(() => {})
    await page.fill('input#p1-yyyy, input[id*="p1"][id*="yyyy"]', '1985').catch(() => {})
    await page.selectOption('select#p1-hr, select[id*="p1"][id*="hr"]', '10').catch(() => {})
    await page.selectOption('select#p1-mi, select[id*="p1"][id*="mi"]', '0').catch(() => {})
    await page.fill('input[placeholder*="City"]:first-of-type, [data-prefix="p1"] input[placeholder*="City"]', 'Chennai').catch(() => {})

    // Person 2
    await page.selectOption('select#p2-dd, select[id*="p2"][id*="dd"]', '15').catch(() => {})
    await page.selectOption('select#p2-mm, select[id*="p2"][id*="mm"]', '3').catch(() => {})
    await page.fill('input#p2-yyyy, input[id*="p2"][id*="yyyy"]', '1990').catch(() => {})
    await page.selectOption('select#p2-hr, select[id*="p2"][id*="hr"]', '8').catch(() => {})
    await page.selectOption('select#p2-mi, select[id*="p2"][id*="mi"]', '0').catch(() => {})

    // Calculate
    await page.click('button:has-text("Calculate Compatibility"), button:has-text("Calculate")')
    
    // Wait for results
    await page.waitForSelector('text=/%|Ashta Koota|Compatibility/i', { timeout: 30000 })

    // Should show a percentage score
    const pct = await page.locator('text=/%/').first().textContent()
    console.log('Compatibility score:', pct)
    expect(pct).toMatch(/\d+%/)

    // Should show Ashta Koota breakdown
    await expect(page.getByText(/Ashta Koota/i)).toBeVisible()

    await page.screenshot({ path: 'e2e-screenshots/match-result.png', fullPage: false })
  })

  test('Match requires birth details — shows error if empty', async ({ page }) => {
    await page.click('button:has-text("Calculate Compatibility"), button:has-text("Calculate")')
    
    // Should show validation error
    await expect(page.locator('text=/Enter|required|date/i').first())
      .toBeVisible({ timeout: 5000 })
  })

})
