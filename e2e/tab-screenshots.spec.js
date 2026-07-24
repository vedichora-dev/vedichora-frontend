const { test, expect } = require('@playwright/test')
const BASE      = 'https://vedichora-frontend-orcin.vercel.app'
const CHART_URL = 'https://enchanting-dedication-production.up.railway.app'
const fs = require('fs')

test('Chart tabs — Shadbala, Ashtakavarga, Doshas', async ({ page }) => {
  test.setTimeout(180000)
  fs.mkdirSync('screenshots', { recursive: true })

  // Pre-fetch chart from API
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
  const chartJson = await chartRes.json()
  const horoId = chartJson?.data?.horoscopeId || ''
  console.log('HoroId:', horoId)
  expect(horoId).toBeTruthy()

  // Pre-fetch shadbala to verify API works from CI
  const shadRes = await fetch(CHART_URL + '/api/strength/' + horoId + '/shadbala')
  const shadJson = await shadRes.json()
  const shadPlanets = shadJson?.data?.planets || []
  console.log('API shadbala planets:', shadPlanets.length, shadPlanets[0]?.planet, 'total:', shadPlanets[0]?.total)

  // Pre-fetch ashtakavarga
  const avRes = await fetch(CHART_URL + '/api/strength/' + horoId + '/ashtakavarga')
  const avJson = await avRes.json()
  const savCount = avJson?.data?.sav?.length || 0
  console.log('API ashtakavarga SAV rows:', savCount)

  await page.setViewportSize({ width: 1400, height: 900 })
  await page.goto(BASE + '/chart', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1000)

  // Fill the form using React native events and generate
  await page.evaluate(() => {
    const sels = document.querySelectorAll('select')
    function setNative(el, val) {
      if (!el) return
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set
      setter.call(el, val)
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
    setNative(sels[0], '1')     // day
    setNative(sels[1], '3')     // month  
    setNative(sels[2], '1959')  // year
    setNative(sels[3], '2')     // hour (14 = 2pm)
    setNative(sels[4], '30')    // min
    setNative(sels[5], 'PM')    // ampm
    console.log('Selects set:', sels.length)
  })

  // Set city by filling input and clicking first dropdown result
  const inputs = await page.locator('input').all()
  let cityDone = false
  for (let i = inputs.length - 1; i >= 0; i--) {
    const ph = await inputs[i].getAttribute('placeholder') || ''
    if (ph.match(/city|place|type|birth/i)) {
      await inputs[i].fill('Chennai')
      await page.waitForTimeout(2000)
      const drop = page.locator('button').filter({ hasText: /Chennai/i }).first()
      if (await drop.isVisible({ timeout: 2000 }).catch(() => false)) {
        await drop.click({ force: true })
        cityDone = true
        console.log('City selected')
      }
      break
    }
  }
  if (!cityDone) {
    // Force lat/lng via evaluate
    await page.evaluate(() => {
      // Find CityAutocomplete and trigger selection programmatically  
      const inputs = document.querySelectorAll('input')
      for (const inp of inputs) {
        if (inp.placeholder && inp.placeholder.toLowerCase().includes('city')) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
          nativeInputValueSetter.call(inp, 'Chennai, India')
          inp.dispatchEvent(new Event('input', { bubbles: true }))
          inp.dispatchEvent(new Event('change', { bubbles: true }))
        }
      }
    })
    await page.waitForTimeout(1000)
    console.log('City forced via input event')
  }
  
  await page.screenshot({ path: 'screenshots/tab_00_form.png' })

  // Click Generate
  const genBtn = page.locator('button').filter({ hasText: /Generate/i }).first()
  const genVisible = await genBtn.isVisible({ timeout: 3000 }).catch(() => false)
  console.log('Generate button visible:', genVisible)
  if (genVisible) {
    await genBtn.click()
    await page.waitForTimeout(8000)
    console.log('Chart generated')
  }

  await page.screenshot({ path: 'screenshots/tab_01_rasi.png' })

  // Check if chart loaded
  const pageText = await page.locator('body').innerText()
  const chartLoaded = pageText.includes('Aries') || pageText.includes('Cancer') || pageText.includes('Lagna')
  console.log('Chart loaded:', chartLoaded)

  // Shadbala tab
  const shadBtn = page.locator('button').filter({ hasText: /Shadbala/i }).first()
  if (await shadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await shadBtn.click()
    await page.waitForTimeout(6000)
    await page.screenshot({ path: 'screenshots/tab_02_shadbala.png' })
    const text = await page.locator('body').innerText()
    const hasSthana = text.includes('Sthana') || text.includes('187') || text.includes('Total Bala') || text.includes('468')
    console.log('Shadbala data visible:', hasSthana)
    console.log('Shadbala text sample:', text.split('\n').filter(l => l.includes('Sun') || l.includes('Sthana') || l.includes('Planet')).slice(0,5).join(' | '))
  }

  // Ashtakavarga tab
  const avBtn = page.locator('button').filter({ hasText: /Ashtakavarga/i }).first()
  if (await avBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await avBtn.click()
    await page.waitForTimeout(6000)
    await page.screenshot({ path: 'screenshots/tab_03_ashtakavarga.png' })
    const text = await page.locator('body').innerText()
    const hasBindu = text.includes('Aries') || text.includes('Bindu') || text.includes('SAV') || text.includes('24')
    console.log('Ashtakavarga data visible:', hasBindu)
  }

  // Doshas tab
  const doshaBtn = page.locator('button').filter({ hasText: /Dosha/i }).first()
  if (await doshaBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await doshaBtn.click()
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'screenshots/tab_04_doshas.png' })
    const text = await page.locator('body').innerText()
    const hasDosha = text.includes('Mangal') || text.includes('Kaal Sarpa')
    console.log('Dosha data visible:', hasDosha)
  }
})
