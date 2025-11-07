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
    if (positions.length === 0) return

    const fetchPrices = async () => {
      const symbols = positions.map(p => p.symbol)
      const today = new Date().toISOString().split('T')[0]

      const { data: prices } = await supabase
        .from('prices_daily')
        .select('*')
        .in('symbol', symbols)
        .eq('date', today)

      const priceMap = new Map(prices?.map(p => [p.symbol, p.price]) || [])

      const positionsWithValue = positions.map(position => {
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

      setPositionsWithPrices(positionsWithValue)
    }

    fetchPrices()
  }, [positions])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">Loading positions...</div>
      </div>
    )
  }

  if (positions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Positions</h2>
        <p className="text-gray-600">No positions found. Upload a CSV file to get started.</p>
      </div>
    )
  }

  const totalValue = positionsWithPrices.reduce((sum, p) => sum + (p.value || 0), 0)
  const totalCostBasis = positionsWithPrices.reduce((sum, p) => sum + (p.costBasis || 0), 0)
  const totalGainLoss = totalValue - totalCostBasis
  const totalGainLossPercent = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold mb-2">Positions</h2>
        <div className="flex space-x-6 text-sm">
          <div>
            <span className="text-gray-600">Total Value: </span>
            <span className="font-semibold">${totalValue.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-600">Total Gain/Loss: </span>
            <span className={`font-semibold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${totalGainLoss.toFixed(2)} ({totalGainLossPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost Basis</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gain/Loss</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {positionsWithPrices.map((position) => (
              <tr key={position.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{position.symbol}</td>
                <td className="px-6 py-4 whitespace-nowrap">{position.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {position.currentPrice > 0 ? `$${position.currentPrice.toFixed(2)}` : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">${position.value.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {position.costBasis > 0 ? `$${position.costBasis.toFixed(2)}` : 'N/A'}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap ${position.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${position.gainLoss.toFixed(2)} ({position.gainLossPercent.toFixed(2)}%)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

