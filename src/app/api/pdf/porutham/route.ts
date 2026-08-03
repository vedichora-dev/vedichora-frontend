import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { createServer } from 'http'
import { readFileSync } from 'fs'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  let server: any = null
  let browser: any = null
  try {
    const { html, filename } = await req.json()
    if (!html) return NextResponse.json({ error: 'No HTML' }, { status: 400 })

    // Write HTML to temp file
    const tmpDir = '/tmp/vh_pdf'
    mkdirSync(tmpDir, { recursive: true })
    const htmlPath = join(tmpDir, `report_${Date.now()}.html`)
    writeFileSync(htmlPath, html, 'utf8')

    // Spin up local HTTP server so scripts execute (file:// blocks them)
    server = createServer((_req: any, res: any) => {
      try {
        const content = readFileSync(htmlPath)
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(content)
      } catch { res.writeHead(500); res.end() }
    })
    const port: number = await new Promise(resolve => {
      server.listen(0, '127.0.0.1', () => resolve((server.address() as any).port))
    })

    // Launch Playwright
    const { chromium } = require('playwright-core')
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    })
    const page = await browser.newPage()
    await page.setViewportSize({ width: 794, height: 1123 })
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(3000) // let init() run fully

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    })

    await browser.close(); browser = null
    server.close(); server = null

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename || 'report.pdf'}"`,
      }
    })
  } catch (e: any) {
    console.error('PDF error:', e.message)
    if (browser) try { await browser.close() } catch {}
    if (server) try { server.close() } catch {}
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
