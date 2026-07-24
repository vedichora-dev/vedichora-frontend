const { test, expect } = require('@playwright/test')
const BASE = 'https://vedichora-frontend-orcin.vercel.app'
const CHART_URL = 'https://enchanting-dedication-production.up.railway.app'

test.describe('Match page screenshots', () => {
  test('01 initial page', async ({ page }) => {
    await page.setViewportSize({ width:1280, height:900 })
    await page.goto(BASE + '/match', { waitUntil:'networkidle', timeout:30000 })
    await page.waitForTimeout(2000)
    await page.screenshot({ path:'screenshots/01_initial.png', fullPage:false })
    console.log('SS01 taken')
  })

  test('02 API verification', async ({ page }) => {
    await page.goto(BASE + '/match', { waitUntil:'domcontentloaded', timeout:30000 })
    const result = await page.evaluate(async ([chartUrl]) => {
      try {
        const r = await fetch(chartUrl + '/api/chart/guest-match', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            Person1: { PersonName:'Ganapathy', Year:1998, Month:8, Day:22, Hour:11, Minute:55, Second:0, PlaceName:'Chennai', Latitude:13.0827, Longitude:80.2707, UtcOffsetHours:5.5, AyanamsaType:'Lahiri' },
            Person2: { PersonName:'Shreya', Year:2002, Month:10, Day:17, Hour:14, Minute:10, Second:0, PlaceName:'Chennai', Latitude:13.0827, Longitude:80.2707, UtcOffsetHours:5.5, AyanamsaType:'Lahiri' }
          })
        })
        const j = await r.json()
        const d = j && j.data && j.data.data ? j.data.data : (j && j.data ? j.data : j)
        return { status:r.status, score:d.ashtaKootaScore, total:d.ashtaKootaTotal, poruthams:(d.poruthams||[]).length, pathuScore:d.pathuPoruthamScore, isRec:d.isRecommended, rajju:d.rajjuWarning||'none', summary:(d.summary||'').slice(0,100) }
      } catch(e) { return {error:e.message} }
    }, [CHART_URL])
    console.log('API: status=' + result.status + ' score=' + result.score + '/' + result.total + ' poruthams=' + result.poruthams + ' pathu=' + result.pathuScore + ' rec=' + result.isRec)
    console.log('API: rajju=' + result.rajju)
    console.log('API: summary=' + result.summary)
    expect(result.status).toBe(200)
    expect(result.score).not.toBeUndefined()
    expect(result.poruthams).toBeGreaterThan(0)
    await page.screenshot({ path:'screenshots/02_api_verified.png', fullPage:false })
    console.log('SS02 taken')
  })

  test('03 full page', async ({ page }) => {
    await page.setViewportSize({ width:1280, height:900 })
    await page.goto(BASE + '/match', { waitUntil:'networkidle', timeout:30000 })
    await page.waitForTimeout(2000)
    await page.screenshot({ path:'screenshots/03_full_page.png', fullPage:true })
    const btns = await page.locator('button').allTextContents()
    console.log('Buttons: ' + btns.join(' | '))
    const h = await page.locator('h1,h2,h3').allTextContents()
    console.log('Headings: ' + h.join(' | '))
    console.log('SS03 full page taken')
  })
})
