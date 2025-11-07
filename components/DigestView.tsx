'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export default function DigestView() {
  const [digests, setDigests] = useState<any[]>([])
  const [selectedDigest, setSelectedDigest] = useState<any>(null)
  const [digestItems, setDigestItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDigests()
  }, [])

  useEffect(() => {
    if (selectedDigest) {
      fetchDigestItems(selectedDigest.id)
    }
  }, [selectedDigest])

  const fetchDigests = async () => {
    try {
      const { data, error } = await supabase
        .from('digests')
        .select('*')
        .order('date', { ascending: false })
        .limit(30)

      if (error) throw error

      setDigests(data || [])
      if (data && data.length > 0 && !selectedDigest) {
        setSelectedDigest(data[0])
      }
    } catch (err) {
      console.error('Error fetching digests:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDigestItems = async (digestId: string) => {
    try {
      const { data, error } = await supabase
        .from('digest_items')
        .select(`
          *,
          news:news_id (
            id,
            headline,
            source,
            url,
            sentiment_score,
            published_at
          )
        `)
        .eq('digest_id', digestId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDigestItems(data || [])
    } catch (err) {
      console.error('Error fetching digest items:', err)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">Loading digests...</div>
      </div>
    )
  }

  if (digests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Daily Digest</h2>
        <p className="text-gray-600">
          No digests available yet. Click "Refresh Data" to generate your first digest.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Digest History</h2>
          </div>
          <div className="divide-y">
            {digests.map((digest) => (
              <button
                key={digest.id}
                onClick={() => setSelectedDigest(digest)}
                className={`w-full text-left p-4 hover:bg-gray-50 ${
                  selectedDigest?.id === digest.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="font-medium">{format(new Date(digest.date), 'MMM dd, yyyy')}</div>
                <div className="text-sm text-gray-600">
                  ${digest.portfolio_value?.toFixed(2) || '0.00'}
                </div>
                <div
                  className={`text-sm ${
                    digest.daily_change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {digest.daily_change >= 0 ? '+' : ''}
                  {digest.daily_change?.toFixed(2) || '0.00'} (
                  {digest.daily_change_percent?.toFixed(2) || '0.00'}%)
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        {selectedDigest && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">
                Digest for {format(new Date(selectedDigest.date), 'MMMM dd, yyyy')}
              </h2>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <div className="text-sm text-gray-600">Portfolio Value</div>
                  <div className="text-xl font-semibold">
                    ${selectedDigest.portfolio_value?.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Daily Change</div>
                  <div
                    className={`text-xl font-semibold ${
                      selectedDigest.daily_change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {selectedDigest.daily_change >= 0 ? '+' : ''}
                    ${selectedDigest.daily_change?.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Change %</div>
                  <div
                    className={`text-xl font-semibold ${
                      selectedDigest.daily_change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {selectedDigest.daily_change_percent >= 0 ? '+' : ''}
                    {selectedDigest.daily_change_percent?.toFixed(2) || '0.00'}%
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Summary</h3>
              <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line">
                {selectedDigest.summary || 'No summary available.'}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Relevant News</h3>
              {digestItems.length === 0 ? (
                <p className="text-gray-600">No news items for this digest.</p>
              ) : (
                <div className="space-y-4">
                  {digestItems.map((item: any) => {
                    const news = item.news
                    if (!news) return null

                    const sentimentColor =
                      (news.sentiment_score || 0) > 0.1
                        ? 'text-green-600'
                        : (news.sentiment_score || 0) < -0.1
                        ? 'text-red-600'
                        : 'text-gray-600'

                    return (
                      <div key={item.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex justify-between items-start mb-1">
                          <a
                            href={news.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:text-blue-800"
                          >
                            {news.headline}
                          </a>
                          <span className={`text-sm font-medium ${sentimentColor}`}>
                            {news.sentiment_score
                              ? (news.sentiment_score > 0 ? '+' : '') +
                                news.sentiment_score.toFixed(2)
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {news.source} • {news.published_at ? format(new Date(news.published_at), 'MMM dd, yyyy') : 'N/A'}
                          {item.position_symbol && ` • ${item.position_symbol}`}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

