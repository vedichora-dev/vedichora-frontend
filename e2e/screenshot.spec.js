const { test, expect } = require('@playwright/test')

const BASE = 'https://vedichora-frontend-orcin.vercel.app'
const CHART_URL = 'https://enchanting-dedication-production.up.railway.app'

test.describe('Match page screenshots', () => {
  test('screenshot initial page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(`${BASE}/match`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'screenshots/01_initial.png', fullPage: false })
    console.log('Screenshot 1 taken')
  })

  test('API returns correct data', async ({ page }) => {
    await page.goto(`${BASE}/match`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    
    const result = await page.evaluate(async (chartUrl) => {
      try {
        const resp = await fetch(`${chartUrl}/api/chart/guest-match`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Person1: { PersonName: 'Ganapathy', Year: 1998, Month: 8, Day: 22, Hour: 11, Minute: 55, Second: 0, PlaceName: 'Chennai', Latitude: 13.0827, Longitude: 80.2707, UtcOffsetHours: 5.5, AyanamsaType: 'Lahiri' },
            Person2: { PersonName: 'Shreya',    Year: 2002, Month: 10, Day: 17, Hour: 14, Minute: 10, Second: 0, PlaceName: 'Chennai', Latitude: 13.0827, Longitude: 80.2707, UtcOffsetHours: 5.5, AyanamsaType: 'Lahiri' }
          })
        })
        const json = await resp.json()
        const d = json?.data?.data ?? json?.data ?? json
        return { status: resp.status, AshtaKootaScore: d?.AshtaKootaScore, AshtaKootaTotal: d?.AshtaKootaTotal, PathuPoruthamScore: d?.PathuPoruthamScore, PortuthamCount: d?.Poruthams?.length, IsRecommended: d?.IsRecommended, Summary: d?.Summary?.slice(0,100), RajjuWarning: d?.RajjuWarning, KootaCount: d?.KootaDetails?.length }
      } catch(e) { return { error: e.message } }
    }, CHART_URL)
    
    console.log('=== API RESULT ===')
    console.log(JSON.stringify(result, null, 2))
    
    expect(result.status).toBe(200)
    expect(result.AshtaKootaScore).toBeDefined()
    expect(result.PortuthamCount).toBeGreaterThan(0)
  })

  test('screenshot after calculation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(`${BASE}/match`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)

    // Inject a mock result directly to trigger the styled UI
    await page.evaluate(async (chartUrl) => {
      const resp = await fetch(`${chartUrl}/api/chart/guest-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Person1: { PersonName: 'Ganapathy', Year: 1998, Month: 8, Day: 22, Hour: 11, Minute: 55, Second: 0, PlaceName: 'Chennai', Latitude: 13.0827, Longitude: 80.2707, UtcOffsetHours: 5.5, AyanamsaType: 'Lahiri' },
          Person2: { PersonName: 'Shreya',    Year: 2002, Month: 10, Day: 17, Hour: 14, Minute: 10, Second: 0, PlaceName: 'Chennai', Latitude: 13.0827, Longitude: 80.2707, UtcOffsetHours: 5.5, AyanamsaType: 'Lahiri' }
        })
      })
      window.__apiData = await resp.json()
    }, CHART_URL)

    // Click the calculate button to trigger real flow with injected data
    // Find date pickers and fill them
    const allInputs = await page.locator('input').all()
    console.log(`Inputs found: ${allInputs.length}`)
    for (const inp of allInputs) {
      const placeholder = await inp.getAttribute('placeholder') || ''
      console.log(`  Input: ${placeholder}`)
    }
    
    // Screenshot before calculate
    await page.screenshot({ path: 'screenshots/02_before_calc.png', fullPage: false })

    // Try to find and use date picker components
    // Look for the DatePicker inputs
    const dateInputs = page.locator('input[type="number"], input[placeholder*="day"], input[placeholder*="Day"]')
    if (await dateInputs.count() > 0) {
      await dateInputs.first().fill('22')
    }
    
    await page.screenshot({ path: 'screenshots/03_form_interact.png', fullPage: false })
    console.log('Form interaction screenshots taken')
  })

  test('full page scroll screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(`${BASE}/match`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)
    
    // Full page screenshot to see everything
    await page.screenshot({ path: 'screenshots/04_full_page.png', fullPage: true })
    console.log('Full page screenshot taken')
    
    // Check page title
    const title = await page.title()
    console.log('Page title:', title)
    
    // Check for key elements
    const headings = await page.locator('h1, h2').allTextContents()
    console.log('Headings:', headings)
    
    // Check current URL
    console.log('URL:', page.url())
  })
})
