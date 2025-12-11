'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts'

export default function DigestView() {
  const [digests, setDigests] = useState<any[]>([])
  const [selectedDigest, setSelectedDigest] = useState<any>(null)
  const [digestItems, setDigestItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [itemsLoading, setItemsLoading] = useState(false)

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
        .limit(60)

      if (error) throw error

      setDigests(data || [])
      if (data && data.length > 0) {
        setSelectedDigest((prev: any) => prev || data[0])
      }
    } catch (err) {
      console.error('Error fetching digests:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDigestItems = async (digestId: string) => {
    try {
      setItemsLoading(true)
      const { data, error } = await supabase
        .from('digest_items')
        .select(
          `
          *,
          news:news_id (
            id,
            headline,
            source,
            url,
            sentiment_score,
            published_at
          )
        `
        )
        .eq('digest_id', digestId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDigestItems(data || [])
    } catch (err) {
      console.error('Error fetching digest items:', err)
    } finally {
      setItemsLoading(false)
    }
  }

  // ===== Derived Data =====

  // Portfolio history for performance chart
  const portfolioHistory = useMemo(() => {
    const withValues = (digests || []).filter(
      (d) => d.portfolio_value && !Number.isNaN(d.portfolio_value)
    )
    if (!withValues.length) return []

    return [...withValues]
      .sort(
        (a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      .map((d) => ({
        date: format(new Date(d.date), 'MM/dd'),
        portfolio_value: Number(d.portfolio_value),
      }))
  }, [digests])

  // Sentiment summary for selected digest
  const sentimentSummary = useMemo(() => {
    const scores =
      digestItems
        ?.map((i: any) => i?.news?.sentiment_score)
        .filter((s: any) => typeof s === 'number') || []

    if (!scores.length) {
      return {
        label: 'No sentiment data',
        avg: null,
        color: 'text-slate-400',
      }
    }

    const avg =
      scores.reduce((sum: number, s: number) => sum + s, 0) /
      scores.length

    let label = 'Neutral'
    let color = 'text-cyan-300'
    if (avg > 0.15) {
      label = 'Bullish'
      color = 'text-emerald-400'
    } else if (avg < -0.15) {
      label = 'Bearish'
      color = 'text-red-400'
    }

    return { label, avg, color }
  }, [digestItems])

  // Bullish / Bearish "signals" from extreme sentiment headlines
  const { bullishSignals, bearishSignals } = useMemo(() => {
    const bullish =
      digestItems?.filter(
        (i: any) => i?.news?.sentiment_score > 0.4
      ) || []
    const bearish =
      digestItems?.filter(
        (i: any) => i?.news?.sentiment_score < -0.4
      ) || []

    return {
      bullishSignals: bullish.slice(0, 3),
      bearishSignals: bearish.slice(0, 3),
    }
  }, [digestItems])

  if (loading) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="text-center py-8 text-slate-400">
          Loading digests...
        </div>
      </div>
    )
  }

  if (!digests.length) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-3 text-slate-100">
          Daily Digest
        </h2>
        <p className="text-slate-400 text-sm">
          No digests available yet. Use{' '}
          <span className="text-cyan-400 font-medium">
            Refresh Data
          </span>{' '}
          on the dashboard to generate your first AI summary.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Digest list */}
      <div className="lg:col-span-1">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-lg font-semibold text-slate-100">
              Digest History
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select a date to view AI summary & signals
            </p>
          </div>
          <div className="divide-y divide-slate-800 max-h-[480px] overflow-y-auto">
            {digests.map((digest) => (
              <button
                key={digest.id}
                onClick={() => setSelectedDigest(digest)}
                className={`w-full text-left px-4 py-3 text-sm transition-all ${
                  selectedDigest?.id === digest.id
                    ? 'bg-cyan-500/10 border-l-4 border-cyan-400'
                    : 'hover:bg-slate-800/70'
                }`}
              >
                <div className="font-medium text-slate-100">
                  {format(
                    new Date(digest.date),
                    'MMM dd, yyyy'
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  Value: $
                  {digest.portfolio_value
                    ?.toFixed(2)
                    .toLocaleString() || '0.00'}
                </div>
                <div
                  className={`text-xs font-semibold ${
                    digest.daily_change >= 0
                      ? 'text-emerald-400'
                      : 'text-red-400'
                  }`}
                >
                  {digest.daily_change >= 0 ? '+' : ''}
                  {digest.daily_change?.toFixed(2) || '0.00'} (
                  {digest.daily_change_percent?.toFixed(2) ||
                    '0.00'}
                  %)
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Selected digest + analytics */}
      <div className="lg:col-span-2 space-y-6">
        {selectedDigest && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            {/* Header & key stats */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-100">
                  Digest for{' '}
                  {format(
                    new Date(selectedDigest.date),
                    'MMMM dd, yyyy'
                  )}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  AI-generated summary & signals based on your
                  positions and recent news.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-slate-500">
                    Portfolio Value
                  </div>
                  <div className="text-lg font-semibold text-slate-100">
                    $
                    {selectedDigest.portfolio_value
                      ?.toFixed(2)
                      .toLocaleString() || '0.00'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">
                    Daily Change
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      selectedDigest.daily_change >= 0
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {selectedDigest.daily_change >= 0
                      ? '+'
                      : ''}
                    $
                    {selectedDigest.daily_change?.toFixed(
                      2
                    ) || '0.00'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">
                    Change %
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      selectedDigest.daily_change_percent >= 0
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {selectedDigest.daily_change_percent >= 0
                      ? '+'
                      : ''}
                    {selectedDigest.daily_change_percent
                      ?.toFixed(2) || '0.00'}
                    %
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics row: portfolio performance + sentiment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Portfolio performance chart */}
              <div className="md:col-span-2 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                    Portfolio Performance
                  </h3>
                  <span className="text-[9px] text-slate-500">
                    Last {portfolioHistory.length} days
                  </span>
                </div>
                {portfolioHistory.length >= 2 ? (
                  <div className="h-32">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <LineChart data={portfolioHistory}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1f2937"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: '#9ca3af', fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: '#6b7280', fontSize: 9 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) =>
                            `$${(v / 1000).toFixed(0)}k`
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor:
                              '#020817',
                            borderColor:
                              '#111827',
                            fontSize: 10,
                          }}
                          formatter={(value: any) => [
                            `$${Number(
                              value
                            ).toFixed(2)}`,
                            'Portfolio',
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="portfolio_value"
                          stroke="#22d3ee"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 mt-2">
                    More history needed to display performance.
                  </p>
                )}
              </div>

              {/* Sentiment & alerts */}
              <div className="space-y-2">
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                  <div className="text-[10px] text-slate-500">
                    Market Mood (News on Your Holdings)
                  </div>
                  <div
                    className={`mt-1 text-sm font-semibold ${sentimentSummary.color}`}
                  >
                    {sentimentSummary.label}
                    {sentimentSummary.avg !== null && (
                      <span className="ml-1 text-[9px] text-slate-400">
                        ({sentimentSummary.avg.toFixed(2)})
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[9px] text-slate-500">
                    Based on sentiment scores of headlines
                    linked to your portfolio.
                  </p>
                </div>

                {(bullishSignals.length > 0 ||
                  bearishSignals.length > 0) && (
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                    <div className="text-[10px] text-slate-500 mb-1">
                      Today&apos;s Signals
                    </div>
                    {bullishSignals.slice(0, 2).map((i: any) => (
                      <div
                        key={i.id}
                        className="text-[9px] text-emerald-400 mb-0.5"
                      >
                        🚀 Bullish: {i.news?.headline}
                      </div>
                    ))}
                    {bearishSignals.slice(0, 2).map((i: any) => (
                      <div
                        key={i.id}
                        className="text-[9px] text-red-400 mb-0.5"
                      >
                        ⚠️ Bearish: {i.news?.headline}
                      </div>
                    ))}
                    {bullishSignals.length === 0 &&
                      bearishSignals.length === 0 && (
                        <div className="text-[9px] text-slate-500">
                          No strong bullish or bearish signals
                          detected.
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>

            {/* AI Summary */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-slate-100">
                AI Summary
              </h3>
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 whitespace-pre-line">
                {selectedDigest.summary ||
                  'No summary available for this date.'}
              </div>
            </div>

            {/* News List */}
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="text-lg font-semibold text-slate-100">
                  Relevant News
                </h3>
                {itemsLoading && (
                  <span className="text-[9px] text-slate-500">
                    Updating...
                  </span>
                )}
              </div>
              {digestItems.length === 0 ? (
                <p className="text-slate-500 text-sm">
                  No news items for this digest.
                </p>
              ) : (
                <div className="space-y-3">
                  {digestItems.map((item: any) => {
                    const news = item.news
                    if (!news) return null

                    const s = news.sentiment_score || 0
                    const sentimentColor =
                      s > 0.1
                        ? 'text-emerald-400'
                        : s < -0.1
                        ? 'text-red-400'
                        : 'text-slate-400'

                    return (
                      <div
                        key={item.id}
                        className="border-l-4 border-cyan-500/80 pl-3 py-2 bg-slate-950/60 rounded-r-xl"
                      >
                        <div className="flex justify-between items-start gap-3 mb-1">
                          <a
                            href={news.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-cyan-400 hover:text-cyan-300 text-sm"
                          >
                            {news.headline}
                          </a>
                          <span
                            className={`text-xs font-semibold ${sentimentColor}`}
                          >
                            {news.sentiment_score
                              ? `${s > 0 ? '+' : ''}${s.toFixed(
                                  2
                                )}`
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {news.source || 'Unknown source'} •{' '}
                          {news.published_at
                            ? format(
                                new Date(
                                  news.published_at
                                ),
                                'MMM dd, yyyy'
                              )
                            : 'N/A'}
                          {item.position_symbol && (
                            <>
                              {' '}
                              •{' '}
                              <span className="text-cyan-400">
                                {item.position_symbol}
                              </span>
                            </>
                          )}
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
