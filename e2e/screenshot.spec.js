const { test } = require('@playwright/test')
const BASE = 'https://vedichora-frontend-orcin.vercel.app'
const CHART_URL = 'https://enchanting-dedication-production.up.railway.app'

test('result UI screenshot', async ({ page }) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(BASE + '/match', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(2000)

  // First get the API data
  const matchData = await page.evaluate(async (chartUrl) => {
    const r = await fetch(chartUrl + '/api/chart/guest-match', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Person1: { PersonName:'Ganapathy', Year:1998, Month:8, Day:22, Hour:11, Minute:55, Second:0, PlaceName:'Chennai', Latitude:13.0827, Longitude:80.2707, UtcOffsetHours:5.5, AyanamsaType:'Lahiri' },
        Person2: { PersonName:'Shreya', Year:2002, Month:10, Day:17, Hour:14, Minute:10, Second:0, PlaceName:'Chennai', Latitude:13.0827, Longitude:80.2707, UtcOffsetHours:5.5, AyanamsaType:'Lahiri' }
      })
    })
    const j = await r.json()
    return j.data && j.data.data ? j.data.data : (j.data || j)
  }, CHART_URL)

  // Inject into React component by finding the React fiber
  await page.evaluate((data) => {
    // Find all React fiber nodes and look for the one with setResult
    function findReactFiber(el) {
      const key = Object.keys(el).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'))
      return key ? el[key] : null
    }
    
    function findStateNode(fiber, maxDepth = 30) {
      if (!fiber || maxDepth <= 0) return null
      if (fiber.memoizedState) {
        // Walk the state chain
        let state = fiber.memoizedState
        while (state) {
          if (state.queue && state.queue.dispatch) {
            return state.queue.dispatch
          }
          state = state.next
        }
      }
      return findStateNode(fiber.child, maxDepth - 1) || findStateNode(fiber.sibling, maxDepth - 1)
    }
    
    // Alternative: look for the result display element and trigger via button click simulation
    // Set the result directly on window for the app to pick up on next render
    window.__VH_MATCH_RESULT = {
      ...data,
      name1: 'Ganapathy',
      name2: 'Shreya',
      chart1: null,
      chart2: null,
    }
    console.log('Injected match result into window')
  }, matchData)

  // Now find the actual React state setter
  // The page has custom select dropdowns - find them
  const allElements = await page.locator('[class*="select"], select, [role="combobox"], [role="listbox"]').all()
  console.log('Dropdowns found:', allElements.length)

  // Let's look at ALL select-like elements in the page
  const selectInfo = await page.evaluate(() => {
    const allSelects = document.querySelectorAll('select')
    return Array.from(allSelects).map((s, i) => ({
      i, 
      name: s.name,
      value: s.value,
      optCount: s.options.length,
      firstOpts: Array.from(s.options).slice(0,5).map(o => o.value + ':' + o.text)
    }))
  })
  console.log('Selects:', JSON.stringify(selectInfo.slice(0,6)))

  // Try clicking selects by index using page.$$ 
  const selects = await page.$$('select')
  console.log('Native selects:', selects.length)
  
  if (selects.length >= 6) {
    // Try each select
    for (let i = 0; i < selects.length; i++) {
      const sel = selects[i]
      const opts = await sel.$$eval('option', os => os.map(o => o.value))
      console.log(`Select[${i}] options:`, opts.slice(0,5))
    }
    
    // Fill person 1 date
    try {
      await selects[0].select('22')  // day
    } catch(e) { 
      try { await page.$$eval('select', (els, i) => els[0].value = '22') } catch {}
    }
  }

  await page.screenshot({ path: 'screenshots/01_inspect.png' })
  console.log('SS01 inspect taken')

  // Try a different approach: use page.select() with element handles
  const allSel = page.locator('select')
  const count = await allSel.count()
  console.log('select count via locator:', count)

  // Select values for person 1: day, month, year
  if (count >= 3) {
    try {
      // Get first select options to understand order
      const opts0 = await allSel.nth(0).locator('option').allTextContents()
      const opts1 = await allSel.nth(1).locator('option').allTextContents()
      const opts2 = await allSel.nth(2).locator('option').allTextContents()
      console.log('Sel0 opts:', opts0.slice(0,6))
      console.log('Sel1 opts:', opts1.slice(0,6))
      console.log('Sel2 opts:', opts2.slice(0,6))

      // dd: value is number 1-31
      // mm: 1-12
      // yyyy: years
      await allSel.nth(0).selectOption({ label: '22' })
      await allSel.nth(1).selectOption({ label: 'August' })
      await allSel.nth(2).selectOption({ value: '1998' })
      
      await allSel.nth(3).selectOption({ label: '17' })
      await allSel.nth(4).selectOption({ label: 'October' })
      await allSel.nth(5).selectOption({ value: '2002' })
      
      console.log('Dates selected!')
    } catch(e) {
      console.log('Select error:', e.message.slice(0,100))
    }
  }

  await page.screenshot({ path: 'screenshots/02_dates.png' })
  console.log('SS02 dates taken')

  // Fill city inputs
  try {
    const cityInputs = page.locator('input[placeholder*="city"], input[placeholder*="City"], input[placeholder*="Type and select"]')
    const cityCount = await cityInputs.count()
    console.log('City inputs:', cityCount)
    if (cityCount > 0) {
      await cityInputs.first().fill('Chennai')
      await page.waitForTimeout(1500)
      // Click first dropdown option
      const opt = page.locator('[class*="dropdown"] [class*="item"], [class*="suggestion"], [role="option"]').first()
      if (await opt.isVisible({ timeout: 2000 })) {
        await opt.click()
        console.log('City 1 selected from dropdown')
      }
    }
    if (cityCount > 1) {
      await cityInputs.nth(1).fill('Chennai')
      await page.waitForTimeout(1500)
      const opt2 = page.locator('[class*="dropdown"] [class*="item"], [class*="suggestion"], [role="option"]').first()
      if (await opt2.isVisible({ timeout: 2000 })) {
        await opt2.click()
        console.log('City 2 selected from dropdown')
      }
    }
  } catch(e) {
    console.log('City error:', e.message.slice(0,80))
  }

  await page.screenshot({ path: 'screenshots/03_city.png' })
  console.log('SS03 city taken')

  // Click calculate
  const calcBtn = page.locator('button').filter({ hasText: /Check Compatibility/i }).first()
  await calcBtn.click({ timeout: 5000 }).catch(e => console.log('Calc click error:', e.message))
  console.log('Calculate clicked')
  await page.waitForTimeout(6000)

  await page.screenshot({ path: 'screenshots/04_after_calc.png' })
  console.log('SS04 after calc taken')

  await page.evaluate(() => window.scrollTo(0, 500))
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'screenshots/05_result_top.png' })

  await page.evaluate(() => window.scrollTo(0, 1200))
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'screenshots/06_result_mid.png' })

  await page.screenshot({ path: 'screenshots/07_full.png', fullPage: true })
  console.log('All screenshots taken')

  // Log what's visible
  const text = (await page.locator('body').innerText()).slice(0, 1000)
  console.log('BODY:', text.replace(/\n/g, ' '))
})
