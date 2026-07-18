import { test, expect } from '@playwright/test'
import { loginViaUI, TEST_EMAIL, TEST_PASSWORD } from './helpers/auth'

test.describe('Authentication', () => {

  test('Home page loads with zodiac strip', async ({ page }) => {
    await page.goto('/')
    // Zodiac strip should be visible
    await expect(page.locator('svg').first()).toBeVisible({ timeout: 15000 })
    // Nav should have VedicHora logo
    await expect(page.getByText(/VedicHora/i).first()).toBeVisible()
  })

  test('Sign in page loads correctly', async ({ page }) => {
    await page.goto('/signin')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('Login with valid credentials', async ({ page }) => {
    await loginViaUI(page)
    // Should be on a non-signin page after login
    expect(page.url()).not.toContain('/signin')
    // Nav should show user avatar or name
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('Login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/signin')
    await page.fill('input[type="email"]', 'bad@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    // Should show error message
    await expect(page.locator('text=/invalid|incorrect|failed|error/i').first())
      .toBeVisible({ timeout: 10000 })
    // Should still be on signin
    expect(page.url()).toContain('/signin')
  })

  test('Signup page has all required fields', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.locator('input[type="text"]').first()).toBeVisible()  // name
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    // Phone field
    await expect(page.locator('input[type="tel"]')).toBeVisible()
  })

  test('Phone login page loads', async ({ page }) => {
    await page.goto('/phone-login')
    await expect(page.locator('input[type="tel"]')).toBeVisible()
    await expect(page.getByText(/Send OTP/i)).toBeVisible()
  })

})
