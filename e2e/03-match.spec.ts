// @ts-nocheck
import { test, expect } from '@playwright/test'
import { ADMIN_EMAIL, ADMIN_PASS } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/signin')
  await page.fill('input[type="email"]', ADMIN_EMAIL)
  await page.fill('input[type="password"]', ADMIN_PASS)
  await page.click('button[type="submit"], button:has-text("Sign in")')
  await page.waitForTimeout(4000)
})

test.describe('MATCH — Compatibility', () => {

  test('Match page renders correctly', async ({ page }) => {
    await page.goto('/match')
    await page.waitForTimeout(1500)
    await page.screenshot({ path: 'test-results/30-match-page.png' })
    
    await expect(page.locator('text=Person 1, text=person 1').first()).toBeVisible()
    await expect(page.locator('text=Person 2, text=person 2').first()).toBeVisible()
    await expect(page.locator('button:has-text("Calculate"), button:has-text("Compatibility")'
      ).first()).toBeVisible()
  })

  test('Match calculation — Ganapathy + Shreya', async ({ page }) => {
    await page.goto('/match')
    await page.waitForTimeout(1500)
    
    // Person 1: Ganapathy — Vrischika lagna, Magha nakshatra
    // DOB example: male, ~1990
    const selects = page.locator('select')
    const count = await selects.count()
    console.log(`Match page selects: ${count}`)
    
    // Fill Person 1
    if (count >= 6) {
      // Day, Month, Year for Person 1
      await selects.nth(0).selectOption('15')   // day
      await selects.nth(1).selectOption({ index: 8 })  // August
      await selects.nth(2).selectOption('1990') // year
      
      // Fill Person 2
      await selects.nth(6).selectOption('20')   // day
      await selects.nth(7).selectOption({ index: 11 }) // November
      await selects.nth(8).selectOption('1992') // year
    }
    
    // Place 1
    const placeFields = page.locator('input[placeholder*="City"], input[placeholder*="city"]')
    await placeFields.nth(0).fill('Chennai')
    await page.waitForTimeout(600)
    await placeFields.nth(1).fill('Coimbatore')
    await page.waitForTimeout(600)
    
    await page.screenshot({ path: 'test-results/31-match-filled.png' })
    
    // Calculate
    await page.click('button:has-text("Calculate"), button:has-text("Compatibility")')
    await page.waitForTimeout(12000) // Two chart calcs + match
    
    await page.screenshot({ path: 'test-results/32-match-result.png' })
    
    const text = await page.locator('body').textContent()
    const hasScore = text?.includes('Ashta') || text?.includes('Koota') || 
                     text?.includes('%') || text?.includes('/36')
    console.log('Match has score data:', hasScore)
    expect(hasScore).toBeTruthy()
  })
})
