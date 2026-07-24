const { test, expect } = require('@playwright/test')
const BASE     = 'https://vedichora-frontend-orcin.vercel.app'
const CHART_URL = 'https://enchanting-dedication-production.up.railway.app'
const fs = require('fs')

// Create a guest chart via API, then open the chart page and screenshot each tab
test('Chart tabs — Shadbala, Ashtakavarga, Doshas', async ({ page }) => {
  test.setTimeout(120000)
  fs.mkdirSync('screenshots', { recursive: true })

  // Step 1: Create chart via API
  const chartRes = await fetch(CHART_URL + '/api/chart/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      PersonName: 'Babu', Year: 1959, Month: 3, Day: 1,
      Hour: 14, Minute: 30, Second: 0,
      Latitude: 13.0827, Longitude: 80.2707,
      UtcOffsetHours: 5.5, AyanamsaType: 'Lahiri'
    })
  })
  const chartData = await chartRes.json()
  const horoId = chartData?.data?.horoscopeId || ''
  console.log('HoroId:', horoId)
  expect(horoId).toBeTruthy()

  // Step 2: Open chart page with this horoId
  await page.setViewportSize({ width: 1400, height: 900 })
  await page.goto(BASE + '/chart', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1000)

  // Step 3: Inject the chart data into localStorage so the page loads it
  // The chart page reads from localStorage key 'vh_horoid' or generates fresh
  // Better: just fill the form using JavaScript native events
  
  // Use the form — fill with React native events
  await page.evaluate(({ hid }) => {
    // Set horoId in localStorage so the strip loads it
    localStorage.setItem('vh_horoid', hid)
  }, { hid: horoId })
  
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(2000)
  
  // Fill the form using React's native setter
  await page.evaluate(() => {
    const sels = document.querySelectorAll('select')
    function setNative(el, val) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set
      setter.call(el, val)
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
    if (sels[0]) setNative(sels[0], '1')     // day
    if (sels[1]) setNative(sels[1], '3')     // month
    if (sels[2]) setNative(sels[2], '1959')  // year
    if (sels[3]) setNative(sels[3], '6')     // hour
    if (sels[4]) setNative(sels[4], '0')     // min
    if (sels[5]) setNative(sels[5], 'AM')    // ampm
    console.log('Form filled, selects:', sels.length)
  })

  // Set city via input
  const cityInput = page.locator('input').filter({ hasAttr: 'placeholder' }).last()
  try {
    await cityInput.fill('Chennai, Tamil Nadu, India', { timeout: 3000 })
    await page.waitForTimeout(1500)
    // Click first dropdown item
    const item = page.locator('[style*="absolute"] button, [style*="position: absolute"] li').first()
    if (await item.isVisible({ timeout: 2000 }).catch(() => false)) {
      await item.click({ force: true })
      console.log('City selected from dropdown')
    }
  } catch(e) { console.log('City fill:', e.message.slice(0,80)) }

  await page.screenshot({ path: 'screenshots/tab_00_form.png' })

  // Click Generate
  const genBtn = page.locator('button').filter({ hasText: /Generate Chart|Generate/i }).first()
  if (await genBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await genBtn.click()
    console.log('Generate clicked')
    await page.waitForTimeout(7000)
  }
  
  await page.screenshot({ path: 'screenshots/tab_01_rasi.png' })
  console.log('SS: Rasi chart')

  // Shadbala tab
  const shadBtn = page.locator('button').filter({ hasText: /Shadbala/i }).first()
  if (await shadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await shadBtn.click()
    await page.waitForTimeout(4000)
    await page.screenshot({ path: 'screenshots/tab_02_shadbala.png' })
    const text = await page.locator('body').innerText()
    const hasSthana = text.includes('Sthana') || text.includes('sthaana') || text.includes('187') || text.includes('Bala')
    console.log('Shadbala data visible:', hasSthana)
    console.log('SS: Shadbala')
  }

  // Ashtakavarga tab
  const avBtn = page.locator('button').filter({ hasText: /Ashtakavarga/i }).first()
  if (await avBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await avBtn.click()
    await page.waitForTimeout(5000)
    await page.screenshot({ path: 'screenshots/tab_03_ashtakavarga.png' })
    const text = await page.locator('body').innerText()
    const hasBindu = text.includes('Bindu') || text.includes('Aries') || text.includes('24') || text.includes('SAV')
    console.log('Ashtakavarga data visible:', hasBindu)
    console.log('SS: Ashtakavarga')
  }

  // Doshas tab
  const doshaBtn = page.locator('button').filter({ hasText: /Dosha/i }).first()
  if (await doshaBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await doshaBtn.click()
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'screenshots/tab_04_doshas.png' })
    const text = await page.locator('body').innerText()
    const hasDosha = text.includes('Mangal') || text.includes('Kaal Sarpa') || text.includes('Dosha')
    console.log('Dosha data visible:', hasDosha)
    console.log('SS: Doshas')
  }

  // Dasha tab
  const dashaBtn = page.locator('button').filter({ hasText: /^Dasha$/i }).first()
  if (await dashaBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await dashaBtn.click()
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'screenshots/tab_05_dasha.png' })
    console.log('SS: Dasha')
  }
})
