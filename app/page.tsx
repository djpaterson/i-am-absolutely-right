'use client'

import { useState, useEffect } from 'react'
import CounterDisplay from './components/CounterDisplay'
import HistogramChart from './components/HistogramChart'

interface Stats {
  total: number
  dailyCounts: { date: string; count: number }[]
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({ total: 0, dailyCounts: [] })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent px-4 py-2">
            "You're absolutely right!"
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 font-light">
            Claude code confidence counter
          </p>
        </div>

        {/* Counter Display */}
        <CounterDisplay count={stats.total} isLoading={isLoading} />

        {/* Histogram */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Daily Activity (Last 30 Days)
          </h2>
          <HistogramChart data={stats.dailyCounts} />
        </div>

        {/* Fun Facts */}
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-blue-600">
              {stats.dailyCounts.length > 0 
                ? Math.max(...stats.dailyCounts.map(d => d.count))
                : 0}
            </div>
            <div className="text-gray-600 mt-2">Peak Day</div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-green-600">
              {stats.dailyCounts.length > 0 
                ? (stats.total / Math.max(stats.dailyCounts.length, 1)).toFixed(1)
                : 0}
            </div>
            <div className="text-gray-600 mt-2">Daily Average</div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-purple-600">
              {stats.dailyCounts.filter(d => d.count > 0).length}
            </div>
            <div className="text-gray-600 mt-2">Active Days</div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm space-y-2">
          <p>Powered by Claude Code enthusiasm 🤖</p>
          <p>
            <a 
              href="https://github.com/TomLefley/i-am-absolutely-right" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 transition-colors underline"
            >
              View source on GitHub
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}