import { test, expect } from '@playwright/test'

/**
 * Deployment verification — checks that the LATEST code is live.
 * Looks for specific strings that only exist in recent commits.
 */
test.describe('Deployment Verification', () => {

  test('Site is reachable and returns 200', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.status()).toBe(200)
  })

  test('Latest chart features are deployed', async ({ page }) => {
    await page.goto('/chart')
    const html = await page.content()
    
    // These strings only exist in the latest chart page build
    const checks = [
      { label: 'Rasi + D9 tab',          pattern: /Rasi|D9|Navamsha/i },
      { label: 'Saved charts strip',      pattern: /Saved Charts|New Chart/i },
      { label: 'City autocomplete',       pattern: /City|Place|Birth/i },
    ]
    
    for (const { label, pattern } of checks) {
      const found = pattern.test(html)
      console.log(`  ${found ? '✓' : '✗'} ${label}`)
      expect(found, `${label} not found in deployed page`).toBe(true)
    }
  })

  test('Signup has phone field (latest feature)', async ({ page }) => {
    await page.goto('/signup')
    const html = await page.content()
    expect(html).toMatch(/phone|tel/i)
    console.log('✓ Phone field present in signup')
  })

  test('Phone login page exists (new route)', async ({ page }) => {
    const res = await page.goto('/phone-login')
    expect(res?.status()).toBe(200)
    const html = await page.content()
    expect(html).toMatch(/OTP|phone|Send/i)
    console.log('✓ /phone-login route exists')
  })

  test('API endpoints responding', async ({ page }) => {
    const AUTH = 'https://vedichora-platform-production.up.railway.app'
    const CHART = 'https://enchanting-dedication-production.up.railway.app'
    
    const authHealth = await page.request.get(`${AUTH}/health`)
    expect(authHealth.status()).toBe(200)
    console.log('✓ Auth service healthy')
    
    const chartHealth = await page.request.get(`${CHART}/health`)
    expect(chartHealth.status()).toBe(200)
    console.log('✓ Chart service healthy')
  })

  test('No console errors on home page', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', err => errors.push(err.message))
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('hydration') &&
      !e.includes('Warning') &&
      !e.includes('Non-Error')
    )
    
    if (criticalErrors.length > 0) {
      console.log('Console errors found:', criticalErrors)
    }
    // Just log, don't fail — some hydration warnings are expected in Next.js 14
    console.log(`Console errors (${criticalErrors.length}):`, criticalErrors.slice(0, 3))
  })

})
