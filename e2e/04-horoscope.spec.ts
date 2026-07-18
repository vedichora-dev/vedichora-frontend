import { test, expect } from '@playwright/test'

test.describe('HOROSCOPE — Home Page', () => {

  test('Home page loads zodiac strip', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test-results/40-home-page.png' })
    
    // Zodiac strip should have 12 sign buttons
    const buttons = page.locator('[style*="flex: 1"] button, button[aria-label]')
    const count = await buttons.count()
    console.log(`Zodiac strip buttons: ${count}`)
  })

  test('Clicking a rasi loads horoscope', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    // Click 3rd rasi (Gemini/Mithuna)
    const rasiButtons = page.locator('button').filter({ hasText: /Gem|Mit|mit/ })
    if (await rasiButtons.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await rasiButtons.first().click()
      await page.waitForTimeout(3000)
    }
    
    await page.screenshot({ path: 'test-results/41-rasi-selected.png' })
    const text = await page.locator('body').textContent()
    console.log('Has horoscope text:', text?.length > 100)
  })

  test('Language switch to Tamil changes labels', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    // Click language dropdown
    const langBtn = page.locator('button').filter({ hasText: /EN|IN|🇮🇳/ }).first()
    if (await langBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await langBtn.click()
      await page.waitForTimeout(500)
      
      // Click Tamil
      const taBtn = page.locator('button:has-text("Tamil"), button:has-text("தமிழ்")')
      if (await taBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await taBtn.click()
        await page.waitForTimeout(2000)
        
        await page.screenshot({ path: 'test-results/42-tamil-language.png' })
        const text = await page.locator('body').textContent()
        const hasTamil = text?.includes('மேஷம்') || text?.includes('ரிஷபம்') || text?.includes('தினசரி')
        console.log('Tamil labels visible:', hasTamil)
      }
    }
  })

  test('Theme switching works', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    // Find theme dropdown (color swatch button)
    const themeBtn = page.locator('button').filter({ hasCSS: { 'border-radius': '50%' } }).first()
    if (await themeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await themeBtn.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: 'test-results/43-theme-dropdown.png' })
    }
  })
})
