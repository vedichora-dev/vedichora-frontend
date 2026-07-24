const { test } = require('@playwright/test')
const BASE = 'https://vedichora-frontend-orcin.vercel.app'

test('result screenshot', async ({ page }) => {
  test.setTimeout(90000)
  await page.setViewportSize({ width: 1280, height: 900 })

  await page.route('**nominatim**', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify([{ lat: '13.0827', lon: '80.2707', display_name: 'Chennai' }])
  }))

  await page.goto(BASE + '/match', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1500)

  // Set dates via React native events
  await page.evaluate(() => {
    function set(el, val) {
      const s = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set
      s.call(el, val)
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
    const sels = document.querySelectorAll('select')
    set(sels[0], '22'); set(sels[1], '8'); set(sels[2], '1998')
    set(sels[6], '17'); set(sels[7], '10'); set(sels[8], '2002')
  })

  // Type city and click suggestion
  const c1 = page.locator('input[placeholder*="Type and select"]').first()
  await c1.fill('Chennai')
  await page.waitForTimeout(900)
  const sug1 = page.locator('li, [class*="suggestion"], [class*="option"]').first()
  await sug1.click({ timeout: 3000 }).catch(() => {})

  const c2 = page.locator('input[placeholder*="Type and select"]').nth(1)
  await c2.fill('Chennai')
  await page.waitForTimeout(900)
  const sug2 = page.locator('li, [class*="suggestion"], [class*="option"]').first()
  await sug2.click({ timeout: 3000 }).catch(() => {})

  // Click calculate
  await page.locator('button').filter({ hasText: /Check Compatibility/i }).first().click()
  console.log('Clicked')
  await page.waitForTimeout(7000)

  // Screenshot at 3 scroll positions
  await page.screenshot({ path: 'screenshots/r1_top.png' })
  
  await page.evaluate(() => window.scrollTo(0, 400))
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'screenshots/r2_mid.png' })
  
  await page.evaluate(() => window.scrollTo(0, 900))
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'screenshots/r3_low.png' })

  await page.evaluate(() => window.scrollTo(0, 1400))
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'screenshots/r4_bottom.png' })

  // Check what rendered
  const pageText = await page.locator('body').innerText()
  console.log('Has OM:', pageText.includes('ॐ'))
  console.log('Has VedicHora header:', pageText.includes('VedicHora') && pageText.includes('Ashta'))
  console.log('Has Porutham:', pageText.includes('Porutham'))
  console.log('Has Koota:', pageText.includes('Koota') || pageText.includes('Varna') || pageText.includes('Nadi'))
  // Check background color of result card
  const bgColor = await page.evaluate(() => {
    const els = document.querySelectorAll('*')
    for (const el of els) {
      const bg = window.getComputedStyle(el).backgroundColor
      if (bg === 'rgb(61, 8, 8)') return 'CRIMSON FOUND: ' + el.tagName + ' ' + el.className.slice(0,50)
      if (bg === 'rgb(250, 246, 240)') return 'PARCHMENT FOUND'
    }
    return 'no crimson/parchment found'
  })
  console.log('Style check:', bgColor)
  console.log('PAGE TEXT SAMPLE:', pageText.slice(0, 1200).replace(/\n/g,' '))
})
