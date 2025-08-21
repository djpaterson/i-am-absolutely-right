import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export async function GET() {
  try {
    // Get total count
    const total = await kv.get('counter:total') || 0
    
    // Get last 30 days of data
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