const { test } = require('@playwright/test')
const BASE  = 'https://vedichora-frontend-orcin.vercel.app'

test('PDF report renders correctly', async ({ page, context }) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 1280, height: 900 })

  // Intercept Nominatim
  await page.route('**/nominatim.openstreetmap.org/**', route =>
    route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify([{lat:'13.0827',lon:'80.2707',display_name:'Chennai'}])})
  )

  await page.goto(BASE + '/match', { waitUntil:'networkidle', timeout:30000 })
  await page.waitForTimeout(2000)

  // Fill dates
  await page.evaluate(() => {
    function setVal(sel, v) {
      const s = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value').set
      s.call(sel, v); sel.dispatchEvent(new Event('change',{bubbles:true}))
    }
    const sels = document.querySelectorAll('select')
    if(sels[0]) setVal(sels[0],'22')
    if(sels[1]) setVal(sels[1],'8')
    if(sels[2]) setVal(sels[2],'1998')
    if(sels[6]) setVal(sels[6],'17')
    if(sels[7]) setVal(sels[7],'10')
    if(sels[8]) setVal(sels[8],'2002')
  })

  // Fill names
  await page.evaluate(() => {
    const inps = Array.from(document.querySelectorAll('input')).filter(i=>i.placeholder&&i.placeholder.includes('name'))
    function setInp(el,v) {
      const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set
      s.call(el,v); el.dispatchEvent(new Event('input',{bubbles:true}))
    }
    if(inps[0]) setInp(inps[0],'Ganapathy')
    if(inps[1]) setInp(inps[1],'Shreya')
  })

  // Click Calculate
  await page.locator('button').filter({hasText:/Check Compatibility/i}).first().click()
  await page.waitForTimeout(8000)

  await page.screenshot({ path:'screenshots/01_match_result.png', fullPage:true })
  console.log('SS01 match result taken')

  // Now click the English PDF button and capture the new page
  const [reportPage] = await Promise.all([
    context.waitForEvent('page', {timeout:10000}).catch(()=>null),
    page.locator('button').filter({hasText:'English'}).last().click().catch(()=>{})
  ])

  if (reportPage) {
    await reportPage.waitForLoadState('load', {timeout:15000}).catch(()=>{})
    await reportPage.waitForTimeout(2000)
    await reportPage.screenshot({ path:'screenshots/02_pdf_report_p1.png', fullPage:false })
    await reportPage.evaluate(() => window.scrollTo(0, 900))
    await reportPage.waitForTimeout(500)
    await reportPage.screenshot({ path:'screenshots/03_pdf_report_p2.png', fullPage:false })
    await reportPage.evaluate(() => window.scrollTo(0, 1800))
    await reportPage.waitForTimeout(500)
    await reportPage.screenshot({ path:'screenshots/04_pdf_report_p3.png', fullPage:false })
    await reportPage.screenshot({ path:'screenshots/05_pdf_report_full.png', fullPage:true })

    const text = await reportPage.locator('body').innerText()
    const lines = text.split('\n').map(l=>l.trim()).filter(l=>l.length>2)
    console.log('PDF_TEXT:' + lines.slice(0,80).join(' | '))
    console.log('PDF_SS_DONE')
  } else {
    console.log('NO_POPUP_OPENED')
    // Try clicking the button differently
    const btns = await page.locator('button').allTextContents()
    console.log('BUTTONS:' + btns.join(' | '))
  }
})
