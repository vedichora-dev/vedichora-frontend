import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
export async function POST(_req: NextRequest) {
  // PDF generation via headless browser not available on Vercel Hobby
  // Frontend will use print dialog fallback
  return NextResponse.json({ error: 'use-print-fallback' }, { status: 500 })
}
