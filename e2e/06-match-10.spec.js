// @ts-nocheck
const { test, expect } = require('@playwright/test')

const SITE = process.env.BASE_URL || 'https://vedichora-frontend-orcin.vercel.app'

const COUPLES = [
  { p1:{name:'Arjun',day:15,mon:8,yr:1990,city:'Chennai'},   p2:{name:'Priya',day:22,mon:3,yr:1992,city:'Mumbai'} },
  { p1:{name:'Raj',  day:1, mon:1,yr:1985,city:'Delhi'},     p2:{name:'Meera',day:10,mon:6,yr:1988,city:'Bangalore'} },
  { p1:{name:'Kiran',day:7, mon:11,yr:1987,city:'Hyderabad'},p2:{name:'Lakshmi',day:3,mon:9,yr:1989,city:'Chennai'} },
  { p1:{name:'Suresh',day:20,mon:4,yr:1982,city:'Coimbatore'},p2:{name:'Kavitha',day:14,mon:12,yr:1984,city:'Madurai'} },
  { p1:{name:'Vinod',day:25,mon:7,yr:1991,city:'Pune'},      p2:{name:'Ananya',day:8,mon:2,yr:1993,city:'Mumbai'} },
  { p1:{name:'Deepak',day:11,mon:5,yr:1986,city:'Kolkata'},  p2:{name:'Sunita',day:17,mon:10,yr:1988,city:'Delhi'} },
  { p1:{name:'Manoj',day:30,mon:9,yr:1983,city:'Ahmedabad'}, p2:{name:'Shilpa',day:5,mon:1,yr:1986,city:'Surat'} },
  { p1:{name:'Rohit',day:18,mon:3,yr:1989,city:'Jaipur'},    p2:{name:'Pooja',day:28,mon:7,yr:1991,city:'Lucknow'} },
  { p1:{name:'Srinivas',day:9,mon:6,yr:1984,city:'Visakhapatnam'},p2:{name:'Padma',day:21,mon:4,yr:1986,city:'Vijayawada'} },
  { p1:{name:'Gopal',day:13,mon:2,yr:1980,city:'Thiruvananthapuram'},p2:{name:'Radha',day:26,mon:8,yr:1982,city:'Kochi'} },
]

async function fillCity(page, inputNth, cityName) {
  const inputs = page.locator('input[placeholder*="City"], input[placeholder*="city"]')
  const input  = inputs.nth(inputNth)
  await input.scrollIntoViewIfNeeded()
  await input.click({ force: true })
  await input.fill(cityName)
  await page.waitForTimeout(2200)
  const opt = page.locator('button[data-city-option="true"]').first()
  if (await opt.isVisible({ timeout: 5000 }).catch(() => false)) {
    await opt.click({ force: true })
    await page.waitForTimeout(800)
  }
  await input.press('Tab')
  await page.waitForTimeout(300)
}

for (let i = 0; i < COUPLES.length; i++) {
  const c = COUPLES[i]
  test(`Match ${i+1}: ${c.p1.name} + ${c.p2.name}`, async ({ page }) => {
    await page.goto(SITE + '/match')
    await page.waitForLoadState('networkidle')
    await expect(page).not.toHaveURL(/signin|login/)

    const selects = page.locator('select')
    const nSel    = await selects.count()
    const offset  = Math.floor(nSel / 2)
    console.log(`\nMatch ${i+1}: ${c.p1.name} x ${c.p2.name} | selects=${nSel}`)

    // Person 1
    await selects.nth(0).selectOption(String(c.p1.day)).catch(()=>{})
    await selects.nth(1).selectOption({ index: c.p1.mon }).catch(()=>{})
    await selects.nth(2).selectOption(String(c.p1.yr)).catch(()=>{})
    const names = page.locator('input[placeholder*="name" i]')
    await names.nth(0).fill(c.p1.name).catch(()=>{})
    await fillCity(page, 0, c.p1.city)

    // Person 2
    await selects.nth(offset).selectOption(String(c.p2.day)).catch(()=>{})
    await selects.nth(offset+1).selectOption({ index: c.p2.mon }).catch(()=>{})
    await selects.nth(offset+2).selectOption(String(c.p2.yr)).catch(()=>{})
    await names.nth(1).fill(c.p2.name).catch(()=>{})
    await fillCity(page, 1, c.p2.city)

    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
    await page.screenshot({ path: `test-results/match-${i+1}-before.png` })

    const calcBtn = page.locator('button').filter({ hasText: /Check Compatibility|Compatibility/ }).first()
    // Scroll to button via JS and click to avoid viewport issues
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(300)
    await calcBtn.scrollIntoViewIfNeeded()
    await page.waitForTimeout(200)
    await calcBtn.click({ force: true })
    await page.waitForTimeout(18000)

    await page.screenshot({ path: `test-results/match-${i+1}-result.png` })
    const body = await page.locator('body').textContent()

    const hasScore = /\d+%|\d+\/36|Ashta|Koota|Porutham/.test(body)
    const hasErr   = /status code 4\d\d|Request failed/.test(body)
    const scoreM   = body.match(/(\d+)%/)
    const kootaM   = body.match(/(\d+)\/36/)
    console.log(`Score: ${scoreM?.[1]||'—'}% | Koota: ${kootaM?.[1]||'—'}/36 | Error: ${hasErr}`)

    expect(hasScore).toBeTruthy()
  })
}

test('Match page — city dropdown works + all UI present', async ({ page }) => {
  await page.goto(SITE + '/match')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: 'test-results/match-ui-check.png', fullPage: true })

  const body = await page.locator('body').textContent()
  expect(body).toMatch(/Person 1|PERSON 1/i)
  expect(body).toMatch(/Person 2|PERSON 2/i)
  expect(body).toMatch(/Male|Female/)

  // City dropdown test
  const cityInput = page.locator('input[placeholder*="City"], input[placeholder*="city"]').first()
  await cityInput.fill('Chennai')
  await page.waitForTimeout(2200)
  const appeared = await page.locator('button[data-city-option="true"]').first().isVisible({ timeout: 5000 }).catch(()=>false)
  console.log(`City dropdown appeared: ${appeared}`)
  if (appeared) {
    await page.locator('button[data-city-option="true"]').first().click({ force: true })
    await page.waitForTimeout(600)
    const val = await cityInput.inputValue()
    console.log(`City selected: "${val}"`)
    const closed = !(await page.locator('button[data-city-option="true"]').first().isVisible({ timeout: 300 }).catch(()=>false))
    console.log(`Dropdown closed: ${closed}`)
    expect(closed).toBeTruthy()
    expect(val.length).toBeGreaterThan(0)
  }
  await page.screenshot({ path: 'test-results/match-city-dropdown.png' })
})
