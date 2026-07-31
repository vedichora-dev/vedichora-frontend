import { NextRequest, NextResponse } from 'next/server'

// Uses lightweight chromium that works on Vercel serverless
// Falls back to HTML download if chromium unavailable
export async function POST(req: NextRequest) {
  try {
    const { html, filename } = await req.json()
    if (!html) return NextResponse.json({ error: 'No HTML' }, { status: 400 })

    // Try to use puppeteer-core with @sparticuz/chromium
    try {
      const chromium = await import('@sparticuz/chromium').catch(() => null)
      const puppeteer = await import('puppeteer-core').catch(() => null)
      
      if (chromium && puppeteer) {
        const browser = await puppeteer.default.launch({
          args: chromium.default.args,
          defaultViewport: chromium.default.defaultViewport,
          executablePath: await chromium.default.executablePath(),
          headless: true,
        })
        const page = await browser.newPage()
        await page.setContent(html, { waitUntil: 'networkidle0' })
        await page.waitForTimeout(2000) // let init() run
        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '0', right: '0', bottom: '0', left: '0' }
        })
        await browser.close()
        
        return new NextResponse(pdf, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename || 'report.pdf'}"`,
          }
        })
      }
    } catch(e) {
      console.log('Chromium not available, falling back to HTML')
    }

    // Fallback: return HTML for client-side printing
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'X-Fallback': 'html'
      }
    })
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
