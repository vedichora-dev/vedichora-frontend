import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { createServer } from 'http'
import { readFileSync } from 'fs'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { html, filename } = await req.json()
    if (!html) return NextResponse.json({ error: 'No HTML' }, { status: 400 })

    try {
      // Write HTML to temp file
      const tmpDir = '/tmp/pdf_render'
      mkdirSync(tmpDir, { recursive: true })
      const htmlPath = join(tmpDir, 'report.html')
      writeFileSync(htmlPath, html)

      // Spin up a mini HTTP server so scripts execute (file:// blocks them)
      const server = createServer((req, res) => {
        try {
          const content = readFileSync(htmlPath)
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(content)
        } catch {
          res.writeHead(500); res.end('error')
        }
      })
      
      await new Promise<void>(r => server.listen(0, '127.0.0.1', r))
      const port = (server.address() as any).port

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const chromium = require('@sparticuz/chromium')
      // eslint-disable-next-line @typescript-eslint/no-var-requires  
      const puppeteer = require('puppeteer-core')

      const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 794, height: 1123 },
        executablePath: await chromium.executablePath(),
        headless: true,
      })

      const page = await browser.newPage()
      await page.goto(`http://127.0.0.1:${port}/report`, { waitUntil: 'networkidle0', timeout: 15000 })
      await page.waitForTimeout(2500) // let init() render all content
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' }
      })

      await browser.close()
      server.close()

      return new NextResponse(pdf as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename || 'report.pdf'}"`,
        }
      })
    } catch(e: any) {
      console.error('PDF generation error:', e.message)
      // Fallback: return HTML with print instruction
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html', 'X-Fallback': 'html' }
      })
    }
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
