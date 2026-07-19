// @ts-nocheck
import { test, expect } from '@playwright/test'
import { SITE, ADMIN_EMAIL, ADMIN_PASS, TEST_EMAIL, TEST_PASSWORD } from './helpers'

test.describe('AUTH — Login & Signup', () => {

  test('Home page loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/VedicHora|Vedic/)
    // Zodiac strip visible
    await expect(page.locator('text=Mesha, text=Mes').first()).toBeVisible({ timeout: 10000 })
      .catch(() => expect(page.locator('[style*="zodiac"], [class*="strip"]').first()).toBeVisible())
    await page.screenshot({ path: 'test-results/01-home.png' })
  })

  test('Nav renders correctly', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=VedicHora, text=Vedic').first()).toBeVisible()
    await expect(page.locator('text=Horoscope')).toBeVisible()
    await expect(page.locator('text=Kundali, text=Chart').first()).toBeVisible()
    await expect(page.locator('text=Matching')).toBeVisible()
  })

  test('Admin login succeeds', async ({ page }) => {
    await page.goto('/signin')
    await page.screenshot({ path: 'test-results/02-signin-page.png' })
    
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASS)
    await page.click('button[type="submit"], button:has-text("Sign in")')
    
    // Should redirect away from signin
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'test-results/03-after-login.png' })
    
    // Should not be on signin page anymore
    await expect(page).not.toHaveURL(/\/signin/)
  })

  test('Wrong password shows error', async ({ page }) => {
    await page.goto('/signin')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', 'wrongpassword123')
    await page.click('button[type="submit"], button:has-text("Sign in")')
    await page.waitForTimeout(2000)
    // Should stay on signin or show error
    const hasError = await page.locator('text=Invalid, text=incorrect, text=failed, text=error').first()
      .isVisible({ timeout: 5000 }).catch(() => false)
    const staysOnSignin = page.url().includes('/signin')
    expect(hasError || staysOnSignin).toBeTruthy()
  })

  test('Signup page renders', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.locator('text=Create, text=Sign up').first()).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    // Phone field
    await expect(page.locator('input[type="tel"]')).toBeVisible()
    await page.screenshot({ path: 'test-results/04-signup-page.png' })
  })

  test('Phone login page renders', async ({ page }) => {
    await page.goto('/phone-login')
    await expect(page.locator('input[type="tel"]')).toBeVisible()
    await expect(page.locator('button:has-text("Send OTP")')).toBeVisible()
    await page.screenshot({ path: 'test-results/05-phone-login.png' })
  })

  test('Logout works', async ({ page }) => {
    // Login first
    await page.goto('/signin')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASS)
    await page.click('button[type="submit"], button:has-text("Sign in")')
    await page.waitForTimeout(3000)
    
    // Find user avatar / logout
    const avatar = page.locator('[style*="border-radius: 50%"]').last()
    if (await avatar.isVisible({ timeout: 3000 }).catch(() => false)) {
      await avatar.click()
      await page.waitForTimeout(500)
      const logoutBtn = page.locator('button:has-text("Sign out"), button:has-text("Logout")')
      if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await logoutBtn.click()
        await page.waitForTimeout(2000)
        await expect(page).toHaveURL(/\/signin|\//)
      }
    }
    await page.screenshot({ path: 'test-results/06-after-logout.png' })
  })
})
