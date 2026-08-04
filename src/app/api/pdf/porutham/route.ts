import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

// Gotenberg service on Railway
const GOTENBERG_URL = process.env.GOTENBERG_URL || 'https://gotenberg-production.up.railway.app'

export async function POST(req: NextRequest) {
  try {
    const { html, filename } = await req.json()
    if (!html) return NextResponse.json({ error: 'No HTML' }, { status: 400 })

    // Gotenberg /forms/chromium/convert/html endpoint
    // Takes multipart form with index.html file → returns PDF
    const formData = new FormData()
    formData.append('files', new Blob([html], { type: 'text/html' }), 'index.html')
    
    // Gotenberg settings
    formData.append('paperWidth', '8.27')   // A4 width in inches
    formData.append('paperHeight', '11.69') // A4 height in inches
    formData.append('marginTop', '0')
    formData.append('marginBottom', '0')
    formData.append('marginLeft', '0')
    formData.append('marginRight', '0')
    formData.append('printBackground', 'true')
    formData.append('waitDelay', '3s')      // wait for init() to run

    const res = await fetch(`${GOTENBERG_URL}/forms/chromium/convert/html`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Gotenberg error:', err)
      return NextResponse.json({ error: `Gotenberg failed: ${res.status}` }, { status: 500 })
    }

    const pdf = await res.arrayBuffer()
    const fname = filename || 'VedicHora_Report.pdf'

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fname}"`,
        'Cache-Control': 'no-store',
      }
    })
  } catch (e: any) {
    console.error('PDF route error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
