import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const today = new Date().toISOString().split('T')[0]

    // Get user's positions
    const { data: positions, error: positionsError } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', user.id)

    if (positionsError) throw positionsError

    if (positions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No positions found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get today's prices
    const symbols = positions.map(p => p.symbol)
    const { data: prices, error: pricesError } = await supabase
      .from('prices_daily')
      .select('*')
      .in('symbol', symbols)
      .eq('date', today)

    if (pricesError) throw pricesError

    // Calculate portfolio value
    let portfolioValue = 0
    const priceMap = new Map(prices.map(p => [p.symbol, p.price]))

    for (const position of positions) {
      const price = priceMap.get(position.symbol) || 0
      portfolioValue += price * position.quantity
    }

    // Get yesterday's prices for comparison
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const { data: yesterdayPrices } = await supabase
      .from('prices_daily')
      .select('*')
      .in('symbol', symbols)
      .eq('date', yesterday)

    let yesterdayValue = 0
    if (yesterdayPrices) {
      const yesterdayPriceMap = new Map(yesterdayPrices.map(p => [p.symbol, p.price]))
      for (const position of positions) {
        const price = yesterdayPriceMap.get(position.symbol) || 0
        yesterdayValue += price * position.quantity
      }
    }

    const dailyChange = portfolioValue - yesterdayValue
    const dailyChangePercent = yesterdayValue > 0 
      ? (dailyChange / yesterdayValue) * 100 
      : 0

    // Get relevant news from today
    const { data: newsItems, error: newsError } = await supabase
      .from('news')
      .select('*')
      .in('symbol', symbols)
      .gte('published_at', today)
      .order('sentiment_score', { ascending: false })
      .limit(10)

    if (newsError) throw newsError

    // Generate summary
    const topGainers = positions
      .map(p => {
        const price = priceMap.get(p.symbol) || 0
        const yesterdayPrice = yesterdayPrices?.find(yp => yp.symbol === p.symbol)?.price || 0
        const change = yesterdayPrice > 0 ? ((price - yesterdayPrice) / yesterdayPrice) * 100 : 0
        return { symbol: p.symbol, change }
      })
      .sort((a, b) => b.change - a.change)
      .slice(0, 3)

    const topLosers = positions
      .map(p => {
        const price = priceMap.get(p.symbol) || 0
        const yesterdayPrice = yesterdayPrices?.find(yp => yp.symbol === p.symbol)?.price || 0
        const change = yesterdayPrice > 0 ? ((price - yesterdayPrice) / yesterdayPrice) * 100 : 0
        return { symbol: p.symbol, change }
      })
      .sort((a, b) => a.change - b.change)
      .slice(0, 3)

    const positiveNews = newsItems?.filter(n => (n.sentiment_score || 0) > 0.1) || []
    const negativeNews = newsItems?.filter(n => (n.sentiment_score || 0) < -0.1) || []

    let summary = `Portfolio Value: $${portfolioValue.toFixed(2)}`
    if (dailyChange !== 0) {
      summary += ` (${dailyChange > 0 ? '+' : ''}${dailyChange.toFixed(2)}, ${dailyChangePercent.toFixed(2)}%)`
    }
    summary += `\n\nTop Gainers: ${topGainers.map(g => `${g.symbol} (+${g.change.toFixed(2)}%)`).join(', ')}`
    summary += `\nTop Losers: ${topLosers.map(l => `${l.symbol} (${l.change.toFixed(2)}%)`).join(', ')}`
    summary += `\n\nRelevant News: ${positiveNews.length} positive, ${negativeNews.length} negative headlines`

    // Create digest
    const { data: digest, error: digestError } = await supabase
      .from('digests')
      .upsert({
        user_id: user.id,
        date: today,
        portfolio_value: portfolioValue,
        daily_change: dailyChange,
        daily_change_percent: dailyChangePercent,
        summary,
      }, { onConflict: 'user_id,date' })
      .select()
      .single()

    if (digestError) throw digestError

    // Link news items to digest
    if (newsItems && newsItems.length > 0 && digest) {
      const digestItems = newsItems.map(news => ({
        digest_id: digest.id,
        news_id: news.id,
        position_symbol: news.symbol,
      }))

      await supabase
        .from('digest_items')
        .upsert(digestItems, { onConflict: 'digest_id,news_id' })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        digest: {
          ...digest,
          news_count: newsItems?.length || 0,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

