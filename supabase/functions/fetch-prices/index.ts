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

    // Get user's positions
    const { data: positions, error: positionsError } = await supabase
      .from('positions')
      .select('symbol')
      .eq('user_id', user.id)

    if (positionsError) throw positionsError

    const symbols = positions.map(p => p.symbol)
    if (symbols.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No positions found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch prices from yfinance (using Yahoo Finance API via fetch)
    const today = new Date().toISOString().split('T')[0]
    const priceUpdates = []

    for (const symbol of symbols) {
      try {
        // Using Yahoo Finance API endpoint
        const response = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
        )
        
        if (!response.ok) continue

        const data = await response.json()
        const result = data.chart?.result?.[0]
        const quote = result?.indicators?.quote?.[0]
        
        if (quote && quote.close && quote.close.length > 0) {
          const price = quote.close[quote.close.length - 1]
          priceUpdates.push({
            symbol,
            price,
            date: today,
          })
        }
      } catch (err) {
        console.error(`Error fetching price for ${symbol}:`, err)
      }
    }

    // Upsert prices
    if (priceUpdates.length > 0) {
      const { error: priceError } = await supabase
        .from('prices_daily')
        .upsert(priceUpdates, { onConflict: 'symbol,date' })

      if (priceError) throw priceError
    }

    return new Response(
      JSON.stringify({ success: true, count: priceUpdates.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

