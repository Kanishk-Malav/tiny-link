import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /:code - Redirect to target URL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    const link = await prisma.link.findUnique({
      where: { code }
    })

    if (!link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      )
    }

    // Increment click count
    await prisma.link.update({
      where: { code },
      data: { clicks: { increment: 1 } }
    })

    // Redirect with 302 status (temporary redirect)
    return NextResponse.redirect(link.targetUrl, { status: 302 })
  } catch (error) {
    console.error('Error redirecting:', error)
    return NextResponse.json(
      { error: 'Failed to redirect' },
      { status: 500 }
    )
  }
}
