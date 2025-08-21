import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export async function GET() {
  try {
    // Check if Redis is available
    const isKvAvailable = process.env.REDIS_URL || 
                         (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
                         process.env.KV_URL
    
    if (!isKvAvailable) {
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
    
    // Production KV logic
    const total = await kv.get('counter:total') || 0
    
    const dailyCounts = []
    const today = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const count = await kv.get(`daily:${dateStr}`) || 0
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