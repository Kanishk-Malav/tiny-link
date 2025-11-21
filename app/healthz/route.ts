import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /health - Health check endpoint
export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      status: 'ok',
      message: 'Service is healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    }, { status: 200 })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Service is unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    }, { status: 500 })
  }
}
