'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import PortfolioUpload from './PortfolioUpload'
import PositionsList from './PositionsList'
import DigestView from './DigestView'
import { format } from 'date-fns'

interface DashboardProps {
  user: any
}

export default function Dashboard({ user }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'digest'>('portfolio')
  const [positions, setPositions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .order('symbol')

      if (error) throw error
      setPositions(data || [])
    } catch (err) {
      console.error('Error fetching positions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPositions()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      // Fetch prices
      const { error: priceError } = await supabase.functions.invoke('fetch-prices', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      if (priceError) throw priceError

      // Fetch news
      const { error: newsError } = await supabase.functions.invoke('fetch-news', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      if (newsError) throw newsError

      // Generate digest
      const { error: digestError } = await supabase.functions.invoke('generate-digest', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      if (digestError) throw digestError

      alert('Portfolio refreshed successfully!')
      fetchPositions()
    } catch (err: any) {
      alert(`Error refreshing: ${err.message}`)
    } finally {
      setRefreshing(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-slate-950 text-gray-100">
      {/* Top Nav */}
      <nav className="border-b border-slate-800/70 bg-black/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-baseline space-x-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                AI Investing
              </span>
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Investing Assistant
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-xs sm:text-sm text-slate-400">
                {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 text-xs sm:text-sm rounded-md border border-slate-600/70 text-slate-200 hover:bg-slate-800/80 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header row: tabs + refresh */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Tabs */}
          <div className="inline-flex items-center rounded-full bg-slate-900/70 border border-slate-800/80 p-1">
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`px-4 py-1.5 text-sm rounded-full transition-all ${
                activeTab === 'portfolio'
                  ? 'bg-cyan-500 text-black font-semibold shadow-md'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              Portfolio
            </button>
            <button
              onClick={() => setActiveTab('digest')}
              className={`px-4 py-1.5 text-sm rounded-full transition-all ${
                activeTab === 'digest'
                  ? 'bg-cyan-500 text-black font-semibold shadow-md'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              Daily Digest
            </button>
          </div>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {refreshing ? (
              <>
                <span className="mr-2 h-4 w-4 border-2 border-transparent border-t-white rounded-full animate-spin" />
                Refreshing...
              </>
            ) : (
              'Refresh Data'
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <PortfolioUpload onUpload={fetchPositions} />
            <PositionsList positions={positions} loading={loading} />
          </div>
        )}

        {activeTab === 'digest' && <DigestView />}
      </div>
    </div>
  )
}
