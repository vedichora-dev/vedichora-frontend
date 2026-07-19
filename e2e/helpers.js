/* eslint-disable @typescript-eslint/no-explicit-any */


const SITE          = process.env.BASE_URL || 'https://vedichora-frontend-orcin.vercel.app'
const ADMIN_EMAIL   = 'admin@vedichora.com'
const ADMIN_PASS    = 'Admin@123'
const TEST_PASSWORD = 'TestPass@123'

const BABU = {
  name:'Babu', day:1, month:3, year:1959, hour:2, minute:30, ap:'PM',
  place:'Chennai',
  expectedLagna:'Cancer', expectedMoon:'Scorpio', expectedNakshatra:'Anuradha',
}
const PRAMOD = {
  name:'Pramod', day:24, month:9, year:1968, hour:8, minute:22, ap:'PM',
  place:'Chennai',
  expectedLagna:'Aries', expectedNakshatra:'Swati', expectedDasha:'Rahu',
}

/** Login via UI */
async function loginUI(page, email = ADMIN_EMAIL, pass = ADMIN_PASS) {
  await page.goto('/signin')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', pass)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(5000)
}

/** Fill date picker selects using prefix-based approach */
async function fillDatePicker(
  page,
  prefix,
  day, month, year,
  hour, minute, ap
) {
  // DatePicker renders <select> elements
  // Try by ID first, then fall back to position
  const tryById = async (id, val) => {
    const el = page.locator(`#${id}`)
    if (await el.count() > 0) {
      await el.selectOption(String(val))
      return true
    }
    return false
  }

  const dayOk = await tryById(`${prefix}-dd`, day)
  if (!dayOk) {
    // Fallback: sequential selects
    const selects = page.locator('select')
    const n = await selects.count()
    if (n >= 1) await selects.nth(0).selectOption(String(day))
    if (n >= 2) await selects.nth(1).selectOption({ index: month })
    if (n >= 3) await selects.nth(2).selectOption(String(year))
    if (n >= 4) await selects.nth(3).selectOption(String(hour))
    if (n >= 5) await selects.nth(4).selectOption(String(minute < 10 ? `0${minute}` : minute))
    if (n >= 6) await selects.nth(5).selectOption(ap)
    return
  }

  await tryById(`${prefix}-mm`, month)
  await tryById(`${prefix}-yyyy`, year)
  await tryById(`${prefix}-hr`,  hour)
  await tryById(`${prefix}-mi`,  minute)
  await tryById(`${prefix}-ap`,  ap)
}

/** Fill city autocomplete */
async function fillCity(page, city) {
  const field = page.locator('input[placeholder*="City"], input[placeholder*="city"]').first()
  await field.fill(city)
  await page.waitForTimeout(800)
  const drop = page.locator(`div button:has-text("${city}")`).first()
  if (await drop.isVisible({ timeout: 2000 }).catch(() => false)) {
    await drop.click()
  }
}

module.exports = { SITE, ADMIN_EMAIL, ADMIN_PASS, TEST_PASSWORD, BABU, PRAMOD, loginUI, fillDatePicker, fillCity }
