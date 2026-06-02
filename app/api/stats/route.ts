import { NextResponse } from 'next/server'
import { createClient } from 'redis'

export async function GET() {
  try {
    // Check if Redis is available
    if (!process.env.REDIS_URL) {
      // Return demo data for local development
      const rightDailyCounts: { date: string; count: number }[] = []
      const issueDailyCounts: { date: string; count: number }[] = []
      const honestDailyCounts: { date: string; count: number }[] = []
      const today = new Date()

      for (let i = 29; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        // Generate some demo data
        rightDailyCounts.push({
          date: dateStr,
          count: Math.floor(Math.random() * 5)
        })
        issueDailyCounts.push({
          date: dateStr,
          count: Math.floor(Math.random() * 3)
        })
        honestDailyCounts.push({
          date: dateStr,
          count: Math.floor(Math.random() * 4)
        })
      }

      return NextResponse.json({
        right: {
          total: 42,
          dailyCounts: rightDailyCounts
        },
        issue: {
          total: 18,
          dailyCounts: issueDailyCounts
        },
        honest: {
          total: 27,
          dailyCounts: honestDailyCounts
        },
        lastUpdated: new Date().toISOString(),
        demo: true
      })
    }
    
    // Production Redis logic
    const redis = createClient({ url: process.env.REDIS_URL })
    await redis.connect()
    
    try {
      // Get totals for all counters
      const [rightTotal, issueTotal, honestTotal] = await Promise.all([
        redis.get('counter:total'),
        redis.get('issue-counter:total'),
        redis.get('honest-counter:total')
      ])

      const rightDailyCounts: { date: string; count: number }[] = []
      const issueDailyCounts: { date: string; count: number }[] = []
      const honestDailyCounts: { date: string; count: number }[] = []
      const today = new Date()

      // Get daily data for last 30 days
      const datePromises = []
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        datePromises.push(
          Promise.all([
            redis.get(`daily:${dateStr}`),
            redis.get(`issue-daily:${dateStr}`),
            redis.get(`honest-daily:${dateStr}`)
          ]).then(([rightCount, issueCount, honestCount]) => ({
            date: dateStr,
            rightCount: Number(rightCount || 0),
            issueCount: Number(issueCount || 0),
            honestCount: Number(honestCount || 0)
          }))
        )
      }

      const dailyData = await Promise.all(datePromises)

      // Format data for response
      dailyData.forEach(({ date, rightCount, issueCount, honestCount }) => {
        rightDailyCounts.push({ date, count: rightCount })
        issueDailyCounts.push({ date, count: issueCount })
        honestDailyCounts.push({ date, count: honestCount })
      })

      return NextResponse.json({
        right: {
          total: Number(rightTotal || 0),
          dailyCounts: rightDailyCounts
        },
        issue: {
          total: Number(issueTotal || 0),
          dailyCounts: issueDailyCounts
        },
        honest: {
          total: Number(honestTotal || 0),
          dailyCounts: honestDailyCounts
        },
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