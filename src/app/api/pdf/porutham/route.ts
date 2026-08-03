import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, mkdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { createServer, Server } from 'http'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  let server: Server | null = null
  let browser: any = null
  try {
    const { html, filename } = await req.json()
    if (!html) return NextResponse.json({ error: 'No HTML' }, { status: 400 })

    const tmpDir = '/tmp/vh_pdf'
    mkdirSync(tmpDir, { recursive: true })
    const htmlPath = join(tmpDir, `r_${Date.now()}.html`)
    writeFileSync(htmlPath, html, 'utf8')

    // Local HTTP server so scripts execute
    server = createServer((_req: any, res: any) => {
      try { res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'}); res.end(readFileSync(htmlPath)) }
      catch { res.writeHead(500); res.end() }
    })
    const port: number = await new Promise(r => server!.listen(0,'127.0.0.1',()=>r((server!.address() as any).port)))

    // Dynamic require prevents webpack bundling
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { chromium } = require('playwright-core')
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage'] })
    const page = await browser.newPage()
    await page.setViewportSize({ width: 794, height: 1123 })
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(3000)

    const pdf = await page.pdf({ format:'A4', printBackground:true, margin:{top:'0',right:'0',bottom:'0',left:'0'} })
    await browser.close(); browser = null
    server.close(); server = null

    return new NextResponse(pdf as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename || 'report.pdf'}"`,
      }
    })
  } catch (e: any) {
    console.error('PDF error:', e.message)
    if (browser) try { await browser.close() } catch {}
    if (server) try { server.close() } catch {}
    // Return 500 so frontend uses fallback (print dialog)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
