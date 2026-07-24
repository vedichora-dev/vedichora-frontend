const { test } = require('@playwright/test')
const BASE = 'https://vedichora-frontend-orcin.vercel.app'
const CHART_URL = 'https://enchanting-dedication-production.up.railway.app'

async function setSelect(page, index, value) {
  return page.evaluate(({index, value}) => {
    const selects = document.querySelectorAll('select')
    const sel = selects[index]
    if (!sel) return false
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set
    nativeInputValueSetter.call(sel, value)
    sel.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  }, {index, value})
}

test('result UI screenshot', async ({ page }) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(BASE + '/match', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(2000)

  // Use React's native event system to set all select values
  await page.evaluate(() => {
    function setReactSelect(select, value) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set
      nativeInputValueSetter.call(select, value)
      select.dispatchEvent(new Event('change', { bubbles: true }))
    }
    const sels = document.querySelectorAll('select')
    // Person 1: sel[0]=day, sel[1]=month, sel[2]=year, sel[3]=hour, sel[4]=minute, sel[5]=AMPM
    // Person 2: sel[6]=day, sel[7]=month, sel[8]=year, sel[9]=hour, sel[10]=minute, sel[11]=AMPM
    setReactSelect(sels[0], '22')   // day 22
    setReactSelect(sels[1], '8')    // August
    setReactSelect(sels[2], '1998') // year 1998
    setReactSelect(sels[6], '17')   // day 17
    setReactSelect(sels[7], '10')   // October
    setReactSelect(sels[8], '2002') // year 2002
    console.log('Dates set via React events')
  })
  await page.waitForTimeout(500)

  // Fill city for person 1
  const cityInp1 = page.locator('input[placeholder*="city" i], input[placeholder*="Type and select"]').first()
  await cityInp1.fill('Chennai')
  await page.waitForTimeout(1500)
  // Try clicking the first suggestion
  const suggestion = page.locator('li, [class*="suggestion"], [class*="option"], [class*="item"]').first()
  if (await suggestion.isVisible({ timeout: 2000 }).catch(() => false)) {
    await suggestion.click()
    console.log('City 1 dropdown clicked')
  } else {
    // Simulate selecting directly
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input')
      for (const inp of inputs) {
        if (inp.placeholder && (inp.placeholder.includes('city') || inp.placeholder.includes('City') || inp.placeholder.includes('Type'))) {
          inp.dispatchEvent(new Event('blur', { bubbles: true }))
          break
        }
      }
    })
    console.log('City 1 - no suggestion visible')
  }

  await page.screenshot({ path: 'screenshots/01_form_filled.png' })
  console.log('SS01 taken')

  // Click Calculate
  const calcBtn = page.locator('button').filter({ hasText: /Check Compatibility/i }).first()
  await calcBtn.click()
  console.log('Calculate clicked')
  await page.waitForTimeout(6000) // wait for API

  await page.screenshot({ path: 'screenshots/02_after_calc.png' })
  console.log('SS02 after calc taken')

  // Scroll to see results
  await page.evaluate(() => window.scrollTo(0, 600))
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'screenshots/03_results_visible.png' })
  console.log('SS03 results visible')

  // Full page
  await page.screenshot({ path: 'screenshots/04_full_page.png', fullPage: true })
  console.log('SS04 full page taken')

  const bodyText = await page.locator('body').innerText()
  const relevant = bodyText.split('\n').filter(l => l.trim() && !l.includes('  ')).slice(0,50).join(' | ')
  console.log('BODY:', relevant.slice(0, 600))
})
