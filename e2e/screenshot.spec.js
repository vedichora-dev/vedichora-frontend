const { test, expect } = require('@playwright/test')
const BASE = 'https://vedichora-frontend-orcin.vercel.app'
const CHART_URL = 'https://enchanting-dedication-production.up.railway.app'

test('match page full result UI', async ({ page }) => {
  await page.setViewportSize({ width:1280, height:900 })
  await page.goto(BASE + '/match', { waitUntil:'networkidle', timeout:30000 })
  await page.waitForTimeout(2000)

  // Screenshot 1: initial form
  await page.screenshot({ path:'screenshots/01_form.png' })
  console.log('SS01: form')

  // Call the API and inject result via React state
  const matchData = await page.evaluate(async (chartUrl) => {
    const r = await fetch(chartUrl + '/api/chart/guest-match', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        Person1:{ PersonName:'Ganapathy', Year:1998, Month:8, Day:22, Hour:11, Minute:55, Second:0, PlaceName:'Chennai', Latitude:13.0827, Longitude:80.2707, UtcOffsetHours:5.5, AyanamsaType:'Lahiri' },
        Person2:{ PersonName:'Shreya',    Year:2002, Month:10, Day:17, Hour:14, Minute:10, Second:0, PlaceName:'Chennai', Latitude:13.0827, Longitude:80.2707, UtcOffsetHours:5.5, AyanamsaType:'Lahiri' }
      })
    })
    const j = await r.json()
    return j.data && j.data.data ? j.data.data : (j.data || j)
  }, CHART_URL)

  console.log('API score:', matchData.ashtaKootaScore, '/', matchData.ashtaKootaTotal)
  console.log('Poruthams:', matchData.poruthams && matchData.poruthams.length)

  // Inject result into React component via custom event
  await page.evaluate((data) => {
    // Try to find React fiber and set state
    // Alternative: dispatch a custom event that the component listens for
    window.__matchResult = data
    window.__testMode = true
    // Dispatch event
    window.dispatchEvent(new CustomEvent('__vedichora_test_result', { detail: data }))
  }, matchData)

  // Also try filling the form and using select dropdowns to trigger real flow
  // The form has select elements for day/month/year
  // Try to find them by their options content
  const selects = await page.locator('select').all()
  console.log('Select count:', selects.length)
  
  if (selects.length >= 6) {
    // Person 1: day=22, month=8(Aug), year=1998
    // Typical order: dd, mm, yyyy for each person
    try {
      await selects[0].selectOption('22')   // P1 day
      await selects[1].selectOption('8')    // P1 month
      await selects[2].selectOption('1998') // P1 year
      await selects[3].selectOption('17')   // P2 day
      await selects[4].selectOption('10')   // P2 month
      await selects[5].selectOption('2002') // P2 year
      console.log('Selects filled')
    } catch(e) {
      console.log('Select fill error:', e.message)
    }
  }

  // Also fill name inputs
  const inputs = await page.locator('input').all()
  for (let i = 0; i < inputs.length; i++) {
    const ph = await inputs[i].getAttribute('placeholder') || ''
    if (ph.toLowerCase().includes('name') || ph === '') {
      try {
        if (i === 0) await inputs[i].fill('Ganapathy')
        if (i === 1) await inputs[i].fill('')  // skip
      } catch {}
    }
  }

  await page.screenshot({ path:'screenshots/02_form_filled.png' })
  console.log('SS02: form filled')

  // Click Calculate button
  const calcBtn = page.locator('button').filter({ hasText: /Check Compatibility|Calculate/i }).first()
  if (await calcBtn.isVisible()) {
    await calcBtn.click()
    console.log('Calculate clicked')
    await page.waitForTimeout(5000) // wait for API call + render
  }

  // Screenshot after calculate
  await page.screenshot({ path:'screenshots/03_after_calc.png' })
  console.log('SS03: after calculate')

  // Scroll down to see results
  await page.evaluate(() => window.scrollTo(0, 600))
  await page.waitForTimeout(500)
  await page.screenshot({ path:'screenshots/04_results_scroll.png' })
  console.log('SS04: results scroll')

  // Full page
  await page.screenshot({ path:'screenshots/05_full_page.png', fullPage: true })
  console.log('SS05: full page')

  // Check what's visible
  const bodyText = await page.locator('body').innerText()
  const hasResult = bodyText.includes('Ashta') || bodyText.includes('Koota') || bodyText.includes('Porutham') || bodyText.includes('VedicHora')
  console.log('Has result content:', hasResult)
  console.log('Body sample:', bodyText.slice(0, 500))
})
