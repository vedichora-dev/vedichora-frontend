import { Page } from '@playwright/test'

export const TEST_EMAIL    = process.env.TEST_EMAIL    || 'admin@vedichora.com'
export const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Admin@123'
export const BASE_URL      = process.env.BASE_URL      || 'https://vedichora-frontend-orcin.vercel.app'

/**
 * Login via UI and return the page ready for use.
 * Stores auth state so subsequent tests skip login.
 */
export async function loginViaUI(page: Page): Promise<void> {
  await page.goto('/signin')
  await page.waitForSelector('input[type="email"]', { timeout: 15000 })
  await page.fill('input[type="email"]', TEST_EMAIL)
  await page.fill('input[type="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  // Wait for redirect away from signin
  await page.waitForURL(url => !url.toString().includes('/signin'), { timeout: 20000 })
}

/**
 * Login via API (faster — injects token directly into localStorage)
 */
export async function loginViaAPI(page: Page): Promise<void> {
  const AUTH_URL = 'https://vedichora-platform-production.up.railway.app'
  const res = await page.request.post(`${AUTH_URL}/api/auth/login`, {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  })
  const body = await res.json()
  const token   = body?.data?.accessToken   || ''
  const refresh = body?.data?.refreshToken  || ''
  const user    = body?.data?.user          || { displayName: 'Admin', email: TEST_EMAIL, plan: 'admin' }

  if (!token) throw new Error(`Login failed: ${JSON.stringify(body)}`)

  // Inject into localStorage the same way the app does
  await page.goto('/')
  await page.evaluate(({ token, refresh, user }) => {
    localStorage.setItem('vh_token',   token)
    localStorage.setItem('vh_refresh', refresh)
    // Also store in zustand persist store
    const state = JSON.parse(localStorage.getItem('vh-store') || '{"state":{}}')
    state.state.token        = token
    state.state.refreshToken = refresh
    state.state.user         = user
    localStorage.setItem('vh-store', JSON.stringify(state))
  }, { token, refresh, user })

  // Reload to pick up the state
  await page.reload()
  await page.waitForLoadState('networkidle')
}
