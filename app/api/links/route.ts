import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { generateShortCode, isValidUrl, formatUrl } from '@/lib/utils'

// Validation schema for creating links
const createLinkSchema = z.object({
  targetUrl: z.string().min(1, 'URL is required'),
  code: z.string().regex(/^[a-zA-Z0-9-_]+$/, 'Code must contain only alphanumeric characters, hyphens, and underscores').optional(),
})

// GET /api/links - List all links
export async function GET() {
  try {
    const links = await prisma.link.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({
      success: true,
      data: links
    }, { status: 200 })
  } catch (error) {
    console.error('Error fetching links:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch links' 
      },
      { status: 500 }
    )
  }
}

// POST /api/links - Create a new link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input with Zod
    const validation = createLinkSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid input',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { targetUrl, code } = validation.data

    // Format and validate URL
    const formattedUrl = formatUrl(targetUrl)
    if (!isValidUrl(formattedUrl)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid URL format' 
        },
        { status: 400 }
      )
    }

    // Generate or use provided code
    let shortCode = code
    if (!shortCode) {
      // Generate unique code with retry logic
      let attempts = 0
      do {
        shortCode = generateShortCode()
        attempts++
        if (attempts > 10) {
          return NextResponse.json(
            { 
              success: false,
              error: 'Failed to generate unique code' 
            },
            { status: 500 }
          )
        }
      } while (await prisma.link.findUnique({ where: { code: shortCode } }))
    } else {
      // Check if custom code already exists
      const existingLink = await prisma.link.findUnique({
        where: { code: shortCode }
      })

      if (existingLink) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Short code already exists' 
          },
          { status: 409 } // Conflict - code already exists
        )
      }
    }

    // Create the link
    const link = await prisma.link.create({
      data: {
        code: shortCode,
        targetUrl: formattedUrl
      }
    })

    return NextResponse.json({
      success: true,
      data: link
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating link:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create link' 
      },
      { status: 500 }
    )
  }
}
