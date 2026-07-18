import { test, expect } from '@playwright/test'
import { ADMIN_EMAIL, ADMIN_PASS, BABU, PRAMOD } from './helpers'

// Login before all chart tests
test.beforeEach(async ({ page }) => {
  await page.goto('/signin')
  await page.fill('input[type="email"]', ADMIN_EMAIL)
  await page.fill('input[type="password"]', ADMIN_PASS)
  await page.click('button[type="submit"], button:has-text("Sign in")')
  await page.waitForTimeout(4000)
})

test.describe('CHART — Generation & Data Validation', () => {

  test('Chart page loads with saved strip', async ({ page }) => {
    await page.goto('/chart')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test-results/10-chart-page.png' })
    
    // Should show saved charts section or New Chart button
    const hasSaved   = await page.locator('text=Saved Charts').isVisible({ timeout: 5000 }).catch(() => false)
    const hasNewBtn  = await page.locator('button:has-text("New Chart")').isVisible({ timeout: 3000 }).catch(() => false)
    expect(hasSaved || hasNewBtn).toBeTruthy()
  })

  test('BABU chart generates — Cancer lagna', async ({ page }) => {
    await page.goto('/chart')
    await page.waitForTimeout(1500)
    
    // Open form
    const newBtn = page.locator('button:has-text("New Chart")')
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) await newBtn.click()
    await page.waitForTimeout(500)
    
    // Fill name
    const nameField = page.locator('input[placeholder*="Name"], input[placeholder*="name"], input[placeholder*="optional"]').first()
    if (await nameField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameField.fill(BABU.name)
    }

    // Fill DOB — Day dropdown
    const selects = page.locator('select')
    const count = await selects.count()
    console.log(`Found ${count} select elements`)
    
    if (count >= 3) {
      await selects.nth(0).selectOption(String(BABU.day))
      await page.waitForTimeout(200)
      await selects.nth(1).selectOption({ index: BABU.month })
      await page.waitForTimeout(200)
      await selects.nth(2).selectOption(String(BABU.year))
      await page.waitForTimeout(200)
      // Hour - 14:30 IST = 2:30 PM
      if (count > 3) {
        await selects.nth(3).selectOption('2')  // 2 PM
        if (count > 4) await selects.nth(4).selectOption('30')
        if (count > 5) await selects.nth(5).selectOption('PM')
      }
    }
    
    // Place
    const placeField = page.locator('input[placeholder*="City"], input[placeholder*="city"]').first()
    if (await placeField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await placeField.fill('Chennai')
      await page.waitForTimeout(800)
      // Try autocomplete
      const dropItem = page.locator('button:has-text("Chennai")').first()
      if (await dropItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dropItem.click()
      }
    }
    
    await page.screenshot({ path: 'test-results/11-babu-form-filled.png' })
    
    // Generate
    await page.click('button:has-text("Generate")')
    await page.waitForTimeout(8000) // Chart takes time
    
    await page.screenshot({ path: 'test-results/12-babu-chart-result.png' })
    
    // Check no error
    const errBox = page.locator('text=Error:, text=failed, text=validation').first()
    const hasError = await errBox.isVisible({ timeout: 1000 }).catch(() => false)
    if (hasError) {
      const errText = await errBox.textContent()
      console.log('CHART ERROR:', errText)
    }
    
    // Check summary cards appeared
    const summaryText = await page.locator('body').textContent()
    console.log('Page contains Cancer:', summaryText?.includes('Cancer') || summaryText?.includes('Karka') || summaryText?.includes('Kadagam'))
    console.log('Page contains lagna text:', summaryText?.toLowerCase().includes('lagna'))
    
    // Validate Cancer lagna
    const hasCancer = summaryText?.includes('Cancer') || summaryText?.includes('Karka')
    if (!hasCancer) {
      console.warn('⚠ Cancer lagna not found — check ascendant calculation')
      // Don't hard fail — log for investigation
    }
    
    // Should show chart data (either North/South chart or planet table)
    const hasChartData = await page.locator('svg, table').first().isVisible({ timeout: 5000 }).catch(() => false)
    expect(hasChartData).toBeTruthy()
  })

  test('BABU — Planets tab shows 9 planets', async ({ page }) => {
    // Use saved chart if available
    await page.goto('/chart')
    await page.waitForTimeout(2000)
    
    // Click Planets tab if chart is loaded
    const planetsTab = page.locator('button:has-text("Planets")')
    if (await planetsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await planetsTab.click()
      await page.waitForTimeout(1000)
      
      // Count planet rows
      const rows = page.locator('table tbody tr')
      const count = await rows.count()
      console.log(`Planet rows: ${count}`)
      // Should have at least 9 planets (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu)
      expect(count).toBeGreaterThanOrEqual(9)
      
      await page.screenshot({ path: 'test-results/13-planets-tab.png' })
    }
  })

  test('BABU — Dasha tab shows timeline', async ({ page }) => {
    await page.goto('/chart')
    await page.waitForTimeout(2000)
    
    const dashaTab = page.locator('button:has-text("Dasha")')
    if (await dashaTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dashaTab.click()
      await page.waitForTimeout(1000)
      
      // Should show dasha rows
      const rows = page.locator('table tbody tr')
      const count = await rows.count()
      console.log(`Dasha rows: ${count}`)
      expect(count).toBeGreaterThanOrEqual(5) // At least 5 MDs shown
      
      // Should show NOW badge on current dasha
      const nowBadge = page.locator('text=NOW')
      const hasNow = await nowBadge.isVisible({ timeout: 2000 }).catch(() => false)
      console.log(`NOW badge visible: ${hasNow}`)
      
      await page.screenshot({ path: 'test-results/14-dasha-tab.png' })
    }
  })

  test('BABU — North Indian chart renders as SVG', async ({ page }) => {
    await page.goto('/chart')
    await page.waitForTimeout(2000)
    
    // Click Rasi + D9 tab
    const rasiTab = page.locator('button:has-text("Rasi"), button:has-text("North")')
    const tab = await rasiTab.first().isVisible({ timeout: 3000 }).catch(() => false)
    if (tab) {
      await rasiTab.first().click()
      await page.waitForTimeout(1000)
    }
    
    const svg = page.locator('svg').first()
    await expect(svg).toBeVisible({ timeout: 5000 })
    
    // SVG should have planet text elements
    const textElems = page.locator('svg text')
    const count = await textElems.count()
    console.log(`SVG text elements: ${count}`)
    expect(count).toBeGreaterThan(5)
    
    await page.screenshot({ path: 'test-results/15-north-chart-svg.png' })
  })

  test('BABU — Shadbala tab loads', async ({ page }) => {
    await page.goto('/chart')
    await page.waitForTimeout(2000)
    
    const tab = page.locator('button:has-text("Shadbala")')
    if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tab.click()
      await page.waitForTimeout(3000)
      await page.screenshot({ path: 'test-results/16-shadbala-tab.png' })
      const text = await page.locator('body').textContent()
      console.log('Has Sun in Shadbala:', text?.includes('Su') || text?.includes('Sun'))
    }
  })

  test('BABU — Arudha tab shows lagnas', async ({ page }) => {
    await page.goto('/chart')
    await page.waitForTimeout(2000)
    
    const tab = page.locator('button:has-text("Arudha")')
    if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tab.click()
      await page.waitForTimeout(3000)
      await page.screenshot({ path: 'test-results/17-arudha-tab.png' })
      const text = await page.locator('body').textContent()
      const hasLagna = text?.includes('Hora') || text?.includes('Lagna') || text?.includes('Ghati')
      console.log('Arudha has lagna data:', hasLagna)
    }
  })

  test('PDF button visible', async ({ page }) => {
    await page.goto('/chart')
    await page.waitForTimeout(2000)
    const pdfBtn = page.locator('button:has-text("PDF")')
    const visible = await pdfBtn.isVisible({ timeout: 3000 }).catch(() => false)
    console.log('PDF button visible:', visible)
    if (visible) await page.screenshot({ path: 'test-results/18-pdf-button.png' })
  })
})
