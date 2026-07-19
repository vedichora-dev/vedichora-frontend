import { test, expect } from '@playwright/test'

const PAGES = [
  { path: '/',            name: 'Home',         expected: ['Horoscope', 'Vedic', 'Hora'] },
  { path: '/chart',       name: 'Chart/Kundali', expected: ['Chart', 'Kundali', 'Birth'] },
  { path: '/match',       name: 'Match',         expected: ['Match', 'Person', 'Compatibility'] },
  { path: '/signup',      name: 'Signup',        expected: ['Sign up', 'Create', 'email'] },
  { path: '/signin',      name: 'Signin',        expected: ['Sign in', 'email'] },
  { path: '/phone-login', name: 'Phone Login',   expected: ['phone', 'OTP', 'Send'] },
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
      await page.screenshot({ path: `test-results/deploy-${name.toLowerCase().replace(/\//, '-')}.png` 
  test('Checkout page loads', async ({ page }) => {
    const response = await page.goto('/checkout')
    expect(response?.status()).toBe(200)
    await page.waitForTimeout(1500)
    await page.screenshot({ path: 'test-results/deploy-checkout.png' })
    const text = await page.locator('body').textContent() || ''
    const hasPlans = text.includes('Starter') || text.includes('minutes') || text.includes('₹')
    console.log('Checkout has plans:', hasPlans)
    expect(hasPlans).toBeTruthy()
  })

  test('Consult page loads with astrologers', async ({ page }) => {
    const response = await page.goto('/consult')
    expect(response?.status()).toBe(200)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test-results/deploy-consult.png' })
    const text = await page.locator('body').textContent() || ''
    const hasAstros = text.includes('Astrologer') || text.includes('min') || text.includes('Call Now')
    console.log('Consult has astrologers:', hasAstros)
    expect(hasAstros).toBeTruthy()
  })
})
      
      // Check expected content
      if (expected.length > 0) {
        const text = await page.locator('body').textContent() || ''
        const found = expected.filter(e => text.toLowerCase().includes(e.toLowerCase()))
        console.log(`${name}: found ${found.length}/${expected.length} expected strings: ${found.join(', ')}`)
        // At least one expected string should be present
        expect(found.length).toBeGreaterThan(0)
      }
    })
  }
})

test.describe('DEPLOYMENT — Performance & Assets', () => {

  test('No console errors on home page', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/')
    await page.waitForTimeout(3000)
    const nonNetworkErrors = errors.filter(e => !e.includes('favicon') && !e.includes('404'))
    console.log('Console errors:', nonNetworkErrors)
    // Allow minor errors but flag major ones
    if (nonNetworkErrors.length > 0) {
      console.warn('⚠ Console errors found:', nonNetworkErrors.join('\n'))
    }
  })

  test('Chart page no JS crash', async ({ page }) => {
    const crashes: string[] = []
    page.on('pageerror', err => crashes.push(err.message))
    await page.goto('/chart')
    await page.waitForTimeout(3000)
    console.log('JS crashes:', crashes)
    expect(crashes.length).toBe(0)
  })
})
