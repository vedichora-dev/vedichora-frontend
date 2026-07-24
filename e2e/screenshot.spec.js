const { test, expect } = require('@playwright/test')

const BASE = 'https://vedichora-frontend-orcin.vercel.app'
const CHART_URL = 'https://enchanting-dedication-production.up.railway.app'

test('matchmaking UI screenshot test', async ({ page }) => {
  // Set viewport to desktop
  await page.setViewportSize({ width: 1280, height: 900 })

  // Navigate to match page
  await page.goto(`${BASE}/match`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  // Screenshot 1: initial page
  await page.screenshot({ path: 'screenshots/01_match_initial.png', fullPage: false })

  // Switch Person 1 to Enter Details
  const enterDetails = page.locator('button').filter({ hasText: 'Enter Details' })
  if (await enterDetails.count() > 0) {
    await enterDetails.first().click()
    await page.waitForTimeout(500)
  }

  // Fill name for person 1
  const nameInput = page.locator('input').first()
  if (await nameInput.count() > 0) {
    await nameInput.fill('Ganapathy')
  }

  // Screenshot 2: form filled
  await page.screenshot({ path: 'screenshots/02_match_form.png', fullPage: false })

  // Use the API to pre-fill and submit — simulate what the frontend does
  // Fill date fields for person 1: day=22, month=8, year=1998
  // Look for select/dropdown elements
  const selects = page.locator('select')
  const selectCount = await selects.count()
  console.log(`Found ${selectCount} selects`)

  // Try clicking the calculate button directly after filling minimal data
  // First fill via API call to ensure we have real data to display
  const result = await page.evaluate(async (chartUrl) => {
    const payload = {
      Person1: {
        PersonName: 'Ganapathy', Year: 1998, Month: 8, Day: 22,
        Hour: 11, Minute: 55, Second: 0,
        PlaceName: 'Chennai, India', Latitude: 13.0827, Longitude: 80.2707,
        UtcOffsetHours: 5.5, AyanamsaType: 'Lahiri'
      },
      Person2: {
        PersonName: 'Shreya', Year: 2002, Month: 10, Day: 17,
        Hour: 14, Minute: 10, Second: 0,
        PlaceName: 'Chennai, India', Latitude: 13.0827, Longitude: 80.2707,
        UtcOffsetHours: 5.5, AyanamsaType: 'Lahiri'
      }
    }
    try {
      const resp = await fetch(`${chartUrl}/api/chart/guest-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await resp.json()
      return { status: resp.status, data: data?.data?.data ?? data?.data ?? data }
    } catch(e) {
      return { error: e.message }
    }
  }, CHART_URL)

  console.log('API result:', JSON.stringify(result).slice(0, 500))

  // Screenshot 3: API test result in console
  await page.screenshot({ path: 'screenshots/03_match_api_tested.png', fullPage: false })

  // Now inject the result into the page by triggering the real UI flow
  // Set window.__testMatchResult for the page to pick up
  await page.evaluate((r) => {
    window.__testMatchResult = r
  }, result)

  // Try clicking the actual Calculate button
  const calcBtn = page.locator('button').filter({ hasText: /Check Compatibility|Calculate/i })
  if (await calcBtn.count() > 0) {
    // Fill date selects first
    const allSelects = page.locator('select')
    const count = await allSelects.count()
    for (let i = 0; i < Math.min(count, 6); i++) {
      const sel = allSelects.nth(i)
      const opts = await sel.locator('option').allTextContents()
      console.log(`Select ${i}: ${opts.slice(0,5)}`)
    }
  }

  await page.screenshot({ path: 'screenshots/04_pre_calc.png', fullPage: false })
})

test('match page API returns correct data', async ({ page }) => {
  await page.goto(`${BASE}/match`, { waitUntil: 'networkidle' })

  // Test the API directly from browser context
  const result = await page.evaluate(async () => {
    const resp = await fetch('https://enchanting-dedication-production.up.railway.app/api/chart/guest-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Person1: { PersonName: 'Ganapathy', Year: 1998, Month: 8, Day: 22, Hour: 11, Minute: 55, Second: 0, PlaceName: 'Chennai', Latitude: 13.08, Longitude: 80.27, UtcOffsetHours: 5.5, AyanamsaType: 'Lahiri' },
        Person2: { PersonName: 'Shreya',    Year: 2002, Month: 10, Day: 17, Hour: 14, Minute: 10, Second: 0, PlaceName: 'Chennai', Latitude: 13.08, Longitude: 80.27, UtcOffsetHours: 5.5, AyanamsaType: 'Lahiri' }
      })
    })
    const json = await resp.json()
    return { status: resp.status, keys: Object.keys(json?.data?.data ?? json?.data ?? json ?? {}), data: json?.data?.data ?? json?.data ?? json }
  })
  
  console.log('API Status:', result.status)
  console.log('API Keys:', result.keys)
  console.log('AshtaKootaScore:', result.data?.AshtaKootaScore)
  console.log('Poruthams count:', result.data?.Poruthams?.length)
  console.log('PathuPoruthamScore:', result.data?.PathuPoruthamScore)
  console.log('IsRecommended:', result.data?.IsRecommended)
  console.log('RajjuWarning:', result.data?.RajjuWarning)
  
  expect(result.status).toBe(200)
  expect(result.data?.AshtaKootaScore).toBeDefined()
  
  await page.screenshot({ path: 'screenshots/05_api_verified.png', fullPage: false })
})
