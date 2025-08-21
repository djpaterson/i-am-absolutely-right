import { NextResponse } from 'next/server'
import { createClient } from 'redis'

export async function GET() {
  try {
    // Check if Redis is available
    if (!process.env.REDIS_URL) {
      // Return demo data for local development
      const dailyCounts = []
      const today = new Date()
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        // Generate some demo data
        const count = Math.floor(Math.random() * 5)
        dailyCounts.push({
          date: dateStr,
          count
        })
      }
      
      return NextResponse.json({
        total: 42,
        dailyCounts,
        lastUpdated: new Date().toISOString(),
        demo: true
      })
    }
    
    // Production Redis logic
    const redis = createClient({ url: process.env.REDIS_URL })
    await redis.connect()
    
    try {
      const total = await redis.get('counter:total') || 0
      
      const dailyCounts = []
      const today = new Date()
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const count = await redis.get(`daily:${dateStr}`) || 0
        dailyCounts.push({
          date: dateStr,
          count: Number(count)
        })
      }
      
      return NextResponse.json({
        total: Number(total),
        dailyCounts,
        lastUpdated: new Date().toISOString()
      })
    } finally {
      await redis.disconnect()
    }
    
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Enable CORS for this endpoint
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}