'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Position {
  id: string
  symbol: string
  quantity: number
  avg_cost_basis: number | null
}

interface PositionsListProps {
  positions: Position[]
  loading: boolean
}

export default function PositionsList({ positions, loading }: PositionsListProps) {
  const [positionsWithPrices, setPositionsWithPrices] = useState<any[]>([])

  useEffect(() => {
    if (positions.length === 0) {
      setPositionsWithPrices([])
      return
    }

    const fetchPrices = async () => {
      const symbols = positions.map((p) => p.symbol)
      const today = new Date().toISOString().split('T')[0]

      const { data: prices } = await supabase
        .from('prices_daily')
        .select('*')
        .in('symbol', symbols)
        .eq('date', today)

      const priceMap = new Map(prices?.map((p) => [p.symbol, p.price]) || [])

      const enriched = positions.map((position) => {
        const price = priceMap.get(position.symbol) || 0
        const value = price * position.quantity
        const costBasis = (position.avg_cost_basis || 0) * position.quantity
        const gainLoss = value - costBasis
        const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0

        return {
          ...position,
          currentPrice: price,
          value,
          costBasis,
          gainLoss,
          gainLossPercent,
        }
      })

      setPositionsWithPrices(enriched)
    }

    fetchPrices()
  }, [positions])

  if (loading) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="text-center py-8 text-slate-400">Loading positions...</div>
      </div>
    )
  }

  if (positions.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-xl font-semibold mb-2 text-slate-50">Positions</h2>
        <p className="text-slate-400 text-sm">
          No positions found. Upload a CSV file above to get started.
        </p>
      </div>
    )
  }

  const totalValue = positionsWithPrices.reduce(
    (sum, p) => sum + (p.value || 0),
    0
  )
  const totalCostBasis = positionsWithPrices.reduce(
    (sum, p) => sum + (p.costBasis || 0),
    0
  )
  const totalGainLoss = totalValue - totalCostBasis
  const totalGainLossPercent =
    totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0

  const sortedByValue = [...positionsWithPrices].sort(
    (a, b) => (b.value || 0) - (a.value || 0)
  )
  const topFive = sortedByValue.slice(0, 5)

  // For allocation bar, we cap tiny slices so everything is visible
  const allocation = sortedByValue.map((p) => {
    const pct = totalValue > 0 ? (p.value / totalValue) * 100 : 0
    return {
      symbol: p.symbol,
      percent: pct,
      width: Math.max(pct, 4), // minimum visible width
    }
  })

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header + totals */}
      <div className="p-6 border-b border-slate-800 flex flex-col gap-4 md:flex-row md:items-baseline md:justify-between bg-slate-900">
        <div>
          <h2 className="text-xl font-semibold text-slate-50">Positions</h2>
          <p className="text-[10px] text-slate-500">
            Based on latest available daily prices
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-xs">
          <div>
            <span className="text-slate-500">Total Value</span>
            <div className="font-semibold text-slate-50">
              ${totalValue.toFixed(2)}
            </div>
          </div>
          <div>
            <span className="text-slate-500">Total Gain/Loss</span>
            <div
              className={`font-semibold ${
                totalGainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              ${totalGainLoss.toFixed(2)} ({totalGainLossPercent.toFixed(2)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Quick analytics row: allocation bar + top 5 table */}
      <div className="px-6 pt-4 pb-2 grid grid-cols-1 lg:grid-cols-2 gap-4 bg-slate-950/95 border-b border-slate-800">
        {/* Allocation bar */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Portfolio Allocation
            </h3>
            <span className="text-[9px] text-slate-500">
              Top holdings as share of total value
            </span>
          </div>
          <div className="w-full h-4 rounded-full bg-slate-900/90 overflow-hidden flex">
            {allocation.map((slice) => (
              <div
                key={slice.symbol}
                className="h-full bg-gradient-to-r from-cyan-500/80 to-blue-500/80 border-r border-slate-950/40 flex items-center justify-center"
                style={{ width: `${slice.width}%` }}
              >
                {slice.percent >= 10 && (
                  <span className="text-[8px] font-semibold text-slate-950/90">
                    {slice.symbol}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            {allocation.slice(0, 6).map((s) => (
              <div key={s.symbol} className="text-[9px] text-slate-400">
                <span className="text-cyan-400 font-semibold mr-1">
                  {s.symbol}
                </span>
                {s.percent.toFixed(1)}%
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 table */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Top 5 Holdings by Value
            </h3>
          </div>
          <div className="text-[10px] text-slate-300">
            <div className="grid grid-cols-4 gap-2 mb-1 text-slate-500">
              <div>Symbol</div>
              <div className="text-right">Value</div>
              <div className="text-right">P/L</div>
              <div className="text-right">% P/L</div>
            </div>
            {topFive.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-4 gap-2 py-0.5 border-b border-slate-900/60 last:border-none"
              >
                <div className="font-semibold text-slate-100">
                  {p.symbol}
                </div>
                <div className="text-right">
                  ${p.value.toFixed(2)}
                </div>
                <div
                  className={`text-right ${
                    p.gainLoss >= 0
                      ? 'text-emerald-400'
                      : 'text-red-400'
                  }`}
                >
                  ${p.gainLoss.toFixed(2)}
                </div>
                <div
                  className={`text-right ${
                    p.gainLossPercent >= 0
                      ? 'text-emerald-400'
                      : 'text-red-400'
                  }`}
                >
                  {p.gainLossPercent.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-950">
            <tr>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                Symbol
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                Price
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                Value
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                Cost Basis
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                Gain / Loss
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-950 divide-y divide-slate-800">
            {positionsWithPrices.map((position) => (
              <tr
                key={position.id}
                className="hover:bg-slate-900/90 transition-colors"
              >
                <td className="px-6 py-3 whitespace-nowrap font-semibold text-slate-50">
                  {position.symbol}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-slate-200">
                  {position.quantity}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-slate-200">
                  {position.currentPrice > 0
                    ? `$${position.currentPrice.toFixed(2)}`
                    : 'N/A'}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-slate-200">
                  ${position.value.toFixed(2)}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-slate-200">
                  {position.costBasis > 0
                    ? `$${position.costBasis.toFixed(2)}`
                    : 'N/A'}
                </td>
                <td
                  className={`px-6 py-3 whitespace-nowrap font-semibold ${
                    position.gainLoss >= 0
                      ? 'text-emerald-400'
                      : 'text-red-400'
                  }`}
                >
                  ${position.gainLoss.toFixed(2)} (
                  {position.gainLossPercent.toFixed(2)}%)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
