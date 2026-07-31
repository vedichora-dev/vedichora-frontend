import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { html, filename } = await req.json()
    if (!html) return NextResponse.json({ error: 'No HTML' }, { status: 400 })

    try {
      // Dynamic require prevents webpack from bundling these at build time
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const chromium = require('@sparticuz/chromium')
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const puppeteer = require('puppeteer-core')
      
      const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: true,
      })
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 })
      await new Promise((r: any) => setTimeout(r, 2000))
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' }
      })
      await browser.close()
      
      return new NextResponse(pdf as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename || 'report.pdf'}"`,
        }
      })
    } catch(e: any) {
      console.error('Chromium error:', e.message)
      // Fallback: return the HTML for client printing
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html', 'X-Fallback': 'html' }
      })
    }
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
