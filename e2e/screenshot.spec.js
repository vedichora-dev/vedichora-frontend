const { test } = require('@playwright/test')
const BASE = 'https://vedichora-frontend-orcin.vercel.app'
const CHART_URL = 'https://enchanting-dedication-production.up.railway.app'

test('match result UI', async ({ page }) => {
  test.setTimeout(90000)
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(BASE + '/match', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(2000)

  // Step 1: Fill dates via React native events
  await page.evaluate(() => {
    function setVal(el, v) {
      const s = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set
      s.call(el, v)
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
    const sels = document.querySelectorAll('select')
    setVal(sels[0], '22')   // P1 day
    setVal(sels[1], '8')    // P1 month (August)
    setVal(sels[2], '1998') // P1 year
    setVal(sels[6], '17')   // P2 day
    setVal(sels[7], '10')   // P2 month (October)
    setVal(sels[8], '2002') // P2 year
  })
  await page.waitForTimeout(300)

  // Step 2: Fill names
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input')
    function setInput(el, v) {
      const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      s.call(el, v)
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
    // First input = male name, 4th input = female name (0=male, 1=time?, 2=city1, 3=female, ...)
    const nameInputs = Array.from(inputs).filter(i => i.placeholder && (i.placeholder.includes('name') || i.placeholder.includes('Name')))
    if (nameInputs[0]) setInput(nameInputs[0], 'Ganapathy')
    if (nameInputs[1]) setInput(nameInputs[1], 'Shreya')
  })
  await page.waitForTimeout(300)

  // Step 3: Set lat/lng directly by injecting into window and bypassing city autocomplete
  // We intercept the fetch call to Nominatim and return Chennai coords
  await page.route('**/nominatim.openstreetmap.org/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ lat: '13.0827', lon: '80.2707', display_name: 'Chennai, Tamil Nadu, India' }])
    })
  })

  // Type in city fields to trigger geocode
  const cityInputs = await page.locator('input[placeholder*="city" i], input[placeholder*="Type and select"]').all()
  if (cityInputs.length > 0) {
    await cityInputs[0].fill('Chennai')
    await page.waitForTimeout(1500)
    // Click first suggestion in dropdown
    const drop1 = page.locator('ul li, [class*="suggestion"], [class*="CityAuto"] li').first()
    if (await drop1.isVisible({ timeout: 2000 }).catch(() => false)) {
      await drop1.click()
      console.log('City 1 clicked')
    } else {
      // Force set lat/lng via React state
      await page.evaluate(() => {
        window.__lat1 = 13.0827; window.__lng1 = 80.2707
      })
      console.log('City 1 forced via window')
    }
    await page.waitForTimeout(500)
  }
  if (cityInputs.length > 1) {
    await cityInputs[1].fill('Chennai')
    await page.waitForTimeout(1500)
    const drop2 = page.locator('ul li, [class*="suggestion"], [class*="CityAuto"] li').first()
    if (await drop2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await drop2.click()
      console.log('City 2 clicked')
    }
    await page.waitForTimeout(500)
  }

  await page.screenshot({ path: 'screenshots/01_form_ready.png' })
  console.log('SS01 form ready')

  // Step 4: Intercept the guest-match API call and inject real response
  let apiCalled = false
  await page.route('**/api/chart/guest-match', async route => {
    apiCalled = true
    // Let the real request through
    const resp = await route.fetch()
    const body = await resp.json()
    console.log('Intercepted guest-match, status:', resp.status())
    const d = body?.data?.data ?? body?.data ?? body
    console.log('Score:', d?.ashtaKootaScore, '/', d?.ashtaKootaTotal)
    console.log('Poruthams:', d?.poruthams?.length)
    await route.fulfill({ response: resp })
  })

  // Step 5: Click Calculate
  const calcBtn = page.locator('button:has-text("Check Compatibility"), button:has-text("Calculate")').first()
  const isVisible = await calcBtn.isVisible({ timeout: 3000 }).catch(() => false)
  console.log('Calc button visible:', isVisible)
  if (isVisible) {
    await calcBtn.click()
    console.log('Clicked Calculate')
  } else {
    // Try by text
    await page.getByText('Check Compatibility').first().click()
    console.log('Clicked via text')
  }

  // Wait for API response and render
  await page.waitForTimeout(7000)
  console.log('API was called:', apiCalled)

  await page.screenshot({ path: 'screenshots/02_result_top.png' })
  console.log('SS02 result top')

  // Scroll down to see result card
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }))
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'screenshots/03_result_card.png' })
  console.log('SS03 result card')

  await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'instant' }))
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'screenshots/04_result_tables.png' })
  console.log('SS04 result tables')

  await page.evaluate(() => window.scrollTo({ top: 1600, behavior: 'instant' }))
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'screenshots/05_result_porutham.png' })
  console.log('SS05 porutham table')

  // Full page
  await page.screenshot({ path: 'screenshots/06_full.png', fullPage: true })
  console.log('SS06 full page')

  const text = await page.locator('body').innerText()
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2)
  console.log('PAGE TEXT SAMPLE:', lines.slice(0, 80).join(' | '))
})
