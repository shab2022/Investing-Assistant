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
      const { data: { session } } = await supabase.auth.getSession()
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Investing Assistant</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-4 border-b">
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'portfolio'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Portfolio
              </button>
              <button
                onClick={() => setActiveTab('digest')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'digest'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Daily Digest
              </button>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

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

