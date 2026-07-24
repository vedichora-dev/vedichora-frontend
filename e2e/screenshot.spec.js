const { test } = require('@playwright/test')
const BASE = 'https://vedichora-frontend-orcin.vercel.app'
const CHART_URL = 'https://enchanting-dedication-production.up.railway.app'

test('full result UI', async ({ page }) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 1280, height: 900 })
  
  // Intercept Nominatim geocode to return Chennai coords immediately
  await page.route('**nominatim**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ lat: '13.0827', lon: '80.2707', display_name: 'Chennai' }])
    })
  })

  // Also intercept any geocode calls
  await page.route('**/search*', route => {
    if (route.request().url().includes('nominatim')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json', 
        body: JSON.stringify([{ lat: '13.0827', lon: '80.2707', display_name: 'Chennai, Tamil Nadu, India' }])
      })
    } else {
      route.continue()
    }
  })

  await page.goto(BASE + '/match', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(2000)

  // Set date selects via React native events
  await page.evaluate(() => {
    function setNative(el, value) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set
      setter.call(el, value)
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
    const sels = document.querySelectorAll('select')
    // P1: day=22, month=8(Aug), year=1998
    setNative(sels[0], '22')
    setNative(sels[1], '8')
    setNative(sels[2], '1998')
    // P2: day=17, month=10(Oct), year=2002
    setNative(sels[6], '17')
    setNative(sels[7], '10')
    setNative(sels[8], '2002')
  })
  await page.waitForTimeout(300)

  // Fill city fields
  const cityInputs = page.locator('input[placeholder*="city" i], input[placeholder*="Type and select"]')
  const cityCount = await cityInputs.count()
  console.log('City inputs:', cityCount)

  for (let i = 0; i < cityCount; i++) {
    await cityInputs.nth(i).fill('Chennai')
    await page.waitForTimeout(800)
    // Click the first suggestion that appears
    const suggestions = page.locator('[class*="suggestion"], [class*="city"], li, [role="option"]')
    if (await suggestions.count() > 0 && await suggestions.first().isVisible({ timeout: 1000 }).catch(() => false)) {
      await suggestions.first().click()
      console.log('City', i+1, 'suggestion clicked')
    } else {
      // No suggestion - set lat/lng directly in the React state via window
      await page.evaluate((idx) => {
        // Find all inputs and set data attributes
        const inputs = document.querySelectorAll('input')
        let cityInputCount = 0
        for (const inp of inputs) {
          const ph = inp.placeholder || ''
          if (ph.includes('city') || ph.includes('City') || ph.includes('Type and select')) {
            if (cityInputCount === idx) {
              // Simulate having selected a city by triggering the blur
              inp.dispatchEvent(new Event('blur', { bubbles: true }))
            }
            cityInputCount++
          }
        }
      }, i)
      console.log('City', i+1, 'set via blur fallback')
    }
    await page.waitForTimeout(300)
  }

  // Set lat/lng directly in window state so geocode is not needed
  await page.evaluate(() => {
    // Override the geocode function if accessible
    window.__lat1 = 13.0827; window.__lng1 = 80.2707
    window.__lat2 = 13.0827; window.__lng2 = 80.2707
    // Store in sessionStorage for the page to use
    sessionStorage.setItem('__test_geo', JSON.stringify({
      lat1: 13.0827, lng1: 80.2707, lat2: 13.0827, lng2: 80.2707
    }))
  })

  await page.screenshot({ path: 'screenshots/01_form_ready.png' })
  console.log('SS01: form ready')

  // Click Calculate
  const calcBtn = page.locator('button').filter({ hasText: /Check Compatibility/i }).first()
  const btnVisible = await calcBtn.isVisible({ timeout: 3000 }).catch(() => false)
  console.log('Calc button visible:', btnVisible)
  
  if (btnVisible) {
    await calcBtn.click()
    console.log('Clicked calculate')
    // Wait for API call to complete and result to render
    await page.waitForTimeout(8000)
  }

  await page.screenshot({ path: 'screenshots/02_after_click.png' })
  console.log('SS02: after click')

  const bodyText = await page.locator('body').innerText()
  console.log('Has crimson:', (await page.locator('[style*="3D0808"]').count()) > 0)
  console.log('Has result:', bodyText.includes('Koota') || bodyText.includes('Porutham') || bodyText.includes('VedicHora') || bodyText.includes('Ashta'))
  console.log('Error visible:', bodyText.includes('failed') || bodyText.includes('error'))
  
  // Log first 800 chars of page text
  console.log('BODY:', bodyText.replace(/\n/g,' ').slice(0, 800))

  // Scroll to results area
  await page.evaluate(() => window.scrollBy(0, 600))
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'screenshots/03_scrolled.png' })
  console.log('SS03: scrolled')

  // Full page
  await page.screenshot({ path: 'screenshots/04_full.png', fullPage: true })
  console.log('SS04: full page done')
})
