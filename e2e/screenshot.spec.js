const { test } = require('@playwright/test')
const BASE  = 'https://vedichora-frontend-orcin.vercel.app'
const CHART = 'https://enchanting-dedication-production.up.railway.app'

test('full match page after calculate', async ({ page }) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 1280, height: 900 })

  // Intercept Nominatim so city geocode returns Chennai coords
  await page.route('**/nominatim.openstreetmap.org/**', route =>
    route.fulfill({ status:200, contentType:'application/json',
      body: JSON.stringify([{lat:'13.0827',lon:'80.2707',display_name:'Chennai'}]) })
  )

  // Intercept guest-match and log full response
  let matchResponse = null
  await page.route('**/api/chart/guest-match', async route => {
    const resp = await route.fetch()
    const body = await resp.json()
    matchResponse = body
    console.log('MATCH_RESPONSE:' + JSON.stringify(body).slice(0,1500))
    await route.fulfill({ response: resp })
  })

  await page.goto(BASE + '/match', { waitUntil:'networkidle', timeout:30000 })
  await page.waitForTimeout(2000)

  // Fill dates via native React events
  await page.evaluate(() => {
    function setVal(sel, v) {
      const s = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value').set
      s.call(sel, v)
      sel.dispatchEvent(new Event('change',{bubbles:true}))
    }
    const sels = document.querySelectorAll('select')
    console.log('SELECT_COUNT:' + sels.length)
    if (sels[0]) setVal(sels[0],'22')
    if (sels[1]) setVal(sels[1],'8')
    if (sels[2]) setVal(sels[2],'1998')
    if (sels[6]) setVal(sels[6],'17')
    if (sels[7]) setVal(sels[7],'10')
    if (sels[8]) setVal(sels[8],'2002')
  })
  await page.waitForTimeout(400)

  // Fill names
  await page.evaluate(() => {
    function setInp(el, v) {
      const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set
      s.call(el, v); el.dispatchEvent(new Event('input',{bubbles:true}))
    }
    const inps = document.querySelectorAll('input')
    const names = Array.from(inps).filter(i=>i.placeholder&&(i.placeholder.includes('name')||i.placeholder.includes('Name')))
    if(names[0]) setInp(names[0],'Ganapathy')
    if(names[1]) setInp(names[1],'Shreya')
  })
  await page.waitForTimeout(400)

  // Type city and pick first suggestion for person 1
  const city1 = page.locator('input[placeholder*="city" i], input[placeholder*="Type and select"]').first()
  await city1.fill('Chennai')
  await page.waitForTimeout(1800)
  const sug1 = page.locator('li[class*="suggestion"], ul li, [class*="CityAuto"] li, [role="option"]').first()
  if (await sug1.isVisible({timeout:1500}).catch(()=>false)) {
    await sug1.click(); console.log('CITY1_CLICKED')
  } else { console.log('CITY1_NO_DROPDOWN') }
  await page.waitForTimeout(400)

  // City 2
  const cityInputs = await page.locator('input[placeholder*="city" i], input[placeholder*="Type and select"]').all()
  if (cityInputs.length > 1) {
    await cityInputs[1].fill('Chennai')
    await page.waitForTimeout(1800)
    const sug2 = page.locator('li[class*="suggestion"], ul li, [class*="CityAuto"] li, [role="option"]').first()
    if (await sug2.isVisible({timeout:1500}).catch(()=>false)) {
      await sug2.click(); console.log('CITY2_CLICKED')
    } else { console.log('CITY2_NO_DROPDOWN') }
  }
  await page.waitForTimeout(400)

  // SS before calculate
  await page.screenshot({ path:'screenshots/01_before_calc.png', fullPage:false })

  // Click Calculate
  const btn = page.locator('button').filter({hasText:/Check Compatibility/i}).first()
  await btn.click(); console.log('CALC_CLICKED')
  await page.waitForTimeout(8000) // wait for API + render

  // Full page screenshot
  await page.screenshot({ path:'screenshots/02_after_calc_full.png', fullPage:true })
  console.log('SS02_FULL_DONE')

  // Scroll and capture 3 sections
  for (const [y, name] of [[0,'top'],[800,'mid'],[1600,'result_header'],[2400,'result_tables'],[3200,'result_bottom']]) {
    await page.evaluate(yy => window.scrollTo(0, yy), y)
    await page.waitForTimeout(300)
    await page.screenshot({ path:`screenshots/03_${name}.png`, fullPage:false })
  }
  console.log('ALL_SS_DONE')

  // Log body text around result section
  const bodyText = await page.locator('body').innerText()
  const lines = bodyText.split('\n').map(l=>l.trim()).filter(l=>l.length>3)
  // Find lines after Check Compatibility button
  const idx = lines.findIndex(l=>l.includes('Check Compatibility')||l.includes('27')||l.includes('Ganapathy'))
  console.log('BODY_LINES:' + lines.slice(Math.max(0,idx-2), idx+60).join(' | '))
})
