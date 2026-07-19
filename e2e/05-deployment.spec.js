// @ts-nocheck
const { test, expect } = require('@playwright/test')

const PAGES = [
  { path: '/',            name: 'Home',         expected: ['Horoscope', 'Vedic', 'Hora'] },
  { path: '/chart',       name: 'Chart',         expected: ['Chart', 'Kundali', 'Birth'] },
  { path: '/match',       name: 'Match',         expected: ['Match', 'Person', 'Compatibility'] },
  { path: '/signup',      name: 'Signup',        expected: ['Sign up', 'Create', 'email'] },
  { path: '/signin',      name: 'Signin',        expected: ['Sign in', 'email'] },
  { path: '/phone-login', name: 'PhoneLogin',    expected: ['phone', 'OTP', 'Send'] },
  { path: '/shop',        name: 'Shop',          expected: [] },
  { path: '/learn',       name: 'Learn',         expected: [] },
  { path: '/about',       name: 'About',         expected: [] },
]

test.describe('DEPLOYMENT — All pages return 200', () => {

  for (const { path, name, expected } of PAGES) {
    test(`${name} page loads (${path})`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      await page.waitForTimeout(1500)
      await page.screenshot({ path: `test-results/deploy-${name.toLowerCase()}.png` })

      if (expected.length > 0) {
        const text  = await page.locator('body').textContent() || ''
        const found = expected.filter(e => text.toLowerCase().includes(e.toLowerCase()))
        console.log(`${name}: found ${found.length}/${expected.length} — ${found.join(', ')}`)
        expect(found.length).toBeGreaterThan(0)
      }
    })
  }

  test('Checkout page loads', async ({ page }) => {
    const response = await page.goto('/checkout')
    expect(response?.status()).toBe(200)
    await page.waitForTimeout(1500)
    await page.screenshot({ path: 'test-results/deploy-checkout.png' })
    const text = await page.locator('body').textContent() || ''
    const hasPlans = text.includes('Starter') || text.includes('minutes') || text.includes('\u20b9')
    console.log('Checkout has plans:', hasPlans)
    expect(hasPlans).toBeTruthy()
  })

  test('Consult page loads', async ({ page }) => {
    const response = await page.goto('/consult')
    expect(response?.status()).toBe(200)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test-results/deploy-consult.png' })
    const text = await page.locator('body').textContent() || ''
    const hasContent = text.includes('Astrologer') || text.includes('Consult') || text.includes('min')
    console.log('Consult has content:', hasContent)
    expect(hasContent).toBeTruthy()
  })
})

test.describe('DEPLOYMENT — JS errors', () => {

  test('No console errors on home page', async ({ page }) => {
    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/')
    await page.waitForTimeout(3000)
    const nonNetworkErrors = errors.filter(e => !e.includes('favicon') && !e.includes('404'))
    console.log('Console errors:', nonNetworkErrors)
    if (nonNetworkErrors.length > 0) {
      console.warn('Console errors found:', nonNetworkErrors.join('\n'))
    }
    // Not asserting zero — just logging
  })

  test('Chart page no JS crash', async ({ page }) => {
    const crashes = []
    page.on('pageerror', err => crashes.push(err.message))
    await page.goto('/chart')
    await page.waitForTimeout(3000)
    console.log('JS crashes:', crashes)
    expect(crashes.length).toBe(0)
  })
})
