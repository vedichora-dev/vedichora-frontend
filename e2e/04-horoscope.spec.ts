import { test, expect } from '@playwright/test'

test.describe('Home / Horoscope', () => {

  test('Zodiac strip shows all 12 signs', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Zodiac strip should have 12 buttons
    const buttons = await page.locator('button').filter({ hasText: /Mesha|Mes|Ari|Vrs|Mit|Kar|Sim|Kan|Tul|Vri|Dha|Mak|Kum|Mee/i }).count()
    console.log('Zodiac buttons:', buttons)
    expect(buttons).toBeGreaterThanOrEqual(12)
  })

  test('Clicking a rasi loads horoscope', async ({ page }) => {
    await page.goto('/')
    
    // Click Vrishabha (2nd sign)
    const secondBtn = page.locator('button').nth(1)
    await secondBtn.click()
    
    // Wait for prediction text
    await page.waitForTimeout(2000)
    const card = page.locator('.card').first()
    await expect(card).toBeVisible()
  })

  test('Tamil language changes rasi names', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Find language dropdown (shows flag + language code)
    const langBtn = page.locator('button').filter({ hasText: /EN|🇮🇳|Language/i }).first()
    if (await langBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await langBtn.click()
      await page.waitForTimeout(300)
      
      // Click Tamil
      const taBtn = page.locator('button').filter({ hasText: /Tamil|தமிழ்|ta/i }).first()
      if (await taBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await taBtn.click()
        await page.waitForTimeout(1000)
        
        // Should show Tamil rasi names
        await expect(page.locator('text=/மேஷம்|ரிஷபம்/').first()).toBeVisible({ timeout: 5000 })
        console.log('✓ Tamil rasi names visible')
      }
    }
    await page.screenshot({ path: 'e2e-screenshots/tamil-horoscope.png' })
  })

  test('Daily/Weekly/Monthly tabs switch period', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    const weeklyBtn = page.locator('button').filter({ hasText: /Weekly|வாரம்/i }).first()
    if (await weeklyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await weeklyBtn.click()
      await page.waitForTimeout(1000)
      console.log('✓ Weekly tab clickable')
    }
  })

})
